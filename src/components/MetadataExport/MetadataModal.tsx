import { parseExperiment } from '../../radar/import.ts';
import React, { useState, useRef } from 'react';
import { RadarConfig, CalculatedRadarPerformance, ExperimentMetadata } from '../../radar/types.ts';
import { X, Download, Upload, Copy, Check, FileJson } from 'lucide-react';
import { useLanguage } from '../../i18n/context.tsx';

interface MetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RadarConfig;
  perf: CalculatedRadarPerformance;
  metadata: ExperimentMetadata;
  onMetadataChange: (meta: ExperimentMetadata) => void;
  onImportConfig: (importedConfig: RadarConfig, importedMeta?: ExperimentMetadata) => void;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({
  isOpen,
  onClose,
  config,
  perf,
  metadata,
  onMetadataChange,
  onImportConfig,
}) => {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const exportPayload = {
    metadata: {
      tool: 'mmWave Studio Parameter Lab',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      ...metadata,
    },
    device: config.device,
    config,
    calculated: {
      rangeResolutionM: perf.rangeResolutionM,
      rangeResolutionCm: perf.rangeResolutionCm,
      effectiveAdcBandwidthMHz: perf.effectiveAdcBandwidthMHz,
      theoreticalMaxRangeM: perf.theoreticalMaxRangeM,
      recommendedMaxRangeM: perf.recommendedMaxRangeM,
      maxUnambiguousVelocityMps: perf.maxUnambiguousVelocityMps,
      velocityResolutionMps: perf.velocityResolutionMps,
      frameActiveTimeMs: perf.frameActiveTimeMs,
      frameRateFps: perf.frameRateFps,
      dutyCyclePercent: perf.dutyCyclePercent,
      virtualAntennaCountAzimuth: perf.virtualAntennaCountAzimuth,
      approxAngularResolutionAzimuthDeg: perf.approxAngularResolutionAzimuthDeg,
      dataSizePerFrameMB: perf.dataSizePerFrameMB,
      totalDataSizeMB: perf.totalDataSizeMB,
    },
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownloadConfigJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (metadata.experimentName || 'awr1843_radar_config')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    link.download = `${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 1024 * 1024) { setImportError('JSON file exceeds 1 MB.'); return; }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        const imported = parseExperiment(parsed);
        onImportConfig(imported.config, imported.metadata);
        onClose();
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.onerror = () => setImportError('Failed to read JSON file.');
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {t.metaTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {t.metaSubtitle}
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

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {importError && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <span className="font-semibold">Import Error: </span>
              {importError}
            </div>
          )}

          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {t.expName}
              </label>
              <input
                type="text"
                placeholder={language === 'zh' ? '例如: Hallway_Test_01' : 'e.g. CornerReflector_Range_Test_01'}
                value={metadata.experimentName}
                onChange={(e) =>
                  onMetadataChange({ ...metadata, experimentName: e.target.value })
                }
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {t.authorLab}
              </label>
              <input
                type="text"
                placeholder={language === 'zh' ? '例如: 毫米波雷达实验室' : 'e.g. Radar Lab / Researcher'}
                value={metadata.author}
                onChange={(e) =>
                  onMetadataChange({ ...metadata, author: e.target.value })
                }
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-medium text-slate-700 block mb-1">
                {t.expNotes}
              </label>
              <textarea
                rows={2}
                placeholder={
                  language === 'zh'
                    ? '例如: 走廊室内静态测试，角反射器放置在 5.0m 处，DCA1000 网口采集，室温 22°C。'
                    : 'e.g. Indoor hallway, corner reflector placed at 5.0m, DCA1000 LVDS capture, room temp 22°C.'
                }
                value={metadata.notes}
                onChange={(e) =>
                  onMetadataChange({ ...metadata, notes: e.target.value })
                }
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* JSON Preview */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">{t.jsonPreview}</span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t.btnCopied : t.btnCopy}
              </button>
            </div>
            <pre className="h-44 overflow-auto bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[10px] leading-tight border border-slate-800">
              {jsonString}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border-t border-slate-200">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-xs font-medium text-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {t.btnImportJson}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-xs text-slate-600 transition-colors"
            >
              {t.btnClose}
            </button>
            <button
              type="button"
              onClick={handleDownloadConfigJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              {t.btnDownloadJson}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
