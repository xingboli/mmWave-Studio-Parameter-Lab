import { describe, it, expect } from 'vitest';
import { PRESETS } from '../presets/awr1843.ts';
import { calculateRadarPerformance } from './calculate.ts';
import { validateRadarConfig } from './validate.ts';
import { searchFeasibleConfigurations } from './reverse.ts';

const fresh = () => structuredClone(PRESETS[0].config);
const issues = (config: ReturnType<typeof fresh>) => validateRadarConfig(config, calculateRadarPerformance(config), 'en');
describe('radar regression cases', () => {
  it('shows the actual duty cycle above 100 percent', () => {
    const c = fresh(); c.frame.periodicityMs = 1;
    expect(calculateRadarPerformance(c).dutyCyclePercent).toBeCloseTo(704, 4);
  });
  it('halves the unambiguous range for real ADC sampling', () => {
    const c = fresh(); const complex = calculateRadarPerformance(c);
    c.adc.complex = false;
    expect(calculateRadarPerformance(c).theoreticalMaxRangeM).toBeCloseTo(complex.theoreticalMaxRangeM / 2, 6);
  });
  it('resolves chirps by their hardware index rather than array position', () => {
    const c = fresh(); c.chirps[0].chirpIndex = 7; c.chirps[0].txEnabled = [false, false, true];
    c.channels.txEnabled = [false, false, true]; c.frame.chirpStartIndex = 7; c.frame.chirpEndIndex = 7;
    expect(calculateRadarPerformance(c).virtualAntennaCountAzimuth).toBe(4);
    c.chirps.push({chirpIndex: 0, profileId: 0, txEnabled: [false, true, false]});
    expect(calculateRadarPerformance(c).virtualAntennaCountAzimuth).toBe(4);
  });
  it.each([
    ['missing chirp', (c: ReturnType<typeof fresh>) => { c.frame.chirpEndIndex = 3; }],
    ['reversed range', (c: ReturnType<typeof fresh>) => { c.frame.chirpStartIndex = 2; }],
    ['disabled TX', (c: ReturnType<typeof fresh>) => { c.channels.txEnabled = [false, true, false]; }],
    ['empty TX', (c: ReturnType<typeof fresh>) => { c.chirps[0].txEnabled = [false, false, false]; }],
    ['wrong profile', (c: ReturnType<typeof fresh>) => { c.chirps[0].profileId = 1; }],
    ['zero slope', (c: ReturnType<typeof fresh>) => { c.profile.frequencySlopeMHzUs = 0; }],
    ['infinite sample rate', (c: ReturnType<typeof fresh>) => { c.profile.sampleRateKsps = Infinity; }],
    ['nonzero chirp variation', (c: ReturnType<typeof fresh>) => { c.chirps[0].idleTimeVarUs = 100; }],
  ])('rejects %s', (_, change) => { const c = fresh(); change(c); expect(issues(c).isValid).toBe(false); });
  it('rejects zero search targets instead of returning infinite scores', () => {
    expect(searchFeasibleConfigurations(fresh(), {maxRangeResolutionM: 1, minMaxRangeM: 0, minMaxVelocityMps: 0, minFrameRateFps: 1})).toEqual([]);
  });
});
