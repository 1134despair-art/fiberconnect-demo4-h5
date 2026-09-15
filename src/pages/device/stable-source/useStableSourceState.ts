import { reactive, watch } from 'vue'
import type { Device, StableSourceRange } from '@/composables/useAuth'

export const STABLE_SOURCE_WAVELENGTHS = [1310, 1550] as const
export const STABLE_SOURCE_OUTPUT_MODES = ['cw', '270hz', '1khz', '2khz'] as const

export type StableSourceWavelength = (typeof STABLE_SOURCE_WAVELENGTHS)[number]
export type StableSourceOutputMode = (typeof STABLE_SOURCE_OUTPUT_MODES)[number]
export type StableSourceOutputStatus = 'idle' | 'starting' | 'emitting' | 'stopping' | 'disconnected' | 'error'
export type StableSourceVflMode = 'off' | 'steady' | 'cw' | '1hz' | '2hz'
export type StableSourceVflColor = 'red' | 'green'
export type StableSourceDeviceLanguage = 'zh-CN' | 'en'
export type StableSourceAutoShutdown = number

export interface StableSourceCapabilities {
  wavelengths: StableSourceWavelength[]
  outputModes: StableSourceOutputMode[]
  powerRange: StableSourceRange
  calibrationRange: StableSourceRange
  gainRange: StableSourceRange
  autoShutdownOptions: StableSourceAutoShutdown[]
  languages: StableSourceDeviceLanguage[]
  vflColors: StableSourceVflColor[]
}

const DEFAULT_CAPABILITIES: StableSourceCapabilities = {
  wavelengths: [...STABLE_SOURCE_WAVELENGTHS],
  outputModes: [...STABLE_SOURCE_OUTPUT_MODES],
  powerRange: { min: -4, max: 10, step: 0.1 },
  calibrationRange: { min: -3, max: 3, step: 0.1 },
  gainRange: { min: 80, max: 120, step: 1 },
  autoShutdownOptions: [0, 1, 5, 10, 30, 60],
  languages: ['zh-CN', 'en'],
  vflColors: ['red']
}

const validRange = (range: StableSourceRange | undefined, fallback: StableSourceRange) => {
  if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max) || !Number.isFinite(range.step) || range.max <= range.min || range.step <= 0) {
    return { ...fallback }
  }
  return { min: range.min, max: range.max, step: range.step }
}

export const resolveStableSourceCapabilities = (device?: Device | null): StableSourceCapabilities => {
  const shutdownOptions = device?.stableSourceAutoShutdownOptions?.length
    ? [...new Set(device.stableSourceAutoShutdownOptions.filter(value => Number.isFinite(value) && value >= 0))].sort((a, b) => a - b)
    : []

  return {
    wavelengths: device?.stableSourceWavelengths?.length ? [...device.stableSourceWavelengths] : [...DEFAULT_CAPABILITIES.wavelengths],
    outputModes: device?.stableSourceFrequencies?.length ? [...device.stableSourceFrequencies] : [...DEFAULT_CAPABILITIES.outputModes],
    powerRange: validRange(device?.stableSourcePowerRange, DEFAULT_CAPABILITIES.powerRange),
    calibrationRange: validRange(device?.stableSourceCalibrationRange, DEFAULT_CAPABILITIES.calibrationRange),
    gainRange: validRange(device?.stableSourceGainRange, DEFAULT_CAPABILITIES.gainRange),
    autoShutdownOptions: shutdownOptions.length ? shutdownOptions : [...DEFAULT_CAPABILITIES.autoShutdownOptions],
    languages: device?.stableSourceLanguages?.length ? [...device.stableSourceLanguages] : [...DEFAULT_CAPABILITIES.languages],
    vflColors: device?.supportedVflColors?.length ? [...device.supportedVflColors] : [...DEFAULT_CAPABILITIES.vflColors]
  }
}

