import React, { useState } from 'react';
import { RadarConfig } from '../../radar/types.ts';
import {
  searchFeasibleConfigurations,
  CandidateSolution,
  ReverseDesignTargets,
} from '../../radar/reverse.ts';
import { Target, Search, X, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../i18n/context.tsx';

interface ReverseDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseConfig: RadarConfig;
  onApplyConfig: (applied: RadarConfig) => void;
}

export const ReverseDesignModal: React.FC<ReverseDesignModalProps> = ({
  isOpen,
  onClose,
  baseConfig,
  onApplyConfig,
}) => {
  const { t, language } = useLanguage();
  const [targetRangeResCm, setTargetRangeResCm] = useState<number>(8.0);
  const [targetMaxRangeM, setTargetMaxRangeM] = useState<number>(25.0);
  const [targetMaxVelMps, setTargetMaxVelMps] = useState<number>(6.0);
  const [targetFps, setTargetFps] = useState<number>(20);
  const [candidates, setCandidates] = useState<CandidateSolution[]>([]);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = () => {
    const targets: ReverseDesignTargets = {
      maxRangeResolutionM: targetRangeResCm / 100,
      minMaxRangeM: targetMaxRangeM,
      minMaxVelocityMps: targetMaxVelMps,
      minFrameRateFps: targetFps,
      maxDutyCyclePercent: 50,
    };

    const results = searchFeasibleConfigurations(baseConfig, targets, 8);
    setCandidates(results);
    setSearched(true);
  };

  const handleApply = (sol: CandidateSolution) => {
    onApplyConfig(sol.config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800">
                  {t.reverseTitle}
                </h2>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                  BETA
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {t.reverseSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Target Parameters Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
            <span className="text-xs font-semibold text-slate-700 block">
              {t.reverseCriteria}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {t.targetRangeRes}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="50"
                    value={targetRangeResCm}
                    onChange={(e) => setTargetRangeResCm(parseFloat(e.target.value) || 1)}
                    className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none bg-white"
                  />
                  <span className="absolute right-2 top-1.5 text-slate-400 text-xs font-mono">
                    ≤ cm
                  </span>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {t.targetMaxRange}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="5"
                    min="5"
                    max="150"
                    value={targetMaxRangeM}
                    onChange={(e) => setTargetMaxRangeM(parseFloat(e.target.value) || 5)}
                    className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none bg-white"
                  />
                  <span className="absolute right-2 top-1.5 text-slate-400 text-xs font-mono">
                    ≥ m
                  </span>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {t.targetMaxVel}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="50"
                    value={targetMaxVelMps}
                    onChange={(e) => setTargetMaxVelMps(parseFloat(e.target.value) || 1)}
                    className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none bg-white"
                  />
                  <span className="absolute right-2 top-1.5 text-slate-400 text-xs font-mono">
                    ≥ m/s
                  </span>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {t.targetFps}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="5"
                    min="1"
                    max="50"
                    value={targetFps}
                    onChange={(e) => setTargetFps(parseInt(e.target.value, 10) || 1)}
                    className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none bg-white"
                  />
                  <span className="absolute right-2 top-1.5 text-slate-400 text-xs font-mono">
                    ≥ FPS
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSearch}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                {t.btnSearchCandidates}
              </button>
            </div>
          </div>

          {/* Results List */}
          {searched && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
                  {t.resultsTitle} ({candidates.length} {language === 'zh' ? '组匹配结果' : 'matches found'}):
                </span>
                <span className="text-slate-400 text-[11px]">
                  {t.resultsSub}
                </span>
              </div>

              {candidates.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs">
                  {t.noCandidates}
                </div>
              ) : (
                <div className="space-y-2">
                  {candidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition-all flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {language === 'zh' ? `方案 #${idx + 1}` : `Candidate #${idx + 1}`}
                          </span>
                          <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                            {language === 'zh' ? '综合评分: ' : 'Score: '}
                            {cand.score.toFixed(0)}
                          </span>
                        </div>

                        {/* Parameter highlights */}
                        <div className="text-[11px] font-mono text-slate-600 flex flex-wrap gap-2">
                          <span>Slope: {cand.config.profile.frequencySlopeMHzUs} MHz/µs</span>
                          <span>•</span>
                          <span>Samples: {cand.config.profile.adcSamples}</span>
                          <span>•</span>
                          <span>Fs: {cand.config.profile.sampleRateKsps} ksps</span>
                          <span>•</span>
                          <span>Ramp: {cand.config.profile.rampEndTimeUs} µs</span>
                          <span>•</span>
                          <span>Idle: {cand.config.profile.idleTimeUs} µs</span>
                          <span>•</span>
                          <span>Loops: {cand.config.frame.loops}</span>
                        </div>

                        {/* Resulting Performance */}
                        <div className="text-[11px] text-slate-700 flex flex-wrap gap-3 font-medium">
                          <span className="text-blue-700">
                            ΔR: {cand.perf.rangeResolutionCm.toFixed(1)} cm
                          </span>
                          <span>
                            Rmax: {cand.perf.recommendedMaxRangeM.toFixed(1)} m
                          </span>
                          <span>
                            Vmax: ±{cand.perf.maxUnambiguousVelocityMps.toFixed(2)} m/s
                          </span>
                          <span>
                            Rate: {cand.perf.frameRateFps.toFixed(0)} FPS ({cand.perf.dutyCyclePercent.toFixed(1)}%)
                          </span>
                          <span>
                            Payload: {cand.perf.dataSizePerFrameMB.toFixed(2)} MB
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApply(cand)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-xs"
                      >
                        {t.btnApplyToLab}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 rounded text-xs text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {t.btnClose}
          </button>
        </div>
      </div>
    </div>
  );
};
