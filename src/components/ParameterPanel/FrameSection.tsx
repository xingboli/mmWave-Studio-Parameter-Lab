import React from 'react';
import { RadarFrameConfig } from '../../radar/types.ts';
import { HelpTooltip } from '../common/HelpTooltip.tsx';
import { useLanguage } from '../../i18n/context.tsx';

interface FrameSectionProps {
  frame: RadarFrameConfig;
  maxChirpIndex: number;
  onChange: (updated: RadarFrameConfig) => void;
}

export const FrameSection: React.FC<FrameSectionProps> = ({
  frame,
  maxChirpIndex,
  onChange,
}) => {
  const { t } = useLanguage();

  const updateField = <K extends keyof RadarFrameConfig>(
    field: K,
    value: RadarFrameConfig[K]
  ) => {
    onChange({
      ...frame,
      [field]: value,
    });
  };

  const handleNumberInput = (
    field: keyof RadarFrameConfig,
    rawVal: string,
    isInteger = false
  ) => {
    const parsed = isInteger ? parseInt(rawVal, 10) : parseFloat(rawVal);
    updateField(field, (isNaN(parsed) ? 0 : parsed) as any);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
          {t.frameTitle}
        </h3>
        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {t.frameSubtitle}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Chirp Loop Range */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.chirpSeqRange}
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="text-[10px] text-slate-400 absolute left-2 top-1.5 font-mono">
                {t.chirpStart}
              </span>
              <input
                type="number"
                min="0"
                max={frame.chirpEndIndex}
                value={frame.chirpStartIndex}
                onChange={(e) => handleNumberInput('chirpStartIndex', e.target.value, true)}
                className="w-full text-xs font-mono border border-slate-300 rounded pl-12 pr-2 py-1.5 focus:border-blue-500 outline-none"
              />
            </div>
            <span className="text-slate-400 text-xs">~</span>
            <div className="relative flex-1">
              <span className="text-[10px] text-slate-400 absolute left-2 top-1.5 font-mono">
                {t.chirpEnd}
              </span>
              <input
                type="number"
                min={frame.chirpStartIndex}
                max={Math.max(0, maxChirpIndex)}
                value={frame.chirpEndIndex}
                onChange={(e) => handleNumberInput('chirpEndIndex', e.target.value, true)}
                className="w-full text-xs font-mono border border-slate-300 rounded pl-10 pr-2 py-1.5 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {frame.chirpEndIndex - frame.chirpStartIndex + 1} {t.chirpsPerLoop}
          </span>
        </div>

        {/* Chirp Loops */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.chirpLoops}
            <HelpTooltip paramKey="loops" />
          </label>
          <div className="relative">
            <input
              type="number"
              step="16"
              min="1"
              value={frame.loops}
              onChange={(e) => handleNumberInput('loops', e.target.value, true)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono pointer-events-none">
              loops
            </span>
          </div>
          <div className="flex gap-1 mt-1">
            {[32, 64, 128, 256].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => updateField('loops', l)}
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono border transition-colors ${
                  frame.loops === l
                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Frame Periodicity */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.framePeriod}
            <HelpTooltip paramKey="periodicityMs" />
          </label>
          <div className="relative">
            <input
              type="number"
              step="5"
              min="1"
              value={frame.periodicityMs}
              onChange={(e) => handleNumberInput('periodicityMs', e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono pointer-events-none">
              ms
            </span>
          </div>
          <div className="flex gap-1 mt-1">
            {[20, 33.3, 40, 50, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => updateField('periodicityMs', p)}
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono border transition-colors ${
                  Math.abs(frame.periodicityMs - p) < 0.1
                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}ms ({p === 33.3 ? '30' : Math.round(1000 / p)}fps)
              </button>
            ))}
          </div>
        </div>

        {/* Number of Frames */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.numFrames}
            <HelpTooltip paramKey="frames" />
          </label>
          <div className="relative">
            <input
              type="number"
              step="50"
              min="0"
              value={frame.frames}
              onChange={(e) => handleNumberInput('frames', e.target.value, true)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono pointer-events-none">
              {frame.frames === 0 ? t.continuousFrames : 'frames'}
            </span>
          </div>
          <div className="flex gap-1 mt-1">
            {[0, 50, 100, 200, 500].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => updateField('frames', f)}
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono border transition-colors ${
                  frame.frames === f
                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f === 0 ? '0 (∞)' : f}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
