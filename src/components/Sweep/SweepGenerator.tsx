import React, { useState } from 'react';
import { RadarConfig } from '../../radar/types.ts';
import { calculateRadarPerformance } from '../../radar/calculate.ts';
import { validateRadarConfig } from '../../radar/validate.ts';
import { Download, Play, Table, AlertCircle, CheckCircle2, Code, Copy, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/context.tsx';

interface SweepGeneratorProps {
  baseConfig: RadarConfig;
}

type SweepableField =
  | 'frequencySlopeMHzUs'
  | 'adcSamples'
  | 'sampleRateKsps'
  | 'idleTimeUs'
  | 'rampEndTimeUs'
  | 'loops';

interface SweepFieldMeta {
  id: SweepableField;
  labelEn: string;
  labelZh: string;
  unit: string;
  defaultStart: number;
  defaultStop: number;
  defaultStep: number;
  targetObject: 'profile' | 'frame';
}

const SWEEP_FIELDS: SweepFieldMeta[] = [
  {
    id: 'frequencySlopeMHzUs',
    labelEn: 'Frequency Slope',
    labelZh: '调频斜率 (Frequency Slope)',
    unit: 'MHz/µs',
    defaultStart: 15,
    defaultStop: 60,
    defaultStep: 5,
    targetObject: 'profile',
  },
  {
    id: 'adcSamples',
    labelEn: 'ADC Samples',
    labelZh: 'ADC 采样点数 (ADC Samples)',
    unit: 'samples',
    defaultStart: 64,
    defaultStop: 512,
    defaultStep: 64,
    targetObject: 'profile',
  },
  {
    id: 'sampleRateKsps',
    labelEn: 'ADC Sample Rate',
    labelZh: 'ADC 采样率 (Sample Rate)',
    unit: 'ksps',
    defaultStart: 2500,
    defaultStop: 12500,
    defaultStep: 2500,
    targetObject: 'profile',
  },
  {
    id: 'idleTimeUs',
    labelEn: 'Idle Time',
    labelZh: '空闲时间 (Idle Time)',
    unit: 'µs',
    defaultStart: 10,
    defaultStop: 100,
    defaultStep: 10,
    targetObject: 'profile',
  },
  {
    id: 'rampEndTimeUs',
    labelEn: 'Ramp End Time',
    labelZh: 'Ramp 结束时间 (Ramp End Time)',
    unit: 'µs',
    defaultStart: 30,
    defaultStop: 90,
    defaultStep: 10,
    targetObject: 'profile',
  },
  {
    id: 'loops',
    labelEn: 'Chirp Loops',
    labelZh: 'Chirp 循环数 (Loops)',
    unit: 'loops',
    defaultStart: 32,
    defaultStop: 256,
    defaultStep: 32,
    targetObject: 'frame',
  },
];

export const SweepGenerator: React.FC<SweepGeneratorProps> = ({
  baseConfig,
}) => {
  const { t, language } = useLanguage();
  const [selectedFieldId, setSelectedFieldId] = useState<SweepableField>('frequencySlopeMHzUs');
  const [startVal, setStartVal] = useState<number>(15);
  const [stopVal, setStopVal] = useState<number>(60);
  const [stepVal, setStepVal] = useState<number>(5);
  const [showLua, setShowLua] = useState<boolean>(false);
  const [luaCopied, setLuaCopied] = useState<boolean>(false);

  const currentMeta = SWEEP_FIELDS.find((f) => f.id === selectedFieldId) || SWEEP_FIELDS[0];
  const fieldLabel = language === 'zh' ? currentMeta.labelZh : currentMeta.labelEn;

  const handleFieldChange = (fieldId: SweepableField) => {
    setSelectedFieldId(fieldId);
    const meta = SWEEP_FIELDS.find((f) => f.id === fieldId);
    if (meta) {
      setStartVal(meta.defaultStart);
      setStopVal(meta.defaultStop);
      setStepVal(meta.defaultStep);
    }
  };

  // Generate table rows
  const rows: number[] = [];
  const safeStep = Math.max(0.001, Math.abs(stepVal));
  const safeStart = startVal;
  const safeStop = stopVal;

  let current = safeStart;
  const maxIterations = 50;
  let count = 0;

  if (safeStart <= safeStop) {
    while (current <= safeStop + 1e-6 && count < maxIterations) {
      rows.push(current);
      current += safeStep;
      count++;
    }
  } else {
    while (current >= safeStop - 1e-6 && count < maxIterations) {
      rows.push(current);
      current -= safeStep;
      count++;
    }
  }

  const tableData = rows.map((val) => {
    const sweepConfig: RadarConfig = {
      ...baseConfig,
      profile: {
        ...baseConfig.profile,
        ...(currentMeta.targetObject === 'profile' ? { [currentMeta.id]: val } : {}),
      },
      frame: {
        ...baseConfig.frame,
        ...(currentMeta.targetObject === 'frame' ? { [currentMeta.id]: val } : {}),
      },
    };

    const perf = calculateRadarPerformance(sweepConfig);
    const valResult = validateRadarConfig(sweepConfig, perf);

    return {
      value: val,
      perf,
      valResult,
      isValid: valResult.isValid,
    };
  });

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      `${fieldLabel} (${currentMeta.unit})`,
      language === 'zh' ? '有效带宽 (MHz)' : 'Effective Bandwidth (MHz)',
      language === 'zh' ? '距离分辨率 (cm)' : 'Range Resolution (cm)',
      language === 'zh' ? '推荐最大距离 (m)' : 'Max Range Recommended (m)',
      language === 'zh' ? '最大速度 (m/s)' : 'Max Velocity (m/s)',
      language === 'zh' ? '速度分辨率 (m/s)' : 'Velocity Resolution (m/s)',
      language === 'zh' ? '发射有效时间 (ms)' : 'Frame Active Time (ms)',
      language === 'zh' ? '占空比 (%)' : 'Duty Cycle (%)',
      language === 'zh' ? '每帧大小 (MB)' : 'Frame Data Size (MB)',
      language === 'zh' ? '校验状态' : 'Validation Status',
    ];

    const csvLines = [headers.join(',')];
    tableData.forEach((row) => {
      csvLines.push(
        [
          row.value,
          row.perf.effectiveAdcBandwidthMHz.toFixed(2),
          row.perf.rangeResolutionCm.toFixed(2),
          row.perf.recommendedMaxRangeM.toFixed(2),
          row.perf.maxUnambiguousVelocityMps.toFixed(2),
          row.perf.velocityResolutionMps.toFixed(4),
          row.perf.frameActiveTimeMs.toFixed(2),
          row.perf.dutyCyclePercent.toFixed(1),
          row.perf.dataSizePerFrameMB.toFixed(2),
          row.isValid ? 'PASS' : 'FAIL',
        ].join(',')
      );
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `awr1843_sweep_${currentMeta.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateSweepLua = (): string => {
    const valuesArrayStr = rows.map((v) => (Number.isInteger(v) ? v : v.toFixed(2))).join(', ');
    const p = baseConfig.profile;

    return `-- ==============================================================================
-- mmWave Studio 2.x Automated Parameter Sweep Script
-- Swept Parameter: ${currentMeta.labelEn} (${currentMeta.unit})
-- Target: TI AWR1843BOOST + DCA1000
-- ==============================================================================

local sweep_values = { ${valuesArrayStr} }

print("[SWEEP] Starting parameter sweep across " .. #sweep_values .. " iterations...")

for idx, val in ipairs(sweep_values) do
    print(string.format("[SWEEP %d/%d] Applying ${currentMeta.labelEn} = %.2f ${currentMeta.unit}", idx, #sweep_values, val))

    -- Update Profile Configuration with stepped value
    ${
      currentMeta.id === 'frequencySlopeMHzUs'
        ? `ar1.ProfileConfig(0, ${p.startFrequencyGHz}, ${p.idleTimeUs}, ${p.adcStartTimeUs}, ${p.rampEndTimeUs}, 0, 0, val, 1, ${p.adcSamples}, ${p.sampleRateKsps}, 0, 0, ${p.rxGainDb})`
        : currentMeta.id === 'adcSamples'
        ? `ar1.ProfileConfig(0, ${p.startFrequencyGHz}, ${p.idleTimeUs}, ${p.adcStartTimeUs}, ${p.rampEndTimeUs}, 0, 0, ${p.frequencySlopeMHzUs}, 1, math.floor(val), ${p.sampleRateKsps}, 0, 0, ${p.rxGainDb})`
        : currentMeta.id === 'sampleRateKsps'
        ? `ar1.ProfileConfig(0, ${p.startFrequencyGHz}, ${p.idleTimeUs}, ${p.adcStartTimeUs}, ${p.rampEndTimeUs}, 0, 0, ${p.frequencySlopeMHzUs}, 1, ${p.adcSamples}, math.floor(val), 0, 0, ${p.rxGainDb})`
        : `ar1.ProfileConfig(0, ${p.startFrequencyGHz}, ${p.idleTimeUs}, ${p.adcStartTimeUs}, ${p.rampEndTimeUs}, 0, 0, ${p.frequencySlopeMHzUs}, 1, ${p.adcSamples}, ${p.sampleRateKsps}, 0, 0, ${p.rxGainDb})`
    }

    ${
      currentMeta.id === 'loops'
        ? `ar1.FrameConfig(0, ${baseConfig.frame.chirpEndIndex}, math.floor(val), ${baseConfig.frame.frames}, ${baseConfig.frame.periodicityMs}, 0, 0)`
        : ''
    }

    RSTD.Sleep(100)
    print("  Profile updated successfully.")
end

print("[SWEEP] Parameter sweep complete.")
`;
  };

  const sweepLuaCode = generateSweepLua();

  const handleCopySweepLua = async () => {
    try {
      await navigator.clipboard.writeText(sweepLuaCode);
      setLuaCopied(true);
      setTimeout(() => setLuaCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* Controls Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-slate-800">
              {t.sweepTitle}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {t.sweepSubtitle}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Parameter Selector */}
          <div>
            <label className="font-medium text-slate-700 block mb-1">
              {t.selectSweepParam}
            </label>
            <select
              value={selectedFieldId}
              onChange={(e) => handleFieldChange(e.target.value as SweepableField)}
              className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none bg-white font-mono"
            >
              {SWEEP_FIELDS.map((f) => (
                <option key={f.id} value={f.id}>
                  {language === 'zh' ? f.labelZh : f.labelEn} ({f.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Start Value */}
          <div>
            <label className="font-medium text-slate-700 block mb-1">
              {t.startVal} ({currentMeta.unit})
            </label>
            <input
              type="number"
              step="any"
              value={startVal}
              onChange={(e) => setStartVal(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Stop Value */}
          <div>
            <label className="font-medium text-slate-700 block mb-1">
              {t.stopVal} ({currentMeta.unit})
            </label>
            <input
              type="number"
              step="any"
              value={stopVal}
              onChange={(e) => setStopVal(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Step Value */}
          <div>
            <label className="font-medium text-slate-700 block mb-1">
              {t.stepVal} ({currentMeta.unit})
            </label>
            <input
              type="number"
              step="any"
              min="0.001"
              value={stepVal}
              onChange={(e) => setStepVal(parseFloat(e.target.value) || 1)}
              className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-mono">
            {language === 'zh'
              ? `已生成 ${tableData.length} 组仿真步进 (${tableData.filter((t) => t.isValid).length} 组有效，${tableData.filter((t) => !t.isValid).length} 组超限)`
              : `Generated ${tableData.length} evaluation steps (${tableData.filter((t) => t.isValid).length} valid, ${tableData.filter((t) => !t.isValid).length} invalid)`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLua(!showLua)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                showLua
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              {showLua ? t.btnHideSweepLua : t.btnViewSweepLua}
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              {t.btnExportCsv}
            </button>
          </div>
        </div>
      </div>

      {/* Sweep Lua Preview */}
      {showLua && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono">mmWave Studio 2.x Iteration Sweep Script</span>
            <button
              type="button"
              onClick={handleCopySweepLua}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-mono"
            >
              {luaCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {luaCopied ? t.btnCopied : t.btnCopy}
            </button>
          </div>
          <pre className="h-48 overflow-auto bg-slate-950 text-slate-100 p-2.5 rounded font-mono text-[11px] leading-relaxed border border-slate-800">
            <code>{sweepLuaCode}</code>
          </pre>
        </div>
      )}

      {/* Sweep Results Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-800">
              {t.sweepMatrixTitle}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {t.matrixNote}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-medium text-[11px] sticky top-0 border-b border-slate-200 shadow-xs z-10">
              <tr>
                <th className="p-2.5 font-mono">
                  {fieldLabel} ({currentMeta.unit})
                </th>
                <th className="p-2.5">{t.colBadc}</th>
                <th className="p-2.5">{t.colRangeRes}</th>
                <th className="p-2.5">{t.colMaxRange}</th>
                <th className="p-2.5">{t.colMaxVel}</th>
                <th className="p-2.5">{t.colVelRes}</th>
                <th className="p-2.5">{t.colActivePeriod}</th>
                <th className="p-2.5">{t.colDuty}</th>
                <th className="p-2.5">{t.colFrameSize}</th>
                <th className="p-2.5 text-center">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
              {tableData.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 transition-colors ${
                    !row.isValid ? 'bg-rose-50/30' : ''
                  }`}
                >
                  <td className="p-2.5 font-bold text-slate-900">
                    {Number.isInteger(row.value) ? row.value : row.value.toFixed(2)}
                  </td>
                  <td className="p-2.5 text-slate-700">
                    {row.perf.effectiveAdcBandwidthMHz.toFixed(1)} MHz
                  </td>
                  <td className="p-2.5 text-slate-800 font-semibold">
                    {row.perf.rangeResolutionCm.toFixed(1)} cm
                  </td>
                  <td className="p-2.5 text-slate-700">
                    {row.perf.recommendedMaxRangeM.toFixed(1)} m
                  </td>
                  <td className="p-2.5 text-slate-700">
                    ±{row.perf.maxUnambiguousVelocityMps.toFixed(2)} m/s
                  </td>
                  <td className="p-2.5 text-slate-700">
                    {row.perf.velocityResolutionMps.toFixed(3)} m/s
                  </td>
                  <td className="p-2.5 text-slate-600">
                    {row.perf.frameActiveTimeMs.toFixed(1)} / {row.perf.framePeriodicityMs} ms
                  </td>
                  <td className="p-2.5 text-slate-700">
                    <span
                      className={
                        row.perf.dutyCyclePercent > 50
                          ? 'text-amber-700 font-semibold'
                          : 'text-slate-700'
                      }
                    >
                      {row.perf.dutyCyclePercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-700">
                    {row.perf.dataSizePerFrameMB.toFixed(2)} MB
                  </td>
                  <td className="p-2.5 text-center">
                    {row.isValid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        PASS
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
                        title={row.valResult.issues[0]?.message}
                      >
                        <AlertCircle className="w-3 h-3" />
                        FAIL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
