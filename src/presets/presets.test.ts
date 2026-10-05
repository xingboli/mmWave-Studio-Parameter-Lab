import { describe, it, expect } from 'vitest';
import { PRESETS } from './awr1843.ts';
import { calculateRadarPerformance } from '../radar/calculate.ts';
import { validateRadarConfig } from '../radar/validate.ts';

describe('AWR1843 Preset Scenarios', () => {
  it('has at least 5 standard presets', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  PRESETS.forEach((preset) => {
    it(`validates preset: ${preset.name}`, () => {
      const perf = calculateRadarPerformance(preset.config);
      const val = validateRadarConfig(preset.config, perf);
      expect(val.isValid).toBe(true);
      expect(val.hasErrors).toBe(false);
      expect(perf.rangeResolutionM).toBeGreaterThan(0);
      expect(perf.recommendedMaxRangeM).toBeGreaterThan(0);
      expect(perf.maxUnambiguousVelocityMps).toBeGreaterThan(0);
    });
  });
});
