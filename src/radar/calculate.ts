import { CalculatedRadarPerformance, RadarConfig } from './types.ts';
import {
  SPEED_OF_LIGHT,
  TI_MAX_RANGE_ENGINEERING_FACTOR,
  COMPLEX_16BIT_BYTES_PER_SAMPLE,
  REAL_16BIT_BYTES_PER_SAMPLE,
} from './constants.ts';
import {
  ghzToHz,
  mhzPerUsToHzPerS,
  kspsToHz,
  usToSeconds,
  secondsToUs,
  msToSeconds,
  secondsToMs,
  metersToCm,
  mpsToKmh,
  radToDeg,
  bytesToKb,
  bytesToMb,
  bytesToGb,
  hzToMhz,
} from './units.ts';
import { getDeviceById } from './devices/awr1843.ts';

/**
 * Safely performs division, returning 0 if denominator is 0 or non-finite.
 */
function safeDiv(num: number, denom: number): number {
  if (!denom || isNaN(denom) || !isFinite(denom) || denom === 0) return 0;
  const res = num / denom;
  return isNaN(res) || !isFinite(res) ? 0 : res;
}

/**
 * Core radar performance calculator.
 * Pure function with zero dependencies on React or browser DOM.
 * Follows physical FMCW radar equations with SI base units internally.
 */
