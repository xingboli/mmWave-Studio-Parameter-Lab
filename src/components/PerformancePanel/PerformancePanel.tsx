import React from 'react';
import { CalculatedRadarPerformance, RadarConfig } from '../../radar/types.ts';
import { PerformanceCard } from './PerformanceCard.tsx';
import { Clock, Database } from 'lucide-react';
import { useLanguage } from '../../i18n/context.tsx';

interface PerformancePanelProps {
  perf: CalculatedRadarPerformance;
  config: RadarConfig;
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  perf,
  config,
}) => {
  const { t, language } = useLanguage();

  const idleUs = config.profile.idleTimeUs || 0;
  const rampEndUs = config.profile.rampEndTimeUs || 0;
  const totalChirpUs = idleUs + rampEndUs;
  const adcStartUs = config.profile.adcStartTimeUs || 0;
  const tadcUs = perf.adcSamplingTimeUs;
  const slackUs = Math.max(0, rampEndUs - (adcStartUs + tadcUs));

  const idlePercent = totalChirpUs > 0 ? (idleUs / totalChirpUs) * 100 : 0;
  const adcStartPercent = totalChirpUs > 0 ? (adcStartUs / totalChirpUs) * 100 : 0;
  const samplePercent = totalChirpUs > 0 ? (tadcUs / totalChirpUs) * 100 : 0;
  const slackPercent = totalChirpUs > 0 ? (slackUs / totalChirpUs) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Chirp Timing Breakdown Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-800">
              {t.timelineTitle} (Tchirp = {perf.chirpCycleTimeUs.toFixed(1)} µs)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {t.chirpRate} {Math.round(perf.chirpRepetitionFrequencyHz).toLocaleString()} Hz
          </span>
        </div>

        {/* Visual Progress / Timeline Bar */}
        <div className="w-full h-5 bg-slate-100 rounded-md overflow-hidden flex border border-slate-200 text-[10px] font-mono text-white text-center font-medium">
          <div
            style={{ width: `${Math.min(100, idlePercent)}%` }}
            className="bg-amber-500 flex items-center justify-center truncate px-1 transition-all"
            title={`Idle: ${idleUs} µs`}
          >
            {idleUs}µs
          </div>
          <div
            style={{ width: `${Math.min(100, adcStartPercent)}%` }}
            className="bg-slate-400 flex items-center justify-center truncate px-1 transition-all"
            title={`ADC Start: ${adcStartUs} µs`}
          >
            {adcStartUs}µs
          </div>
          <div
            style={{ width: `${Math.min(100, samplePercent)}%` }}
            className="bg-blue-600 flex items-center justify-center truncate px-1 transition-all"
            title={`ADC Sampling: ${tadcUs.toFixed(1)} µs`}
          >
            {language === 'zh' ? '采样' : 'Sample'}: {tadcUs.toFixed(1)}µs
          </div>
          {slackPercent > 0 && (
            <div
              style={{ width: `${Math.min(100, slackPercent)}%` }}
              className="bg-slate-300 text-slate-700 flex items-center justify-center truncate px-1 transition-all"
              title={`Slack: ${slackUs.toFixed(1)} µs`}
            >
              {slackUs.toFixed(1)}µs
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 mt-2 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
            <span>{t.idleLegend} ({idleUs} µs)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block"></span>
            <span>{t.adcStartLegend} ({adcStartUs} µs)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"></span>
            <span>{t.sampleLegend} ({tadcUs.toFixed(1)} µs)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block"></span>
            <span>{t.slackLegend} ({slackUs.toFixed(1)} µs)</span>
          </div>
        </div>
      </div>

      {/* Grid of Key Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Range Resolution */}
        <PerformanceCard
          title={t.metricRangeRes}
          primaryValue={`${perf.rangeResolutionCm.toFixed(1)} cm`}
          secondaryValue={`${perf.rangeResolutionM.toFixed(3)} m`}
          betterDirection="smaller"
          badgeType="info"
          badge={`Badc = ${perf.effectiveAdcBandwidthMHz.toFixed(0)} MHz`}
          formula="ΔR = c / (2 × Badc) = c × Fs / (2 × Slope × Nadc)"
          drivenBy={language === 'zh' ? ['调频斜率 (S)', '采样点数 (Nadc)', '采样率 (Fs)'] : ['Slope (S)', 'ADC Samples (Nadc)', 'Sample Rate (Fs)']}
          note={t.metricRangeResDesc}
        />

        {/* Maximum Range */}
        <PerformanceCard
          title={t.metricMaxRange}
          primaryValue={`${perf.recommendedMaxRangeM.toFixed(1)} m`}
          secondaryValue={`${language === 'zh' ? '理论' : 'Theor'}: ${perf.theoreticalMaxRangeM.toFixed(1)} m`}
          betterDirection="larger"
          badgeType="neutral"
          badge={language === 'zh' ? '0.9 工程裕量' : '0.9 Margin'}
          formula="Rmax_rec = 0.9 × (Fs × c) / (2 × Slope)"
          drivenBy={language === 'zh' ? ['采样率 (Fs)', '调频斜率 (S)'] : ['Sample Rate (Fs)', 'Slope (S)']}
          note={t.metricMaxRangeDesc}
        />

        {/* Max Velocity */}
        <PerformanceCard
          title={t.metricMaxVel}
          primaryValue={`±${perf.maxUnambiguousVelocityMps.toFixed(2)} m/s`}
          secondaryValue={`±${perf.maxUnambiguousVelocityKmh.toFixed(1)} km/h`}
          betterDirection="larger"
          badgeType="info"
          badge={`Ttx = ${perf.txRepetitionTimeUs.toFixed(1)} µs`}
          formula="Vmax = λ / (4 × Ttx)"
          drivenBy={language === 'zh' ? ['循环中发射TX数', 'Chirp周期 (Tchirp)', '载频波长 (λ)'] : ['TX Antennas in Loop', 'Chirp Cycle (Tchirp)', 'Carrier (f0)']}
          note={t.metricMaxVelDesc}
        />

        {/* Velocity Resolution */}
        <PerformanceCard
          title={t.metricVelRes}
          primaryValue={`${perf.velocityResolutionMps.toFixed(3)} m/s`}
          secondaryValue={`${perf.velocityResolutionKmh.toFixed(2)} km/h`}
          betterDirection="smaller"
          badgeType="neutral"
          badge={`Tobs = ${(perf.dopplerObservationTimeS * 1000).toFixed(1)} ms`}
          formula="Δv = λ / (2 × Nd × Ttx)"
          drivenBy={language === 'zh' ? ['循环次数 (Loops, Nd)', 'TX 重复周期 (Ttx)'] : ['Chirp Loops (Nd)', 'TX Repetition (Ttx)']}
          note={t.metricVelResDesc}
        />

        {/* Frame Active & Duty Cycle */}
        <PerformanceCard
          title={t.metricDuty}
          primaryValue={`${perf.dutyCyclePercent.toFixed(1)}%`}
          secondaryValue={`${perf.frameActiveTimeMs.toFixed(1)} ms / ${perf.framePeriodicityMs} ms`}
          badgeType={perf.dutyCyclePercent > 50 ? 'warning' : 'success'}
          badge={`${perf.frameRateFps.toFixed(0)} FPS`}
          formula="Duty = Tactive / Tframe = (Loops × Nchirp × Tchirp) / Tframe"
          drivenBy={language === 'zh' ? ['帧周期', '循环数', '单Chirp周期'] : ['Frame Periodicity', 'Loops', 'Chirp Cycle']}
          note={t.metricDutyDesc}
        />

        {/* Virtual Antenna Array & AoA */}
        <PerformanceCard
          title={t.metricVirtual}
          primaryValue={`${perf.virtualAntennaCountAzimuth} ${language === 'zh' ? '方位元' : 'Azimuth'}`}
          secondaryValue={`${perf.virtualAntennaCountElevation} ${language === 'zh' ? '俯仰元' : 'Elev'} (${language === 'zh' ? '共' : 'Total'} ${perf.virtualAntennaCountTotal})`}
          badgeType="info"
          badge={`AoA ≈ ${perf.approxAngularResolutionAzimuthDeg.toFixed(1)}°`}
          formula="θ_res ≈ 2 / N_azimuth (ideal λ/2 ULA)"
          drivenBy={language === 'zh' ? ['激活TX天线', '4路RX天线', '微带阵列空间几何'] : ['TX Channels', 'RX Channels (4)', 'Antenna Geometry']}
          note={t.metricVirtualDesc}
        />
      </div>

      {/* Raw Data Payload Summary Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-800">
              {t.rawPayloadTitle}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {config.adc.complex
              ? language === 'zh'
                ? '复数 16-bit IQ (4 字节/点)'
                : '16-bit Complex IQ (4 bytes/sample)'
              : language === 'zh'
              ? '实数 16-bit (2 字节/点)'
              : '16-bit Real (2 bytes/sample)'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t.perChirp}</span>
            <span className="text-sm font-bold font-mono text-slate-800">
              {(perf.dataSizePerChirpBytes / 1024).toFixed(1)} KB
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              {config.profile.adcSamples} × {perf.activeRxCount} RX
            </span>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t.perFrame}</span>
            <span className="text-sm font-bold font-mono text-slate-800">
              {perf.dataSizePerFrameMB.toFixed(2)} MB
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              {perf.chirpsPerFrame} {language === 'zh' ? '个 Chirp' : 'chirps'}
            </span>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t.totalSession}</span>
            <span className="text-sm font-bold font-mono text-emerald-700">
              {config.frame.frames === 0
                ? language === 'zh' ? '∞ (持续流式传输)' : '∞ (Stream)'
                : perf.totalDataSizeMB > 1024
                ? `${perf.totalDataSizeGB.toFixed(2)} GB`
                : `${perf.totalDataSizeMB.toFixed(1)} MB`}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              {config.frame.frames === 0 ? (language === 'zh' ? '持续' : 'Continuous') : `${config.frame.frames} ${language === 'zh' ? '帧' : 'frames'}`}
            </span>
          </div>

          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t.ethernetRate}</span>
            <span className="text-sm font-bold font-mono text-slate-800">
              {perf.dataRateMBps.toFixed(1)} MB/s
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              {((perf.dataRateMBps * 8)).toFixed(0)} Mbps
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
