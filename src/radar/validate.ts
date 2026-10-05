import { RadarConfig, CalculatedRadarPerformance } from './types.ts';
import { getDeviceById } from './devices/awr1843.ts';

export interface ValidationIssue {
  severity: 'info' | 'warning' | 'error';
  field?: string;
  code: string;
  title: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  issues: ValidationIssue[];
}

/**
 * Validates a RadarConfig against physics, timing constraints, and device limits.
 * Pure function with no side effects, supports bilingual output (zh/en).
 */
export function validateRadarConfig(
  config: RadarConfig,
  perf: CalculatedRadarPerformance,
  lang: 'zh' | 'en' = 'zh'
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const device = getDeviceById(config.device);
  const constraints = device.constraints;
  const isZh = lang === 'zh';

  const { profile, channels, frame } = config;

  const error = (code: string, field: string, en: string, zh: string) => issues.push({
    severity: 'error', code, field, title: isZh ? zh : en, message: isZh ? zh : en,
  });
  for (const [field, value] of [...Object.entries(profile), ...Object.entries(frame)]) {
    if (!Number.isFinite(value)) error('NON_FINITE_PARAMETER', field, `Invalid numeric parameter: ${field}`, `参数必须为有限数值: ${field}`);
  }
  if (profile.frequencySlopeMHzUs < constraints.minSlopeMHzUs || profile.frequencySlopeMHzUs > constraints.maxSlopeMHzUs)
    error('SLOPE_OUT_OF_RANGE', 'frequencySlopeMHzUs', 'Slope must be within the supported positive range.', '调频斜率必须在支持的正数范围内。');
  if (profile.rampEndTimeUs < constraints.minRampEndTimeUs || profile.rampEndTimeUs > constraints.maxRampEndTimeUs)
    error('RAMP_OUT_OF_RANGE', 'rampEndTimeUs', 'Ramp duration is outside the supported range.', 'Ramp 时长超出支持范围。');
  if (profile.adcStartTimeUs < 0 || frame.triggerDelayMs < 0)
    error('NEGATIVE_DELAY', 'adcStartTimeUs', 'Delays cannot be negative.', '启动延迟不能为负数。');
  if (!Number.isInteger(profile.profileId) || profile.profileId < 0 || profile.profileId > 3)
    error('PROFILE_ID_INVALID', 'profileId', 'Profile ID must be an integer from 0 to 3.', 'Profile ID 必须是 0 至 3 的整数。');
  if (!Number.isInteger(frame.chirpStartIndex) || !Number.isInteger(frame.chirpEndIndex) ||
      frame.chirpStartIndex < 0 || frame.chirpEndIndex > 511 || frame.chirpStartIndex > frame.chirpEndIndex)
    error('CHIRP_RANGE_INVALID', 'chirps', 'Frame chirp range must be ordered integer indices within 0..511.', '帧 Chirp 范围必须是 0 至 511 内按顺序排列的整数。');
  if (frame.loops > 65535 || frame.frames > 65535)
    error('FRAME_COUNT_OUT_OF_RANGE', 'frame', 'Loops and frames must fit unsigned 16-bit fields.', '循环数与帧数不能超过 65535。');
  if (!device.supportedAdcBits.includes(config.adc.bitsPerComponent))
    error('ADC_BITS_INVALID', 'adc', 'ADC precision must be 12, 14 or 16 bits.', 'ADC 位宽必须为 12、14 或 16。');
  const activeChirps = config.chirps.filter(c => c.chirpIndex >= frame.chirpStartIndex && c.chirpIndex <= frame.chirpEndIndex);
  if (new Set(activeChirps.map(c => c.chirpIndex)).size !== frame.chirpEndIndex - frame.chirpStartIndex + 1 ||
      new Set(config.chirps.map(c => c.chirpIndex)).size !== config.chirps.length)
    error('CHIRP_MISSING_OR_DUPLICATE', 'chirps', 'Every frame chirp must have one unique configuration.', '帧范围内每个 Chirp 必须有且仅有一份配置。');
  const txOccurrences = [0, 0, 0];
  for (const chirp of config.chirps) {
    if (!Number.isInteger(chirp.chirpIndex) || chirp.chirpIndex < 0 || chirp.chirpIndex > 511)
      error('CHIRP_INDEX_INVALID', 'chirps', 'Chirp indices must be integers within 0..511.', 'Chirp 索引必须是 0 至 511 的整数。');
    const isActive = activeChirps.includes(chirp);
    if (chirp.profileId !== profile.profileId)
      error('CHIRP_PROFILE_MISMATCH', 'chirps', 'Chirp references a profile that is not configured.', 'Chirp 引用了未配置的 Profile。');
    if (isActive && chirp.txEnabled.filter(Boolean).length !== 1)
      error('UNSUPPORTED_TX_PATTERN', 'chirps', 'This calculator supports one active TX per chirp (TDM).', '此计算器仅支持每个 Chirp 启用一个 TX 的 TDM 模式。');
    chirp.txEnabled.forEach((enabled, i) => {
      if (enabled && isActive) txOccurrences[i]++;
      if (enabled && !channels.txEnabled[i]) error('CHIRP_TX_DISABLED', 'chirps', 'A chirp uses a TX disabled by the channel configuration.', 'Chirp 使用了通道配置中关闭的 TX。');
    });
    if (isActive && [chirp.startFreqVarMHz, chirp.freqSlopeVarMHzUs, chirp.idleTimeVarUs, chirp.adcStartTimeVarUs].some(v => v !== undefined && v !== 0))
      error('UNSUPPORTED_CHIRP_VARIATION', 'chirps', 'Per-chirp variations are not modeled; use a uniform profile.', '尚未建模每个 Chirp 的参数偏移，请使用一致的 Profile。');
  }
  if (txOccurrences.some(n => n > 1))
    error('UNSUPPORTED_TDM_PATTERN', 'chirps', 'Doppler estimates require each active TX exactly once per loop.', '多普勒估算要求每个启用的 TX 在每次循环中恰好发射一次。');

  // --- 1. ADC Sampling Window vs Ramp End Time ---
  const adcStartUs = profile.adcStartTimeUs || 0;
  const adcDurationUs = perf.adcSamplingTimeUs;
  const adcEndUs = adcStartUs + adcDurationUs;
  const rampEndUs = profile.rampEndTimeUs || 0;

  if (adcEndUs > rampEndUs) {
    issues.push({
      severity: 'error',
      field: 'rampEndTimeUs',
      code: 'ADC_SAMPLING_EXCEEDS_RAMP',
      title: isZh
        ? 'ADC 采样窗口超出 Ramp 结束时间'
        : 'ADC Sampling Window Exceeds Ramp End Time',
      message: isZh
        ? `ADC 采样于 ${adcEndUs.toFixed(2)} µs 结束 (启动延时: ${adcStartUs.toFixed(1)} µs + 采样时长: ${adcDurationUs.toFixed(2)} µs)，已超出所设 Ramp 结束时间 ${rampEndUs.toFixed(1)} µs 达 ${(adcEndUs - rampEndUs).toFixed(2)} µs。采样点将被强制截断！`
        : `ADC sampling ends at ${adcEndUs.toFixed(2)} µs (Start: ${adcStartUs.toFixed(1)} µs + Duration: ${adcDurationUs.toFixed(2)} µs), which exceeds Ramp End Time of ${rampEndUs.toFixed(1)} µs by ${(adcEndUs - rampEndUs).toFixed(2)} µs.`,
      suggestion: isZh
        ? '解决办法: (1) 增大 Ramp 结束时间 (Ramp End Time), (2) 减少 ADC 采样点数 (ADC Samples), 或 (3) 提高采样率 (Sample Rate)。'
        : 'Try: (1) Increase Ramp End Time, (2) Decrease ADC Samples, or (3) Increase ADC Sample Rate.',
    });
  } else if (rampEndUs - adcEndUs > 15.0) {
    issues.push({
      severity: 'info',
      field: 'rampEndTimeUs',
      code: 'RAMP_EXCESS_SLACK',
      title: isZh ? '采样后存在较大闲置 Ramp 冗余' : 'Excess Ramp Duration After Sampling',
      message: isZh
        ? `Ramp 结束时间 (${rampEndUs.toFixed(1)} µs) 在 ADC 采样完成后仍留有 ${(rampEndUs - adcEndUs).toFixed(1)} µs 未利用的多余扫频时间。`
        : `Ramp End Time (${rampEndUs.toFixed(1)} µs) has ${(rampEndUs - adcEndUs).toFixed(1)} µs of unused excess ramp time after ADC sampling finishes.`,
      suggestion: isZh
        ? '适当缩短 Ramp 结束时间可以缩短单 Chirp 周期，从而提升多普勒最大不模糊测量速度。'
        : 'You can reduce Ramp End Time to decrease total chirp cycle time and improve maximum unambiguous velocity.',
    });
  }

  if (adcStartUs < constraints.minAdcStartTimeUs) {
    issues.push({
      severity: 'warning',
      field: 'adcStartTimeUs',
      code: 'ADC_START_TOO_SMALL',
      title: isZh ? 'ADC 启动时间偏小' : 'ADC Start Time May Be Too Short',
      message: isZh
        ? `ADC 启动时间 (${adcStartUs} µs) 低于器件推荐下限 (${constraints.minAdcStartTimeUs} µs)。模拟高通滤波器需要短暂建立时间，过短可能引起初始采样点直流冲击失真。`
        : `ADC Start Time (${adcStartUs} µs) is below typical minimum (${constraints.minAdcStartTimeUs} µs). Analog HPF and IF filters require settle time to avoid transient settling distortion in ADC samples.`,
      suggestion: isZh
        ? `建议将 ADC 启动时间调整为 >= ${constraints.minAdcStartTimeUs} µs (常规推荐 4 - 7 µs)。`
        : `Increase ADC Start Time to >= ${constraints.minAdcStartTimeUs} µs (typically 4 - 7 µs).`,
    });
  }

  // --- 2. Frame Active Time vs Frame Periodicity ---
  const activeTimeMs = perf.frameActiveTimeMs;
  const periodicityMs = frame.periodicityMs || 0;

  if (periodicityMs <= 0) {
    issues.push({
      severity: 'error',
      field: 'periodicityMs',
      code: 'FRAME_PERIOD_ZERO',
      title: isZh ? '无效的帧周期' : 'Invalid Frame Periodicity',
      message: isZh ? '帧周期必须严格大于 0 ms。' : 'Frame Periodicity must be strictly greater than 0 ms.',
      suggestion: isZh ? '请将帧周期设置为合理正数 (例如 50.0 ms)。' : 'Set Frame Periodicity to a positive value (e.g., 50.0 ms).',
    });
  } else if (activeTimeMs > periodicityMs) {
    issues.push({
      severity: 'error',
      field: 'periodicityMs',
      code: 'FRAME_ACTIVE_EXCEEDS_PERIOD',
      title: isZh ? '帧发射有效时间超出帧周期' : 'Frame Active Time Exceeds Frame Periodicity',
      message: isZh
        ? `单帧内 Chirp 连续发射时间 (${activeTimeMs.toFixed(2)} ms) 超出了所设定的帧触发周期 (${periodicityMs.toFixed(2)} ms)。占空比达到 ${perf.dutyCyclePercent.toFixed(1)}% (> 100%)，雷达在上一帧尚未发射完毕时便试图触发下一帧！`
        : `Total frame chirping active time (${activeTimeMs.toFixed(2)} ms) exceeds Frame Periodicity (${periodicityMs.toFixed(2)} ms). Duty cycle would be ${perf.dutyCyclePercent.toFixed(1)}% (> 100%).`,
      suggestion: isZh
        ? '解决办法: (1) 调大帧周期 (Frame Periodicity), (2) 减少循环数 (Loops), 或 (3) 缩减单 Chirp 周期 (Idle/Ramp 时间)。'
        : 'Try: (1) Increase Frame Periodicity, (2) Decrease Chirp Loops, or (3) Decrease Chirp Cycle Time (Idle / Ramp times).',
    });
  } else if (perf.dutyCyclePercent > 50.0) {
    issues.push({
      severity: 'warning',
      field: 'periodicityMs',
      code: 'DUTY_CYCLE_HIGH',
      title: isZh ? '雷达发射占空比过高 (> 50%)' : 'High Radar Duty Cycle (> 50%)',
      message: isZh
        ? `当前发射占空比为 ${perf.dutyCyclePercent.toFixed(1)}%。长时间高占空比发射易导致 AWR1843BOOST 射频前端温度过高，甚至触发过热保护。`
        : `Duty cycle is ${perf.dutyCyclePercent.toFixed(1)}%. High duty cycle radar transmissions can lead to excessive thermal dissipation on AWR1843BOOST.`,
      suggestion: isZh
        ? '在没有辅助散热风扇时，建议增大帧周期或减小循环数，将占空比控制在 50% 以内。'
        : 'Ensure adequate heatsinking or increase Frame Periodicity / decrease Chirp Loops to keep duty cycle <= 50%.',
    });
  }

  // --- 3. ADC Sample Rate Limits ---
  const sampleRateKsps = profile.sampleRateKsps || 0;
  if (sampleRateKsps > constraints.maxAdcSampleRateKsps) {
    issues.push({
      severity: 'error',
      field: 'sampleRateKsps',
      code: 'SAMPLE_RATE_EXCEEDED',
      title: isZh ? 'ADC 采样率超出硬件支持上限' : 'ADC Sample Rate Exceeds Hardware Limit',
      message: isZh
        ? `采样率 (${sampleRateKsps} ksps) 超出了 ${device.name} 芯片的物理上限 ${constraints.maxAdcSampleRateKsps} ksps。`
        : `Sample Rate (${sampleRateKsps} ksps) exceeds ${device.name} hardware maximum limit of ${constraints.maxAdcSampleRateKsps} ksps.`,
      suggestion: isZh
        ? `将采样率降低至 <= ${constraints.maxAdcSampleRateKsps} ksps (常见设定为 5000 至 10000 ksps)。`
        : `Reduce ADC Sample Rate to <= ${constraints.maxAdcSampleRateKsps} ksps.`,
    });
  } else if (sampleRateKsps < constraints.minAdcSampleRateKsps) {
    issues.push({
      severity: 'error',
      field: 'sampleRateKsps',
      code: 'SAMPLE_RATE_TOO_LOW',
      title: isZh ? 'ADC 采样率低于硬件允许下限' : 'ADC Sample Rate Below Minimum Limit',
      message: isZh
        ? `采样率 (${sampleRateKsps} ksps) 低于硬件下限 ${constraints.minAdcSampleRateKsps} ksps。`
        : `Sample Rate (${sampleRateKsps} ksps) is below hardware minimum of ${constraints.minAdcSampleRateKsps} ksps.`,
      suggestion: isZh
        ? `将采样率调整至 >= ${constraints.minAdcSampleRateKsps} ksps。`
        : `Increase ADC Sample Rate to >= ${constraints.minAdcSampleRateKsps} ksps.`,
    });
  }

  // --- 4. RF Frequency and Sweep Range ---
  const startFreq = profile.startFrequencyGHz || 0;
  if (startFreq < constraints.minFrequencyGHz || startFreq > constraints.maxFrequencyGHz) {
    issues.push({
      severity: 'error',
      field: 'startFrequencyGHz',
      code: 'START_FREQ_OUT_OF_BAND',
      title: isZh ? '起始频率超出芯片支持频段' : 'Start Frequency Outside Supported Band',
      message: isZh
        ? `起始频率 (${startFreq.toFixed(3)} GHz) 不在 ${device.name} 射频频段范围 (${constraints.minFrequencyGHz} - ${constraints.maxFrequencyGHz} GHz) 内。`
        : `Start Frequency (${startFreq.toFixed(3)} GHz) is outside the ${device.name} RF operating band (${constraints.minFrequencyGHz} - ${constraints.maxFrequencyGHz} GHz).`,
      suggestion: isZh
        ? `请选择 ${constraints.minFrequencyGHz} GHz 至 ${constraints.maxFrequencyGHz} GHz 之间的频率 (标准多为 77.0 GHz)。`
        : `Select a frequency between ${constraints.minFrequencyGHz} GHz and ${constraints.maxFrequencyGHz} GHz (typically 77.0 GHz).`,
    });
  }

  const stopFreq = startFreq + perf.fullChirpSweepBandwidthMHz / 1000;
  if (stopFreq > constraints.maxFrequencyGHz) {
    issues.push({
      severity: 'error',
      field: 'frequencySlopeMHzUs',
      code: 'STOP_FREQ_EXCEEDS_BAND',
      title: isZh ? '扫频终止频率超出 81 GHz 射频上限' : 'Chirp Sweep Exceeds Maximum RF Frequency',
      message: isZh
        ? `扫频在 ${stopFreq.toFixed(3)} GHz 结束，超过了芯片 ${constraints.maxFrequencyGHz} GHz 的工作上限。`
        : `Chirp stops at ${stopFreq.toFixed(3)} GHz, which exceeds maximum frequency limit of ${constraints.maxFrequencyGHz} GHz.`,
      suggestion: isZh
        ? '降低调频斜率、减小 Ramp 结束时间，或适当调低起始频率。'
        : 'Decrease Frequency Slope or Ramp End Time, or lower Start Frequency.',
    });
  }

  if (perf.fullChirpSweepBandwidthMHz / 1000 > constraints.maxTotalBandwidthGHz) {
    issues.push({
      severity: 'error',
      field: 'frequencySlopeMHzUs',
      code: 'TOTAL_BANDWIDTH_EXCEEDED',
      title: isZh ? '全扫频总带宽超出 4 GHz 物理限制' : 'Total Chirp Bandwidth Exceeds 4 GHz Limit',
      message: isZh
        ? `总扫频带宽 (${(perf.fullChirpSweepBandwidthMHz / 1000).toFixed(2)} GHz) 超出了器件支持的最大 4 GHz 带宽限制。`
        : `Total chirp bandwidth (${(perf.fullChirpSweepBandwidthMHz / 1000).toFixed(2)} GHz) exceeds device maximum supported bandwidth of ${constraints.maxTotalBandwidthGHz} GHz.`,
      suggestion: isZh ? '请调低调频斜率或缩短 Ramp 结束时间。' : 'Decrease Frequency Slope or Ramp End Time.',
    });
  }

  // --- 5. Slope & Idle Time Limits ---
  const idleTimeUs = profile.idleTimeUs || 0;
  if (idleTimeUs < constraints.minIdleTimeUs) {
    issues.push({
      severity: 'error',
      field: 'idleTimeUs',
      code: 'IDLE_TIME_TOO_LOW',
      title: isZh ? '空闲时间过短无法满足锁相环稳定' : 'Idle Time Too Short for Synthesizer Settle',
      message: isZh
        ? `空闲时间 (${idleTimeUs} µs) 低于硬件 PLL VCO 建立锁定所需的最低时长 (${constraints.minIdleTimeUs} µs)。`
        : `Idle Time (${idleTimeUs} µs) is below hardware minimum PLL settling requirement (${constraints.minIdleTimeUs} µs).`,
      suggestion: isZh
        ? `增加空闲时间至 >= ${constraints.minIdleTimeUs} µs (常规多设为 10 - 100 µs)。`
        : `Increase Idle Time to >= ${constraints.minIdleTimeUs} µs.`,
    });
  }

  // --- 6. ADC Samples (Power of 2 & Bounds) ---
  const samples = profile.adcSamples || 0;
  if (samples <= 0 || !Number.isInteger(samples)) {
    issues.push({
      severity: 'error',
      field: 'adcSamples',
      code: 'ADC_SAMPLES_INVALID',
      title: isZh ? 'ADC 采样点数必须为正整数' : 'ADC Samples Must Be Positive Integer',
      message: isZh ? `采样点数 (${samples}) 必须大于 0 且为整数。` : `ADC Samples (${samples}) must be an integer > 0.`,
      suggestion: isZh ? '建议选择 64, 128, 256, 512 或 1024。' : 'Set ADC Samples to 64, 128, 256, 512, or 1024.',
    });
  } else {
    if (samples < constraints.minAdcSamples || samples > constraints.maxAdcSamples) {
      issues.push({
        severity: 'error',
        field: 'adcSamples',
        code: 'ADC_SAMPLES_OUT_OF_RANGE',
        title: isZh ? 'ADC 采样点数超出片上缓存范围' : 'ADC Samples Exceeds Buffer Limit',
        message: isZh
          ? `采样点数 (${samples}) 超出硬件支持范围 [${constraints.minAdcSamples}, ${constraints.maxAdcSamples}]。`
          : `ADC Samples (${samples}) is outside hardware supported range [${constraints.minAdcSamples}, ${constraints.maxAdcSamples}].`,
        suggestion: isZh ? '将点数调整到 [64, 1024] 范围内。' : 'Choose ADC samples within [64, 1024].',
      });
    }

    const isPowerOfTwo = (samples & (samples - 1)) === 0;
    if (!isPowerOfTwo) {
      issues.push({
        severity: 'warning',
        field: 'adcSamples',
        code: 'ADC_SAMPLES_NOT_POW2',
        title: isZh ? 'ADC 采样点数非 2 的整数次幂' : 'ADC Samples is Not a Power of 2',
        message: isZh
          ? `采样点数为 ${samples}。非 2 的幂次在进行 Range FFT 快速傅里叶变换时需要补零填充，会略微降低处理性能。`
          : `ADC Samples is ${samples}. Non-power-of-2 sizes require zero-padding for Range FFT processing.`,
        suggestion: isZh ? '推荐调整为标准 2 的次幂：128, 256, 512 或 1024。' : 'Consider using a standard power-of-2 size: 128, 256, 512, or 1024.',
      });
    }
  }

  // --- 7. TX and RX Channel Enable ---
  const rxCount = (channels.rxEnabled || []).filter(Boolean).length;
  if (rxCount === 0) {
    issues.push({
      severity: 'error',
      field: 'channels',
      code: 'NO_RX_ENABLED',
      title: isZh ? '未启用任何接收天线 (RX)' : 'No RX Antennas Enabled',
      message: isZh ? '必须至少启用 1 个 RX 接收天线通道才能采集雷达回波。' : 'At least one RX antenna channel must be enabled to capture radar reflections.',
      suggestion: isZh ? '在天线通道中勾选 RX1、RX2、RX3 或 RX4。' : 'Enable RX1, RX2, RX3, or RX4 in Channel configuration.',
    });
  }

  const txCount = (channels.txEnabled || []).filter(Boolean).length;
  if (txCount === 0) {
    issues.push({
      severity: 'error',
      field: 'channels',
      code: 'NO_TX_ENABLED',
      title: isZh ? '未启用任何发射天线 (TX)' : 'No TX Antennas Enabled in Channel Mask',
      message: isZh ? '必须至少启用 1 个 TX 发射天线才能发射雷达信号。' : 'At least one TX antenna must be enabled for chirp transmission.',
      suggestion: isZh ? '在天线通道中勾选启用至少一个 TX 天线。' : 'Enable at least one TX antenna in Channel configuration.',
    });
  }

  // --- 8. Frame Configuration ---
  const loops = frame.loops || 0;
  if (loops <= 0 || !Number.isInteger(loops)) {
    issues.push({
      severity: 'error',
      field: 'loops',
      code: 'LOOPS_INVALID',
      title: isZh ? '循环数必须为正整数' : 'Chirp Loops Must Be Positive Integer',
      message: isZh ? `循环数 (${loops}) 必须 >= 1。` : `Chirp Loops (${loops}) must be an integer >= 1.`,
      suggestion: isZh ? '将循环数设为合理正整数 (如 64, 128, 256)。' : 'Set Chirp Loops to a positive value (e.g., 64, 128, 256).',
    });
  }

  const numFrames = frame.frames !== undefined ? frame.frames : 100;
  if (numFrames < 0 || !Number.isInteger(numFrames)) {
    issues.push({
      severity: 'error',
      field: 'frames',
      code: 'FRAMES_INVALID',
      title: isZh ? '采集帧数不合法' : 'Number of Frames Invalid',
      message: isZh ? '采集帧数必须为 >= 0 的整数。' : 'Number of frames must be an integer >= 0.',
      suggestion: isZh ? '设置为 >= 0 的整数。' : 'Set frames to >= 0.',
    });
  } else if (numFrames === 0) {
    issues.push({
      severity: 'info',
      field: 'frames',
      code: 'INFINITE_FRAMES_NOTE',
      title: isZh ? '连续无限帧流式录制 (frames = 0)' : 'Continuous Frame Streaming (frames = 0)',
      message: isZh
        ? '在 mmWave Studio 中设置 frames = 0 代表持续发射并流式捕获，直到手动发送停止指令。'
        : 'In mmWave Studio ar1.FrameConfig, setting frames to 0 specifies continuous infinite capture until manual stop.',
      suggestion: isZh ? '请确保电脑保存硬盘有足够存储空间。' : 'Ensure DCA1000 capture buffer has enough host disk space.',
    });
  }

  // --- 9. Data Rate & DCA1000 Buffer Warning ---
  if (perf.dataRateMBps > 75.0) {
    issues.push({
      severity: 'warning',
      field: 'dataRate',
      code: 'HIGH_DATA_RATE',
      title: isZh ? '以太网流式吞吐率较高' : 'High Streaming Data Rate',
      message: isZh
        ? `估算的原始数据流速率为 ${perf.dataRateMBps.toFixed(1)} MB/s。DCA1000 千兆以太网的理论上限约 100 MB/s，过高吞吐率在较慢的主机网卡上可能引起 UDP 丢包。`
        : `Calculated raw data rate is ${perf.dataRateMBps.toFixed(1)} MB/s. DCA1000 Gigabit Ethernet link maximum theoretical throughput is ~100 MB/s.`,
      suggestion: isZh
        ? '如若出现丢包，可降低帧率 (调大帧周期) 或减少 Chirp 循环数。'
        : 'Reduce Frame Rate (increase Frame Periodicity) or reduce Chirp Loops if Ethernet packet loss occurs.',
    });
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  const hasWarnings = issues.some((i) => i.severity === 'warning');

  return {
    isValid: !hasErrors,
    hasErrors,
    hasWarnings,
    issues,
  };
}