export function calculateRadarPerformance(
  config: RadarConfig
): CalculatedRadarPerformance {
  const device = getDeviceById(config.device);

  // 1. Carrier Frequency & Wavelength
  // Start Frequency is used as the approximate carrier frequency for Doppler / angular calculations
  const startFreqGHz = Math.max(0, config.profile.startFrequencyGHz || 77.0);
  const carrierFreqHz = ghzToHz(startFreqGHz);
  const wavelengthM = safeDiv(SPEED_OF_LIGHT, carrierFreqHz);

  // 2. ADC Sampling Time
  const adcSamples = Math.max(0, Math.floor(config.profile.adcSamples || 0));
  const sampleRateKsps = Math.max(0, config.profile.sampleRateKsps || 0);
  const sampleRateHz = kspsToHz(sampleRateKsps);
  const adcSamplingTimeS = safeDiv(adcSamples, sampleRateHz);
  const adcSamplingTimeUs = secondsToUs(adcSamplingTimeS);

  // 3. Slope & Bandwidths
  const slopeMHzUs = config.profile.frequencySlopeMHzUs || 0;
  const slopeHzS = mhzPerUsToHzPerS(slopeMHzUs);

  const rampEndTimeS = usToSeconds(Math.max(0, config.profile.rampEndTimeUs || 0));
  const fullChirpSweepBandwidthHz = Math.abs(slopeHzS * rampEndTimeS);
  const fullChirpSweepBandwidthMHz = hzToMhz(fullChirpSweepBandwidthHz);

  const effectiveAdcBandwidthHz = Math.abs(slopeHzS * adcSamplingTimeS);
  const effectiveAdcBandwidthMHz = hzToMhz(effectiveAdcBandwidthHz);

  // 4. Range Resolution: deltaR = c / (2 * Badc)
  const rangeResolutionM = safeDiv(SPEED_OF_LIGHT, 2 * effectiveAdcBandwidthHz);
  const rangeResolutionCm = metersToCm(rangeResolutionM);
  const rangeBinSizeM = rangeResolutionM;

  // 5. Maximum Range:
  // Theoretical: Rmax = Fs * c / (2 * Slope)
  // Recommended: 0.9 * Rmax (accounting for IF filter roll-off)
  const theoreticalMaxRangeM = safeDiv(
    sampleRateHz * SPEED_OF_LIGHT * (config.adc.complex ? 1 : 0.5),
    2 * Math.abs(slopeHzS)
  );
  const recommendedMaxRangeM =
    theoreticalMaxRangeM * TI_MAX_RANGE_ENGINEERING_FACTOR;

  // 6. Chirp Cycle Time & Rate
  const idleTimeS = usToSeconds(Math.max(0, config.profile.idleTimeUs || 0));
  const chirpCycleTimeS = idleTimeS + rampEndTimeS;
  const chirpCycleTimeUs = secondsToUs(chirpCycleTimeS);
  const chirpRepetitionFrequencyHz = safeDiv(1, chirpCycleTimeS);

  // 7. Active Channels and TDM-MIMO Doppler Timing
  // Count active RX
  const activeRxCount = (config.channels.rxEnabled || []).filter(Boolean).length;

  // Derive active TX from chirps within [chirpStartIndex, chirpEndIndex]
  const chirpStart = Math.max(0, config.frame.chirpStartIndex || 0);
  const chirpEnd = Math.max(
    chirpStart,
    config.frame.chirpEndIndex !== undefined ? config.frame.chirpEndIndex : chirpStart
  );
  const chirpsPerLoop = Math.max(1, chirpEnd - chirpStart + 1);

  // Determine active TX channels across the configured chirps or fallback to channel config
  const activeTxMap = [false, false, false];
  if (config.chirps && config.chirps.length > 0) {
    for (const chirp of config.chirps.filter(c => c.chirpIndex >= chirpStart && c.chirpIndex <= chirpEnd)) {
      if (chirp && chirp.txEnabled) {
        if (chirp.txEnabled[0]) activeTxMap[0] = true;
        if (chirp.txEnabled[1]) activeTxMap[1] = true;
        if (chirp.txEnabled[2]) activeTxMap[2] = true;
      }
    }
  } else if (config.channels.txEnabled) {
    activeTxMap[0] = !!config.channels.txEnabled[0];
    activeTxMap[1] = !!config.channels.txEnabled[1];
    activeTxMap[2] = !!config.channels.txEnabled[2];
  }
  const activeTxCount = activeTxMap.filter(Boolean).length;

  // For TDM-MIMO:
  // Repetition interval for the SAME TX antenna is Ntx_active * Tchirp
  // In a standard TDM frame where each loop has chirpsPerLoop chirps (e.g. 3 chirps for 3 TX),
  // the repetition interval for a specific TX is chirpsPerLoop * Tchirp.
  const txRepetitionTimeS = chirpsPerLoop * chirpCycleTimeS;
  const txRepetitionTimeUs = secondsToUs(txRepetitionTimeS);

  // 8. Maximum Unambiguous Velocity: Vmax = lambda / (4 * Ttx)
  const maxUnambiguousVelocityMps = safeDiv(wavelengthM, 4 * txRepetitionTimeS);
  const maxUnambiguousVelocityKmh = mpsToKmh(maxUnambiguousVelocityMps);

  // 9. Velocity Resolution:
  // Nd = loops (number of chirps per TX per frame)
  // Tobs = Nd * Ttx = loops * txRepetitionTimeS
  // deltaV = lambda / (2 * Tobs)
  const loops = Math.max(1, config.frame.loops || 1);
  const dopplerChirpsPerTxPerFrame = loops;
  const dopplerObservationTimeS = loops * txRepetitionTimeS;
  const velocityResolutionMps = safeDiv(
    wavelengthM,
    2 * dopplerObservationTimeS
  );
  const velocityResolutionKmh = mpsToKmh(velocityResolutionMps);

  // 10. Frame Chirp Count & Timing
  const chirpsPerFrame = chirpsPerLoop * loops;
  const frameActiveTimeS = chirpsPerFrame * chirpCycleTimeS;
  const frameActiveTimeMs = secondsToMs(frameActiveTimeS);

  const framePeriodicityMs = Math.max(0, config.frame.periodicityMs || 0);
  const framePeriodicityS = msToSeconds(framePeriodicityMs);
  const frameRateFps = safeDiv(1, framePeriodicityS);

  const dutyCyclePercent =
    framePeriodicityS > 0
      ? Math.max(0, (frameActiveTimeS / framePeriodicityS) * 100)
      : 0;

  // 11. Virtual Antenna Count & Approximate Angular Resolution
  const virtualArray = device.computeVirtualAntennas(
    activeTxMap,
    config.channels.rxEnabled
  );
  const virtualAntennaCountTotal = virtualArray.total;
  const virtualAntennaCountAzimuth = virtualArray.azimuth;
  const virtualAntennaCountElevation = virtualArray.elevation;

  // Approximate Angular Resolution (ideal lambda/2 ULA: theta_rad ≈ 2 / N_azimuth)
  const approxAngularResolutionAzimuthRad =
    virtualAntennaCountAzimuth > 0 ? 2 / virtualAntennaCountAzimuth : 0;
  const approxAngularResolutionAzimuthDeg = radToDeg(
    approxAngularResolutionAzimuthRad
  );

  // 12. Raw ADC Data Size
  // 16-bit Complex = 4 bytes per sample (2 bytes I + 2 bytes Q)
  // 16-bit Real = 2 bytes per sample
  const bytesPerSample = config.adc.complex
    ? COMPLEX_16BIT_BYTES_PER_SAMPLE
    : REAL_16BIT_BYTES_PER_SAMPLE;

  const dataSizePerChirpBytes = adcSamples * activeRxCount * bytesPerSample;
  const dataSizePerFrameBytes = dataSizePerChirpBytes * chirpsPerFrame;
  const dataSizePerFrameKB = bytesToKb(dataSizePerFrameBytes);
  const dataSizePerFrameMB = bytesToMb(dataSizePerFrameBytes);

  const numFrames = Math.max(0, config.frame.frames || 0);
  const totalDataSizeBytes =
    numFrames > 0 ? dataSizePerFrameBytes * numFrames : 0;
  const totalDataSizeMB = bytesToMb(totalDataSizeBytes);
  const totalDataSizeGB = bytesToGb(totalDataSizeBytes);

  const dataRateMBps = dataSizePerFrameMB * frameRateFps;

  return {
    carrierFreqHz,
    wavelengthM,
    adcSamplingTimeS,
    adcSamplingTimeUs,
    fullChirpSweepBandwidthHz,
    fullChirpSweepBandwidthMHz,
    effectiveAdcBandwidthHz,
    effectiveAdcBandwidthMHz,
    rangeResolutionM,
    rangeResolutionCm,
    rangeBinSizeM,
    theoreticalMaxRangeM,
    recommendedMaxRangeM,
    chirpCycleTimeS,
    chirpCycleTimeUs,
    chirpRepetitionFrequencyHz,
    activeTxCount,
    activeRxCount,
    txRepetitionTimeS,
    txRepetitionTimeUs,
    maxUnambiguousVelocityMps,
    maxUnambiguousVelocityKmh,
    dopplerChirpsPerTxPerFrame,
    dopplerObservationTimeS,
    velocityResolutionMps,
    velocityResolutionKmh,
    chirpsPerLoop,
    chirpsPerFrame,
    frameActiveTimeS,
    frameActiveTimeMs,
    framePeriodicityMs,
    frameRateFps,
    dutyCyclePercent,
    virtualAntennaCountTotal,
    virtualAntennaCountAzimuth,
    virtualAntennaCountElevation,
    approxAngularResolutionAzimuthRad,
    approxAngularResolutionAzimuthDeg,
    bytesPerSample,
    dataSizePerChirpBytes,
    dataSizePerFrameBytes,
    dataSizePerFrameKB,
    dataSizePerFrameMB,
    totalDataSizeBytes,
    totalDataSizeMB,
    totalDataSizeGB,
    dataRateMBps,
  };
}
