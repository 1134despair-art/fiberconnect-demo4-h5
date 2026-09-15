export type MeasureStatus = 'idle' | 'running' | 'done'
export type ActiveTab = 'overview' | 'parameter' | 'threshold' | 'result'
export type WavelengthOption = '1310nm' | '1550nm' | '1310+1550'
export type RangeOption =
  | '100m'
  | '500m'
  | '1km'
  | '2km'
  | '5km'
  | '10km'
  | '20km'
  | '40km'
  | '60km'
  | '90km'
  | '100km'
  | '120km'
  | '150km'
  | '200km'
export type PulseWidthOption =
  | '5ns'
  | '10ns'
  | '20ns'
  | '50ns'
  | '100ns'
  | '275ns'
  | '500ns'
  | '1us'
  | '2us'
  | '5us'
  | '10us'
export type MeasurementMode = 'average' | 'real-time'
export type MeasureTimeMode = '10s' | '15s' | '30s' | 'custom'
export type FiberMode = 'none' | 'length' | 'event'
export type DistanceUnit = 'km' | 'kfeet' | 'miles'
export type ThresholdMode = 'auto' | 'custom'

export interface ParameterForm {
  wavelength: WavelengthOption
  range: RangeOption
  pulseWidth: PulseWidthOption
  measurementMode: MeasurementMode
  measureTimeMode: MeasureTimeMode
  customMeasureSeconds: string
  refractiveIndex1310: string
  refractiveIndex1550: string
  launchFiberMode: FiberMode
  launchFiberValue: string
  receiveFiberMode: FiberMode
  receiveFiberValue: string
  unit: DistanceUnit
}

export interface PassRuleGroup {
  reflectEventEnabled: boolean
  reflectEventValue: string
  nonReflectEventEnabled: boolean
  nonReflectEventValue: string
  totalLossEnabled: boolean
  totalLossValue: string
  reflectEnabled: boolean
  reflectValue: string
  avgLoss1310Enabled: boolean
  avgLoss1310Value: string
  avgLoss1550Enabled: boolean
  avgLoss1550Value: string
}

export interface ThresholdForm {
  lossMode: ThresholdMode
  lossThreshold: string
  reflectMode: ThresholdMode
  reflectThreshold: string
  endMode: ThresholdMode
  endThreshold: string
  backscatter1310: string
  backscatter1550: string
  passRules: PassRuleGroup
}

export interface TracePoint {
  x: number
  y: number
  highlight?: boolean
}

export type OtdrZoomLevel = 1 | 2 | 3

export type OtdrCurveTool =
  | 'zoom-in'
  | 'zoom-out'
  | 'reset'
  | 'point-a'
  | 'point-b'
  | 'ab'
  | 'event-list'
  | 'result-list'
  | 'event-compare'

export type OtdrResultViewMode = 'result-list' | 'event-list' | 'event-compare'
export type OtdrReadMode = 'none' | 'point-a' | 'point-b' | 'ab'

export interface OtdrAbSelection {
  startIndex: number
  endIndex: number
}

export interface OtdrEventItem {
  id: number
  name: string
  type: string
  distance: string
  loss: string
  reflect: string
  totalLoss: string
  pass: boolean
  detail: string
}

export interface OtdrResultSummary {
  totalLoss: string
  averageLoss: string
  eventCount: number
  maxReflectance: string
  conclusion: 'pass' | 'fail'
  conclusionText: string
}

export interface OtdrResultData {
  trace: TracePoint[]
  events: OtdrEventItem[]
  summary: OtdrResultSummary
  testedAt: string
}

export interface OtdrHistoryRecord {
  id: string
  name: string
  time: string
  wavelength: string
  distance: string
  size: string
  conclusion: 'pass' | 'fail'
  conclusionText: string
  result: OtdrResultData
}

export interface CalibrationState {
  loading: boolean
  lastCalibratedAt: string
  result: string
}

export interface SaveStatusMeta {
  dirty: boolean
  savedAt: string
}

export interface OtdrConfigUsageNotice {
  text: string
  tone: 'default' | 'warning' | 'success'
}
