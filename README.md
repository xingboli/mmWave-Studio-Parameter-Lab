# mmWave Studio Parameter Lab

A dedicated, static FMCW radar parameter configuration, physical performance compiler, constraint validation, and mmWave Studio Lua generator tailored for researchers working with **Texas Instruments AWR1843BOOST** and **DCA1000 EVM**.

> **Disclaimer:** This tool is intended for experiment design and configuration assistance. Calculated results are engineering estimates and should be verified against official TI documentation (e.g. SWRA553, SPRUIS4C) and actual hardware measurements.

---

## 1. What is mmWave Parameter Lab?

In FMCW millimeter-wave radar experimentation, radar parameters are deeply coupled:
- Increasing **Frequency Slope** enhances range resolution, but contracts maximum unambiguous detection range.
- Increasing **ADC Samples** expands effective bandwidth and range resolution, but risks exceeding the chirp **Ramp End Time**.
- In **TDM-MIMO**, activating more TX antennas expands the virtual antenna array aperture, but multiplies the TX repetition interval $T_{tx}$, directly dividing the **Maximum Unambiguous Velocity** ($V_{max}$).

Traditional spreadsheets and standalone formula calculators calculate numbers in isolation without checking whether the ADC sampling window physically fits inside the synthesizer ramp, or whether duty cycles will overheat the RF front-end.

**mmWave Studio Parameter Lab** functions as an **Experiment Configuration Compiler**:

$$\text{Experiment Goals} \longrightarrow \text{Physical Modeling} \longrightarrow \text{Constraint Validation} \longrightarrow \text{Trade-off Analysis} \longrightarrow \text{Verified Lua Script}$$

---

## 2. Features

- **Decoupled Architecture:** Pure TypeScript physics engine (`calculate.ts`), strict hardware constraint validator (`validate.ts`), and unit-tested SI conversion layer (`units.ts`) completely separated from React UI.
- **Physical Performance Compilation:**
  - ADC Sampling Time ($T_{adc}$) & Window Margin Slack
  - Effective ADC Bandwidth ($B_{adc}$) vs Full Chirp Sweep Bandwidth
  - Range Resolution ($\Delta R$) & Range Bin size
  - Maximum Detection Range ($R_{max}$) with theoretical and recommended 0.9 engineering margins
  - Chirp Cycle Time ($T_{chirp}$) & Chirp Repetition Frequency (CRF)
  - TDM-MIMO TX Repetition Time ($T_{tx}$)
  - Maximum Unambiguous Velocity ($V_{max}$) & Doppler Velocity Resolution ($\Delta v$)
  - Frame Active Time ($T_{active}$), Frame Rate (FPS), and Duty Cycle (%)
  - Virtual Antenna Count (Azimuth & Elevation) & Approximate Angular Resolution (AoA)
  - Raw ADC Data Payload (per chirp, per frame, total session MB/GB, and streaming Ethernet data rate)
- **Constraint & Safety Validator:**
  - Flags ADC sampling window overrun when $T_{adc\_start} + T_{adc} > T_{ramp\_end}$ with actionable suggestions
  - Flags frame active time overflow when $T_{active} > T_{frame}$ (duty cycle > 100%)
  - Thermal warnings for high duty cycles (> 50%)
  - Out-of-band checks for 76 - 81 GHz RF limits and 4 GHz total sweep bandwidth
  - Minimum idle time checks for PLL VCO settling ($T_{idle} \ge 2\ \mu\text{s}$)
- **Trade-off Engine:** Dynamic insight cards explaining the physical "why" behind current parameter values.
- **mmWave Studio 2.x Lua Generator:**
  - **Mode A (Config Only):** 100% verified `ar1.*` commands (`ChannelConfig`, `ADCBufConfig`, `ProfileConfig`, `ChirpConfig`, `FrameConfig`)
  - **Mode B (Config + Capture - Beta):** Verified DCA1000 LVDS Ethernet arming and capture triggers
  - **Mode C (Full Automation - Reference Template):** Board bringup sequence template
- **Parameter Sweep Generator:** Batch simulate performance across slope, samples, sample rate, idle time, or loops, with CSV export and Lua iteration scripts.
- **Reverse Design (Beta):** Bounded grid search algorithm compiling compliant parameter combinations from user performance targets ($\Delta R$, $R_{max}$, $V_{max}$, FPS).
- **JSON Import / Export:** Serialized `config.json` and `experiment.json` containing metadata, author, notes, and exact calculated outputs.

---

## 3. Architecture

```text
src/
├── radar/                      # Pure physics & hardware abstraction
│   ├── types.ts                # Unified RadarConfig and Performance interfaces
│   ├── constants.ts            # Physical constants (c, margins, byte sizes)
│   ├── units.ts                # Explicit SI unit conversion module
│   ├── calculate.ts            # Pure physical calculation engine
│   ├── calculate.test.ts       # Vitest unit test suite
│   ├── validate.ts             # Hardware constraint validator
│   ├── validate.test.ts        # Validator test suite
│   ├── tradeoff.ts             # Multi-parameter trade-off reasoning engine
│   ├── reverse.ts              # Bounded grid search compiler
│   └── devices/
│       ├── types.ts            # Device profile interface
│       └── awr1843.ts          # TI AWR1843 hardware specifications & antenna geometry
│
├── lua/                        # mmWave Studio Lua generator layer
│   ├── types.ts                # Lua intermediate representation
│   ├── studio2.ts              # Verified TI ar1.* API mapping implementations
│   └── generator.ts            # Lua script compiler with comments & metrics header
│
├── presets/                    # Laboratory scenario presets
│   ├── types.ts
│   ├── awr1843.ts              # 5 pre-configured experiment baselines
│   └── presets.test.ts
│
├── components/                 # React UI layer
│   ├── ParameterPanel/         # Profile, Chirp, Frame, and Channel inputs
│   ├── PerformancePanel/       # Visual timeline bar & metric cards
│   ├── ValidationPanel/        # Error/Warning/Info alerts with actionable tips
│   ├── TradeoffPanel/          # Dynamic trade-off analysis tabs
│   ├── LuaPreview/             # Real-time Lua code viewer with Copy & Download
│   ├── Sweep/                  # Parameter sweep table & CSV generator
│   ├── ReverseDesign/          # Reverse design target search dialog
│   ├── MetadataExport/         # JSON config/experiment import & export
│   └── About/                  # Engineering derivations & documentation dialog
│
└── App.tsx                     # Main layout & tab orchestrator
```

