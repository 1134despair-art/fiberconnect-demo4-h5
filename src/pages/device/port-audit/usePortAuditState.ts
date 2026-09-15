import { reactive, ref, watch } from 'vue'

export const PORT_AUDIT_WAVELENGTHS = [850, 980, 1270, 1300, 1310, 1490, 1550, 1577, 1625, 1650] as const
export type PortAuditWavelength = (typeof PORT_AUDIT_WAVELENGTHS)[number]
export type PortAuditPowerView = 'opm' | 'pon'
export type PortAuditPowerUnit = 'dBm' | 'mW' | 'uW' | 'nW'
export type PortAuditRunStatus = 'idle' | 'running' | 'pass' | 'fail' | 'error' | 'disconnected'
export type PortAuditVflMode = 'off' | 'cw' | '1hz' | '2hz'
export type PortAuditVflColor = 'red' | 'green'
export type PortAuditAutoShutdown = 0 | 1 | 5 | 10 | 30 | 60
export type PortAuditFidScenario = 'forward' | 'reverse' | 'no-signal' | 'error'
export type PortAuditOnuCondition = 'connected' | 'open' | 'abnormal'

export interface PortAuditRfidRecord {
  id: string
  epc: string
  portCode: string
  assetCode: string
  readAt: string
  uploaded: boolean
}

interface PortAuditPersistedState {
  version: 1
  bluetoothEnabled: boolean
  cellularEnabled: boolean
  buzzerEnabled: boolean
  flashlightOn: boolean
  vflMode: PortAuditVflMode
  vflColor: PortAuditVflColor
  powerView: PortAuditPowerView
  powerUnit: PortAuditPowerUnit
  selectedWavelength: PortAuditWavelength
  opmReferenceDbm: number
  ponReferenceDbm: Record<'1490' | '1577', number>
  calibrationOffsets: Record<string, number>
  rfidRecords: PortAuditRfidRecord[]
  autoShutdownMinutes: PortAuditAutoShutdown
  deviceLanguage: 'zh-CN' | 'en'
}

const DEFAULT_STATE: PortAuditPersistedState = {
  version: 1,
  bluetoothEnabled: true,
  cellularEnabled: true,
  buzzerEnabled: true,
  flashlightOn: false,
  vflMode: 'off',
  vflColor: 'red',
  powerView: 'opm',
  powerUnit: 'dBm',
  selectedWavelength: 1310,
  opmReferenceDbm: 0,
  ponReferenceDbm: { 1490: 0, 1577: 0 },
  calibrationOffsets: {},
  rfidRecords: [],
  autoShutdownMinutes: 5,
  deviceLanguage: 'zh-CN'
}

const BASE_POWER: Record<PortAuditWavelength, number> = {
  850: -24.12, 980: -23.64, 1270: -20.18, 1300: -19.84, 1310: -18.76,
  1490: -17.48, 1550: -19.26, 1577: -18.32, 1625: -22.14, 1650: -23.08
}

const controllers = new Map<string, ReturnType<typeof createController>>()
const storageKey = (deviceId: string) => `port-audit:v1:${deviceId}`
const clamp = (value: number, min: number, max: number, decimals = 2) => {
  if (!Number.isFinite(value)) return 0
  return Number(Math.min(max, Math.max(min, value)).toFixed(decimals))
}
const validWavelength = (value: unknown): value is PortAuditWavelength => PORT_AUDIT_WAVELENGTHS.includes(Number(value) as PortAuditWavelength)

