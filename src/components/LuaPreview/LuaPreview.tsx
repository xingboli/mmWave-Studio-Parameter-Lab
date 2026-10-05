import React, { useState } from 'react';
import { GeneratedLuaScript, LuaOutputMode } from '../../lua/types.ts';
import { Copy, Check, Download, Code, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../i18n/context.tsx';

interface LuaPreviewProps {
  luaScript: GeneratedLuaScript;
  mode: LuaOutputMode;
  onModeChange: (mode: LuaOutputMode) => void;
  includeComments: boolean;
  onToggleComments: (val: boolean) => void;
  includeCalculatedHeader: boolean;
  onToggleHeader: (val: boolean) => void;
}

export const LuaPreview: React.FC<LuaPreviewProps> = ({
  luaScript,
  mode,
  onModeChange,
  includeComments,
  onToggleComments,
  includeCalculatedHeader,
  onToggleHeader,
}) => {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(luaScript.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    const blob = new Blob([luaScript.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `awr1843_mmwave_studio_${mode}.lua`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-semibold text-slate-800">
            {t.luaTitle}
          </h3>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            ar1.*
          </span>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs font-medium">
          <button
            type="button"
            onClick={() => onModeChange('config_only')}
            className={`px-2 py-1 rounded transition-all ${
              mode === 'config_only'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.modeA}
          </button>
          <button
            type="button"
            onClick={() => onModeChange('config_and_capture')}
            className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
              mode === 'config_and_capture'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.modeB}
          </button>
          <button
            type="button"
            onClick={() => onModeChange('full_automation')}
            className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
              mode === 'full_automation'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.modeC}
          </button>
        </div>
      </div>

      {/* API Verification Notice */}
      <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded border border-slate-200 gap-2">
        <div className="flex items-center gap-2">
          {mode === 'config_only' ? (
            <span className="flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.verifiedLabel}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-700 font-medium text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t.unverifiedLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-600">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCalculatedHeader}
              onChange={(e) => onToggleHeader(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>{t.perfHeaderToggle}</span>
          </label>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative group">
        <pre className="w-full h-80 overflow-auto bg-slate-950 text-slate-100 p-3.5 rounded-lg font-mono text-[11px] leading-relaxed border border-slate-800 select-all">
          <code>{luaScript.code}</code>
        </pre>

        {/* Float Action Buttons */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-700 text-xs font-mono transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{t.btnCopied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.btnCopy}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded border border-blue-500 text-xs font-mono transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.btnDownloadLua}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
