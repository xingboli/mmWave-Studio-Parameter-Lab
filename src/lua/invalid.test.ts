import { it, expect } from 'vitest';
import { PRESETS } from '../presets/awr1843.ts';
import { generateStudio2Lua } from './generator.ts';
import { calculateRadarPerformance } from '../radar/calculate.ts';
it('blocks executable Lua when the configuration is invalid',()=>{
  const c=structuredClone(PRESETS[0].config); c.frame.periodicityMs=1;
  const script=generateStudio2Lua(c,calculateRadarPerformance(c),{mode:'config_only',includeComments:true,includeCalculatedHeader:true});
  expect(script.code).not.toMatch(/^ar1\./m); expect(script.verifiedStatus.radarConfigVerified).toBe(false);
});
