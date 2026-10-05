import { RadarConfig, CalculatedRadarPerformance } from './types.ts';

export interface TradeoffEffect {
  metric: string;
  direction: 'increase' | 'decrease' | 'improve' | 'degrade';
  impact: 'positive' | 'negative' | 'neutral' | 'risk';
  description: string;
}

export interface ParameterTradeoffInsight {
  parameterId: string;
  parameterName: string;
  currentValueDisplay: string;
  summary: string;
  effects: TradeoffEffect[];
  whyItMatters: string;
}

export function analyzeTradeoffs(
  config: RadarConfig,
  perf: CalculatedRadarPerformance,
  lang: 'zh' | 'en' = 'zh'
): ParameterTradeoffInsight[] {
  const insights: ParameterTradeoffInsight[] = [];
  const isZh = lang === 'zh';

  // 1. Frequency Slope Tradeoff
  insights.push({
    parameterId: 'frequencySlopeMHzUs',
    parameterName: isZh ? '调频斜率 (Frequency Slope, S)' : 'Frequency Slope (S)',
    currentValueDisplay: `${config.profile.frequencySlopeMHzUs} MHz/µs`,
    summary: isZh
      ? '主导雷达“距离分辨能力 (ΔR)”与“最大不模糊探测距离 (Rmax)”之间的核心权衡。'
      : 'Governs the trade-off between Range Resolving Power and Maximum Unambiguous Range.',
    effects: [
      {
        metric: isZh ? '有效扫频带宽 (Badc)' : 'Effective ADC Bandwidth',
        direction: 'increase',
        impact: 'positive',
        description: isZh
          ? `当前 ${perf.effectiveAdcBandwidthMHz.toFixed(1)} MHz。斜率越高，在有限的 ADC 采样窗口内扫过的频带越宽。`
          : `Current ${perf.effectiveAdcBandwidthMHz.toFixed(1)} MHz. Higher slope broadens swept bandwidth within ADC window.`,
      },
      {
        metric: isZh ? '距离分辨率 (ΔR)' : 'Range Resolution (ΔR)',
        direction: 'improve',
        impact: 'positive',
        description: isZh
          ? `当前 ${perf.rangeResolutionCm.toFixed(1)} cm (数值越小越好)。更陡峭的斜率带来更精细的物理目标分辨。`
          : `Current ${perf.rangeResolutionCm.toFixed(1)} cm (smaller is better). Steeper slope yields finer distance discrimination.`,
      },
      {
        metric: isZh ? '最大不模糊探测距离 (Rmax)' : 'Theoretical Maximum Range (Rmax)',
        direction: 'decrease',
        impact: 'negative',
        description: isZh
          ? `当前推荐 ${perf.recommendedMaxRangeM.toFixed(1)} m。中频差拍频率 fb = (2*S*R)/c，斜率大时相同距离产生的差频更高，更易受 ADC 采样率上限约束。`
          : `Current ${perf.theoreticalMaxRangeM.toFixed(1)} m. Beat frequency fb = (2*S*R)/c is limited by ADC sample rate Fs.`,
      },
    ],
    whyItMatters: isZh
      ? '对于近距离高精度实验（如人体姿态识别、手势、生命体征），推荐采用大斜率 (30-60 MHz/µs) 以获得极高分辨率；对于远距离汽车雷达探测，应调低斜率 (5-15 MHz/µs) 防止差拍信号超出中频滤波器截止频率。'
      : 'For short-range, high-resolution human motion/vital signs experiments, use a higher slope (30-60 MHz/µs). For long-range automotive tracking, decrease slope (5-15 MHz/µs) to avoid exceeding IF bandwidth.',
  });

  // 2. ADC Samples Tradeoff
  const adcStartUs = config.profile.adcStartTimeUs || 0;
  const rampMarginUs = config.profile.rampEndTimeUs - (adcStartUs + perf.adcSamplingTimeUs);

  insights.push({
    parameterId: 'adcSamples',
    parameterName: isZh ? 'ADC 采样点数 (Nadc)' : 'ADC Samples (Nadc)',
    currentValueDisplay: `${config.profile.adcSamples}`,
    summary: isZh
      ? '决定单 Chirp 采样时间窗宽度、实际有效带宽及原始二进制数据缓存大小。'
      : 'Controls sampling window duration, effective bandwidth, and raw memory payload.',
    effects: [
      {
        metric: isZh ? 'ADC 采样窗口时间 (Tadc)' : 'ADC Sampling Duration (Tadc)',
        direction: 'increase',
        impact: 'neutral',
        description: isZh
          ? `当前 ${perf.adcSamplingTimeUs.toFixed(1)} µs。点数越多，采样窗口越长，覆盖更多线性调频频带。`
          : `Current ${perf.adcSamplingTimeUs.toFixed(1)} µs. Longer sampling window captures more sweep frequency.`,
      },
      {
        metric: isZh ? '距离分辨率' : 'Range Resolution',
        direction: 'improve',
        impact: 'positive',
        description: isZh
          ? '采样时间延长使得有效带宽 Badc = S × Tadc 增大，从而改善距离分辨率。'
          : 'More samples expand effective bandwidth Badc = S * Tadc, improving range resolution.',
      },
      {
        metric: isZh ? 'Ramp 裕量超限风险' : 'Ramp Time Margin Risk',
        direction: rampMarginUs < 2.0 ? 'degrade' : 'improve',
        impact: rampMarginUs < 2.0 ? 'risk' : 'neutral',
        description: isZh
          ? rampMarginUs < 0
            ? `越界溢出 ${Math.abs(rampMarginUs).toFixed(1)} µs！采样窗口超出了设定的 Ramp 结束时间。`
            : `当前距离斜坡结束还剩 ${rampMarginUs.toFixed(1)} µs 安全裕量。`
          : rampMarginUs < 0
          ? `OVERFLOW by ${Math.abs(rampMarginUs).toFixed(1)} µs! Samples exceed Ramp End Time.`
          : `Slack remaining: ${rampMarginUs.toFixed(1)} µs before ramp ends.`,
      },
      {
        metric: isZh ? '每帧原始数据量' : 'Data Payload',
        direction: 'increase',
        impact: 'negative',
        description: isZh
          ? `每帧产生 ${perf.dataSizePerFrameMB.toFixed(2)} MB 原始数据。增加点数将提升 DCA1000 网口传输负担及内存占用。`
          : `Generates ${perf.dataSizePerFrameMB.toFixed(2)} MB/frame. Larger buffers increase DCA1000 transfer time and RAM usage.`,
      },
    ],
    whyItMatters: isZh
      ? '采样点数越多，距离分辨率和相干信噪比处理增益越高，但必须确保 ADC 启动时间 + 采样时间严格小于 Ramp 结束时间。'
      : 'Higher sample counts give finer range resolution and higher processing gain, but must fit comfortably within the chirp ramp time.',
  });

  // 3. ADC Sample Rate Tradeoff
  insights.push({
    parameterId: 'sampleRateKsps',
    parameterName: isZh ? 'ADC 采样率 (Fs)' : 'ADC Sample Rate (Fs)',
    currentValueDisplay: `${config.profile.sampleRateKsps} ksps`,
    summary: isZh
      ? '决定中频滤波器的抗混叠频率上限、最大探测距离和模数转换速率。'
      : 'Sets IF filter bandwidth, maximum detectable distance, and ADC sampling speed.',
    effects: [
      {
        metric: isZh ? '推荐最大探测距离 (Rmax)' : 'Maximum Unambiguous Range (Rmax)',
        direction: 'increase',
        impact: 'positive',
        description: isZh
          ? `当前推荐 ${perf.recommendedMaxRangeM.toFixed(1)} m。依据奈奎斯特采样定理，采样率越高允许采集的中频差拍频率越高，探测距离越远。`
          : `Current ${perf.recommendedMaxRangeM.toFixed(1)} m. By Nyquist theorem, IF beat frequency cannot exceed Fs.`,
      },
      {
        metric: isZh ? 'ADC 采样持续时间 (Tadc)' : 'ADC Sampling Time (Tadc)',
        direction: 'decrease',
        impact: 'neutral',
        description: isZh
          ? '采样率提高使 ADC 能够更快完成指定点数的采集，缩短采样时间窗。'
          : 'Higher Fs means ADC finishes collecting samples faster, shrinking sampling time.',
      },
      {
        metric: isZh ? '有效带宽与距离分辨率' : 'Effective Bandwidth & Resolution',
        direction: 'degrade',
        impact: 'negative',
        description: isZh
          ? '如果在采样率提高的同时未相应增加点数，采样时间窗变短将压缩有效带宽 Badc，导致距离分辨率粗化。'
          : 'If ADC samples count is kept constant, higher Fs reduces sampling time, narrowing Badc and worsening range resolution.',
      },
    ],
    whyItMatters: isZh
      ? '当需要更远的探测距离，或者需要将大量采样点压缩在短时间内采集以提高多普勒速度性能时，应提高采样率。'
      : 'Increase Sample Rate when you need longer detection distance or want to fit more samples in a shorter chirp ramp.',
  });

  // 4. Chirp Loops Tradeoff
  insights.push({
    parameterId: 'loops',
    parameterName: isZh ? 'Chirp 循环数 (Loops, Nd)' : 'Chirp Loops (Nd)',
    currentValueDisplay: `${config.frame.loops}`,
    summary: isZh
      ? '决定多普勒相干观测时长、速度辨识分辨率与发射有效占空比。'
      : 'Determines Doppler observation time, velocity resolving power, and duty cycle.',
    effects: [
      {
        metric: isZh ? '速度分辨率 (Δv)' : 'Velocity Resolution (Δv)',
        direction: 'improve',
        impact: 'positive',
        description: isZh
          ? `当前 ${perf.velocityResolutionMps.toFixed(3)} m/s (${perf.velocityResolutionKmh.toFixed(2)} km/h)。循环数越多，多普勒观测总时长 Tobs 越长，速度分辨能力越强。`
          : `Current ${perf.velocityResolutionMps.toFixed(3)} m/s (${perf.velocityResolutionKmh.toFixed(2)} km/h). More loops expand observation duration Tobs.`,
      },
      {
        metric: isZh ? '多普勒相干处理增益' : 'Doppler Processing Gain',
        direction: 'increase',
        impact: 'positive',
        description: isZh
          ? `信噪比理论改善 ~10×log10(${config.frame.loops}) ≈ ${(10 * Math.log10(Math.max(1, config.frame.loops))).toFixed(1)} dB。`
          : `SNR improves by ~10*log10(${config.frame.loops}) ≈ ${(10 * Math.log10(Math.max(1, config.frame.loops))).toFixed(1)} dB.`,
      },
      {
        metric: isZh ? '发射时间与占空比' : 'Frame Active Time & Duty Cycle',
        direction: 'increase',
        impact: perf.dutyCyclePercent > 50 ? 'risk' : 'neutral',
        description: isZh
          ? `当前发射时间为 ${perf.frameActiveTimeMs.toFixed(1)} ms (占空比 ${perf.dutyCyclePercent.toFixed(1)}%)。`
          : `Active time is ${perf.frameActiveTimeMs.toFixed(1)} ms (${perf.dutyCyclePercent.toFixed(1)}% duty cycle).`,
      },
    ],
    whyItMatters: isZh
      ? '对于微多普勒与微弱振动感知（如呼吸检测、手势识别），较大的循环数（128 - 256）对于区分微小速度变化至关重要。'
      : 'For micro-Doppler and vibration sensing (gestures, chest displacement), high chirp loops (128 - 256) are vital for resolving subtle velocity variations.',
  });

  // 5. TX Antenna / MIMO Tradeoff
  insights.push({
    parameterId: 'channels',
    parameterName: isZh ? 'TDM-MIMO 时分复用机制' : 'TDM-MIMO TX Multiplexing',
    currentValueDisplay: isZh
      ? `${perf.activeTxCount} 个激活 TX (${perf.chirpsPerLoop} 个 Chirp/循环)`
      : `${perf.activeTxCount} Active TX (${perf.chirpsPerLoop} chirps/loop)`,
    summary: isZh
      ? '在“空间角分辨率 (阵列孔径)”与“最大不模糊速度 (Doppler)”之间的根本物理制约。'
      : 'Trade-off between Spatial Angular Aperture vs Maximum Doppler Velocity.',
    effects: [
      {
        metric: isZh ? '虚拟天线孔径' : 'Virtual Antenna Aperture',
        direction: 'increase',
        impact: 'positive',
        description: isZh
          ? `获得 ${perf.virtualAntennaCountAzimuth} 个方位虚拟天线阵元（估算角分辨率约为 ${perf.approxAngularResolutionAzimuthDeg.toFixed(1)}°）。`
          : `Yields ${perf.virtualAntennaCountAzimuth} azimuth virtual elements (Approx AoA resolution: ${perf.approxAngularResolutionAzimuthDeg.toFixed(1)}°).`,
      },
      {
        metric: isZh ? '同天线发射间隔 (Ttx)' : 'TX Repetition Interval (Ttx)',
        direction: 'increase',
        impact: 'negative',
        description: isZh
          ? `每个 TX 必须等待时隙轮替：Ttx = ${perf.chirpsPerLoop} × Tchirp = ${perf.txRepetitionTimeUs.toFixed(1)} µs。`
          : `Each TX must wait for all other TXs: Ttx = ${perf.chirpsPerLoop} × Tchirp = ${perf.txRepetitionTimeUs.toFixed(1)} µs.`,
      },
      {
        metric: isZh ? '最大不模糊速度 (Vmax)' : 'Maximum Unambiguous Velocity (Vmax)',
        direction: 'decrease',
        impact: 'negative',
        description: isZh
          ? `由于 Ttx 采样间隔被成倍拉长，最大测量速度收缩至 ±${perf.maxUnambiguousVelocityMps.toFixed(2)} m/s (±${perf.maxUnambiguousVelocityKmh.toFixed(1)} km/h)。`
          : `Reduced to ${perf.maxUnambiguousVelocityMps.toFixed(2)} m/s (${perf.maxUnambiguousVelocityKmh.toFixed(1)} km/h) due to longer Ttx sampling interval.`,
      },
    ],
    whyItMatters: isZh
      ? '启用全部 3 个 TX 可以获得 3D 到达角估计能力（方位 + 俯仰），但 Vmax 会直接降为单 TX 时的三分之一。如果实验主攻高速运动物体追踪，建议仅使用 1 个 TX。'
      : 'Activating all 3 TX gives 3D AoA (azimuth + elevation) capabilities, but reduces Vmax by 3x compared to single TX. Use 1 TX when high-speed targets (automotive/drones) are the primary focus.',
  });

  return insights;
}
