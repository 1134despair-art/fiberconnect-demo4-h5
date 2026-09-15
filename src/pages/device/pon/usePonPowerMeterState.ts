import { reactive, ref, watch } from 'vue'

export const PON_OPM_WAVELENGTHS = [850, 980, 1270, 1300, 1310, 1490, 1550, 1577, 1625, 1650] as const

export type PonOpmWavelength = (typeof PON_OPM_WAVELENGTHS)[number]
export type PonMeasurementMode = 'pon' | 'opm'
export type PonPowerUnit = 'dBm' | 'mW' | 'uW' | 'nW'
export type PonMeasurementStatus = 'idle' | 'live' | 'disconnected' | 'error'
export type PonVflMode = 'off' | 'steady' | 'cw' | '1hz' | '2hz'
export type PonDeviceLanguage = 'zh-CN' | 'en'
export type PonAutoShutdownMinutes = 0 | 1 | 5 | 10 | 30 | 60
export type PonFrequencyMode = 0 | 270 | 330 | 1000 | 2000

export const PON_FREQUENCY_OPTIONS = [0, 270, 330, 1000, 2000] as const
export const PON_DETECTABLE_FREQUENCIES = [270, 330, 1000, 2000] as const

export interface PonMeasurementRecord {
  id: string
  deviceId: string
  createdAt: string
  mode: PonMeasurementMode
  unit: PonPowerUnit
  pon1490Dbm?: number
  pon1577Dbm?: number
  wavelength?: PonOpmWavelength
  powerDbm?: number
  frequency?: number
  referenceDbm?: number
  relativeDb?: number
  linearPowerNw?: number
}

interface PonPersistedState {
  version: 1
  measurementMode: PonMeasurementMode
  selectedWavelength: PonOpmWavelength
  displayUnit: PonPowerUnit
  frequencyMode: PonFrequencyMode
  referenceDbm: Record<string, number>
  calibrationOffsets: Record<string, number>
  vflMode: PonVflMode
  flashlightOn: boolean
  bluetoothEnabled: boolean
  deviceLanguage: PonDeviceLanguage
  autoShutdownMinutes: PonAutoShutdownMinutes
  records: PonMeasurementRecord[]
}

type StoredRecord = Partial<PonMeasurementRecord> & {
  kind?: 'dual' | 'single'
}

type StoredState = Partial<PonPersistedState> & {
  measurementView?: 'dual' | 'single'
  records?: StoredRecord[]
}

const DEFAULT_STATE: PonPersistedState = {
  version: 1,
  measurementMode: 'pon',
  selectedWavelength: 1310,
  displayUnit: 'dBm',
  frequencyMode: 270,
  referenceDbm: {},
  calibrationOffsets: {},
  vflMode: 'off',
  flashlightOn: false,
  bluetoothEnabled: true,
  deviceLanguage: 'zh-CN',
  autoShutdownMinutes: 5,
  records: []
}

const OPM_BASE_DBM: Record<PonOpmWavelength, number> = {
  850: -23.58,
  980: -24.12,
  1270: -19.46,
  1300: -20.04,
  1310: -18.86,
  1490: 3.24,
  1550: -19.18,
  1577: -20.16,
  1625: -22.08,
  1650: -33.89
}

const DETECTED_FREQUENCY_BY_WAVELENGTH: Record<PonOpmWavelength, Exclude<PonFrequencyMode, 0>> = {
  850: 270,
  980: 330,
  1270: 1000,
  1300: 2000,
  1310: 270,
  1490: 330,
  1550: 1000,
  1577: 2000,
  1625: 270,
  1650: 330
}

const POWER_UNITS: PonPowerUnit[] = ['dBm', 'mW', 'uW', 'nW']
const controllers = new Map<string, ReturnType<typeof createController>>()
const storageKey = (deviceId: string) => `pon-power-meter:v1:${deviceId}`

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const round = (value: number, digits = 2) => Number(value.toFixed(digits))
const isSupportedWavelength = (value: unknown): value is PonOpmWavelength => (
  PON_OPM_WAVELENGTHS.includes(Number(value) as PonOpmWavelength)
)
const isPowerUnit = (value: unknown): value is PonPowerUnit => POWER_UNITS.includes(value as PonPowerUnit)

