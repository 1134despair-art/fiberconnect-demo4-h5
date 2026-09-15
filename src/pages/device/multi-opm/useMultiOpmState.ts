import { reactive, ref, watch } from 'vue'

export type MultiOpmUnit = 'dBm' | 'mW' | 'uW' | 'nW'
export type MultiOpmVflMode = 'off' | 'steady' | 'blink'

export interface MultiOpmRecord {
  id: number
  wavelength: number
  frequency: number
  result: number
  unit: MultiOpmUnit
  timestamp: string
}

const states = new Map<string, ReturnType<typeof createState>>()

const createState = (deviceId: string) => {
  const storageKey = `multi-opm-ui-state:v1:${deviceId}`
  const defaults = {
    isEnabled: true,
    wavelength: 1310,
    frequency: 270,
    unit: 'dBm' as MultiOpmUnit,
    referenceDbm: 0,
    flashlightOn: false,
    bluetoothEnabled: true,
    autoShutdown: '5分钟',
    language: '简体中文',
    networkEnabled: true,
    serverIp: '192.168.1.100',
    serverPort: 9000,
    vflMode: 'off' as MultiOpmVflMode
  }

  let stored: Partial<typeof defaults> = {}
  try { stored = JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { stored = {} }
  const persisted = reactive({ ...defaults, ...stored })
  watch(persisted, value => localStorage.setItem(storageKey, JSON.stringify(value)), { deep: true })

  const recordKey = `multi-opm-records:v1:${deviceId}`
  const seedRecords: MultiOpmRecord[] = [
    { id: 1, wavelength: 1310, frequency: 270, result: -18.86, unit: 'dBm', timestamp: '2026-09-03 10:15' },
    { id: 2, wavelength: 1550, frequency: 1000, result: -22.41, unit: 'dBm', timestamp: '2026-09-02 16:42' },
    { id: 3, wavelength: 850, frequency: 0, result: -12.68, unit: 'dBm', timestamp: '2026-09-01 09:30' }
  ]
  let initialRecords = seedRecords
  try {
    const parsed = JSON.parse(localStorage.getItem(recordKey) || 'null')
    if (Array.isArray(parsed)) initialRecords = parsed
  } catch { initialRecords = seedRecords }
  const records = ref<MultiOpmRecord[]>(initialRecords)
  const persistRecords = () => localStorage.setItem(recordKey, JSON.stringify(records.value))
  const saveRecord = (result: number) => {
    records.value.unshift({
      id: Date.now(),
      wavelength: persisted.wavelength,
      frequency: persisted.frequency,
      result,
      unit: persisted.unit,
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false })
    })
    persistRecords()
  }

  return { persisted, records, saveRecord }
}

export const useMultiOpmState = (deviceId: string) => {
  if (!states.has(deviceId)) states.set(deviceId, createState(deviceId))
  return states.get(deviceId)!
}

export const multiOpmDbmToMw = (dbm: number) => Math.pow(10, dbm / 10)

export const formatMultiOpmFrequency = (frequency: number) => {
  if (!frequency) return '关闭'
  if (frequency === 1000) return '1kHz'
  if (frequency === 2000) return '2kHz'
  return `${frequency}Hz`
}

export const formatMultiOpmReading = (dbm: number, unit: MultiOpmUnit) => {
  const mw = multiOpmDbmToMw(dbm)
  if (unit === 'mW') return mw.toFixed(5)
  if (unit === 'uW') return (mw * 1000).toFixed(3)
  if (unit === 'nW') return (mw * 1_000_000).toFixed(1)
  return dbm.toFixed(2)
}
