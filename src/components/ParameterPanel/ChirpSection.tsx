import React from 'react';
import { ChirpConfig } from '../../radar/types.ts';
import { Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../../i18n/context.tsx';

interface ChirpSectionProps {
  chirps: ChirpConfig[];
  onChange: (updated: ChirpConfig[]) => void;
}

export const ChirpSection: React.FC<ChirpSectionProps> = ({
  chirps,
  onChange,
}) => {
  const { t, language } = useLanguage();

  const handleTxToggle = (chirpIdx: number, txIndex: 0 | 1 | 2) => {
    const updated = chirps.map((c, i) => {
      if (i !== chirpIdx) return c;
      const newTx: [boolean, boolean, boolean] = [...c.txEnabled];
      newTx[txIndex] = !newTx[txIndex];
      return { ...c, txEnabled: newTx };
    });
    onChange(updated);
  };

  const addChirp = () => {
    if (chirps.length >= 8) return;
    const nextIdx = chirps.length;
    const defaultTx: [boolean, boolean, boolean] = [
      nextIdx % 3 === 0,
      nextIdx % 3 === 1,
      nextIdx % 3 === 2,
    ];
    onChange([
      ...chirps,
      {
        chirpIndex: nextIdx,
        profileId: 0,
        txEnabled: defaultTx,
      },
    ]);
  };

  const removeChirp = (idx: number) => {
    if (chirps.length <= 1) return;
    const filtered = chirps
      .filter((_, i) => i !== idx)
      .map((c, i) => ({ ...c, chirpIndex: i }));
    onChange(filtered);
  };

  const applyPattern = (pattern: 'single' | 'tdm2' | 'tdm3') => {
    if (pattern === 'single') {
      onChange([
        { chirpIndex: 0, profileId: 0, txEnabled: [true, false, false] },
      ]);
    } else if (pattern === 'tdm2') {
      onChange([
        { chirpIndex: 0, profileId: 0, txEnabled: [true, false, false] },
        { chirpIndex: 1, profileId: 0, txEnabled: [false, false, true] },
      ]);
    } else if (pattern === 'tdm3') {
      onChange([
        { chirpIndex: 0, profileId: 0, txEnabled: [true, false, false] },
        { chirpIndex: 1, profileId: 0, txEnabled: [false, true, false] },
        { chirpIndex: 2, profileId: 0, txEnabled: [false, false, true] },
      ]);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2 mb-3 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
            {t.chirpTitle}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {t.chirpSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">{t.chirpPatterns}</span>
          <button
            type="button"
            onClick={() => applyPattern('single')}
            className={`px-2 py-0.5 rounded border text-[11px] font-medium transition-colors ${
              chirps.length === 1 && chirps[0].txEnabled[0] && !chirps[0].txEnabled[1] && !chirps[0].txEnabled[2]
                ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {language === 'zh' ? '1 TX (单发)' : '1 TX'}
          </button>
          <button
            type="button"
            onClick={() => applyPattern('tdm2')}
            className={`px-2 py-0.5 rounded border text-[11px] font-medium transition-colors ${
              chirps.length === 2 ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="TX1 + TX3 (8 Virtual Azimuth elements)"
          >
            {language === 'zh' ? '2 TX 方位' : '2 TX Azimuth'}
          </button>
          <button
            type="button"
            onClick={() => applyPattern('tdm3')}
            className={`px-2 py-0.5 rounded border text-[11px] font-medium transition-colors ${
              chirps.length === 3 ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="TX1 + TX2 + TX3 (8 Azimuth + 4 Elevation = 12 Virtual Antennas)"
          >
            {language === 'zh' ? '3 TX 3D MIMO' : '3 TX 3D MIMO'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {chirps.map((chirp, idx) => (
          <div
            key={chirp.chirpIndex}
            className="flex items-center justify-between p-2.5 rounded-md border border-slate-200 bg-slate-50/70 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-slate-700 w-16">
                {t.chirpSlot} #{chirp.chirpIndex}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {t.chirpProfile} {chirp.profileId}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">{t.activeTx}</span>
                {[
                  { tx: 0, label: language === 'zh' ? 'TX1 (方位)' : 'TX1 (Azimuth)' },
                  { tx: 1, label: language === 'zh' ? 'TX2 (俯仰)' : 'TX2 (Elevation)' },
                  { tx: 2, label: language === 'zh' ? 'TX3 (方位)' : 'TX3 (Azimuth)' },
                ].map(({ tx, label }) => {
                  const active = chirp.txEnabled[tx as 0 | 1 | 2];
                  return (
                    <button
                      key={tx}
                      type="button"
                      onClick={() => handleTxToggle(idx, tx as 0 | 1 | 2)}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-medium border transition-colors ${
                        active
                          ? 'bg-blue-600 border-blue-700 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                      }`}
                      title={label}
                    >
                      TX{tx + 1}
                    </button>
                  );
                })}
              </div>

              {chirps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeChirp(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Remove this chirp slot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {chirps.length < 8 && (
        <button
          type="button"
          onClick={addChirp}
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 border border-dashed border-slate-300 rounded text-xs text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.addChirp}
        </button>
      )}
    </div>
  );
};
