import { describe, it, expect } from 'vitest';
import { PRESETS } from '../presets/awr1843.ts';
import { buildSweepRows, generateSweepLua } from './sweep.ts';
const config=structuredClone(PRESETS[0].config);
describe('parameter sweep export',()=>{
  it.each(['idleTimeUs','rampEndTimeUs'] as const)('applies each %s value to exported ProfileConfig', field=>{
    const rows=buildSweepRows(config,field,61,62,1);
    const code=generateSweepLua(rows,field);
    const commands=code.split('\n').filter(line=>line.startsWith('ar1.ProfileConfig('));
    expect(commands).toHaveLength(2);
    const slot=field==='idleTimeUs'?2:4;
    expect(commands.map(line=>Number(line.slice(line.indexOf('(')+1,line.indexOf(')')).split(',')[slot]))).toEqual([61,62]);
  });
  it('omits invalid configurations from executable output',()=>{
    const rows=buildSweepRows(config,'rampEndTimeUs',20,60,40);
    expect(rows.map(r=>r.isValid)).toEqual([false,true]);
    expect(generateSweepLua(rows,'rampEndTimeUs').split('\n').filter(l=>l.startsWith('ar1.ProfileConfig('))).toHaveLength(1);
  });
  it('keeps descending sweeps bounded to fifty rows',()=>{
    const rows=buildSweepRows(config,'idleTimeUs',100,10,0.01);
    expect(rows).toHaveLength(50); expect(rows[1].value).toBeCloseTo(99.99);
  });
});
