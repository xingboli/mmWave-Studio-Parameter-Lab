/**
 * Explicit unit conversion module.
 * Eliminates magic scaling numbers from radar physics equations.
 * Converts user-facing engineering units to standard SI units (Hz, s, m, m/s, rad, bytes)
 * and back.
 */

// Frequency
export const ghzToHz = (ghz: number): number => ghz * 1e9;
export const hzToGhz = (hz: number): number => hz / 1e9;

export const mhzToHz = (mhz: number): number => mhz * 1e6;
export const hzToMhz = (hz: number): number => hz / 1e6;

export const khzToHz = (khz: number): number => khz * 1e3;
export const hzToKhz = (hz: number): number => hz / 1e3;

// Slope: MHz/us -> Hz/s
// 1 MHz / 1 us = 1e6 Hz / 1e-6 s = 1e12 Hz/s
export const mhzPerUsToHzPerS = (slopeMHzUs: number): number => slopeMHzUs * 1e12;
export const hzPerSToMhzPerUs = (slopeHzS: number): number => slopeHzS / 1e12;

// Sample Rate: ksps (kilo-samples per second) -> samples per second (Hz)
export const kspsToHz = (ksps: number): number => ksps * 1e3;
export const hzToKsps = (hz: number): number => hz / 1e3;

export const mspsToHz = (msps: number): number => msps * 1e6;
export const hzToMsps = (hz: number): number => hz / 1e6;

// Time
export const usToSeconds = (us: number): number => us * 1e-6;
export const secondsToUs = (s: number): number => s * 1e6;

export const msToSeconds = (ms: number): number => ms * 1e-3;
export const secondsToMs = (s: number): number => s * 1e3;

// Distance
export const metersToCm = (m: number): number => m * 1e2;
export const cmToMeters = (cm: number): number => cm / 1e2;

export const metersToMm = (m: number): number => m * 1e3;
export const mmToMeters = (mm: number): number => mm / 1e3;

// Velocity
export const mpsToKmh = (mps: number): number => mps * 3.6;
export const kmhToMps = (kmh: number): number => kmh / 3.6;

// Angles
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;
export const degToRad = (deg: number): number => (deg * Math.PI) / 180;

// Data size (using binary 1024 / IEC prefix)
export const bytesToKb = (bytes: number): number => bytes / 1024;
export const bytesToMb = (bytes: number): number => bytes / (1024 * 1024);
export const bytesToGb = (bytes: number): number => bytes / (1024 * 1024 * 1024);

export const mbToBytes = (mb: number): number => mb * 1024 * 1024;
export const gbToBytes = (gb: number): number => gb * 1024 * 1024 * 1024;

/**
 * Format helpers for engineering display
 */
export function formatWithUnit(
  val: number,
  unit: string,
  precision = 2
): string {
  if (isNaN(val) || !isFinite(val)) return `--- ${unit}`;
  return `${val.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  })} ${unit}`;
}
