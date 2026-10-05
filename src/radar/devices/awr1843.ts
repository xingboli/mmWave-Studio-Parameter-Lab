import { RadarDevice } from './types.ts';

export const AWR1843_DEVICE: RadarDevice = {
  id: 'awr1843boost',
  name: 'TI AWR1843 / AWR1843BOOST',
  family: 'AWR18xx',
  description: '76-81 GHz High-Performance Automotive Radar Sensor with 3 TX and 4 RX antennas (supports Azimuth + Elevation MIMO)',
  txCount: 3,
  rxCount: 4,
  supportedAdcBits: [12, 14, 16],
  antennaGeometry: {
    txAntennas: [
      { txIndex: 0, label: 'TX1 (Azimuth ULA element 0)', azimuthOffsetLambda: 0, elevationOffsetLambda: 0 },
      { txIndex: 1, label: 'TX2 (Elevation element)', azimuthOffsetLambda: 1, elevationOffsetLambda: 0.5 },
      { txIndex: 2, label: 'TX3 (Azimuth ULA element 1)', azimuthOffsetLambda: 2, elevationOffsetLambda: 0 },
    ],
    rxAntennaCount: 4,
    rxSpacingLambda: 0.5,
  },
  constraints: {
    minFrequencyGHz: 76.0,
    maxFrequencyGHz: 81.0,
    maxTotalBandwidthGHz: 4.0,
    minAdcSampleRateKsps: 1000,
    maxAdcSampleRateKsps: 12500, // 12.5 Msps (complex 1x) / up to 10 Msps typical
    minAdcSamples: 64,
    maxAdcSamples: 1024,
    minIdleTimeUs: 2.0,
    minAdcStartTimeUs: 1.0,
    minRampEndTimeUs: 5.0,
    maxRampEndTimeUs: 500.0,
    minSlopeMHzUs: 0.1,
    maxSlopeMHzUs: 100.0,
    minFramePeriodicityMs: 1.0,
    maxChirpsPerFrame: 512,
  },
  computeVirtualAntennas: (activeTx: boolean[], activeRx: boolean[]) => {
    const rxCount = activeRx.filter(Boolean).length;
    const tx1Active = !!activeTx[0];
    const tx2Active = !!activeTx[1];
    const tx3Active = !!activeTx[2];
    const totalTx = activeTx.filter(Boolean).length;

    const total = totalTx * rxCount;

    // Azimuth virtual elements:
    // If TX1 and TX3 are active with 4 RX, they form 4 * 2 = 8 virtual azimuth elements (spacing 0.5 lambda)
    let azimuth = 0;
    if (tx1Active && tx3Active) {
      azimuth = 2 * rxCount;
    } else if (tx1Active || tx3Active) {
      azimuth = 1 * rxCount;
    }

    // Elevation virtual elements:
    // TX2 is elevated by 0.5 lambda relative to TX1/TX3
    let elevation = 0;
    if (tx2Active && (tx1Active || tx3Active)) {
      elevation = rxCount; // pairs with azimuth rows
    }

    let notes = '';
    if (tx1Active && tx2Active && tx3Active && rxCount === 4) {
      notes = 'Standard AWR1843BOOST 3D MIMO: 8 virtual azimuth elements + 4 elevation elements (Total: 12 virtual antennas).';
    } else if (tx1Active && tx3Active && !tx2Active && rxCount === 4) {
      notes = 'Azimuth-only 2D MIMO (TX1+TX3): 8 virtual azimuth elements.';
    } else {
      notes = `${totalTx} TX × ${rxCount} RX = ${total} virtual antennas.`;
    }

    return { total, azimuth, elevation, notes };
  },
};

export const DEVICES: Record<string, RadarDevice> = {
  [AWR1843_DEVICE.id]: AWR1843_DEVICE,
};

export function getDeviceById(id: string): RadarDevice {
  return DEVICES[id] || AWR1843_DEVICE;
}
