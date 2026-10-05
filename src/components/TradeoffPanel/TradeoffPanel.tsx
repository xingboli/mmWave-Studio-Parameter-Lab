import React, { useState } from 'react';
import { ParameterTradeoffInsight } from '../../radar/tradeoff.ts';
import { Sliders, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLanguage } from '../../i18n/context.tsx';

interface TradeoffPanelProps {
  tradeoffs: ParameterTradeoffInsight[];
}

export const TradeoffPanel: React.FC<TradeoffPanelProps> = ({
  tradeoffs,
}) => {
  const { t } = useLanguage();
  const [selectedParam, setSelectedParam] = useState<string>(
    tradeoffs[0]?.parameterId || 'frequencySlopeMHzUs'
  );

  const activeInsight =
    tradeoffs.find((t) => t.parameterId === selectedParam) || tradeoffs[0];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-semibold text-slate-800">
            {t.tradeoffTitle}
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          {t.tradeoffSubtitle}
        </span>
      </div>

      {/* Parameter Selection Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2 mb-3">
        {tradeoffs.map((item) => (
          <button
            key={item.parameterId}
            type="button"
            onClick={() => setSelectedParam(item.parameterId)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              selectedParam === item.parameterId
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
            }`}
          >
            {item.parameterName}
          </button>
        ))}
      </div>

      {/* Active Insight Details */}
      {activeInsight && (
        <div className="space-y-3">
          <div className="flex items-start justify-between bg-slate-50 p-3 rounded-md border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {activeInsight.parameterName}
                </span>
                <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-700 font-semibold">
                  {activeInsight.currentValueDisplay}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {activeInsight.summary}
              </p>
            </div>
          </div>

          {/* Effects Table / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {activeInsight.effects.map((effect, idx) => {
              const isPositive = effect.impact === 'positive';
              const isNegative = effect.impact === 'negative';
              const isRisk = effect.impact === 'risk';

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-md border text-xs flex flex-col justify-between ${
                    isRisk
                      ? 'bg-rose-50/50 border-rose-200'
                      : isPositive
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isNegative
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-slate-50/50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800">
                      {effect.metric}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                        isRisk
                          ? 'bg-rose-100 text-rose-800'
                          : isPositive
                          ? 'bg-emerald-100 text-emerald-800'
                          : isNegative
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {effect.direction === 'increase' || effect.direction === 'improve' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {effect.direction.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-normal">
                    {effect.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 rounded bg-blue-50/50 border border-blue-200 text-xs text-blue-900">
            <span className="font-semibold">{t.labGuideline} </span>
            <span className="text-slate-700">{activeInsight.whyItMatters}</span>
          </div>
        </div>
      )}
    </div>
  );
};
