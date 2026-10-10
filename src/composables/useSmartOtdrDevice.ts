import { computed, onMounted, onUnmounted, reactive, watch, type Ref } from 'vue'
import { useAuth, type Device } from './useAuth'
import { useSmartOtdrConnectionState } from './useSmartOtdrConnectionState'
import { authorizationExpired, getSmartOtdrAdapter, type ClockReceipt, type DeviceAuthorization, type DeviceLanguage } from '@/services/smartOtdr'

interface RuntimeState {
  authorizationChecked: boolean; authorizationLoading: boolean; authorizationError: string
  languages: DeviceLanguage[]; language: string; authorization: DeviceAuthorization | null
  clock: ClockReceipt | null; autoTime: boolean; syncing: boolean; error: string
}
const states = reactive<Record<string, RuntimeState>>({})
function stateFor(id: string): RuntimeState {
  if (!states[id]) {
    let autoTime = true
    try { autoTime = localStorage.getItem(`smart-otdr-auto-time:${id}`) !== 'false' } catch { /* default */ }
    states[id] = { authorizationChecked: false, authorizationLoading: false, authorizationError: '', languages: [], language: '', authorization: null, clock: null, autoTime, syncing: false, error: '' }
  }
  return states[id]
}
export function useSmartOtdrDevice(device: Ref<Device | null | undefined>) {
  const { updateDevice } = useAuth()
  const { connectionState } = useSmartOtdrConnectionState()
  const online = reactive({ value: navigator.onLine, now: Date.now() })
  const runtime = computed(() => stateFor(device.value?.id || 'unavailable'))
  const authorization = computed(() => runtime.value.authorization)
  const locked = computed(() => {
    const d = device.value; if (!d || d.deviceType !== 'smart_otdr') return false
    const a = authorization.value
    return a ? !a.activated || a.locked || authorizationExpired(a.expiresAt, online.now)
      : d.activationStatus !== 'activated' || authorizationExpired(d.authorizationExpiry, online.now)
  })
  const channel = computed(() => connectionState.bluetoothEnabled ? 'bluetooth' as const : connectionState.network4gEnabled ? '4g' as const : null)
  async function refreshAuthorization() {
    const d = device.value; if (!d || d.deviceType !== 'smart_otdr') return
    const s = stateFor(d.id)
    if (d.status !== 'connected') { s.authorizationChecked = false; return }
    if (s.authorizationLoading) return
    s.authorizationLoading = true; s.authorizationError = ''
    try {
      const result = await getSmartOtdrAdapter().getAuthorization(d)
      s.authorization = result; s.authorizationChecked = true
      const status = result.activated ? 'activated' : 'not_activated'
      if (d.activationStatus !== status || (d.authorizationExpiry || '') !== result.expiresAt)
        updateDevice(d.id, { activationStatus: status, authorizationExpiry: result.expiresAt })
    } catch (error) { s.authorizationError = error instanceof Error ? error.message : '授权状态读取失败'; s.authorizationChecked = false }
    finally { s.authorizationLoading = false }
  }
  async function syncTime(force = false) {
    const d = device.value; const s = runtime.value; const via = channel.value
    if (!d || d.deviceType !== 'smart_otdr' || !s.autoTime && !force || s.syncing) return
    if (!online.value || d.status !== 'connected' || !via) { s.error = '联网并连接设备后自动同步时间'; return }
    s.syncing = true; s.error = ''
    try {
      s.clock = await getSmartOtdrAdapter().syncClock(d, { time: new Date().toISOString(), timezoneOffsetMinutes: new Date().getTimezoneOffset(), channel: via })
    } catch (error) { s.error = error instanceof Error ? error.message : '同步失败，请重试' }
    finally { s.syncing = false }
  }
  async function refresh() {
    const d = device.value; if (!d || d.deviceType !== 'smart_otdr') return
    const s = stateFor(d.id)
    try {
      const capabilities = await getSmartOtdrAdapter().getCapabilities(d)
      s.languages = capabilities.languages; s.language = capabilities.language
    } catch (error) { s.error = error instanceof Error ? error.message : '设备信息读取失败' }
    // Authorization is independent of optional capability discovery.
    await refreshAuthorization(); await syncTime()
  }
  async function setLanguage(code: string) {
    const d = device.value; if (!d) throw new Error('设备不存在')
    const s = stateFor(d.id)
    await getSmartOtdrAdapter().setLanguage(d, code); s.language = code
  }
  function setAutoTime(value: boolean) {
    localStorage.setItem(`smart-otdr-auto-time:${device.value?.id}`, String(value))
    runtime.value.autoTime = value
    if (value) void syncTime()
  }
  const updateOnline = () => { online.value = navigator.onLine; if (online.value) void refresh() }
  const updateAuthorization = () => void refreshAuthorization()
  let timer: number | undefined
  onMounted(() => {
    window.addEventListener('online', updateOnline); window.addEventListener('offline', updateOnline)
    window.addEventListener('storage', updateAuthorization)
    window.addEventListener('smart-otdr-authorization-updated', updateAuthorization)
    timer = window.setInterval(() => { online.now = Date.now(); void refreshAuthorization() }, 15000)
  })
  onUnmounted(() => {
    window.removeEventListener('online', updateOnline); window.removeEventListener('offline', updateOnline)
    window.removeEventListener('storage', updateAuthorization)
    window.removeEventListener('smart-otdr-authorization-updated', updateAuthorization)
    window.clearInterval(timer)
  })
  watch(() => [device.value?.id, device.value?.status, channel.value], () => void refresh(), { immediate: true })
  return { runtime, authorization, locked, refreshAuthorization, syncTime, setAutoTime, setLanguage }
}
