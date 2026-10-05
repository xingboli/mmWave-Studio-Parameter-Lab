import { describe, it, expect } from 'vitest';
import { validateRadarConfig } from './validate.ts';
import { calculateRadarPerformance } from './calculate.ts';
import { RadarConfig } from './types.ts';

describe('Radar Config Validator', () => {
  const validConfig: RadarConfig = {
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
      loops: 64, // with 64 loops, active time is ~30.72 ms < 50 ms
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

  it('validates a correct configuration with no errors', () => {
    const perf = calculateRadarPerformance(validConfig);
    const result = validateRadarConfig(validConfig, perf);
    expect(result.isValid).toBe(true);
    expect(result.hasErrors).toBe(false);
  });

  it('detects when ADC sampling time exceeds Ramp End Time', () => {
    // 512 samples at 5000 ksps = 102.4 us duration.
    // 6 us start + 102.4 us = 108.4 us > 60 us ramp end!
    const invalidConfig: RadarConfig = {
      ...validConfig,
      profile: {
        ...validConfig.profile,
        adcSamples: 512,
        rampEndTimeUs: 60.0,
      },
    };
    const perf = calculateRadarPerformance(invalidConfig);
    const result = validateRadarConfig(invalidConfig, perf);
    expect(result.isValid).toBe(false);
    expect(result.hasErrors).toBe(true);
    expect(
      result.issues.some((i) => i.code === 'ADC_SAMPLING_EXCEEDS_RAMP')
    ).toBe(true);
  });

  it('detects when Frame Active Time exceeds Frame Periodicity', () => {
    // 128 loops * 3 chirps * 160 us = 61.44 ms > 50 ms periodicity
    const invalidFrameConfig: RadarConfig = {
      ...validConfig,
      frame: {
        ...validConfig.frame,
        loops: 128,
        periodicityMs: 50.0,
      },
    };
    const perf = calculateRadarPerformance(invalidFrameConfig);
    const result = validateRadarConfig(invalidFrameConfig, perf);
    expect(result.isValid).toBe(false);
    expect(
      result.issues.some((i) => i.code === 'FRAME_ACTIVE_EXCEEDS_PERIOD')
    ).toBe(true);
  });

  it('detects missing RX or TX antennas', () => {
    const noRxConfig: RadarConfig = {
      ...validConfig,
      channels: {
        ...validConfig.channels,
        rxEnabled: [false, false, false, false],
      },
    };
    const perf = calculateRadarPerformance(noRxConfig);
    const result = validateRadarConfig(noRxConfig, perf);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((i) => i.code === 'NO_RX_ENABLED')).toBe(true);
  });
});
