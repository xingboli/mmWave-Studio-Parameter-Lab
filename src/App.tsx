import React, { useState, useMemo, useEffect } from 'react';
import { RadarConfig, ExperimentMetadata } from './radar/types.ts';
import { calculateRadarPerformance } from './radar/calculate.ts';
import { validateRadarConfig } from './radar/validate.ts';
import { analyzeTradeoffs } from './radar/tradeoff.ts';
import { generateStudio2Lua } from './lua/generator.ts';
import { LuaOutputMode } from './lua/types.ts';
import { PRESETS } from './presets/awr1843.ts';
import { PresetScenario } from './presets/types.ts';
import { LanguageProvider, useLanguage } from './i18n/context.tsx';

// Components
import { PresetManager } from './components/PresetManager/PresetManager.tsx';
import { ParameterPanel } from './components/ParameterPanel/ParameterPanel.tsx';
import { PerformancePanel } from './components/PerformancePanel/PerformancePanel.tsx';
import { ValidationPanel } from './components/ValidationPanel/ValidationPanel.tsx';
import { TradeoffPanel } from './components/TradeoffPanel/TradeoffPanel.tsx';
import { LuaPreview } from './components/LuaPreview/LuaPreview.tsx';
import { SweepGenerator } from './components/Sweep/SweepGenerator.tsx';
import { MetadataModal } from './components/MetadataExport/MetadataModal.tsx';
import { ReverseDesignModal } from './components/ReverseDesign/ReverseDesignModal.tsx';
import { AboutModal } from './components/About/AboutModal.tsx';

import {
  SlidersHorizontal,
  TrendingUp,
  FileJson,
  HelpCircle,
  Target,
  Radio,
  CheckCircle2,
  AlertCircle,
  Languages,
} from 'lucide-react';