export const dbmToMilliwatts = (dbm: number) => 10 ** (dbm / 10)
export const dbmToNanowatts = (dbm: number) => dbmToMilliwatts(dbm) * 1_000_000

export const convertPonPower = (dbm: number, unit: PonPowerUnit) => {
  if (unit === 'dBm') return dbm.toFixed(2)
  const milliwatts = dbmToMilliwatts(dbm)
  if (unit === 'mW') return milliwatts >= 1 ? milliwatts.toFixed(3) : milliwatts.toFixed(4)
  if (unit === 'uW') return (milliwatts * 1000).toFixed(2)
  return (milliwatts * 1_000_000).toFixed(0)
}

export const formatPonFrequency = (frequency: number) => {
  if (frequency === 0) return 'CW'
  if (frequency === 1000) return '1kHz'
  if (frequency === 2000) return '2kHz'
  return `${frequency}Hz`
}

const normalizeNumberMap = (value: unknown) => {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, entry]) => isSupportedWavelength(key) && Number.isFinite(Number(entry)))
      .map(([key, entry]) => [key, round(clamp(Number(entry), -80, 30))])
  )
}

const normalizeCalibrationMap = (value: unknown) => {
  const map = normalizeNumberMap(value)
  return Object.fromEntries(Object.entries(map).map(([key, entry]) => [key, round(clamp(entry, -5, 5))]))
}

const normalizeRecord = (record: StoredRecord): PonMeasurementRecord | null => {
  const mode: PonMeasurementMode = record.mode === 'opm' || record.kind === 'single' ? 'opm' : 'pon'
  const base = {
    id: typeof record.id === 'string' ? record.id : `${Date.now()}-legacy`,
    deviceId: typeof record.deviceId === 'string' ? record.deviceId : '',
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    mode,
    unit: isPowerUnit(record.unit) ? record.unit : 'dBm' as PonPowerUnit
  }

  if (mode === 'opm') {
    const powerDbm = Number(record.powerDbm)
    if (!isSupportedWavelength(record.wavelength) || !Number.isFinite(powerDbm)) return null
    return {
      ...base,
      wavelength: record.wavelength,
      powerDbm,
      frequency: Number.isFinite(Number(record.frequency)) ? Number(record.frequency) : 0,
      referenceDbm: Number.isFinite(Number(record.referenceDbm)) ? Number(record.referenceDbm) : 0,
      relativeDb: Number.isFinite(Number(record.relativeDb)) ? Number(record.relativeDb) : powerDbm,
      linearPowerNw: Number.isFinite(Number(record.linearPowerNw)) ? Number(record.linearPowerNw) : dbmToNanowatts(powerDbm)
    }
  }

  const pon1490Dbm = Number(record.pon1490Dbm)
  const pon1577Dbm = Number(record.pon1577Dbm)
  if (!Number.isFinite(pon1490Dbm) || !Number.isFinite(pon1577Dbm)) return null
  return { ...base, mode: 'pon', unit: 'dBm', pon1490Dbm, pon1577Dbm }
}

