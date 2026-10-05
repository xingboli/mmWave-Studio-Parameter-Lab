/**
 * Radar configuration data models and types
 * All modules (calculator, validator, lua generator, UI) read this unified config.
 */

export interface ChirpConfig {
  chirpIndex: number; // 0-based
  profileId: number;
  txEnabled: [boolean, boolean, boolean]; // [TX1, TX2, TX3] for AWR1843
  startFreqVarMHz?: number;
  freqSlopeVarMHzUs?: number;
  idleTimeVarUs?: number;
  adcStartTimeVarUs?: number;
}

export interface RadarProfileConfig {
  profileId: number;

  // RF / Chirp Timing (SI / Standard radar units in UI)
  startFrequencyGHz: number; // e.g. 77.0 GHz
  idleTimeUs: number; // e.g. 100.0 us
  adcStartTimeUs: number; // e.g. 6.0 us
  rampEndTimeUs: number; // e.g. 60.0 us

  frequencySlopeMHzUs: number; // e.g. 30.0 MHz/us

  // ADC Sampling
  adcSamples: number; // e.g. 256
  sampleRateKsps: number; // e.g. 5000 ksps

  // Analog Front-End
  hpfCornerFreq1Khz?: number; // HPF1: 175, 235, 350, 700 kHz
  hpfCornerFreq2Khz?: number; // HPF2: 350, 700, 1400, 2800 kHz
  rxGainDb: number; // e.g. 30 dB (typically 24 to 48 dB)
  txOutPowerBackoffDb?: number; // 0 for max power
}

export interface RadarChannelConfig {
  rxEnabled: [boolean, boolean, boolean, boolean]; // [RX1, RX2, RX3, RX4]
  txEnabled: [boolean, boolean, boolean]; // [TX1, TX2, TX3]
}

export interface RadarFrameConfig {
  chirpStartIndex: number; // 0
  chirpEndIndex: number; // e.g. 2 (for 3 chirps)
  loops: number; // e.g. 128
  frames: number; // e.g. 100 (0 = infinite / continuous)
  periodicityMs: number; // e.g. 50.0 ms
  triggerDelayMs: number; // e.g. 0.0 ms
}

export interface RadarAdcConfig {
  complex: boolean; // Complex 1x / 2x IQ vs Real
  bitsPerComponent: number; // 12, 14, 16 bits (typically 16-bit for DCA1000)
  iqSwap: boolean; // false = I first, then Q
}

export interface RadarConfig {
  device: string; // e.g. "awr1843boost"
  profile: RadarProfileConfig;
  channels: RadarChannelConfig;
  chirps: ChirpConfig[];
  frame: RadarFrameConfig;
  adc: RadarAdcConfig;
}

export interface ExperimentMetadata {
  experimentName: string;
  author: string;
  notes: string;
  sceneDescription?: string;
  boardRevision?: string;
  dcaFpgaVersion?: string;
  timestamp: string;
}

export interface CalculatedRadarPerformance {
  // Wavelength & Carrier
  carrierFreqHz: number;
  wavelengthM: number;

  // Sampling & Bandwidth
  adcSamplingTimeS: number;
  adcSamplingTimeUs: number;
  fullChirpSweepBandwidthHz: number;
  fullChirpSweepBandwidthMHz: number;
  effectiveAdcBandwidthHz: number;
  effectiveAdcBandwidthMHz: number;

  // Range Performance
  rangeResolutionM: number;
  rangeResolutionCm: number;
  rangeBinSizeM: number; // Range resolution / FFT size or per bin
  theoreticalMaxRangeM: number;
  recommendedMaxRangeM: number; // with TI 0.9 engineering margin

  // Chirp Timing & Repetition
  chirpCycleTimeS: number;
  chirpCycleTimeUs: number;
  chirpRepetitionFrequencyHz: number; // 1 / Tchirp

  // TDM-MIMO & Doppler
  activeTxCount: number;
  activeRxCount: number;
  txRepetitionTimeS: number;
  txRepetitionTimeUs: number;
  maxUnambiguousVelocityMps: number;
  maxUnambiguousVelocityKmh: number;
  dopplerChirpsPerTxPerFrame: number;
  dopplerObservationTimeS: number;
  velocityResolutionMps: number;
  velocityResolutionKmh: number;

  // Frame Timing & Duty Cycle
  chirpsPerLoop: number;
  chirpsPerFrame: number;
  frameActiveTimeS: number;
  frameActiveTimeMs: number;
  framePeriodicityMs: number;
  frameRateFps: number;
  dutyCyclePercent: number;

  // Antenna & Angular Performance
  virtualAntennaCountTotal: number;
  virtualAntennaCountAzimuth: number;
  virtualAntennaCountElevation: number;
  approxAngularResolutionAzimuthRad: number;
  approxAngularResolutionAzimuthDeg: number;

  // ADC Data Size
  bytesPerSample: number;
  dataSizePerChirpBytes: number;
  dataSizePerFrameBytes: number;
  dataSizePerFrameKB: number;
  dataSizePerFrameMB: number;
  totalDataSizeBytes: number;
  totalDataSizeMB: number;
  totalDataSizeGB: number;
  dataRateMBps: number;
}
