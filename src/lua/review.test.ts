import { it, expect } from 'vitest';
import { PRESETS } from '../presets/awr1843.ts';
import { calculateRadarPerformance } from '../radar/calculate.ts';
import { validateRadarConfig } from '../radar/validate.ts';
import { generateStudio2Lua } from './generator.ts';
it('validates inactive chirps too because the Lua emitter configures them',()=>{
  const c=structuredClone(PRESETS[0].config); c.chirps.push({chirpIndex:1,profileId:1.5,txEnabled:[false,true,false]});
  expect(validateRadarConfig(c,calculateRadarPerformance(c)).isValid).toBe(false);
});
it('keeps capture paths inside a string and single-line comment',()=>{
  const c=PRESETS[0].config;
  const code=generateStudio2Lua(c,calculateRadarPerformance(c),{mode:'config_and_capture',includeComments:true,includeCalculatedHeader:false,captureFilePath:'x\nar1.StopFrame()\u0000'}).code;
  expect(code).not.toMatch(/^ar1.StopFrame\(\)/m);expect(code).not.toContain('\\u0000');
});