const readPersistedState = (deviceId: string): PonPersistedState => {
  try {
    const raw = localStorage.getItem(storageKey(deviceId))
    if (!raw) return { ...DEFAULT_STATE, referenceDbm: {}, calibrationOffsets: {}, records: [] }

    const parsed = JSON.parse(raw) as StoredState
    const records = Array.isArray(parsed.records)
      ? parsed.records.map(normalizeRecord).filter((record): record is PonMeasurementRecord => record !== null).slice(0, 100)
      : []
    const legacyMode = parsed.measurementView === 'single' ? 'opm' : 'pon'

    return {
      version: 1,
      measurementMode: parsed.measurementMode === 'opm' || parsed.measurementMode === 'pon' ? parsed.measurementMode : legacyMode,
      selectedWavelength: isSupportedWavelength(parsed.selectedWavelength) ? parsed.selectedWavelength : 1310,
      displayUnit: isPowerUnit(parsed.displayUnit) ? parsed.displayUnit : 'dBm',
      frequencyMode: PON_FREQUENCY_OPTIONS.includes(Number(parsed.frequencyMode) as PonFrequencyMode)
        ? Number(parsed.frequencyMode) as PonFrequencyMode
        : 270,
      referenceDbm: normalizeNumberMap(parsed.referenceDbm),
      calibrationOffsets: normalizeCalibrationMap(parsed.calibrationOffsets),
      vflMode: parsed.vflMode === 'steady' || parsed.vflMode === 'cw' || parsed.vflMode === '1hz' || parsed.vflMode === '2hz' ? parsed.vflMode : 'off',
      flashlightOn: false,
      bluetoothEnabled: parsed.bluetoothEnabled !== false,
      deviceLanguage: parsed.deviceLanguage === 'en' ? 'en' : 'zh-CN',
      autoShutdownMinutes: [0, 1, 5, 10, 30, 60].includes(Number(parsed.autoShutdownMinutes))
        ? Number(parsed.autoShutdownMinutes) as PonAutoShutdownMinutes
        : 5,
      records
    }
  } catch {
    return { ...DEFAULT_STATE, referenceDbm: {}, calibrationOffsets: {}, records: [] }
  }
}