---

## 4. Supported Hardware & mmWave Studio

| Component | Target Support | Status |
| :--- | :--- | :--- |
| **Radar Sensor** | TI AWR1843 / AWR1843BOOST | Native Profile |
| **Data Capture** | TI DCA1000 EVM | Supported (LVDS over Ethernet) |
| **mmWave Studio** | Version 2.0 / 2.1.1.0 (`ar1.*` API) | Mode A Verified, Mode B Beta |
| **Future Extension** | AWR1642, IWR6843, AWR2944, Studio 4.x (`mws.*`) | Architecture ready via `DeviceProfile` |

---

## 5. How Radar Calculations Work

Internal calculations strictly use standard SI units:
- Frequency: $\text{Hz}$
- Time: $\text{seconds}$
- Distance: $\text{meters}$
- Velocity: $\text{m/s}$
- Speed of light: $c = 299,792,458\ \text{m/s}$

1. **Carrier Wavelength:** $\lambda = \frac{c}{f_0}$ (using Start Frequency $f_0$ as Doppler approximation)
2. **ADC Sampling Duration:** $T_{adc} = \frac{N_{adc}}{F_s}$
3. **Effective Swept Bandwidth:** $B_{adc} = \text{Slope} \times T_{adc}$
4. **Range Resolution:** $\Delta R = \frac{c}{2 \cdot B_{adc}} = \frac{c \cdot F_s}{2 \cdot \text{Slope} \cdot N_{adc}}$
5. **Recommended Maximum Range:** $R_{max} = 0.9 \cdot \frac{F_s \cdot c}{2 \cdot \text{Slope}}$ (0.9 engineering factor)
6. **Chirp Cycle Time:** $T_{chirp} = T_{idle} + T_{ramp\_end}$
7. **TX Repetition Interval:** $T_{tx} = N_{tx\_active} \times T_{chirp}$
8. **Maximum Unambiguous Velocity:** $V_{max} = \frac{\lambda}{4 \cdot T_{tx}}$
9. **Velocity Resolution:** $\Delta v = \frac{\lambda}{2 \cdot N_d \cdot T_{tx}}$ (where $N_d$ is chirp loops per frame)
10. **Frame Active Time:** $T_{active} = \text{Loops} \times N_{chirp} \times T_{chirp}$
11. **Duty Cycle:** $\text{Duty} = \frac{T_{active}}{T_{frame}} \times 100\%$

---

## 6. How Lua Generation Works

The generator follows a two-tier credibility model:

### Verified TI mmWave Studio 2.x Commands
- `ar1.ChannelConfig(rxMask, txMask, cascading)`
- `ar1.ADCBufConfig(dataFmt, iqSwap, chanInterleave, chirpThreshold)`
- `ar1.ProfileConfig(profileId, startFreq, idleTime, adcStartTime, rampEndTime, txOutPower, txPhaseShifter, freqSlopeConst, txStartTime, numAdcSamples, digOutSampleRate, hpf1, hpf2, rxGain)`
- `ar1.ChirpConfig(chirpStartIndex, chirpEndIndex, profileId, startFreqVar, freqSlopeVar, idleTimeVar, adcStartTimeVar, txMask)`
- `ar1.FrameConfig(chirpStartIndex, chirpEndIndex, numLoops, numFrames, framePeriodicity, triggerDelay, numDummyChirps)`

### DCA1000 & Automation Commands (Beta / Template)
- `ar1.SelectCaptureDevice("DCA1000")`
- `ar1.CaptureCardConfig_Mode(1, 1, 1, 2, 1, 30)`
- `ar1.CaptureCardConfig_StartRecord(filePath, 1)`
- `ar1.StartFrame()`

---

## 7. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run unit test suite (Vitest)
npm test

# 3. Type check & lint
npm run lint

# 4. Start local development server
npm run dev
```

---

## 8. Static Build & GitHub Pages Deployment

The application is completely static (no backend, no database, no API keys).

```bash
# Build production bundle to /dist
npm run build
```

To deploy on GitHub Pages:
1. Push this repository to GitHub.
2. In GitHub repository **Settings** → **Pages** → **Build and deployment**:
   - Source: **GitHub Actions**
3. The included workflow `.github/workflows/deploy.yml` will automatically build and publish the applet.

---

## 9. Roadmap

- [ ] Add device profile for **IWR6843** (60 GHz) and **AWR2944** (77 GHz 4-TX)
- [ ] Add mmWave Studio 4.x CLI script generator (`mws.*`)
- [ ] Direct WebUSB / WebSerial connectivity runner
