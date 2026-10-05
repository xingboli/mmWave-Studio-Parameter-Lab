import { RadarConfig, CalculatedRadarPerformance, ExperimentMetadata } from '../radar/types.ts';

export type LuaOutputMode = 'config_only' | 'config_and_capture' | 'full_automation';

export interface LuaCommand {
  apiName: string;
  args: (string | number)[];
  comment?: string;
  isVerified: boolean;
  statusNotes?: string;
}

export interface LuaSection {
  title: string;
  description?: string;
  isVerified: boolean;
  commands: LuaCommand[];
}

export interface LuaGenerationOptions {
  mode: LuaOutputMode;
  includeComments: boolean;
  includeCalculatedHeader: boolean;
  metadata?: ExperimentMetadata;
  captureFilePath?: string;
}

export interface GeneratedLuaScript {
  code: string;
  mode: LuaOutputMode;
  backendName: string;
  verifiedStatus: {
    radarConfigVerified: boolean;
    dca1000Verified: boolean;
    automationVerified: boolean;
  };
}
