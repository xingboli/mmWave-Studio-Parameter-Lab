import { RadarConfig, CalculatedRadarPerformance } from '../radar/types.ts';
import { LuaSection, LuaCommand, LuaGenerationOptions, GeneratedLuaScript } from './types.ts';

/**
 * Encodes RX antenna enable flags into 4-bit bitmask.
 * bit0: RX1, bit1: RX2, bit2: RX3, bit3: RX4
 * e.g., [true, true, true, true] -> 0b1111 = 15
 */
export function getRxMask(rxEnabled: [boolean, boolean, boolean, boolean]): number {
  let mask = 0;
  if (rxEnabled[0]) mask |= 1;
  if (rxEnabled[1]) mask |= 2;
  if (rxEnabled[2]) mask |= 4;
  if (rxEnabled[3]) mask |= 8;
  return mask;
}

/**
 * Encodes TX antenna enable flags into 3-bit bitmask.
 * bit0: TX1, bit1: TX2, bit2: TX3
 * e.g., [true, true, true] -> 0b111 = 7
 */
export function getTxMask(txEnabled: [boolean, boolean, boolean]): number {
  let mask = 0;
  if (txEnabled[0]) mask |= 1;
  if (txEnabled[1]) mask |= 2;
  if (txEnabled[2]) mask |= 4;
  return mask;
}

/**
 * Maps HPF1 cutoff frequency in kHz to mmWave Studio index.
 * 0: 175 kHz, 1: 235 kHz, 2: 350 kHz, 3: 700 kHz
 */
export function getHpf1Index(khz?: number): number {
  if (!khz || khz <= 175) return 0;
  if (khz <= 235) return 1;
  if (khz <= 350) return 2;
  return 3;
}

/**
 * Maps HPF2 cutoff frequency in kHz to mmWave Studio index.
 * 0: 350 kHz, 1: 700 kHz, 2: 1400 kHz, 3: 2800 kHz
 */
export function getHpf2Index(khz?: number): number {
  if (!khz || khz <= 350) return 0;
  if (khz <= 700) return 1;
  if (khz <= 1400) return 2;
  return 3;
}

/** Studio 2.1.1 ChanNAdcConfig: TX0..2, RX0..3, ADC bits index, format, IQ swap. */
export function buildChannelSection(config: RadarConfig): LuaSection {
  return {
    title: '1. RF Channel & ADC Configuration',
    isVerified: true,
    commands: [{
      apiName: 'ar1.ChanNAdcConfig',
      args: [...config.channels.txEnabled.map(Number), ...config.channels.rxEnabled.map(Number),
        [12, 14, 16].indexOf(config.adc.bitsPerComponent), config.adc.complex ? 1 : 0, Number(config.adc.iqSwap)],
      comment: 'TX0..2 / RX0..3 enable flags; ADC bits: 0=12, 1=14, 2=16; format: 0=real, 1=complex 1x',
      isVerified: true,
    }],
  };
}

/**
 * Verified Section 2: Profile Configuration
 * TI API: ar1.ProfileConfig(profileId, startFreq, idleTime, adcStartTime, rampEndTime, tx0OutPower, tx1OutPower, tx2OutPower, tx0Phase, tx1Phase, tx2Phase, freqSlopeConst, txStartTime, numAdcSamples, digOutSampleRate, hpfCornerFreq1, hpfCornerFreq2, rxGain)
 */
export function buildProfileSection(config: RadarConfig): LuaSection {
  const p = config.profile;
  const hpf1 = getHpf1Index(p.hpfCornerFreq1Khz);
  const hpf2 = getHpf2Index(p.hpfCornerFreq2Khz);

  return {
    title: '2. Profile Configuration',
    isVerified: true,
    commands: [
      {
        apiName: 'ar1.ProfileConfig',
        args: [
          p.profileId || 0,
          p.startFrequencyGHz,
          p.idleTimeUs,
          p.adcStartTimeUs,
          p.rampEndTimeUs,
          p.txOutPowerBackoffDb || 0,
          p.txOutPowerBackoffDb || 0,
          p.txOutPowerBackoffDb || 0,
          0, 0, 0, // per-TX phase shifters
          p.frequencySlopeMHzUs,
          1, // txStartTime (typically 1.0 us)
          p.adcSamples,
          p.sampleRateKsps,
          hpf1,
          hpf2,
          p.rxGainDb,
        ],
        comment: `Profile ${p.profileId}: StartFreq=${p.startFrequencyGHz} GHz, Idle=${p.idleTimeUs} us, ADCStart=${p.adcStartTimeUs} us, RampEnd=${p.rampEndTimeUs} us, Slope=${p.frequencySlopeMHzUs} MHz/us, Samples=${p.adcSamples}, Fs=${p.sampleRateKsps} ksps, Gain=${p.rxGainDb} dB`,
        isVerified: true,
      },
    ],
  };
}

/**
 * Verified Section 3: Chirp Configuration
 * TI API: ar1.ChirpConfig(chirpStartIndex, chirpEndIndex, profileId, startFreqVar, freqSlopeVar, idleTimeVar, adcStartTimeVar, tx0Enable, tx1Enable, tx2Enable)
 */
