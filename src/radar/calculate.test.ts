import { describe, it, expect } from 'vitest';
import { calculateRadarPerformance } from './calculate.ts';
import { RadarConfig } from './types.ts';
import { SPEED_OF_LIGHT, TI_MAX_RANGE_ENGINEERING_FACTOR } from './constants.ts';

describe('Radar Performance Calculator', () => {
  // Test scenario specified in requirements section 33:
  // Start Frequency: 77 GHz
  // Idle Time: 100 us
  // ADC Start: 6 us
  // Ramp End: 60 us
  // Slope: 30 MHz/us
  // ADC Samples: 256
  // ADC Sample Rate: 5000 ksps
  // RX: 4
  // TX: 3 (TDM, 3 chirps)
  // Loops: 128
  // Frames: 100
  // Frame Period: 50 ms
  const baselineConfig: RadarConfig = {
    device: 'awr1843boost',
    profile: {
      profileId: 0,
      startFrequencyGHz: 77.0,
      idleTimeUs: 100.0,
      adcStartTimeUs: 6.0,
      rampEndTimeUs: 60.0,
      frequencySlopeMHzUs: 30.0,
      adcSamples: 256,
      sampleRateKsps: 5000,
      rxGainDb: 30,
    },
    channels: {
      rxEnabled: [true, true, true, true],
      txEnabled: [true, true, true],
    },
    chirps: [
      { chirpIndex: 0, profileId: 0, txEnabled: [true, false, false] },
      { chirpIndex: 1, profileId: 0, txEnabled: [false, true, false] },
      { chirpIndex: 2, profileId: 0, txEnabled: [false, false, true] },
    ],
    frame: {
      chirpStartIndex: 0,
      chirpEndIndex: 2,
      loops: 128,
      frames: 100,
      periodicityMs: 50.0,
      triggerDelayMs: 0.0,
    },
    adc: {
      complex: true,
      bitsPerComponent: 16,
      iqSwap: false,
    },
  };

  it('correctly calculates ADC Sampling Time', () => {
    const perf = calculateRadarPerformance(baselineConfig);
    // Tadc = Nadc / Fs = 256 / 5,000,000 = 51.2 us (5.12e-5 s)
    expect(perf.adcSamplingTimeS).toBeCloseTo(5.12e-5, 8);
    expect(perf.adcSamplingTimeUs).toBeCloseTo(51.2, 4);
  });

  it('correctly calculates Effective Bandwidth and Full Sweep Bandwidth', () => {
    const perf = calculateRadarPerformance(baselineConfig);
    // Badc = Slope * Tadc = (30e12 Hz/s) * (5.12e-5 s) = 1.536e9 Hz = 1536 MHz
    expect(perf.effectiveAdcBandwidthHz).toBeCloseTo(1.536e9, 0);
    expect(perf.effectiveAdcBandwidthMHz).toBeCloseTo(1536, 1);

    // Full sweep bandwidth = Slope * RampEndTime = (30 MHz/us) * 60 us = 1800 MHz = 1.8 GHz
    expect(perf.fullChirpSweepBandwidthMHz).toBeCloseTo(1800, 1);
  });

  it('correctly calculates Range Resolution', () => {
    const perf = calculateRadarPerformance(baselineConfig);
    // deltaR = c / (2 * Badc) = 299792458 / (2 * 1.536e9) ≈ 0.09758869 m ≈ 9.76 cm
    const expectedDeltaR = SPEED_OF_LIGHT / (2 * 1.536e9);
    expect(perf.rangeResolutionM).toBeCloseTo(expectedDeltaR, 6);
    expect(perf.rangeResolutionCm).toBeCloseTo(expectedDeltaR * 100, 3);
  });

  it('correctly calculates Maximum Range with and without 0.9 margin', () => {
    const perf = calculateRadarPerformance(baselineConfig);
    // Rmax = Fs * c / (2 * Slope) = (5e6 * 299792458) / (2 * 30e12) ≈ 24.9827 m
    const expectedTheoretical = (5e6 * SPEED_OF_LIGHT) / (2 * 30e12);
    expect(perf.theoreticalMaxRangeM).toBeCloseTo(expectedTheoretical, 3);

    const expectedRecommended = expectedTheoretical * TI_MAX_RANGE_ENGINEERING_FACTOR;
    expect(perf.recommendedMaxRangeM).toBeCloseTo(expectedRecommended, 3);
  });

  it('correctly calculates Chirp Cycle Time and Repetition Frequency', () => {
    const perf = calculateRadarPerformance(baselineConfig);
    // Tchirp = Idle + RampEnd = 100 us + 60 us = 160 us
    expect(perf.chirpCycleTimeUs).toBeCloseTo(160.0, 4);
    expect(perf.chirpCycleTimeS).toBeCloseTo(160e-6, 8);
    // Chirp rate = 1 / 160us = 6250 Hz
    expect(perf.chirpRepetitionFrequencyHz).toBeCloseTo(6250, 1);
  });

  it('correctly calculates TDM-MIMO Maximum Velocity and Velocity Resolution', () => {
    const perf = calculateRadarPerformance(baselineConfig);
    // lambda = c / 77GHz ≈ 3.8934 mm
    const lambda = SPEED_OF_LIGHT / 77e9;
    expect(perf.wavelengthM).toBeCloseTo(lambda, 6);

    // 3 chirps in loop (TDM with 3 TX) -> Ttx = 3 * 160 us = 480 us
    expect(perf.txRepetitionTimeUs).toBeCloseTo(480.0, 3);

    // Vmax = lambda / (4 * Ttx) = lambda / (4 * 480e-6) ≈ 2.0278 m/s
    const expectedVmax = lambda / (4 * 480e-6);
    expect(perf.maxUnambiguousVelocityMps).toBeCloseTo(expectedVmax, 3);
    expect(perf.maxUnambiguousVelocityKmh).toBeCloseTo(expectedVmax * 3.6, 2);

    // Velocity Resolution: Nd = 128 loops, Tobs = 128 * 480e-6 = 0.06144 s
    // deltaV = lambda / (2 * Tobs) ≈ 0.03168 m/s
    const expectedDeltaV = lambda / (2 * 128 * 480e-6);
    expect(perf.velocityResolutionMps).toBeCloseTo(expectedDeltaV, 4);
  });

  it('correctly calculates Frame Chirps, Active Time, and Duty Cycle', () => {
    const perf = calculateRadarPerformance(baselineConfig);
    // Chirps per loop = 3, loops = 128 -> total chirps per frame = 384
    expect(perf.chirpsPerLoop).toBe(3);
    expect(perf.chirpsPerFrame).toBe(384);

    // Frame active time = 384 * 160 us = 61.44 ms (0.06144 s)
    expect(perf.frameActiveTimeMs).toBeCloseTo(61.44, 2);

    // Frame periodicity = 50 ms. Notice active time (61.44 ms) > 50 ms, duty cycle > 100% (capped at 100%)
    // This triggers validation error, which is verified by validator test!
    expect(perf.framePeriodicityMs).toBe(50.0);
    expect(perf.frameRateFps).toBe(20.0);
  });

  it('correctly calculates Raw ADC Data Size for 16-bit complex IQ', () => {
    const perf = calculateRadarPerformance(baselineConfig);
    // Complex 16-bit IQ: 4 bytes per sample
    // 256 samples * 4 RX * 4 bytes = 4,096 bytes per chirp
    expect(perf.dataSizePerChirpBytes).toBe(4096);

    // Per frame: 384 chirps * 4096 bytes = 1,572,864 bytes = 1.5 MB (1536 KB)
    expect(perf.dataSizePerFrameBytes).toBe(1572864);
    expect(perf.dataSizePerFrameKB).toBe(1536);
    expect(perf.dataSizePerFrameMB).toBe(1.5);

    // Total for 100 frames: 157,286,400 bytes = 150 MB
    expect(perf.totalDataSizeBytes).toBe(157286400);
    expect(perf.totalDataSizeMB).toBe(150);
  });

  it('handles edge cases gracefully without NaN, Infinity, or throwing', () => {
    const zeroConfig: RadarConfig = {
      device: 'awr1843boost',
      profile: {
        profileId: 0,
        startFrequencyGHz: 0,
        idleTimeUs: 0,
        adcStartTimeUs: 0,
        rampEndTimeUs: 0,
        frequencySlopeMHzUs: 0,
        adcSamples: 0,
        sampleRateKsps: 0,
        rxGainDb: 0,
      },
      channels: {
        rxEnabled: [false, false, false, false],
        txEnabled: [false, false, false],
      },
      chirps: [],
      frame: {
        chirpStartIndex: 0,
        chirpEndIndex: 0,
        loops: 0,
        frames: 0,
        periodicityMs: 0,
        triggerDelayMs: 0,
      },
      adc: {
        complex: true,
        bitsPerComponent: 16,
        iqSwap: false,
      },
    };

    const perf = calculateRadarPerformance(zeroConfig);
    expect(perf.rangeResolutionM).toBeDefined();
    expect(isNaN(perf.rangeResolutionM)).toBe(false);
    expect(isFinite(perf.rangeResolutionM)).toBe(true);
    expect(isNaN(perf.maxUnambiguousVelocityMps)).toBe(false);
    expect(isFinite(perf.maxUnambiguousVelocityMps)).toBe(true);
    expect(isNaN(perf.dutyCyclePercent)).toBe(false);
    expect(isFinite(perf.dutyCyclePercent)).toBe(true);
  });
});
