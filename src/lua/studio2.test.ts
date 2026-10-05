import { describe, it, expect } from 'vitest';
import { PRESETS } from '../presets/awr1843.ts';
import { buildChannelSection, buildProfileSection, buildChirpSection, buildFrameSection, buildDca1000Section } from './studio2.ts';
import { generateStudio2Lua } from './generator.ts';
import { calculateRadarPerformance } from '../radar/calculate.ts';
const c = structuredClone(PRESETS[0].config);
describe('Studio 2.1.1 Lua API regression cases', () => {
  it('uses per-channel flags in ChanNAdcConfig', () => {
    expect(buildChannelSection(c).commands[0]).toMatchObject({apiName: 'ar1.ChanNAdcConfig',args: [1,0,0,1,1,1,1,2,1,0]});
  });
  it('emits all 18 ProfileConfig arguments in TI order', () => {
    expect(buildProfileSection(c).commands[0].args).toEqual([0,77,50,6,60,0,0,0,0,0,0,45,1,256,5000,0,0,30]);
  });
  it('emits three TX enable flags in ChirpConfig', () => {
    expect(buildChirpSection(c).commands[0].args).toEqual([0,0,0,0,0,0,0,1,0,0]);
  });
  it('puts frame count before loop count and includes software trigger', () => {
    expect(buildFrameSection(c).commands[0].args).toEqual([0,0,100,64,50,0,0,1]);
  });
  it('uses the xWR18xx DCA1000 LVDS mode', () => {
    expect(buildDca1000Section().commands.find(x=>x.apiName==='ar1.CaptureCardConfig_Mode')?.args).toEqual([1,2,1,2,3,30]);
  });
  it('never marks untested full automation as hardware verified', () => {
    expect(generateStudio2Lua(c, calculateRadarPerformance(c), {mode:'full_automation',includeComments:true,includeCalculatedHeader:true}).verifiedStatus.automationVerified).toBe(false);
  });
  it('keeps metadata newlines inside Lua comments', () => {
    const code=generateStudio2Lua(c,calculateRadarPerformance(c),{mode:'config_only',includeComments:true,includeCalculatedHeader:false,metadata:{experimentName:'hello\nar1.StartFrame()',author:'a',notes:'',timestamp:''}}).code;
    expect(code).not.toMatch(/^ar1.StartFrame\(\)/m);
  });
});
