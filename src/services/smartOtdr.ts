import type { Device } from '@/composables/useAuth'
import demoReportUrl from '@/assets/reports/smart-otdr-demo.pdf?url'

export interface DeviceLanguage { code: string; label: string }
export interface DeviceCapabilities { languages: DeviceLanguage[]; language: string }
export interface DeviceAuthorization { activated: boolean; activatedAt: string; expiresAt: string; locked: boolean }
export interface DeviceReport { id: string; name: string; createdAt: string; size?: number }
export type ConnectionChannel = 'bluetooth' | '4g'
export interface ClockReceipt { syncedAt: string; deviceTime: string; channel: ConnectionChannel }

/** Replace this boundary with the authenticated native/server implementation before device integration. */
export interface SmartOtdrAdapter {
  readonly mode: 'prototype' | 'device'
  connect(device: Device, channel: ConnectionChannel): Promise<{ connectedAt: string; channel: ConnectionChannel }>
  getCapabilities(device: Device): Promise<DeviceCapabilities>
  setLanguage(device: Device, code: string): Promise<void>
  syncClock(device: Device, input: { time: string; timezoneOffsetMinutes: number; channel: ConnectionChannel }): Promise<ClockReceipt>
  listReports(device: Device): Promise<DeviceReport[]>
  readReport(device: Device, reportId: string): Promise<Blob>
  getAuthorization(device: Device): Promise<DeviceAuthorization>
  activate(device: Device, code: string): Promise<DeviceAuthorization>
}

export function authorizationExpired(expiresAt?: string, now = Date.now()) {
  if (!expiresAt) return false
  // A date-only authorization remains valid through the end of that local calendar day.
  const value = expiresAt.replace(/\//g, '-')
  const timestamp = /^\d{4}-\d{1,2}-\d{1,2}$/.test(value)
    ? new Date(Number(value.split('-')[0]), Number(value.split('-')[1]) - 1, Number(value.split('-')[2]), 23, 59, 59, 999).getTime() : new Date(value).getTime()
  return !Number.isFinite(timestamp) || timestamp <= now
}
const languages: DeviceLanguage[] = [
  { code: 'zh-CN', label: '简体中文' }, { code: 'zh-TW', label: '繁體中文' }, { code: 'en', label: 'English' }
]
type PrototypeState = { language?: string; authorization?: DeviceAuthorization; clock?: ClockReceipt }
const storageKey = (id: string) => `smart-otdr-prototype:v1:${id}`
function readState(id: string): PrototypeState {
  try { return JSON.parse(localStorage.getItem(storageKey(id)) || '{}') } catch { return {} }
}
function writeState(id: string, patch: Partial<PrototypeState>) {
  localStorage.setItem(storageKey(id), JSON.stringify({ ...readState(id), ...patch }))
}
function connected(device: Device) {
  if (device.status !== 'connected') throw new Error('请先连接设备')
}
const prototypeAdapter: SmartOtdrAdapter = {
  mode: 'prototype',
  async connect(_device, channel) {
    await new Promise(resolve => setTimeout(resolve, 600))
    return { connectedAt: new Date().toISOString(), channel }
  },
  async getCapabilities(device) {
    return { languages, language: readState(device.id).language || 'zh-CN' }
  },
  async setLanguage(device, code) {
    connected(device)
    if (!languages.some(item => item.code === code)) throw new Error('设备不支持此语言')
    writeState(device.id, { language: code })
  },
  async syncClock(device, input) {
    connected(device)
    const receipt: ClockReceipt = { syncedAt: new Date().toISOString(), deviceTime: input.time, channel: input.channel }
    writeState(device.id, { clock: receipt }); return receipt
  },
  async listReports(device) {
    connected(device)
    return [{ id: 'prototype-pdf', name: '示例_OTDR_检测报告.pdf', createdAt: '2026-10-09' }]
  },
  async readReport(device, reportId) {
    connected(device)
    if (reportId !== 'prototype-pdf') throw new Error('报告不存在，请刷新文件列表')
    const response = await fetch(demoReportUrl)
    if (!response.ok) throw new Error('报告读取失败，请重试')
    return new Blob([await response.arrayBuffer()], { type: 'application/pdf' })
  },
  async getAuthorization(device) {
    const saved = readState(device.id).authorization
    const result = saved || { activated: device.activationStatus === 'activated', activatedAt: '', expiresAt: device.authorizationExpiry || '', locked: false }
    return { ...result, locked: result.locked || authorizationExpired(result.expiresAt) }
  },
  async activate(device, code) {
    connected(device)
    if (!/^SOTDR-ACT-[A-Z0-9]{8,32}$/i.test(code.trim())) throw new Error('激活码格式不正确，请核对后重试')
    const now = new Date(); const end = new Date(now); end.setFullYear(end.getFullYear() + 1)
    const authorization = { activated: true, activatedAt: now.toISOString(), expiresAt: end.toISOString(), locked: false }
    writeState(device.id, { authorization }); return authorization
  }
}
let adapter: SmartOtdrAdapter = prototypeAdapter
export const getSmartOtdrAdapter = () => adapter
export function installSmartOtdrAdapter(next: SmartOtdrAdapter) { adapter = next }

/** A separate administrator client must implement this contract, never the ordinary user page. */
export interface SmartOtdrAdminAdapter {
  grantAuthorization(input: { serialNumber: string; expiresAt: string; reason: string }): Promise<DeviceAuthorization>
}

/** Local review fixture for a backend-pushed authorization; unavailable in device mode. */
export function applyPrototypeAuthorization(deviceId: string, authorization: DeviceAuthorization) {
  if (adapter.mode !== 'prototype') throw new Error('仅支持原型授权演示')
  writeState(deviceId, { authorization })
  window.dispatchEvent(new CustomEvent('smart-otdr-authorization-updated', { detail: { deviceId } }))
}
