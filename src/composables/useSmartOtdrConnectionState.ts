import { reactive, readonly } from 'vue'

const SMART_OTDR_CONNECTION_STATE_KEY = 'smart_otdr_connection_state'
const SMART_OTDR_SYSTEM_SETTINGS_KEY = 'smart-otdr-system-settings'

interface SmartOtdrConnectionState {
  bluetoothEnabled: boolean
  network4gEnabled: boolean
}

const createDefaultState = (): SmartOtdrConnectionState => ({
  bluetoothEnabled: true,
  network4gEnabled: true
})

const sanitizeState = (input?: Partial<SmartOtdrConnectionState>): SmartOtdrConnectionState => {
  const defaults = createDefaultState()
  const payload = input ?? {}

  return {
    bluetoothEnabled:
      typeof payload.bluetoothEnabled === 'boolean' ? payload.bluetoothEnabled : defaults.bluetoothEnabled,
    network4gEnabled:
      typeof payload.network4gEnabled === 'boolean' ? payload.network4gEnabled : defaults.network4gEnabled
  }
}

const state = reactive<SmartOtdrConnectionState>(createDefaultState())

const persistState = () => {
  localStorage.setItem(
    SMART_OTDR_CONNECTION_STATE_KEY,
    JSON.stringify({
      bluetoothEnabled: state.bluetoothEnabled,
      network4gEnabled: state.network4gEnabled
    })
  )
}

const restoreState = () => {
  try {
    const raw = localStorage.getItem(SMART_OTDR_CONNECTION_STATE_KEY)
    if (raw) {
      Object.assign(state, sanitizeState(JSON.parse(raw)))
      return
    }

    const legacyRaw = localStorage.getItem(SMART_OTDR_SYSTEM_SETTINGS_KEY)
    if (legacyRaw) {
      Object.assign(state, sanitizeState(JSON.parse(legacyRaw)))
      persistState()
      return
    }
  } catch {
    Object.assign(state, createDefaultState())
    persistState()
    return
  }

  Object.assign(state, createDefaultState())
  persistState()
}

restoreState()

const setBluetoothEnabled = (value: boolean) => {
  state.bluetoothEnabled = value
  persistState()
}

const setNetwork4gEnabled = (value: boolean) => {
  state.network4gEnabled = value
  persistState()
}

const toggleBluetooth = () => {
  setBluetoothEnabled(!state.bluetoothEnabled)
}

const toggleNetwork4g = () => {
  setNetwork4gEnabled(!state.network4gEnabled)
}

export function useSmartOtdrConnectionState() {
  return {
    connectionState: readonly(state),
    setBluetoothEnabled,
    setNetwork4gEnabled,
    toggleBluetooth,
    toggleNetwork4g,
    restoreSmartOtdrConnectionState: restoreState
  }
}