const readState = (deviceId: string): PortAuditPersistedState => {
  try {
    const raw = localStorage.getItem(storageKey(deviceId))
    if (!raw) return { ...DEFAULT_STATE, calibrationOffsets: {}, rfidRecords: [] }
    const parsed = JSON.parse(raw) as Partial<PortAuditPersistedState> & { referenceDbm?: number }
    const legacyReferenceDbm = clamp(Number(parsed.referenceDbm ?? 0), -80, 20)
    const records = Array.isArray(parsed.rfidRecords)
      ? parsed.rfidRecords.filter(item => item && typeof item.id === 'string').slice(0, 100)
      : []
    return {
      version: 1,
      bluetoothEnabled: parsed.bluetoothEnabled !== false,
      cellularEnabled: parsed.cellularEnabled !== false,
      buzzerEnabled: parsed.buzzerEnabled !== false,
      flashlightOn: false,
      vflMode: ['cw', '1hz', '2hz'].includes(String(parsed.vflMode)) ? parsed.vflMode as PortAuditVflMode : 'off',
      vflColor: parsed.vflColor === 'green' ? 'green' : 'red',
      powerView: parsed.powerView === 'pon' ? 'pon' : 'opm',
      powerUnit: ['mW', 'uW', 'nW'].includes(String(parsed.powerUnit)) ? parsed.powerUnit as PortAuditPowerUnit : 'dBm',
      selectedWavelength: validWavelength(parsed.selectedWavelength) ? parsed.selectedWavelength : 1310,
      opmReferenceDbm: clamp(Number(parsed.opmReferenceDbm ?? legacyReferenceDbm), -80, 20),
      ponReferenceDbm: {
        1490: clamp(Number(parsed.ponReferenceDbm?.['1490'] ?? legacyReferenceDbm), -80, 20),
        1577: clamp(Number(parsed.ponReferenceDbm?.['1577'] ?? legacyReferenceDbm), -80, 20)
      },
      calibrationOffsets: typeof parsed.calibrationOffsets === 'object' && parsed.calibrationOffsets ? parsed.calibrationOffsets : {},
      rfidRecords: records,
      autoShutdownMinutes: [0, 1, 5, 10, 30, 60].includes(Number(parsed.autoShutdownMinutes)) ? Number(parsed.autoShutdownMinutes) as PortAuditAutoShutdown : 5,
      deviceLanguage: parsed.deviceLanguage === 'en' ? 'en' : 'zh-CN'
    }
  } catch {
    return { ...DEFAULT_STATE, calibrationOffsets: {}, rfidRecords: [] }
  }
}