interface StableSourcePersistedState {
  version: 1
  selectedWavelength: StableSourceWavelength
  outputPowerDbm: number
  outputMode: StableSourceOutputMode
  calibrationOffsets: Record<StableSourceWavelength, number>
  gainPercent: number
  vflMode: StableSourceVflMode
  vflColor: StableSourceVflColor
  flashlightOn: boolean
  bluetoothEnabled: boolean
  deviceLanguage: StableSourceDeviceLanguage
  autoShutdownMinutes: StableSourceAutoShutdown
}

const DEFAULT_STATE: StableSourcePersistedState = {
  version: 1,
  selectedWavelength: 1550,
  outputPowerDbm: 1,
  outputMode: 'cw',
  calibrationOffsets: { 1310: 0, 1550: 0 },
  gainPercent: 100,
  vflMode: 'off',
  vflColor: 'red',
  flashlightOn: false,
  bluetoothEnabled: true,
  deviceLanguage: 'zh-CN',
  autoShutdownMinutes: 5
}

const defaultStateFor = (capabilities: StableSourceCapabilities): StableSourcePersistedState => ({
  ...DEFAULT_STATE,
  selectedWavelength: capabilities.wavelengths[0],
  outputMode: capabilities.outputModes[0],
  outputPowerDbm: clampStep(1, capabilities.powerRange.min, capabilities.powerRange.max, capabilities.powerRange.step),
  calibrationOffsets: { 1310: 0, 1550: 0 },
  gainPercent: clampStep(100, capabilities.gainRange.min, capabilities.gainRange.max, capabilities.gainRange.step),
  vflColor: capabilities.vflColors[0],
  deviceLanguage: capabilities.languages[0],
  autoShutdownMinutes: capabilities.autoShutdownOptions.includes(5) ? 5 : capabilities.autoShutdownOptions[0]
})

const controllers = new Map<string, ReturnType<typeof createController>>()
const storageKey = (deviceId: string) => `stable-light-source:v1:${deviceId}`

const clampStep = (value: number, min: number, max: number, step: number) => {
  if (!Number.isFinite(value)) return 0
  const clamped = Math.min(max, Math.max(min, value))
  return Number((Math.round(clamped / step) * step).toFixed(1))
}

const readState = (deviceId: string, capabilities: StableSourceCapabilities): StableSourcePersistedState => {
  try {
    const raw = localStorage.getItem(storageKey(deviceId))
    if (!raw) return defaultStateFor(capabilities)
    const parsed = JSON.parse(raw) as Partial<StableSourcePersistedState>
    const wavelength = capabilities.wavelengths.includes(parsed.selectedWavelength as StableSourceWavelength)
      ? parsed.selectedWavelength as StableSourceWavelength
      : capabilities.wavelengths[0]
    const outputMode = capabilities.outputModes.includes(parsed.outputMode as StableSourceOutputMode)
      ? parsed.outputMode as StableSourceOutputMode
      : capabilities.outputModes[0]
    const autoShutdown = capabilities.autoShutdownOptions.includes(Number(parsed.autoShutdownMinutes))
      ? Number(parsed.autoShutdownMinutes) as StableSourceAutoShutdown
      : capabilities.autoShutdownOptions[0]

    return {
      version: 1,
      selectedWavelength: wavelength,
      outputPowerDbm: clampStep(Number(parsed.outputPowerDbm ?? 1), capabilities.powerRange.min, capabilities.powerRange.max, capabilities.powerRange.step),
      outputMode,
      calibrationOffsets: {
        1310: clampStep(Number(parsed.calibrationOffsets?.[1310] ?? 0), capabilities.calibrationRange.min, capabilities.calibrationRange.max, capabilities.calibrationRange.step),
        1550: clampStep(Number(parsed.calibrationOffsets?.[1550] ?? 0), capabilities.calibrationRange.min, capabilities.calibrationRange.max, capabilities.calibrationRange.step)
      },
      gainPercent: Number.isFinite(Number(parsed.gainPercent))
        ? clampStep(Number(parsed.gainPercent), capabilities.gainRange.min, capabilities.gainRange.max, capabilities.gainRange.step)
        : 100,
      vflMode: ['steady', 'cw', '1hz', '2hz'].includes(String(parsed.vflMode))
        ? parsed.vflMode as StableSourceVflMode
        : 'off',
      vflColor: capabilities.vflColors.includes(parsed.vflColor as StableSourceVflColor)
        ? parsed.vflColor as StableSourceVflColor
        : capabilities.vflColors[0],
      flashlightOn: false,
      bluetoothEnabled: parsed.bluetoothEnabled !== false,
      deviceLanguage: capabilities.languages.includes(parsed.deviceLanguage as StableSourceDeviceLanguage)
        ? parsed.deviceLanguage as StableSourceDeviceLanguage
        : capabilities.languages[0],
      autoShutdownMinutes: autoShutdown
    }
  } catch {
    return defaultStateFor(capabilities)
  }
}

