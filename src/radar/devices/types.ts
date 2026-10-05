/**
 * Hardware Device Profile Abstraction
 * Allows supporting AWR1843 now, and easily extending to AWR1443, AWR1642, IWR6843, AWR2944 in the future.
 */

export interface DeviceTxAntennaGeometry {
  txIndex: number; // 0, 1, 2 (TX1, TX2, TX3)
  label: string; // e.g., "TX1 (Azimuth)", "TX2 (Elevation)", "TX3 (Azimuth)"
  azimuthOffsetLambda: number; // spacing in wavelength lambda
  elevationOffsetLambda: number;
}

export interface DeviceAntennaGeometry {
  txAntennas: DeviceTxAntennaGeometry[];
  rxAntennaCount: number;
  rxSpacingLambda: number; // typically 0.5 lambda for ULA
}

export interface DeviceConstraints {
  minFrequencyGHz: number;
  maxFrequencyGHz: number;
  maxAdcSampleRateKsps: number;
  minAdcSampleRateKsps: number;
  minAdcSamples: number;
  maxAdcSamples: number;
  minIdleTimeUs: number;
  minAdcStartTimeUs: number;
  minRampEndTimeUs: number;
  maxRampEndTimeUs: number;
  maxSlopeMHzUs: number;
  minSlopeMHzUs: number;
  minFramePeriodicityMs: number;
  maxChirpsPerFrame: number;
  maxTotalBandwidthGHz: number; // Maximum 4 GHz bandwidth (e.g. 76-81 GHz)
}

export interface RadarDevice {
  id: string;
  name: string;
  family: string;
  description: string;
  txCount: number;
  rxCount: number;
  supportedAdcBits: number[];
  antennaGeometry: DeviceAntennaGeometry;
  constraints: DeviceConstraints;

  /**
   * Helper to compute virtual array composition for active TX channels.
   * On AWR1843:
   * TX1 and TX3 are azimuth separated by 2*lambda, forming an 8-element azimuth ULA with 4 RX (lambda/2).
   * TX2 is elevated by 0.5*lambda (and 1*lambda azimuth offset), forming elevation angle capability.
   */
  computeVirtualAntennas: (
    activeTx: boolean[],
    activeRx: boolean[]
  ) => {
    total: number;
    azimuth: number;
    elevation: number;
    notes: string;
  };
}