function createController(deviceId: string) {
  const persisted = reactive<PonPersistedState>(readPersistedState(deviceId))
  const records = ref<PonMeasurementRecord[]>(persisted.records)
  const runtime = reactive({
    status: 'idle' as PonMeasurementStatus,
    tick: 0,
    pon1490Dbm: -15.68,
    pon1577Dbm: -20.16,
    opmDbm: OPM_BASE_DBM[persisted.selectedWavelength],
    opmFrequency: persisted.frequencyMode === 0 ? 0 : DETECTED_FREQUENCY_BY_WAVELENGTH[persisted.selectedWavelength],
    errorMessage: ''
  })

  let liveTimer: number | undefined

  const persist = () => {
    try {
      localStorage.setItem(storageKey(deviceId), JSON.stringify({ ...persisted, records: records.value.slice(0, 100) }))
    } catch {
      return
    }
  }

  watch(() => ({ ...persisted, records: records.value }), persist, { deep: true })

  const refreshOpmReading = () => {
    const wavelength = persisted.selectedWavelength
    const calibration = Number(persisted.calibrationOffsets[String(wavelength)] || 0)
    const index = PON_OPM_WAVELENGTHS.indexOf(wavelength)
    runtime.opmDbm = OPM_BASE_DBM[wavelength] + calibration + Math.sin((runtime.tick + index) / 3.4) * 0.015
    runtime.opmFrequency = persisted.frequencyMode === 0 ? 0 : DETECTED_FREQUENCY_BY_WAVELENGTH[wavelength]
  }

  const updateReadings = () => {
    runtime.tick += 1
    runtime.pon1490Dbm = -15.68 + Math.sin(runtime.tick / 3.1) * 0.015
    runtime.pon1577Dbm = -20.16 + Math.cos(runtime.tick / 3.6) * 0.02
    refreshOpmReading()
  }

  const clearLiveTimer = () => {
    if (liveTimer !== undefined) {
      window.clearInterval(liveTimer)
      liveTimer = undefined
    }
  }

  const stopLiveMeasurement = (status: PonMeasurementStatus = 'idle') => {
    clearLiveTimer()
    runtime.status = status
  }

  const startLiveMeasurement = () => {
    if (!persisted.bluetoothEnabled) {
      stopLiveMeasurement('disconnected')
      runtime.errorMessage = 'bluetooth_off'
      return false
    }
    runtime.errorMessage = ''
    runtime.status = 'live'
    updateReadings()
    if (liveTimer === undefined) liveTimer = window.setInterval(updateReadings, 650)
    return true
  }

  const setMeasurementMode = (mode: PonMeasurementMode) => {
    persisted.measurementMode = mode
    updateReadings()
  }

  const setWavelength = (wavelength: PonOpmWavelength) => {
    persisted.selectedWavelength = wavelength
    refreshOpmReading()
  }

  const setDisplayUnit = (unit: PonPowerUnit) => {
    persisted.displayUnit = unit
  }

  const setFrequencyMode = (frequency: PonFrequencyMode) => {
    persisted.frequencyMode = frequency
    refreshOpmReading()
  }

  const setFrequencyRecognition = (enabled: boolean) => {
    persisted.frequencyMode = enabled ? 270 : 0
    refreshOpmReading()
  }

  const getReferenceDbm = (wavelength = persisted.selectedWavelength) => Number(persisted.referenceDbm[String(wavelength)] || 0)

  const setReferenceFromCurrent = () => {
    persisted.referenceDbm[String(persisted.selectedWavelength)] = round(runtime.opmDbm)
  }

  const clearReference = () => {
    delete persisted.referenceDbm[String(persisted.selectedWavelength)]
  }

  const setCalibrationOffset = (wavelength: PonOpmWavelength, offset: number) => {
    persisted.calibrationOffsets[String(wavelength)] = round(clamp(offset, -5, 5))
    refreshOpmReading()
  }

  const resetCalibration = (wavelength?: PonOpmWavelength) => {
    if (wavelength) delete persisted.calibrationOffsets[String(wavelength)]
    else persisted.calibrationOffsets = {}
    refreshOpmReading()
  }

  const saveCurrentRecord = () => {
    if (runtime.status !== 'live') return null
    const common = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      deviceId,
      createdAt: new Date().toISOString()
    }
    const record: PonMeasurementRecord = persisted.measurementMode === 'pon'
      ? {
          ...common,
          mode: 'pon',
          unit: 'dBm',
          pon1490Dbm: round(runtime.pon1490Dbm),
          pon1577Dbm: round(runtime.pon1577Dbm)
        }
      : {
          ...common,
          mode: 'opm',
          unit: persisted.displayUnit,
          wavelength: persisted.selectedWavelength,
          powerDbm: round(runtime.opmDbm),
          frequency: runtime.opmFrequency,
          referenceDbm: round(getReferenceDbm()),
          relativeDb: round(runtime.opmDbm - getReferenceDbm()),
          linearPowerNw: round(dbmToNanowatts(runtime.opmDbm), 3)
        }

    records.value = [record, ...records.value].slice(0, 100)
    persist()
    return record
  }

  const deleteRecord = (recordId: string) => {
    records.value = records.value.filter(record => record.id !== recordId)
    persist()
  }

  const clearRecords = () => {
    records.value = []
    persist()
  }

  const setVflMode = (mode: PonVflMode) => {
    if (!persisted.bluetoothEnabled && mode !== 'off') return false
    persisted.vflMode = mode
    return true
  }

  const setFlashlight = (enabled: boolean) => {
    if (!persisted.bluetoothEnabled && enabled) return false
    persisted.flashlightOn = enabled
    return true
  }

  const setBluetooth = (enabled: boolean) => {
    persisted.bluetoothEnabled = enabled
    if (!enabled) {
      stopLiveMeasurement('disconnected')
      persisted.vflMode = 'off'
      persisted.flashlightOn = false
    } else if (runtime.status === 'disconnected') {
      runtime.status = 'idle'
      runtime.errorMessage = ''
    }
  }

  const setMeasurementError = (message = 'sensor_error') => {
    stopLiveMeasurement('error')
    runtime.errorMessage = message
  }

  return {
    deviceId,
    persisted,
    records,
    runtime,
    startLiveMeasurement,
    stopLiveMeasurement,
    setMeasurementMode,
    setWavelength,
    setDisplayUnit,
    setFrequencyMode,
    setFrequencyRecognition,
    getReferenceDbm,
    setReferenceFromCurrent,
    clearReference,
    setCalibrationOffset,
    resetCalibration,
    saveCurrentRecord,
    deleteRecord,
    clearRecords,
    setVflMode,
    setFlashlight,
    setBluetooth,
    setMeasurementError,
    persist
  }
}

export function usePonPowerMeterState(deviceId: string) {
  const existing = controllers.get(deviceId)
  if (existing) return existing
  const controller = createController(deviceId)
  controllers.set(deviceId, controller)
  return controller
}
