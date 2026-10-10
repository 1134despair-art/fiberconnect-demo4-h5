import { scopedKey, readStored } from './scopedStorage'
import type { OtdrResultData, ParameterForm } from '@/pages/device/components/smartOtdrTypes'
export interface OtdrSnapshot { version: 1; selectedAt: number; id: string; deviceId: string; filename: string; parameters: ParameterForm; result: OtdrResultData }
export const isOtdrSnapshot = (value: unknown): value is OtdrSnapshot => {
 const item = value as OtdrSnapshot | null
 return !!item && item.version === 1 && !!item.parameters && Array.isArray(item.result?.events) && Array.isArray(item.result?.trace) && !!item.result?.summary
}
export const readOtdrResult = (deviceId: string) => {
 const value = readStored<unknown>(scopedKey('otdr-result', deviceId), null)
 return isOtdrSnapshot(value) && value.deviceId === deviceId ? value : null
}
export const storeOtdrResult = (snapshot: OtdrSnapshot) => localStorage.setItem(scopedKey('otdr-result', snapshot.deviceId), JSON.stringify(snapshot))
