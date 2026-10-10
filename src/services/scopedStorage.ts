// Stable account identity: independent from the currently selected device or edited display name.
export const accountScope = () => {
 try { const u = JSON.parse(localStorage.getItem('auth_user') || '{}'); return encodeURIComponent((String(u.id || '').startsWith('registered_') ? u.id : u.phone || u.email?.toLowerCase() || u.id) || 'guest') }
 catch { return 'guest' }
}
export const scopedKey = (area: string, deviceId?: string) => `app:v2:${accountScope()}:${area}${deviceId ? ':' + encodeURIComponent(deviceId) : ''}`
export const readStored = <T>(key: string, fallback: T): T => {
 try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}
