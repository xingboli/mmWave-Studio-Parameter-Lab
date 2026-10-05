import { RadarConfig } from '../radar/types.ts';

export interface PresetScenario {
  id: string;
  name: string;
  category: 'ranging' | 'doppler' | 'mimo' | 'vibration' | 'custom';
  tag: string;
  description: string;
  designIntent: string;
  recommendedUse: string;
  config: RadarConfig;
}
