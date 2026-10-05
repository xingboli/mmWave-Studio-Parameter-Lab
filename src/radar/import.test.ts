import { describe, it, expect } from 'vitest';
import { PRESETS } from '../presets/awr1843.ts';
import { parseExperiment } from './import.ts';
const config = PRESETS[0].config;
describe('configuration import boundary', () => {
  it('accepts both a raw config and the exported wrapper', () => {
    expect(parseExperiment(config).config).toEqual(config);
    expect(parseExperiment({config}).config).toEqual(config);
  });
  it.each([null, {profile:{},frame:{}}, {...config,channels:null}, {...config,device:'unknown'},
    {...config,channels:{rxEnabled:[true],txEnabled:[true,false,false]}},
    {...config,profile:{...config.profile,sampleRateKsps:'5000'}},
    {...config,frame:{...config.frame,chirpEndIndex:100000000}},
  ])('rejects malformed input before it reaches React', payload => expect(()=>parseExperiment(payload)).toThrow());
  it('rejects malformed metadata before Lua generation', () => {
    expect(()=>parseExperiment({config, metadata:{author:55}})).toThrow();
  });
});
