// Foreground SVG colors are recorded in assets/icons/iconfont/settings-ui/SOURCES.md.
// Decorative grouping only: labels and state badges still communicate the meaning.
const backgrounds: Record<string, string> = {
  account: '#eff6ff',
  info: '#eff6ff',
  upload: '#eff6ff',
  settings: '#eff6ff',
  agreement: '#eff6ff',
  bluetooth: '#eaf7f3',
  cellular: '#eaf7f3',
  phone: '#eaf7f3',
  support: '#eaf7f3',
  privacy: '#eaf7f3',
  translate: '#f2edfa',
  calibration: '#f2edfa',
  timer: '#fcf3e5',
  calendar: '#fcf3e5',
  brightness: '#fcf3e5',
  buzzer: '#fcf3e5',
  book: '#fcf3e5',
  logout: '#fff0f0',
  restore: '#fff0f0',
}

export const settingsIconBackground = (name?: string): string | undefined =>
  name ? backgrounds[name] : undefined
