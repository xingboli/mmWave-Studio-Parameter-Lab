import React from 'react';

export interface PerformanceCardProps {
  title: string;
  primaryValue: string;
  secondaryValue?: string;
  badge?: string;
  badgeType?: 'info' | 'warning' | 'success' | 'neutral';
  betterDirection?: 'smaller' | 'larger';
  drivenBy: string[];
  formula?: string;
  note?: string;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  title,
  primaryValue,
  secondaryValue,
  badge,
  badgeType = 'neutral',
  betterDirection,
  drivenBy,
  formula,
  note,
}) => {
  const badgeClasses = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div>
        <div className="flex items-start justify-between gap-1 mb-1">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          {badge && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeClasses[badgeType]}`}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
            {primaryValue}
          </div>
          {secondaryValue && (
            <div className="text-xs font-mono text-slate-500">
              ({secondaryValue})
            </div>
          )}
        </div>

        {betterDirection && (
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <span className="text-blue-600">
              {betterDirection === 'smaller' ? '◀ Better: smaller value' : '▲ Better: larger value'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
        {formula && (
          <div className="font-mono text-slate-400 text-[10px] truncate" title={formula}>
            {formula}
          </div>
        )}

        <div className="text-slate-500">
          <span className="font-medium text-slate-600">Driven by: </span>
          <span className="text-slate-700 font-mono text-[10px]">
            {drivenBy.join(', ')}
          </span>
        </div>

        {note && (
          <div className="text-[10px] text-slate-400 italic leading-tight">
            {note}
          </div>
        )}
      </div>
    </div>
  );
};
