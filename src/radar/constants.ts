/**
 * Physical and engineering constants for FMCW radar calculation
 */

// Speed of light in vacuum (m/s) as defined by SI standard
export const SPEED_OF_LIGHT = 299792458; // m/s

// TI Recommended maximum range engineering factor (accounting for filter roll-off / margin)
export const TI_MAX_RANGE_ENGINEERING_FACTOR = 0.9;

// Default ADC bytes per sample for 16-bit Complex (2 bytes I + 2 bytes Q)
export const COMPLEX_16BIT_BYTES_PER_SAMPLE = 4;
export const REAL_16BIT_BYTES_PER_SAMPLE = 2;