function createController(deviceId: string) {
  const persisted = reactive<PortAuditPersistedState>(readState(deviceId))
  const records = ref<PortAuditRfidRecord[]>(persisted.rfidRecords)
  const runtime = reactive({
    fidStatus: 'idle' as PortAuditRunStatus,
    fidDirection: 'unknown' as 'forward' | 'reverse' | 'unknown',
    fidIntensity: 0,
    fidPowerDbm: -70,
    onuStatus: 'idle' as PortAuditRunStatus,
    onuCondition: 'unknown' as 'connected' | 'open' | 'abnormal' | 'unknown',
    onuReturnLossDb: 0,
    powerStatus: 'idle' as 'idle' | 'running' | 'disconnected' | 'error',
    opmDbm: -18.76,
    pon1490Dbm: -17.48,
    pon1577Dbm: -18.32,
    frequencyHz: 0,
    tick: 0,
    rfidScanning: false,
    uploadProgress: 0,
    upgradeStatus: 'idle' as 'idle' | 'checking' | 'ready' | 'upgrading' | 'completed' | 'error',
    upgradeProgress: 0
  })
  let fidTimer: number | undefined
  let fidFinishTimer: number | undefined
  let onuFinishTimer: number | undefined
  let powerTimer: number | undefined
  let upgradeTimer: number | undefined

  watch(
    () => ({ ...persisted, rfidRecords: records.value }),
    value => {
      try { localStorage.setItem(storageKey(deviceId), JSON.stringify(value)) } catch { return }
    },
    { deep: true }
  )

  const clearTimers = () => {
    if (fidTimer) window.clearInterval(fidTimer)
    if (fidFinishTimer) window.clearTimeout(fidFinishTimer)
    if (onuFinishTimer) window.clearTimeout(onuFinishTimer)
    if (powerTimer) window.clearInterval(powerTimer)
    fidTimer = fidFinishTimer = onuFinishTimer = powerTimer = undefined
  }

  const startFid = (scenario: PortAuditFidScenario = 'forward') => {
    if (!persisted.bluetoothEnabled) { runtime.fidStatus = 'disconnected'; return false }
    if (fidTimer) window.clearInterval(fidTimer)
    if (fidFinishTimer) window.clearTimeout(fidFinishTimer)
    runtime.fidStatus = 'running'; runtime.fidDirection = 'unknown'; runtime.fidIntensity = 12; runtime.fidPowerDbm = -62.4
    fidTimer = window.setInterval(() => {
      runtime.fidIntensity = Math.min(88, runtime.fidIntensity + 11)
      runtime.fidPowerDbm = clamp(-62.4 + runtime.fidIntensity * 0.22, -70, 10)
    }, 220)
    fidFinishTimer = window.setTimeout(() => {
      if (fidTimer) window.clearInterval(fidTimer)
      fidTimer = undefined
      const hasSignal = scenario === 'forward' || scenario === 'reverse'
      runtime.fidStatus = hasSignal ? 'pass' : scenario === 'no-signal' ? 'fail' : 'error'
      runtime.fidDirection = hasSignal ? scenario : 'unknown'
      runtime.fidIntensity = hasSignal ? (scenario === 'forward' ? 82 : 68) : scenario === 'no-signal' ? 8 : 0
      runtime.fidPowerDbm = hasSignal ? (scenario === 'forward' ? -44.36 : -48.12) : -70
    }, 1800)
    return true
  }

  const stopFid = () => {
    if (fidTimer) window.clearInterval(fidTimer)
    if (fidFinishTimer) window.clearTimeout(fidFinishTimer)
    fidTimer = fidFinishTimer = undefined
    if (runtime.fidStatus === 'running') runtime.fidStatus = persisted.bluetoothEnabled ? 'idle' : 'disconnected'
  }

  const startOnu = (condition: PortAuditOnuCondition = 'connected') => {
    if (!persisted.bluetoothEnabled) { runtime.onuStatus = 'disconnected'; return false }
    if (onuFinishTimer) window.clearTimeout(onuFinishTimer)
    runtime.onuStatus = 'running'; runtime.onuCondition = 'unknown'; runtime.onuReturnLossDb = 0
    onuFinishTimer = window.setTimeout(() => {
      runtime.onuStatus = condition === 'connected' ? 'pass' : condition === 'open' ? 'fail' : 'error'
      runtime.onuCondition = condition
      runtime.onuReturnLossDb = condition === 'connected' ? 35.55 : 0
    }, 1700)
    return true
  }

  const stopOnu = () => {
    if (onuFinishTimer) window.clearTimeout(onuFinishTimer)
    onuFinishTimer = undefined
    if (runtime.onuStatus === 'running') runtime.onuStatus = persisted.bluetoothEnabled ? 'idle' : 'disconnected'
  }

  const refreshPower = () => {
    runtime.tick += 1
    const offset = clamp(Number(persisted.calibrationOffsets[String(persisted.selectedWavelength)] || 0), -5, 5)
    runtime.opmDbm = clamp(BASE_POWER[persisted.selectedWavelength] + offset + Math.sin(runtime.tick / 3) * 0.04, -70, 10)
    runtime.pon1490Dbm = clamp(-17.48 + Math.sin(runtime.tick / 3.2) * 0.04, -70, 10)
    runtime.pon1577Dbm = clamp(-18.32 + Math.cos(runtime.tick / 3.5) * 0.04, -70, 10)
    runtime.frequencyHz = [0, 270, 1000, 2000][Math.floor(runtime.tick / 8) % 4]
  }

  const startPower = () => {
    if (!persisted.bluetoothEnabled) { runtime.powerStatus = 'disconnected'; return false }
    if (powerTimer) window.clearInterval(powerTimer)
    runtime.powerStatus = 'running'; refreshPower()
    powerTimer = window.setInterval(refreshPower, 700)
    return true
  }

  const stopPower = () => {
    if (powerTimer) window.clearInterval(powerTimer)
    powerTimer = undefined
    runtime.powerStatus = persisted.bluetoothEnabled ? 'idle' : 'disconnected'
  }

  const setCalibration = (wavelength: PortAuditWavelength, value: number) => {
    persisted.calibrationOffsets[String(wavelength)] = clamp(value, -5, 5, 2)
    refreshPower()
  }

  const setReferenceFromCurrent = () => {
    if (persisted.powerView === 'pon') {
      persisted.ponReferenceDbm['1490'] = runtime.pon1490Dbm
      persisted.ponReferenceDbm['1577'] = runtime.pon1577Dbm
      return
    }
    persisted.opmReferenceDbm = runtime.opmDbm
  }

  const clearReference = () => {
    if (persisted.powerView === 'pon') {
      persisted.ponReferenceDbm['1490'] = 0
      persisted.ponReferenceDbm['1577'] = 0
      return
    }
    persisted.opmReferenceDbm = 0
  }

  const scanRfid = async () => {
    if (!persisted.bluetoothEnabled || runtime.rfidScanning) return null
    runtime.rfidScanning = true
    await new Promise(resolve => window.setTimeout(resolve, 850))
    if (!persisted.bluetoothEnabled) {
      runtime.rfidScanning = false
      return null
    }
    const sequence = records.value.length + 1
    const record: PortAuditRfidRecord = {
      id: `${Date.now()}`,
      epc: `E200-3412-${String(sequence).padStart(4, '0')}-A8F1`,
      portCode: `ODF-03-${String((sequence % 12) + 1).padStart(2, '0')}`,
      assetCode: `FTTH-SZ-${String(260700 + sequence)}`,
      readAt: new Date().toISOString(),
      uploaded: false
    }
    records.value = [record, ...records.value].slice(0, 100)
    runtime.rfidScanning = false
    return record
  }

  const uploadRecord = async (recordId: string) => {
    if (!persisted.cellularEnabled && !persisted.bluetoothEnabled) return false
    runtime.uploadProgress = 20
    await new Promise(resolve => window.setTimeout(resolve, 300)); runtime.uploadProgress = 65
    await new Promise(resolve => window.setTimeout(resolve, 300)); runtime.uploadProgress = 100
    const target = records.value.find(item => item.id === recordId)
    if (target) target.uploaded = true
    window.setTimeout(() => { runtime.uploadProgress = 0 }, 500)
    return Boolean(target)
  }

  const setVflMode = (mode: PortAuditVflMode) => {
    if (!persisted.bluetoothEnabled && mode !== 'off') return false
    persisted.vflMode = mode
    return true
  }

  const disconnectBluetooth = () => {
    clearTimers()
    if (upgradeTimer) window.clearInterval(upgradeTimer)
    upgradeTimer = undefined
    if (runtime.upgradeStatus === 'upgrading') runtime.upgradeStatus = 'error'
    runtime.rfidScanning = false
    persisted.bluetoothEnabled = false; persisted.flashlightOn = false; persisted.vflMode = 'off'
    runtime.fidStatus = 'disconnected'; runtime.onuStatus = 'disconnected'; runtime.powerStatus = 'disconnected'
  }
  const reconnectBluetooth = async () => {
    await new Promise(resolve => window.setTimeout(resolve, 550)); persisted.bluetoothEnabled = true
    runtime.fidStatus = 'idle'; runtime.onuStatus = 'idle'; runtime.powerStatus = 'idle'
  }

  const startUpgrade = () => {
    if (!persisted.bluetoothEnabled || runtime.upgradeStatus === 'upgrading') return false
    runtime.upgradeStatus = 'upgrading'; runtime.upgradeProgress = 0
    if (upgradeTimer) window.clearInterval(upgradeTimer)
    upgradeTimer = window.setInterval(() => {
      runtime.upgradeProgress = Math.min(100, runtime.upgradeProgress + 8)
      if (runtime.upgradeProgress >= 100) {
        if (upgradeTimer) window.clearInterval(upgradeTimer)
        upgradeTimer = undefined; runtime.upgradeStatus = 'completed'
      }
    }, 180)
    return true
  }

  return {
    persisted, records, runtime, startFid, stopFid, startOnu, stopOnu, startPower, stopPower,
    setCalibration, setReferenceFromCurrent, clearReference, scanRfid, uploadRecord, setVflMode,
    disconnectBluetooth, reconnectBluetooth, startUpgrade, clearTimers
  }
}

export const usePortAuditState = (deviceId: string) => {
  const existing = controllers.get(deviceId)
  if (existing) return existing
  const controller = createController(deviceId)
  controllers.set(deviceId, controller)
  return controller
}

export const formatPortAuditFrequency = (value: number) => value === 0 ? 'CW' : value >= 1000 ? `${value / 1000}kHz` : `${value}Hz`
export const convertPortAuditPower = (dbm: number, unit: PortAuditPowerUnit) => {
  if (unit === 'dBm') return dbm.toFixed(2)
  const mw = 10 ** (dbm / 10)
  if (unit === 'mW') return mw.toFixed(mw >= 0.01 ? 4 : 6)
  if (unit === 'uW') return (mw * 1000).toFixed(3)
  return (mw * 1_000_000).toFixed(2)
}
