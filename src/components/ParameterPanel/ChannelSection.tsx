import React from 'react';
import { RadarChannelConfig, RadarAdcConfig } from '../../radar/types.ts';
import { Cpu } from 'lucide-react';
import { useLanguage } from '../../i18n/context.tsx';

interface ChannelSectionProps {
  channels: RadarChannelConfig;
  adc: RadarAdcConfig;
  onChannelsChange: (updated: RadarChannelConfig) => void;
  onAdcChange: (updated: RadarAdcConfig) => void;
}

export const ChannelSection: React.FC<ChannelSectionProps> = ({
  channels,
  adc,
  onChannelsChange,
  onAdcChange,
}) => {
  const { t, language } = useLanguage();

  const toggleRx = (rxIdx: 0 | 1 | 2 | 3) => {
    const newRx: [boolean, boolean, boolean, boolean] = [...channels.rxEnabled];
    newRx[rxIdx] = !newRx[rxIdx];
    onChannelsChange({ ...channels, rxEnabled: newRx });
  };

  const toggleTx = (txIdx: 0 | 1 | 2) => {
    const newTx: [boolean, boolean, boolean] = [...channels.txEnabled];
    newTx[txIdx] = !newTx[txIdx];
    onChannelsChange({ ...channels, txEnabled: newTx });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          {t.channelsTitle}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          AWR1843 (3 TX, 4 RX)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RX Antennas */}
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">
            {t.rxAntennas}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((rx) => {
              const active = channels.rxEnabled[rx as 0 | 1 | 2 | 3];
              return (
                <button
                  key={rx}
                  type="button"
                  onClick={() => toggleRx(rx as 0 | 1 | 2 | 3)}
                  className={`py-1.5 px-2 rounded border text-xs font-mono font-medium text-center transition-all ${
                    active
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-slate-400">CH</div>
                  RX{rx + 1}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {t.rxAntennasSub}
          </span>
        </div>

        {/* TX Antennas */}
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-1.5">
            {t.txAntennas}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { idx: 0, label: 'TX1', desc: language === 'zh' ? '方位角' : 'Azimuth' },
              { idx: 1, label: 'TX2', desc: language === 'zh' ? '俯仰角' : 'Elevation' },
              { idx: 2, label: 'TX3', desc: language === 'zh' ? '方位角' : 'Azimuth' },
            ].map(({ idx, label, desc }) => {
              const active = channels.txEnabled[idx as 0 | 1 | 2];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleTx(idx as 0 | 1 | 2)}
                  className={`py-1.5 px-2 rounded border text-xs font-mono font-medium text-center transition-all ${
                    active
                      ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-slate-400">{desc}</div>
                  {label}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {t.txAntennasSub}
          </span>
        </div>

        {/* ADC Format */}
        <div className="md:col-span-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-700">{t.adcMode}</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="adcFormat"
                checked={adc.complex}
                onChange={() => onAdcChange({ ...adc, complex: true })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="font-mono text-slate-700">{t.adcComplex}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="adcFormat"
                checked={!adc.complex}
                onChange={() => onAdcChange({ ...adc, complex: false })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="font-mono text-slate-700">{t.adcReal}</span>
            </label>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={adc.iqSwap}
              onChange={(e) => onAdcChange({ ...adc, iqSwap: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>{t.swapIq}</span>
          </label>
        </div>
      </div>
    </div>
  );
};
