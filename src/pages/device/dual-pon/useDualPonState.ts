import { reactive, watch } from 'vue'

export const DUAL_PON_WAVELENGTHS = [1310, 1490, 1550] as const
export const DUAL_PON_OPM_WAVELENGTHS = [850, 980, 1270, 1300, 1310, 1490, 1550, 1577, 1625, 1650] as const
export type DualPonWavelength = (typeof DUAL_PON_WAVELENGTHS)[number]
export type DualPonOpmWavelength = (typeof DUAL_PON_OPM_WAVELENGTHS)[number]
export type DualPonLinkCase = 'online' | 'disconnected' | 'terminal_fault' | 'high_loss' | 'unpowered' | 'missing_terminal'
export type DualPonRunStatus = 'idle' | 'running' | 'pass' | 'fail' | 'error' | 'disconnected'
export type DualPonPowerMode = 'pon' | 'opm'
export type DualPonPowerUnit = 'dBm' | 'mW' | 'uW'
export type DualPonVflMode = 'off' | 'cw' | '1hz' | '2hz'
export type DualPonCableMode = 'length' | 'wiremap' | 'trace'
export type DualPonPowerRange = 'standard' | 'high'
export type DualPonCableUnit = 'm' | 'ft'
export type DualPonCableCategory = 'cat5e' | 'cat6'
export type DualPonCableRunMode = 'single' | 'continuous'
export type DualPonRecordKind = 'network' | 'power' | 'cable'
export type DualPonDeviceLanguage = 'zh-CN' | 'en' | 'vi' | 'pt' | 'es'

export interface DualPonRecord {
  id: string
  kind: DualPonRecordKind
  createdAt: string
  title: string
  result: 'pass' | 'fail' | 'saved'
  summary: string
  values: Array<{ label: string; value: string }>
}

interface DualPonPersistedState {
  version: 1
  bluetoothEnabled: boolean
  flashlightOn: boolean
  buzzerEnabled: boolean
  brightness: number
  autoShutdownMinutes: 0 | 5 | 15 | 30 | 60
  deviceLanguage: DualPonDeviceLanguage
  vflMode: DualPonVflMode
  vflColor: 'red' | 'green'
  powerMode: DualPonPowerMode
  powerUnit: DualPonPowerUnit
  selectedOpmWavelength: DualPonOpmWavelength
  referenceDbm: number
  calibrationOffsets: Record<string, number>
  thresholds: Record<DualPonWavelength, { reference: number; alarm: number; low: number }>
  selectedTracePort: number
  cableStandard: 'T568A' | 'T568B'
  cableUnit: DualPonCableUnit
  cableCategory: DualPonCableCategory
  cableCalibrationMeters: number
  cableRunMode: DualPonCableRunMode
  deviceDate: string
  deviceTime: string
  records: DualPonRecord[]
}

const defaultThresholds = (): DualPonPersistedState['thresholds'] => ({
  1310: { reference: -35, alarm: -15, low: -28 },
  1490: { reference: -40, alarm: -15, low: -28 },
  1550: { reference: -40, alarm: -15, low: -28 }
})

const localDate = () => new Date().toISOString().slice(0, 10)
const localTime = () => new Date().toTimeString().slice(0, 5)

const createDefaultState = (): DualPonPersistedState => ({
  version: 1,
  bluetoothEnabled: true,
  flashlightOn: false,
  buzzerEnabled: true,
  brightness: 80,
  autoShutdownMinutes: 60,
  deviceLanguage: 'zh-CN',
  vflMode: 'off',
  vflColor: 'red',
  powerMode: 'pon',
  powerUnit: 'dBm',
  selectedOpmWavelength: 1310,
  referenceDbm: 0,
  calibrationOffsets: {},
  thresholds: defaultThresholds(),
  selectedTracePort: 1,
  cableStandard: 'T568B',
  cableUnit: 'm',
  cableCategory: 'cat5e',
  cableCalibrationMeters: 0,
  cableRunMode: 'single',
  deviceDate: localDate(),
  deviceTime: localTime(),
  records: []
})

