import { RadarConfig } from './types.ts';
import { calculateRadarPerformance } from './calculate.ts';
import { validateRadarConfig } from './validate.ts';
import { buildProfileSection, buildFrameSection } from '../lua/studio2.ts';

export type SweepableField = 'frequencySlopeMHzUs' | 'adcSamples' | 'sampleRateKsps' | 'idleTimeUs' | 'rampEndTimeUs' | 'loops';
export function buildSweepRows(base: RadarConfig, field: SweepableField, start: number, stop: number, step: number) {
  if (![start, stop, step].every(Number.isFinite)) return [];
  const increment = Math.max(0.001, Math.abs(step)) * (start <= stop ? 1 : -1);
  const count = Math.min(50, Math.floor(Math.abs(stop - start) / Math.abs(increment) + 1e-6) + 1);
  return Array.from({length: count}, (_, i) => {
    const value = Number((start + i * increment).toPrecision(12));
    const config = {...base, profile: {...base.profile, ...(field !== 'loops' ? {[field]: value} : {})}, frame: {...base.frame, ...(field === 'loops' ? {loops: value} : {})}};
    const perf = calculateRadarPerformance(config);
    const valResult = validateRadarConfig(config, perf);
    return {value, config, perf, valResult, isValid: valResult.isValid};
  });
}
export function generateSweepLua(rows: ReturnType<typeof buildSweepRows>, field: SweepableField): string {
  const lines = ['-- Studio 2.1.1 parameter sweep: ' + field, '-- Configuration only; recording and frame triggering are manual.', '-- Invalid rows are omitted. API mapping checked; not hardware tested.'];
  rows.forEach((row, i) => {
    if (!row.isValid) { lines.push(`-- Skipped invalid row ${i + 1}: ${row.value}`); return; }
    lines.push(`-- Row ${i + 1}: ${row.value}`);
    for (const section of [buildProfileSection(row.config), buildFrameSection(row.config)]) {
      for (const command of section.commands) lines.push(`${command.apiName}(${command.args.join(', ')})`);
    }
    lines.push('RSTD.Sleep(100)');
  });
  return lines.join('\n');
}
