import { RadarConfig, CalculatedRadarPerformance } from './types.ts';
import { calculateRadarPerformance } from './calculate.ts';
import { validateRadarConfig } from './validate.ts';

export interface ReverseDesignTargets {
  maxRangeResolutionM: number; // e.g. <= 0.10 m (10 cm)
  minMaxRangeM: number; // e.g. >= 20 m
  minMaxVelocityMps: number; // e.g. >= 5 m/s
  minFrameRateFps: number; // e.g. >= 10 fps
  maxDutyCyclePercent?: number; // e.g. <= 50%
}

export interface CandidateSolution {
  config: RadarConfig;
  perf: CalculatedRadarPerformance;
  score: number;
  fitnessSummary: {
    rangeResScore: number;
    maxRangeScore: number;
    maxVelScore: number;
    dutyCycleScore: number;
  };
}

/**
 * Bounded grid search reverse-design compiler.
 * Evaluates candidate profile & frame combinations that satisfy user physical targets.
 */
export function searchFeasibleConfigurations(
  baseConfig: RadarConfig,
  targets: ReverseDesignTargets,
  maxResults = 8
): CandidateSolution[] {
  const candidateSlopes = [10.0, 15.0, 20.0, 25.0, 29.982, 35.0, 45.0, 60.0];
  const candidateSamples = [128, 256, 512];
  const candidateSampleRates = [2500, 5000, 6250, 8000, 10000];
  const candidateIdleTimes = [15.0, 30.0, 50.0, 100.0];
  const candidateLoops = [32, 64, 128, 256];

  const results: CandidateSolution[] = [];

  // Constrain total search iterations to prevent browser UI freezing
  for (const slope of candidateSlopes) {
    for (const samples of candidateSamples) {
      for (const fs of candidateSampleRates) {
        // Calculate sampling duration Tadc = samples / (fs * 1e3) (in us)
        const tadcUs = (samples / (fs * 1000)) * 1e6;
        const adcStartUs = 6.0;
        // Set ramp end time with a comfortable 4 us slack
        const rampEndUs = Math.ceil(adcStartUs + tadcUs + 4.0);
        if (rampEndUs > 120.0) continue; // Keep chirps reasonably sized

        for (const idleUs of candidateIdleTimes) {
          for (const loops of candidateLoops) {
            // Check frame periodicity to satisfy minFrameRateFps
            const targetPeriodMs = targets.minFrameRateFps > 0
              ? Math.floor(1000 / targets.minFrameRateFps)
              : 50;

            const testConfig: RadarConfig = {
              ...baseConfig,
              profile: {
                ...baseConfig.profile,
                startFrequencyGHz: baseConfig.profile.startFrequencyGHz || 77.0,
                frequencySlopeMHzUs: slope,
                adcSamples: samples,
                sampleRateKsps: fs,
                adcStartTimeUs: adcStartUs,
                rampEndTimeUs: rampEndUs,
                idleTimeUs: idleUs,
              },
              frame: {
                ...baseConfig.frame,
                loops,
                periodicityMs: targetPeriodMs,
              },
            };

            const perf = calculateRadarPerformance(testConfig);
            const val = validateRadarConfig(testConfig, perf);

            if (!val.isValid) continue;

            // Check targets
            if (perf.rangeResolutionM > targets.maxRangeResolutionM) continue;
            if (perf.recommendedMaxRangeM < targets.minMaxRangeM) continue;
            if (perf.maxUnambiguousVelocityMps < targets.minMaxVelocityMps) continue;
            if (perf.frameRateFps < targets.minFrameRateFps) continue;
            if (targets.maxDutyCyclePercent && perf.dutyCyclePercent > targets.maxDutyCyclePercent) continue;

            // Score heuristic: balance resolution, margin, and reasonable data payload
            const rangeResScore = (targets.maxRangeResolutionM - perf.rangeResolutionM) / targets.maxRangeResolutionM;
            const maxRangeScore = (perf.recommendedMaxRangeM - targets.minMaxRangeM) / targets.minMaxRangeM;
            const maxVelScore = (perf.maxUnambiguousVelocityMps - targets.minMaxVelocityMps) / targets.minMaxVelocityMps;
            const dutyCycleScore = (100 - perf.dutyCyclePercent) / 100;

            const totalScore = rangeResScore * 30 + maxRangeScore * 25 + maxVelScore * 25 + dutyCycleScore * 20;

            results.push({
              config: testConfig,
              perf,
              score: totalScore,
              fitnessSummary: {
                rangeResScore,
                maxRangeScore,
                maxVelScore,
                dutyCycleScore,
              },
            });
          }
        }
      }
    }
  }

  // Sort by highest score first, then slice
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}