const BASE_OPM: Record<DualPonOpmWavelength, number> = {
  850: -22.64, 980: -21.82, 1270: -20.24, 1300: -19.71, 1310: -18.64,
  1490: -17.92, 1550: -19.18, 1577: -18.36, 1625: -22.08, 1650: -23.16
}
const storageKey = (deviceId: string) => `dual-pon-meter:v1:${deviceId}`
const controllers = new Map<string, ReturnType<typeof createController>>()
const clamp = (value: number, min: number, max: number, digits = 2) => Number(Math.min(max, Math.max(min, value)).toFixed(digits))
const nowLabel = () => new Date().toLocaleString('zh-CN', { hour12: false })

const readState = (deviceId: string): DualPonPersistedState => {
  const base = createDefaultState()
  try {
    const raw = localStorage.getItem(storageKey(deviceId))
    if (!raw) return base
    const value = JSON.parse(raw) as Partial<DualPonPersistedState>
    return {
      ...base,
      bluetoothEnabled: value.bluetoothEnabled !== false,
      flashlightOn: false,
      buzzerEnabled: value.buzzerEnabled !== false,
      brightness: clamp(Number(value.brightness ?? 80), 20, 100, 0),
      autoShutdownMinutes: [0, 5, 15, 30, 60].includes(Number(value.autoShutdownMinutes)) ? Number(value.autoShutdownMinutes) as DualPonPersistedState['autoShutdownMinutes'] : 60,
      deviceLanguage: ['zh-CN', 'en', 'vi', 'pt', 'es'].includes(String(value.deviceLanguage)) ? value.deviceLanguage as DualPonDeviceLanguage : 'zh-CN',
      vflMode: ['off', 'cw', '1hz', '2hz'].includes(String(value.vflMode)) ? value.vflMode as DualPonVflMode : 'off',
      vflColor: value.vflColor === 'green' ? 'green' : 'red',
      powerMode: value.powerMode === 'opm' ? 'opm' : 'pon',
      powerUnit: ['dBm', 'mW', 'uW'].includes(String(value.powerUnit)) ? value.powerUnit as DualPonPowerUnit : 'dBm',
      selectedOpmWavelength: DUAL_PON_OPM_WAVELENGTHS.includes(Number(value.selectedOpmWavelength) as DualPonOpmWavelength) ? Number(value.selectedOpmWavelength) as DualPonOpmWavelength : 1310,
      referenceDbm: clamp(Number(value.referenceDbm ?? 0), -80, 30),
      calibrationOffsets: value.calibrationOffsets && typeof value.calibrationOffsets === 'object' ? value.calibrationOffsets : {},
      thresholds: DUAL_PON_WAVELENGTHS.reduce((result, wavelength) => {
        const saved = value.thresholds?.[wavelength]
        result[wavelength] = {
          reference: clamp(Number(saved?.reference ?? base.thresholds[wavelength].reference), -80, 30),
          alarm: clamp(Number(saved?.alarm ?? base.thresholds[wavelength].alarm), -80, 30),
          low: clamp(Number(saved?.low ?? base.thresholds[wavelength].low), -80, 30)
        }
        return result
      }, {} as DualPonPersistedState['thresholds']),
      selectedTracePort: clamp(Number(value.selectedTracePort ?? 1), 1, 8, 0),
      cableStandard: value.cableStandard === 'T568A' ? 'T568A' : 'T568B',
      cableUnit: value.cableUnit === 'ft' ? 'ft' : 'm',
      cableCategory: value.cableCategory === 'cat6' ? 'cat6' : 'cat5e',
      cableCalibrationMeters: clamp(Number(value.cableCalibrationMeters ?? 0), -5, 5, 1),
      cableRunMode: value.cableRunMode === 'continuous' ? 'continuous' : 'single',
      deviceDate: /^\d{4}-\d{2}-\d{2}$/.test(String(value.deviceDate || '')) ? String(value.deviceDate) : base.deviceDate,
      deviceTime: /^\d{2}:\d{2}$/.test(String(value.deviceTime || '')) ? String(value.deviceTime) : base.deviceTime,
      records: Array.isArray(value.records) ? value.records.filter(item => item && typeof item.id === 'string').slice(0, 100) : []
    }
  } catch {
    return base
  }
}