export function buildChirpSection(config: RadarConfig): LuaSection {
  const commands: LuaCommand[] = [];

  const chirps = config.chirps;

  chirps.forEach((chirp) => {
    const txMask = getTxMask(chirp.txEnabled);
    const txLabels = [];
    if (chirp.txEnabled[0]) txLabels.push('TX1');
    if (chirp.txEnabled[1]) txLabels.push('TX2');
    if (chirp.txEnabled[2]) txLabels.push('TX3');

    commands.push({
      apiName: 'ar1.ChirpConfig',
      args: [
        chirp.chirpIndex,
        chirp.chirpIndex,
        chirp.profileId,
        chirp.startFreqVarMHz || 0,
        chirp.freqSlopeVarMHzUs || 0,
        chirp.idleTimeVarUs || 0,
        chirp.adcStartTimeVarUs || 0,
        ...chirp.txEnabled.map(Number),
      ],
      comment: `Chirp ${chirp.chirpIndex}: Profile ${chirp.profileId}, TX Mask=${txMask} (${txLabels.join('+') || 'None'})`,
      isVerified: true,
    });
  });

  return {
    title: '3. Chirp Sequence Configuration',
    isVerified: true,
    commands,
  };
}

/**
 * Verified Section 4: Frame Configuration
 * TI API: ar1.FrameConfig(chirpStartIndex, chirpEndIndex, numFrames, numLoops, framePeriodicity, triggerDelay, numDummyChirps, triggerSelect)
 */
export function buildFrameSection(config: RadarConfig): LuaSection {
  const f = config.frame;

  return {
    title: '4. Frame Configuration',
    isVerified: true,
    commands: [
      {
        apiName: 'ar1.FrameConfig',
        args: [
          f.chirpStartIndex,
          f.chirpEndIndex,
          f.frames,
          f.loops,
          f.periodicityMs,
          f.triggerDelayMs || 0,
          0, // numDummyChirps
          1, // software trigger
        ],
        comment: `Chirps [${f.chirpStartIndex}..${f.chirpEndIndex}], Loops=${f.loops}, Frames=${f.frames} (${f.frames === 0 ? 'continuous' : 'fixed'}), Period=${f.periodicityMs} ms, TriggerDelay=${f.triggerDelayMs || 0} ms`,
        isVerified: true,
      },
    ],
  };
}

/**
 * Mode B: DCA1000 Configuration & Capture
 * Note: DCA1000 commands are verified against standard mmWave Studio 2.x capture scripts,
 * but marked with Beta tags as host network adapter & firewall may require manual arming.
 */
export function buildDca1000Section(filePath = 'C:/ti/mmwave_studio_02_01_01_00/mmWaveStudio/PostProc/adc_data.bin'): LuaSection {
  return {
    title: '5. DCA1000 Setup & Capture Control (Mode B - Beta)',
    description: 'Requires prior DCA1000 Ethernet initialization, FPGA configuration and sensor LVDS setup. Not hardware tested.',
    isVerified: false,
    commands: [
      {
        apiName: 'ar1.SelectCaptureDevice',
        args: [`"DCA1000"`],
        comment: 'Select DCA1000 capture hardware',
        isVerified: true,
      },
      {
        apiName: 'ar1.CaptureCardConfig_Mode',
        args: [1, 2, 1, 2, 3, 30],
        comment: 'DCA1000: logging=1, xWR18xx LVDS=2, transfer=1, capture=2, format=3, timer=30',
        isVerified: true,
      },
      {
        apiName: 'ar1.CaptureCardConfig_PacketDelay',
        args: [25],
        comment: 'Ethernet packet delay in us (25 us for gigabit reliability)',
        isVerified: true,
      },
      {
        apiName: 'ar1.CaptureCardConfig_StartRecord',
        args: [JSON.stringify(filePath).replace(/\\u00([0-9a-f]{2})/gi, (_, hex) => '\\' + parseInt(hex, 16).toString().padStart(3, '0')), 1],
        comment: `Arm DCA1000 to record to: ${filePath}`,
        isVerified: true,
      },
      {
        apiName: 'RSTD.Sleep',
        args: [1000],
        comment: 'Allow recording to arm before the software trigger',
        isVerified: false,
      },
      {
        apiName: 'ar1.StartFrame',
        args: [],
        comment: 'Trigger radar sensor to begin chirping and transmitting frames',
        isVerified: true,
      },
    ],
  };
}

/**
 * Mode C: Full Automation Reference
 * Explicitly documented as unverified / template mapping for full automated board bringup.
 */
export function buildAutomationSection(): LuaSection {
  return {
    title: '6. Full Automated Bringup (Mode C - Reference Template / Unverified)',
    description: 'WARNING: Connection and firmware download calls require matching COM ports and local firmware file paths.',
    isVerified: false,
    commands: [
      {
        apiName: 'ar1.Connect',
        args: [4, 921600, 1000],
        comment: '[UNVERIFIED] Connect RS232 COM port (e.g. COM4 at 921600 baud)',
        isVerified: false,
        statusNotes: 'COM port number is environment-specific',
      },
      {
        apiName: 'ar1.DownloadBSSFw',
        args: [`"C:\\\\ti\\\\mmwave_studio_02_01_01_00\\\\rf_eval_firmware\\\\radarss\\\\xwr18xx_radarss.bin"`],
        comment: '[UNVERIFIED] Download RadarSS firmware',
        isVerified: false,
      },
      {
        apiName: 'ar1.DownloadMSSFw',
        args: [`"C:\\\\ti\\\\mmwave_studio_02_01_01_00\\\\rf_eval_firmware\\\\masterss\\\\xwr18xx_masterss.bin"`],
        comment: '[UNVERIFIED] Download MasterSS firmware',
        isVerified: false,
      },
      {
        apiName: 'ar1.PowerOn',
        args: [0, 1000, 0, 0],
        comment: '[UNVERIFIED] Power on BSS/MSS cores',
        isVerified: false,
      },
      {
        apiName: 'ar1.RfEnable',
        args: [],
        comment: '[UNVERIFIED] Enable RF front-end',
        isVerified: false,
      },
    ],
  };
}
