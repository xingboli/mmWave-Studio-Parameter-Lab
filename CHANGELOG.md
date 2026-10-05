# Changelog

## 1.0.0 - 2026-10-05

- Fix reproducible npm installation, remove unused backend/AI dependencies, and use Node.js 24 for Pages builds.
- Correct Studio 2.1.1 channel, profile, chirp, frame and xWR18xx DCA1000 command mappings.
- Validate uploaded and saved configurations before rendering. Reject malformed metadata and oversized JSON files.
- Resolve chirps by hardware indices. Validate all emitted chirps, frame ranges, channel masks and modeled TDM patterns.
- Report duty cycles above 100% and apply the real ADC Nyquist range limit.
- Synchronize structural chirp sequence changes with frame range and TX channels while preserving manually selected subranges during TX edits.
- Correct idle/ramp parameter sweeps, preserve profile/frame settings in their Lua output, and omit invalid rows.
- Reject nonpositive/nonfinite reverse-design targets. Block executable Lua for invalid configurations.
- Escape capture paths and prevent metadata/comments from introducing extra Lua statements.
- Replace hardware verification claims with documented API mapping checks and untested hardware status.
- Release original source under MIT and configure automatic GitHub Pages deployment.

Validation: 54 unit tests, TypeScript checking, production build, browser import/export/sweep/reverse-design checks and 390px responsive layout. No radar, DCA1000 or firmware operations were performed.