function createController(deviceId: string) {
  const persisted = reactive<DualPonPersistedState>(readState(deviceId))
  const capabilities = reactive({
    powerRange: 'standard' as DualPonPowerRange,
    supportedVflColors: ['red', 'green'] as Array<'red' | 'green'>
  })
  const runtime = reactive({
    linkStatus: 'idle' as DualPonRunStatus,
    linkCase: 'online' as DualPonLinkCase,
    linkReadings: { 1310: -18.46, 1490: -17.82, 1550: -19.12 } as Record<DualPonWavelength, number>,
    powerStatus: 'idle' as 'idle' | 'running' | 'error' | 'disconnected',
    ponReadings: { 1310: -18.46, 1490: -17.82, 1550: -19.12 } as Record<DualPonWavelength, number>,
    opmDbm: -18.64,
    frequencyHz: 270,
    tick: 0,
    cableStatus: 'idle' as DualPonRunStatus,
    cableMode: 'length' as DualPonCableMode,
    cableContinuous: false,
    cableLengths: [19.8, 19.9, 20.0, 19.8, 20.1, 20.0, 19.9, 20.0],
    wiremap: ['pass', 'open', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass'] as Array<'pass' | 'open' | 'short'>,
    upgradeStatus: 'idle' as 'idle' | 'checking' | 'ready' | 'upgrading' | 'completed' | 'error',
    upgradeProgress: 0
  })
  let linkTimer: number | undefined
  let powerTimer: number | undefined
  let cableTimer: number | undefined
  let cableLoopTimer: number | undefined
  let upgradeTimer: number | undefined

  watch(persisted, value => {
    try { localStorage.setItem(storageKey(deviceId), JSON.stringify(value)) } catch { return }
  }, { deep: true })

  const stopLink = () => {
    if (linkTimer) window.clearTimeout(linkTimer)
    linkTimer = undefined
    if (runtime.linkStatus === 'running') runtime.linkStatus = persisted.bluetoothEnabled ? 'idle' : 'disconnected'
  }

  const linkValuesFor = (result: DualPonLinkCase) => {
    if (result === 'online') return { 1310: -18.46, 1490: -17.82, 1550: -19.12 }
    if (result === 'terminal_fault') return { 1310: -17.42, 1490: -70, 1550: -70 }
    if (result === 'high_loss') return { 1310: -29.68, 1490: -18.04, 1550: -19.33 }
    if (result === 'unpowered') return { 1310: -70, 1490: -18.12, 1550: -19.26 }
    if (result === 'missing_terminal') return { 1310: -70, 1490: -17.96, 1550: -19.08 }
    return { 1310: -70, 1490: -70, 1550: -70 }
  }

  const startLinkTest = (result: DualPonLinkCase = runtime.linkCase) => {
    if (!persisted.bluetoothEnabled) { runtime.linkStatus = 'disconnected'; return false }
    stopLink()
    runtime.linkStatus = 'running'
    runtime.linkCase = result
    linkTimer = window.setTimeout(() => {
      runtime.linkReadings = linkValuesFor(result)
      runtime.linkStatus = result === 'online' ? 'pass' : 'fail'
      linkTimer = undefined
    }, 1500)
    return true
  }

  const addRecord = (record: Omit<DualPonRecord, 'id' | 'createdAt'>) => {
    persisted.records.unshift({ ...record, id: `${Date.now()}-${persisted.records.length + 1}`, createdAt: nowLabel() })
    persisted.records = persisted.records.slice(0, 100)
  }

  const saveLinkRecord = () => {
    addRecord({
      kind: 'network',
      title: 'PON 网络状态测试',
      result: runtime.linkStatus === 'pass' ? 'pass' : 'fail',
      summary: runtime.linkCase,
      values: DUAL_PON_WAVELENGTHS.map(wavelength => ({ label: `${wavelength}nm`, value: `${runtime.linkReadings[wavelength].toFixed(2)} dBm` }))
    })
  }

  const configureCapabilities = (options: { powerRange?: DualPonPowerRange; supportedVflColors?: Array<'red' | 'green'> }) => {
    capabilities.powerRange = options.powerRange === 'high' ? 'high' : 'standard'
    capabilities.supportedVflColors = options.supportedVflColors?.length ? [...options.supportedVflColors] : ['red']
    if (!capabilities.supportedVflColors.includes(persisted.vflColor)) persisted.vflColor = capabilities.supportedVflColors[0]
  }

  const powerBounds = () => capabilities.powerRange === 'high' ? { min: -50, max: 26 } : { min: -70, max: 10 }

  const getPonChannelStatus = (wavelength: DualPonWavelength) => {
    const reading = runtime.ponReadings[wavelength]
    const threshold = persisted.thresholds[wavelength]
    if (reading <= powerBounds().min + 0.5) return 'fall' as const
    if (reading < threshold.low) return 'low' as const
    if (reading > threshold.alarm) return 'high' as const
    return 'pass' as const
  }

  const refreshPower = () => {
    runtime.tick += 1
    const swing = Math.sin(runtime.tick / 3) * .04
    const bounds = powerBounds()
    runtime.ponReadings = { 1310: clamp(-18.46 + swing, bounds.min, bounds.max), 1490: clamp(-17.82 - swing, bounds.min, bounds.max), 1550: clamp(-19.12 + swing / 2, bounds.min, bounds.max) }
    const calibration = Number(persisted.calibrationOffsets[String(persisted.selectedOpmWavelength)] || 0)
    runtime.opmDbm = clamp(BASE_OPM[persisted.selectedOpmWavelength] + calibration + swing, bounds.min, bounds.max)
    runtime.frequencyHz = [270, 330, 1000, 2000][Math.floor(runtime.tick / 7) % 4]
  }

  const startPower = () => {
    if (!persisted.bluetoothEnabled) { runtime.powerStatus = 'disconnected'; return false }
    if (powerTimer) window.clearInterval(powerTimer)
    runtime.powerStatus = 'running'
    refreshPower()
    powerTimer = window.setInterval(refreshPower, 700)
    return true
  }

  const stopPower = () => {
    if (powerTimer) window.clearInterval(powerTimer)
    powerTimer = undefined
    runtime.powerStatus = persisted.bluetoothEnabled ? 'idle' : 'disconnected'
  }

  const convertPower = (dbm: number, unit = persisted.powerUnit) => {
    if (unit === 'dBm') return { value: dbm.toFixed(2), unit }
    const mw = 10 ** (dbm / 10)
    if (unit === 'mW') return { value: mw < .01 ? mw.toFixed(5) : mw.toFixed(3), unit }
    return { value: (mw * 1000).toFixed(3), unit }
  }

  const savePowerRecord = () => {
    const isPon = persisted.powerMode === 'pon'
    addRecord({
      kind: 'power', title: isPon ? 'PON 三波长功率' : '普通光功率', result: 'saved',
      summary: isPon ? '1310 / 1490 / 1550nm' : `${persisted.selectedOpmWavelength}nm · ${persisted.powerUnit}`,
      values: isPon
        ? DUAL_PON_WAVELENGTHS.map(wavelength => ({ label: `${wavelength}nm`, value: `${runtime.ponReadings[wavelength].toFixed(2)} dBm` }))
        : [{ label: `${persisted.selectedOpmWavelength}nm`, value: `${convertPower(runtime.opmDbm).value} ${persisted.powerUnit}` }, { label: '频率', value: `${runtime.frequencyHz >= 1000 ? `${runtime.frequencyHz / 1000}k` : runtime.frequencyHz}Hz` }]
    })
  }

  const setReference = () => { persisted.referenceDbm = runtime.opmDbm }
  const clearReference = () => { persisted.referenceDbm = 0 }
  const setCalibration = (wavelength: DualPonOpmWavelength, offset: number) => {
    persisted.calibrationOffsets[String(wavelength)] = clamp(offset, -5, 5)
    refreshPower()
  }

  const stopCable = () => {
    if (cableTimer) window.clearTimeout(cableTimer)
    if (cableLoopTimer) window.clearInterval(cableLoopTimer)
    cableTimer = undefined
    cableLoopTimer = undefined
    runtime.cableContinuous = false
    if (runtime.cableStatus === 'running') runtime.cableStatus = persisted.bluetoothEnabled ? 'idle' : 'disconnected'
  }

  const completeCableTest = (mode: DualPonCableMode) => {
    runtime.cableStatus = mode === 'wiremap' && runtime.wiremap.includes('open') ? 'fail' : 'pass'
  }

  const startCableTest = (mode: DualPonCableMode, runMode = persisted.cableRunMode) => {
    if (!persisted.bluetoothEnabled) { runtime.cableStatus = 'disconnected'; return false }
    stopCable()
    runtime.cableMode = mode
    persisted.cableRunMode = runMode
    runtime.cableContinuous = runMode === 'continuous'
    runtime.cableStatus = 'running'
    cableTimer = window.setTimeout(() => {
      completeCableTest(mode)
      cableTimer = undefined
    }, 1300)
    if (runMode === 'continuous') {
      cableLoopTimer = window.setInterval(() => {
        runtime.cableStatus = 'running'
        cableTimer = window.setTimeout(() => { completeCableTest(mode); cableTimer = undefined }, 700)
      }, 2400)
    }
    return true
  }

  const calibratedCableLength = (value: number) => {
    const meters = Math.max(0, value + persisted.cableCalibrationMeters)
    return persisted.cableUnit === 'ft' ? meters * 3.28084 : meters
  }

  const saveCableRecord = () => {
    addRecord({
      kind: 'cable', title: runtime.cableMode === 'length' ? 'RJ45 线长测试' : runtime.cableMode === 'wiremap' ? 'RJ45 线序测试' : 'RJ45 寻线',
      result: runtime.cableStatus === 'fail' ? 'fail' : 'pass', summary: runtime.cableMode,
      values: runtime.cableMode === 'length'
        ? runtime.cableLengths.map((value, index) => ({ label: `Port ${index + 1}`, value: `${calibratedCableLength(value).toFixed(1)} ${persisted.cableUnit}` }))
        : [{ label: '标准', value: persisted.cableStandard }, { label: '模式', value: persisted.cableRunMode }, { label: '端口', value: String(persisted.selectedTracePort) }]
    })
  }

  const removeRecord = (id: string) => { persisted.records = persisted.records.filter(record => record.id !== id) }
  const clearRecords = () => { persisted.records = [] }

  const setVfl = (mode: DualPonVflMode, color = persisted.vflColor) => {
    if (!persisted.bluetoothEnabled && mode !== 'off') return false
    persisted.vflColor = capabilities.supportedVflColors.includes(color) ? color : capabilities.supportedVflColors[0]
    persisted.vflMode = mode
    return true
  }

  const stopUpgrade = () => {
    if (upgradeTimer) window.clearInterval(upgradeTimer)
    upgradeTimer = undefined
  }
  const checkUpdate = () => {
    if (!persisted.bluetoothEnabled) { runtime.upgradeStatus = 'error'; return false }
    runtime.upgradeStatus = 'checking'
    window.setTimeout(() => { runtime.upgradeStatus = 'ready' }, 850)
    return true
  }
  const startUpgrade = () => {
    if (!persisted.bluetoothEnabled || runtime.upgradeStatus !== 'ready') return false
    stopUpgrade(); runtime.upgradeStatus = 'upgrading'; runtime.upgradeProgress = 0
    upgradeTimer = window.setInterval(() => {
      runtime.upgradeProgress = Math.min(100, runtime.upgradeProgress + 8)
      if (runtime.upgradeProgress >= 100) { stopUpgrade(); runtime.upgradeStatus = 'completed' }
    }, 220)
    return true
  }

  const setBluetooth = (enabled: boolean) => {
    persisted.bluetoothEnabled = enabled
    if (!enabled) {
      stopLink(); stopPower(); stopCable(); stopUpgrade()
      persisted.vflMode = 'off'; persisted.flashlightOn = false
      runtime.linkStatus = runtime.powerStatus = runtime.cableStatus = 'disconnected'
    } else {
      runtime.linkStatus = runtime.powerStatus = runtime.cableStatus = 'idle'
    }
  }
  const reconnectBluetooth = async () => {
    await new Promise(resolve => window.setTimeout(resolve, 700))
    setBluetooth(true)
  }
  const resetFactory = () => {
    stopLink(); stopPower(); stopCable(); stopUpgrade()
    const localRecords = [...persisted.records]
    Object.assign(persisted, createDefaultState(), { records: localRecords })
    Object.assign(runtime, { linkStatus: 'idle', powerStatus: 'idle', cableStatus: 'idle', upgradeStatus: 'idle', upgradeProgress: 0 })
  }
  const disposeOutputs = () => { stopPower(); persisted.vflMode = 'off' }

  return { capabilities, persisted, runtime, configureCapabilities, powerBounds, getPonChannelStatus, startLinkTest, stopLink, saveLinkRecord, startPower, stopPower, convertPower, savePowerRecord, setReference, clearReference, setCalibration, startCableTest, stopCable, calibratedCableLength, saveCableRecord, removeRecord, clearRecords, setVfl, checkUpdate, startUpgrade, setBluetooth, reconnectBluetooth, resetFactory, disposeOutputs }
}

export const useDualPonState = (deviceId: string) => {
  if (!controllers.has(deviceId)) controllers.set(deviceId, createController(deviceId))
  return controllers.get(deviceId)!
}