function RadarLabMain() {
  const { language, toggleLanguage, t } = useLanguage();

  // Navigation active tab: 'configure' | 'sweep'
  const [activeTab, setActiveTab] = useState<'configure' | 'sweep'>('configure');

  // Currently active preset
  const [currentPresetId, setCurrentPresetId] = useState<string>(PRESETS[0].id);

  // Unified RadarConfig state
  const [config, setConfig] = useState<RadarConfig>(() => {
    try {
      const saved = localStorage.getItem('mmwave_lab_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile && parsed.frame) return parsed;
      }
    } catch {}
    return PRESETS[0].config;
  });

  // Experiment metadata
  const [metadata, setMetadata] = useState<ExperimentMetadata>({
    experimentName: 'AWR1843_Experiment_01',
    author: 'Radar Researcher',
    notes: 'TI AWR1843BOOST + DCA1000 FMCW Radar Configuration',
    timestamp: new Date().toISOString(),
  });

  // Lua Generation Options
  const [luaMode, setLuaMode] = useState<LuaOutputMode>('config_only');
  const [includeComments, setIncludeComments] = useState(true);
  const [includeCalculatedHeader, setIncludeCalculatedHeader] = useState(true);

  // Modals state
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Save config changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mmwave_lab_config', JSON.stringify(config));
    } catch {}
  }, [config]);

  // Handle Preset selection
  const handleSelectPreset = (preset: PresetScenario) => {
    setCurrentPresetId(preset.id);
    setConfig(preset.config);
  };

  // Perform Calculations, Validations, and Trade-offs (passing current language)
  const perf = useMemo(() => calculateRadarPerformance(config), [config]);
  const validation = useMemo(
    () => validateRadarConfig(config, perf, language),
    [config, perf, language]
  );
  const tradeoffs = useMemo(
    () => analyzeTradeoffs(config, perf, language),
    [config, perf, language]
  );

  // Generate Lua Script
  const luaScript = useMemo(
    () =>
      generateStudio2Lua(config, perf, {
        mode: luaMode,
        includeComments,
        includeCalculatedHeader,
        metadata,
      }),
    [config, perf, luaMode, includeComments, includeCalculatedHeader, metadata]
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Application Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Hardware Target */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
                  {t.appTitle}
                </h1>
                <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-semibold">
                  {t.badgeDevice}
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded hidden sm:inline-block">
                  {t.badgeCapture}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Validation Status Badge & Navigation Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Health Indicator */}
            {validation.isValid ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.validationPass}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-rose-300 bg-rose-950/80 border border-rose-800 px-2.5 py-1 rounded-full animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {validation.issues.filter((i) => i.severity === 'error').length} {t.validationError}
                </span>
              </span>
            )}

            {/* Language Switch Button */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded border border-blue-500 transition-all shadow-xs cursor-pointer"
              title={language === 'zh' ? 'Switch to English' : '切换为中文'}
            >
              <Languages className="w-3.5 h-3.5 text-blue-100" />
              <span>{language === 'zh' ? 'EN' : '中文'}</span>
            </button>

            {/* Quick Action Buttons */}
            <button
              type="button"
              onClick={() => setShowReverseModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded border border-slate-700 transition-colors"
              title="Reverse-design parameters from resolution & range targets"
            >
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">{t.btnReverseDesign}</span>
              <span className="text-[9px] bg-blue-900 text-blue-200 px-1 rounded">Beta</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMetadataModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded border border-slate-700 transition-colors"
              title="Download or import JSON configuration & metadata"
            >
              <FileJson className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.btnJsonExport}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-400 hover:text-white rounded transition-colors"
              title="Hardware specification, formulas, and documentation"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-4 text-xs font-medium border-t border-slate-800/80 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('configure')}
            className={`pb-2 px-1 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'configure'
                ? 'border-blue-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t.tabConfigure}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sweep')}
            className={`pb-2 px-1 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'sweep'
                ? 'border-blue-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {t.tabSweep}
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex-1">
        {activeTab === 'configure' && (
          <div className="space-y-4">
            {/* Preset Selector Bar */}
            <PresetManager
              currentPresetId={currentPresetId}
              onSelectPreset={handleSelectPreset}
            />

            {/* Validation Alerts Banner if warnings/errors exist */}
            {(!validation.isValid || validation.hasWarnings) && (
              <ValidationPanel validation={validation} />
            )}

            {/* Two-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Parameter Configuration Inputs (5 cols on lg) */}
              <div className="lg:col-span-5 space-y-4">
                <ParameterPanel
                  config={config}
                  onChange={(updated) => {
                    setConfig(updated);
                    setCurrentPresetId('custom-template');
                  }}
                />
              </div>

              {/* Right Column: Physical Performance Dashboard & Trade-Offs (7 cols on lg) */}
              <div className="lg:col-span-7 space-y-4">
                <PerformancePanel perf={perf} config={config} />
                <TradeoffPanel tradeoffs={tradeoffs} />
              </div>
            </div>

            {/* Bottom Full-Width Section: Real-Time mmWave Studio Lua Generator */}
            <LuaPreview
              luaScript={luaScript}
              mode={luaMode}
              onModeChange={setLuaMode}
              includeComments={includeComments}
              onToggleComments={setIncludeComments}
              includeCalculatedHeader={includeCalculatedHeader}
              onToggleHeader={setIncludeCalculatedHeader}
            />
          </div>
        )}

        {activeTab === 'sweep' && (
          <SweepGenerator baseConfig={config} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 text-xs py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">{t.appTitle}</span>
            <span className="mx-2">•</span>
            <span>{t.footerSub}</span>
            <span className="mx-2">•</span>
            <span>{t.footerStatic}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              {t.btnAbout}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowMetadataModal(true)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              {t.btnJsonExport}
            </button>
          </div>
        </div>
      </footer>

      {/* Dialog Modals */}
      <MetadataModal
        isOpen={showMetadataModal}
        onClose={() => setShowMetadataModal(false)}
        config={config}
        perf={perf}
        metadata={metadata}
        onMetadataChange={setMetadata}
        onImportConfig={(imported, meta) => {
          setConfig(imported);
          if (meta) setMetadata(meta);
          setCurrentPresetId('custom-template');
        }}
      />

      <ReverseDesignModal
        isOpen={showReverseModal}
        onClose={() => setShowReverseModal(false)}
        baseConfig={config}
        onApplyConfig={(applied) => {
          setConfig(applied);
          setCurrentPresetId('custom-template');
        }}
      />

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <RadarLabMain />
    </LanguageProvider>
  );
}