function createController(deviceId: string, initialCapabilities: StableSourceCapabilities) {
  const capabilities = reactive<StableSourceCapabilities>(initialCapabilities)
  const persisted = reactive<StableSourcePersistedState>(readState(deviceId, capabilities))
  const runtime = reactive({
    outputStatus: 'idle' as StableSourceOutputStatus,
    errorMessage: ''
  })
  let operationSequence = 0

  watch(
    persisted,
    () => {
      try {
        localStorage.setItem(storageKey(deviceId), JSON.stringify(persisted))
      } catch {
        return
      }
    },
    { deep: true }
  )

  const stopOutput = async () => {
    const sequence = ++operationSequence
    if (runtime.outputStatus === 'emitting') {
      runtime.outputStatus = 'stopping'
      await new Promise(resolve => window.setTimeout(resolve, 260))
      if (sequence !== operationSequence) return
    }
    runtime.outputStatus = persisted.bluetoothEnabled ? 'idle' : 'disconnected'
  }

  const startOutput = async () => {
    if (!persisted.bluetoothEnabled) {
      runtime.outputStatus = 'disconnected'
      runtime.errorMessage = 'bluetooth_off'
      return false
    }
    const sequence = ++operationSequence
    runtime.outputStatus = 'starting'
    runtime.errorMessage = ''
    await new Promise(resolve => window.setTimeout(resolve, 520))
    if (sequence !== operationSequence || !persisted.bluetoothEnabled) return false
    runtime.outputStatus = 'emitting'
    return true
  }

  const selectWavelength = async (wavelength: StableSourceWavelength) => {
    if (!capabilities.wavelengths.includes(wavelength)) return
    if (persisted.selectedWavelength === wavelength) return
    if (runtime.outputStatus === 'emitting') await stopOutput()
    persisted.selectedWavelength = wavelength
  }

  const setOutputPower = (value: number) => {
    persisted.outputPowerDbm = clampStep(value, capabilities.powerRange.min, capabilities.powerRange.max, capabilities.powerRange.step)
  }

  const setOutputMode = (mode: StableSourceOutputMode) => {
    if (!capabilities.outputModes.includes(mode)) return
    persisted.outputMode = mode
  }

  const setCalibrationOffset = (wavelength: StableSourceWavelength, value: number) => {
    persisted.calibrationOffsets[wavelength] = clampStep(value, capabilities.calibrationRange.min, capabilities.calibrationRange.max, capabilities.calibrationRange.step)
  }

  const resetCalibration = (wavelength?: StableSourceWavelength) => {
    if (wavelength) persisted.calibrationOffsets[wavelength] = 0
    else persisted.calibrationOffsets = { 1310: 0, 1550: 0 }
  }

  const setGainPercent = (value: number) => {
    persisted.gainPercent = clampStep(value, capabilities.gainRange.min, capabilities.gainRange.max, capabilities.gainRange.step)
  }

  const setVflMode = (mode: StableSourceVflMode) => {
    if (!persisted.bluetoothEnabled && mode !== 'off') return false
    persisted.vflMode = mode
    return true
  }

  const setVflColor = (color: StableSourceVflColor) => {
    if (!capabilities.vflColors.includes(color)) return false
    if (persisted.vflMode !== 'off') persisted.vflMode = 'off'
    persisted.vflColor = color
    return true
  }

  const configure = (next: StableSourceCapabilities) => {
    capabilities.wavelengths = [...next.wavelengths]
    capabilities.outputModes = [...next.outputModes]
    capabilities.powerRange = { ...next.powerRange }
    capabilities.calibrationRange = { ...next.calibrationRange }
    capabilities.gainRange = { ...next.gainRange }
    capabilities.autoShutdownOptions = [...next.autoShutdownOptions]
    capabilities.languages = [...next.languages]
    capabilities.vflColors = [...next.vflColors]

    if (!capabilities.wavelengths.includes(persisted.selectedWavelength)) persisted.selectedWavelength = capabilities.wavelengths[0]
    if (!capabilities.outputModes.includes(persisted.outputMode)) persisted.outputMode = capabilities.outputModes[0]
    if (!capabilities.vflColors.includes(persisted.vflColor)) persisted.vflColor = capabilities.vflColors[0]
    if (!capabilities.languages.includes(persisted.deviceLanguage)) persisted.deviceLanguage = capabilities.languages[0]
    if (!capabilities.autoShutdownOptions.includes(persisted.autoShutdownMinutes)) persisted.autoShutdownMinutes = capabilities.autoShutdownOptions[0]
    setOutputPower(persisted.outputPowerDbm)
    setCalibrationOffset(1310, persisted.calibrationOffsets[1310])
    setCalibrationOffset(1550, persisted.calibrationOffsets[1550])
    setGainPercent(persisted.gainPercent)
  }

  const toggleFlashlight = () => {
    if (!persisted.bluetoothEnabled) return false
    persisted.flashlightOn = !persisted.flashlightOn
    return true
  }

  const disconnectBluetooth = async () => {
    persisted.bluetoothEnabled = false
    persisted.vflMode = 'off'
    persisted.flashlightOn = false
    await stopOutput()
  }

  const reconnectBluetooth = async () => {
    runtime.outputStatus = 'disconnected'
    await new Promise(resolve => window.setTimeout(resolve, 600))
    persisted.bluetoothEnabled = true
    runtime.outputStatus = 'idle'
    runtime.errorMessage = ''
  }

  return {
    capabilities,
    persisted,
    runtime,
    startOutput,
    stopOutput,
    selectWavelength,
    setOutputPower,
    setOutputMode,
    setCalibrationOffset,
    resetCalibration,
    setGainPercent,
    setVflMode,
    setVflColor,
    toggleFlashlight,
    disconnectBluetooth,
    reconnectBluetooth,
    configure
  }
}

export const useStableSourceState = (deviceId: string, capabilities: StableSourceCapabilities = DEFAULT_CAPABILITIES) => {
  const existing = controllers.get(deviceId)
  if (existing) {
    existing.configure(capabilities)
    return existing
  }
  const controller = createController(deviceId, capabilities)
  controllers.set(deviceId, controller)
  return controller
}

export const formatStableSourceMode = (mode: StableSourceOutputMode | StableSourceVflMode) => {
  if (mode === 'steady') return 'STEADY'
  if (mode === 'cw') return 'CW'
  if (mode === '270hz') return '270Hz'
  if (mode === '1khz') return '1kHz'
  if (mode === '2khz') return '2kHz'
  if (mode === '1hz') return '1Hz'
  if (mode === '2hz') return '2Hz'
  return 'OFF'
}
