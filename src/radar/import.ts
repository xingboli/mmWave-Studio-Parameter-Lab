import { RadarConfig, ExperimentMetadata } from './types.ts';
import { DEVICES } from './devices/awr1843.ts';

type RecordValue = Record<string, unknown>;
function record(value: unknown, path: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid object: ${path}`);
  return value as RecordValue;
}
function numericFields(value: RecordValue, required: string[], optional: string[], path: string) {
  for (const key of [...required, ...optional]) {
    const v = value[key];
    if (v === undefined && optional.includes(key)) continue;
    if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 1e9) throw new Error(`Invalid number: ${path}.${key}`);
  }
}
function flags(value: unknown, length: number, path: string) {
  if (!Array.isArray(value) || value.length !== length || value.some(v => typeof v !== 'boolean')) throw new Error(`Invalid antenna flags: ${path}`);
}

/** Guard both uploaded JSON and persisted browser state before rendering/calculation. */
export function parseExperiment(payload: unknown): { config: RadarConfig; metadata?: ExperimentMetadata } {
  const root = record(payload, 'experiment');
  const config = record(root.config ?? root, 'config');
  if (typeof config.device !== 'string' || !Object.hasOwn(DEVICES, config.device)) throw new Error('Unsupported device');
  const profile = record(config.profile, 'profile');
  numericFields(profile, ['profileId','startFrequencyGHz','idleTimeUs','adcStartTimeUs','rampEndTimeUs','frequencySlopeMHzUs','adcSamples','sampleRateKsps','rxGainDb'], ['hpfCornerFreq1Khz','hpfCornerFreq2Khz','txOutPowerBackoffDb'], 'profile');
  const frame = record(config.frame, 'frame');
  numericFields(frame, ['chirpStartIndex','chirpEndIndex','loops','frames','periodicityMs','triggerDelayMs'], [], 'frame');
  for (const field of ['chirpStartIndex', 'chirpEndIndex']) {
    if (!Number.isInteger(frame[field]) || (frame[field] as number) < 0 || (frame[field] as number) > 511) throw new Error(`Invalid chirp index: ${field}`);
  }
  const channels = record(config.channels, 'channels');
  flags(channels.rxEnabled, 4, 'channels.rxEnabled'); flags(channels.txEnabled, 3, 'channels.txEnabled');
  const adc = record(config.adc, 'adc');
  if (typeof adc.complex !== 'boolean' || typeof adc.iqSwap !== 'boolean' || ![12,14,16].includes(adc.bitsPerComponent as number)) throw new Error('Invalid ADC format');
  if (!Array.isArray(config.chirps) || config.chirps.length < 1 || config.chirps.length > 512) throw new Error('Invalid chirp list');
  for (const raw of config.chirps) {
    const chirp = record(raw, 'chirp');
    numericFields(chirp, ['chirpIndex','profileId'], ['startFreqVarMHz','freqSlopeVarMHzUs','idleTimeVarUs','adcStartTimeVarUs'], 'chirp');
    if (!Number.isInteger(chirp.chirpIndex) || (chirp.chirpIndex as number) < 0 || (chirp.chirpIndex as number) > 511) throw new Error('Invalid chirp index');
    flags(chirp.txEnabled, 3, 'chirp.txEnabled');
  }
  let metadata: ExperimentMetadata | undefined;
  if (root.metadata !== undefined) {
    const meta = record(root.metadata, 'metadata');
    for (const [key, value] of Object.entries(meta)) {
      if (typeof value !== 'string') throw new Error(`Invalid metadata: ${key}`);
    }
    metadata = { experimentName: '', author: '', notes: '', timestamp: '', ...meta } as ExperimentMetadata;
  }
  return { config: config as unknown as RadarConfig, metadata };
}
