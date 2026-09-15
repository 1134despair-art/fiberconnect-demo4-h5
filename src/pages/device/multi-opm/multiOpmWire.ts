export type CableStandard = 'T568A' | 'T568B'
export type WireStatus = 'idle' | 'testing' | 'ok' | 'fail'

export const wireColors: Record<CableStandard, string[]> = {
  T568A: ['#d1fae5', '#16a34a', '#ffedd5', '#f97316', '#dbeafe', '#2563eb', '#f3e8ff', '#7e22ce'],
  T568B: ['#ffedd5', '#f97316', '#d1fae5', '#16a34a', '#dbeafe', '#2563eb', '#f3e8ff', '#7e22ce']
}
