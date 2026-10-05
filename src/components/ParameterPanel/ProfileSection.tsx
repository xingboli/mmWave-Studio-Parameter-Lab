import React from 'react';
import { RadarProfileConfig } from '../../radar/types.ts';
import { HelpTooltip } from '../common/HelpTooltip.tsx';
import { useLanguage } from '../../i18n/context.tsx';

interface ProfileSectionProps {
  profile: RadarProfileConfig;
  onChange: (updated: RadarProfileConfig) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  onChange,
}) => {
  const { t } = useLanguage();

  const updateField = <K extends keyof RadarProfileConfig>(
    field: K,
    value: RadarProfileConfig[K]
  ) => {
    onChange({
      ...profile,
      [field]: value,
    });
  };

  const handleNumberInput = (
    field: keyof RadarProfileConfig,
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
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          {t.profileTitle}
        </h3>
        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {t.profileId}: {profile.profileId ?? 0}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Start Frequency */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.startFreq}
            <HelpTooltip paramKey="startFrequencyGHz" />
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="76.0"
              max="81.0"
              value={profile.startFrequencyGHz}
              onChange={(e) => handleNumberInput('startFrequencyGHz', e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono pointer-events-none">
              GHz
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{t.startFreqSub}</span>
        </div>

        {/* Frequency Slope */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.freqSlope}
            <HelpTooltip paramKey="frequencySlopeMHzUs" />
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              min="0.1"
              max="100"
              value={profile.frequencySlopeMHzUs}
              onChange={(e) => handleNumberInput('frequencySlopeMHzUs', e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono pointer-events-none">
              MHz/µs
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{t.freqSlopeSub}</span>
        </div>

        {/* Idle Time */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.idleTime}
            <HelpTooltip paramKey="idleTimeUs" />
          </label>
          <div className="relative">
            <input
              type="number"
              step="1"
              min="2"
              value={profile.idleTimeUs}
              onChange={(e) => handleNumberInput('idleTimeUs', e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono pointer-events-none">
              µs
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{t.idleTimeSub}</span>
        </div>

        {/* ADC Start Time */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.adcStartTime}
            <HelpTooltip paramKey="adcStartTimeUs" />
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              min="1"
              value={profile.adcStartTimeUs}
              onChange={(e) => handleNumberInput('adcStartTimeUs', e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono pointer-events-none">
              µs
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{t.adcStartTimeSub}</span>
        </div>

        {/* Ramp End Time */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.rampEndTime}
            <HelpTooltip paramKey="rampEndTimeUs" />
          </label>
          <div className="relative">
            <input
              type="number"
              step="1"
              min="5"
              value={profile.rampEndTimeUs}
              onChange={(e) => handleNumberInput('rampEndTimeUs', e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono pointer-events-none">
              µs
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{t.rampEndTimeSub}</span>
        </div>

        {/* ADC Samples */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.adcSamples}
            <HelpTooltip paramKey="adcSamples" />
          </label>
          <div className="relative">
            <input
              type="number"
              step="32"
              min="64"
              max="1024"
              value={profile.adcSamples}
              onChange={(e) => handleNumberInput('adcSamples', e.target.value, true)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono pointer-events-none">
              pts
            </span>
          </div>
          <div className="flex gap-1 mt-1">
            {[128, 256, 512, 1024].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateField('adcSamples', s)}
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono border transition-colors ${
                  profile.adcSamples === s
                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ADC Sample Rate */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.sampleRate}
            <HelpTooltip paramKey="sampleRateKsps" />
          </label>
          <div className="relative">
            <input
              type="number"
              step="250"
              min="1000"
              max="12500"
              value={profile.sampleRateKsps}
              onChange={(e) => handleNumberInput('sampleRateKsps', e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono pointer-events-none">
              ksps
            </span>
          </div>
          <div className="flex gap-1 mt-1">
            {[2500, 5000, 6250, 10000, 12500].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => updateField('sampleRateKsps', rate)}
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono border transition-colors ${
                  profile.sampleRateKsps === rate
                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {rate}
              </button>
            ))}
          </div>
        </div>

        {/* RX Gain & HPF Filter */}
        <div>
          <label className="text-xs font-medium text-slate-700 flex items-center mb-1">
            {t.rxGain}
            <HelpTooltip paramKey="rxGainDb" />
          </label>
          <div className="relative">
            <input
              type="number"
              step="2"
              min="24"
              max="48"
              value={profile.rxGainDb}
              onChange={(e) => handleNumberInput('rxGainDb', e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono pointer-events-none">
              dB
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{t.rxGainSub}</span>
        </div>
      </div>
    </div>
  );
};
