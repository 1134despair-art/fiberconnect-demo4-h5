import { reactive, watch } from 'vue'

export type PortableOtdrVflMode = 'off' | 'steady' | '1hz' | '2hz'

interface PortableOtdrState {
  flashlightOn: boolean
  vflMode: PortableOtdrVflMode
  bluetoothEnabled: boolean
  autoShutdown: string
  language: string
}

const states = new Map<string, PortableOtdrState>()
const defaults = (): PortableOtdrState => ({
  flashlightOn: false,
  vflMode: 'off',
  bluetoothEnabled: true,
  autoShutdown: '5分钟',
  language: '简体中文'
})

export const usePortableOtdrState = (deviceId: string) => {
  const existing = states.get(deviceId)
  if (existing) return existing

  const key = `portable-otdr-state:v1:${deviceId}`
  let initial = defaults()
  try { initial = { ...initial, ...JSON.parse(localStorage.getItem(key) || '{}') } } catch { /* use defaults */ }

  const state = reactive(initial) as PortableOtdrState
  watch(state, value => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage is optional */ }
  }, { deep: true })
  states.set(deviceId, state)
  return state
}

