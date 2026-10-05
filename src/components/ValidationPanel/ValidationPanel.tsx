import React from 'react';
import { ValidationResult } from '../../radar/validate.ts';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../i18n/context.tsx';

interface ValidationPanelProps {
  validation: ValidationResult;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validation,
}) => {
  const { t, language } = useLanguage();

  const errorCount = validation.issues.filter((i) => i.severity === 'error').length;
  const warningCount = validation.issues.filter((i) => i.severity === 'warning').length;
  const infoCount = validation.issues.filter((i) => i.severity === 'info').length;

  if (validation.isValid && warningCount === 0 && infoCount === 0) {
    return (
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3.5 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <h4 className="text-xs font-semibold text-emerald-900">
            {t.validationPassedTitle}
          </h4>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            {t.validationPassedMsg}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          {errorCount > 0 ? (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          ) : warningCount > 0 ? (
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          ) : (
            <Info className="w-4 h-4 text-blue-600" />
          )}
          <h3 className="text-xs font-semibold text-slate-800">
            {t.validationTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          {errorCount > 0 && (
            <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-semibold border border-rose-200">
              {errorCount} {language === 'zh' ? '项错误' : `ERROR${errorCount > 1 ? 'S' : ''}`}
            </span>
          )}
          {warningCount > 0 && (
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-200">
              {warningCount} {language === 'zh' ? '项警告' : `WARNING${warningCount > 1 ? 'S' : ''}`}
            </span>
          )}
          {infoCount > 0 && (
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-200">
              {infoCount} {language === 'zh' ? '项提示' : 'INFO'}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {validation.issues.map((issue, idx) => {
          const isError = issue.severity === 'error';
          const isWarning = issue.severity === 'warning';

          return (
            <div
              key={`${issue.code}-${idx}`}
              className={`p-3 rounded-md border text-xs transition-all ${
                isError
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : isWarning
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-blue-50/70 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{issue.title}</span>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                        isError
                          ? 'bg-rose-200 text-rose-800'
                          : isWarning
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-700">
                    {issue.message}
                  </p>

                  {issue.suggestion && (
                    <div className="pt-1.5 mt-1 border-t border-slate-200/60 text-[11px] font-medium text-slate-800">
                      <span className="font-semibold">{t.suggestedAction} </span>
                      <span className="font-normal">{issue.suggestion}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
