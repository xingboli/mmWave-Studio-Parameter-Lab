export type Language = 'zh' | 'en';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  badgeDevice: string;
  badgeCapture: string;
  langSwitchBtn: string;
  validationPass: string;
  validationError: string;
  validationWarning: string;
  tabConfigure: string;
  tabSweep: string;
  btnReverseDesign: string;
  btnJsonExport: string;
  btnAbout: string;

  // Presets
  presetTitle: string;
  presetSubtitle: string;
  presetExampleNote: string;
  presetRangeName: string;
  presetRangeTag: string;
  presetRangeDesc: string;
  presetDopplerName: string;
  presetDopplerTag: string;
  presetDopplerDesc: string;
  presetAoaName: string;
  presetAoaTag: string;
  presetAoaDesc: string;
  presetMicroName: string;
  presetMicroTag: string;
  presetMicroDesc: string;
  presetCustomName: string;
  presetCustomTag: string;
  presetCustomDesc: string;

  // Parameter Panel
  profileTitle: string;
  profileId: string;
  startFreq: string;
  startFreqSub: string;
  freqSlope: string;
  freqSlopeSub: string;
  idleTime: string;
  idleTimeSub: string;
  adcStartTime: string;
  adcStartTimeSub: string;
  rampEndTime: string;
  rampEndTimeSub: string;
  adcSamples: string;
  sampleRate: string;
  rxGain: string;
  rxGainSub: string;

  // Chirps
  chirpTitle: string;
  chirpSubtitle: string;
  chirpPatterns: string;
  chirpSlot: string;
  chirpProfile: string;
  activeTx: string;
  addChirp: string;

  // Frames
  frameTitle: string;
  frameSubtitle: string;
  chirpSeqRange: string;
  chirpStart: string;
  chirpEnd: string;
  chirpsPerLoop: string;
  chirpLoops: string;
  framePeriod: string;
  numFrames: string;
  continuousFrames: string;

  // Channels
  channelsTitle: string;
  rxAntennas: string;
  rxAntennasSub: string;
  txAntennas: string;
  txAntennasSub: string;
  adcMode: string;
  adcComplex: string;
  adcReal: string;
  swapIq: string;

  // Performance
  timelineTitle: string;
  chirpRate: string;
  idleLegend: string;
  adcStartLegend: string;
  sampleLegend: string;
  slackLegend: string;

  metricRangeRes: string;
  metricRangeResDesc: string;
  metricMaxRange: string;
  metricMaxRangeDesc: string;
  metricMaxVel: string;
  metricMaxVelDesc: string;
  metricVelRes: string;
  metricVelResDesc: string;
  metricDuty: string;
  metricDutyDesc: string;
  metricVirtual: string;
  metricVirtualDesc: string;

  betterSmaller: string;
  betterLarger: string;
  drivenBy: string;

  rawPayloadTitle: string;
  perChirp: string;
  perFrame: string;
  totalSession: string;
  ethernetRate: string;

  // Validation
  validationTitle: string;
  validationPassedTitle: string;
  validationPassedMsg: string;
  suggestedAction: string;

  // Trade-offs
  tradeoffTitle: string;
  tradeoffSubtitle: string;
  labGuideline: string;

  // Lua Preview
  luaTitle: string;
  modeA: string;
  modeB: string;
  modeC: string;
  verifiedLabel: string;
  unverifiedLabel: string;
  perfHeaderToggle: string;
  btnCopy: string;
  btnCopied: string;
  btnDownloadLua: string;

  // Sweep
  sweepTitle: string;
  sweepSubtitle: string;
  selectSweepParam: string;
  startVal: string;
  stopVal: string;
  stepVal: string;
  btnExportCsv: string;
  btnViewSweepLua: string;
  btnHideSweepLua: string;
  sweepMatrixTitle: string;
  matrixNote: string;
  colParam: string;
  colBadc: string;
  colRangeRes: string;
  colMaxRange: string;
  colMaxVel: string;
  colVelRes: string;
  colActivePeriod: string;
  colDuty: string;
  colFrameSize: string;
  colStatus: string;

  // Reverse Design
  reverseTitle: string;
  reverseSubtitle: string;
  reverseCriteria: string;
  targetRangeRes: string;
  targetMaxRange: string;
  targetMaxVel: string;
  targetFps: string;
  btnSearchCandidates: string;
  resultsTitle: string;
  resultsSub: string;
  noCandidates: string;
  btnApplyToLab: string;

  // Metadata & Export
  metaTitle: string;
  metaSubtitle: string;
  expName: string;
  authorLab: string;
  expNotes: string;
  jsonPreview: string;
  btnImportJson: string;
  btnDownloadJson: string;
  btnClose: string;

  // Footer
  footerSub: string;
  footerStatic: string;
}
