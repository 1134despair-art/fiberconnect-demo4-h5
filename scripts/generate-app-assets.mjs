import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer'

const ROOT = path.resolve(process.cwd(), 'src/assets/app')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const COLORS = {
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  channel: '#0891B2',
  reading: '#F59E0B',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  text: '#0F172A',
  secondary: '#475569',
  tertiary: '#64748B',
  disabled: '#94A3B8',
  border: '#D8E2EF',
  page: '#F4F7FB',
  surface: '#FFFFFF',
  instrument: '#0B1423',
  instrumentRaised: '#132238',
}

const p = (d) => `<path d="${d}"/>`
const line = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
const circle = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`
const rect = (x, y, width, height, rx = 0) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}"/>`

const ICONS = [
  // Registration and login
  ['auth', 'phone', p('M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 12.8a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.07 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.7a16 16 0 0 0 6.3 6.3l1.24-1.24a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z')],
  ['auth', 'lock', rect(5, 10, 14, 11, 2) + p('M8 10V7a4 4 0 0 1 8 0v3') + line(12, 14, 12, 17)],
  ['auth', 'verification-code', rect(3, 5, 18, 14, 2) + circle(8, 12, 1) + circle(12, 12, 1) + circle(16, 12, 1)],
  ['auth', 'eye', p('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z') + circle(12, 12, 3)],
  ['auth', 'eye-off', p('M3 3l18 18') + p('M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.1 3.2M6.1 6.1C3.5 8 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 3.2-.5') + p('M9.9 9.9a3 3 0 0 0 4.2 4.2')],
  ['auth', 'user-add', circle(9, 8, 4) + p('M3 21v-2a6 6 0 0 1 6-6h2') + line(19, 8, 19, 14) + line(16, 11, 22, 11)],
  ['auth', 'agreement-check', circle(12, 12, 9) + p('M8 12l2.5 2.5L16 9')],

  // Bottom navigation
  ['navigation', 'home-default', p('M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z'), 'secondary'],
  ['navigation', 'home-active', p('M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z'), 'primary'],
  ['navigation', 'product-default', p('M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z') + p('M3.3 7L12 12l8.7-5M12 22V12'), 'secondary'],
  ['navigation', 'product-active', p('M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z') + p('M3.3 7L12 12l8.7-5M12 22V12'), 'primary'],
  ['navigation', 'profile-default', circle(12, 8, 4) + p('M4 21a8 8 0 0 1 16 0'), 'secondary'],
  ['navigation', 'profile-active', circle(12, 8, 4) + p('M4 21a8 8 0 0 1 16 0'), 'primary'],

  // Shared navigation and actions
  ['common', 'back', p('M19 12H5m7-7-7 7 7 7')],
  ['common', 'close', line(5, 5, 19, 19) + line(19, 5, 5, 19)],
  ['common', 'chevron-right', p('M9 18l6-6-6-6')],
  ['common', 'more', circle(5, 12, 1) + circle(12, 12, 1) + circle(19, 12, 1)],
  ['common', 'search', circle(11, 11, 7) + line(16.5, 16.5, 21, 21)],
  ['common', 'add', line(12, 5, 12, 19) + line(5, 12, 19, 12)],
  ['common', 'refresh', p('M20 6v5h-5M4 18v-5h5') + p('M18.4 10A7 7 0 0 0 6.2 6.2L4 8M5.6 14A7 7 0 0 0 17.8 17.8L20 16')],
  ['common', 'check', p('M5 12l4 4L19 6')],
  ['common', 'download', p('M12 3v12m-5-5 5 5 5-5') + p('M5 21h14')],
  ['common', 'delete', p('M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7') + line(10, 11, 10, 17) + line(14, 11, 14, 17), 'danger'],
  ['common', 'edit', p('M12 20h9') + p('M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z')],
  ['common', 'settings', circle(12, 12, 3) + p('M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-4v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1z')],
  ['common', 'filter', p('M4 5h16l-6 7v5l-4 2v-7z')],
  ['common', 'calendar', rect(3, 5, 18, 16, 2) + line(8, 3, 8, 7) + line(16, 3, 16, 7) + line(3, 10, 21, 10)],
  ['common', 'save', p('M5 3h12l3 3v15H4V4a1 1 0 0 1 1-1z') + rect(8, 3, 7, 6, 0) + rect(7, 14, 10, 7, 1)],

  // Home and device connection flow
  ['connection', 'bluetooth', p('M7 7l10 10-5 4V3l5 4L7 17')],
  ['connection', 'bluetooth-off', p('M7 7l10 10-5 4V3l4 3M4 4l16 16'), 'danger'],
  ['connection', 'scan', circle(12, 12, 3) + p('M4.9 4.9A10 10 0 0 1 19 19M19.1 4.9A10 10 0 0 0 5 19')],
  ['connection', 'signal-strong', p('M5 20v-3M10 20v-7M15 20V9M20 20V4')],
  ['connection', 'signal-medium', p('M5 20v-3M10 20v-7M15 20V9')],
  ['connection', 'connect', p('M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1')],
  ['connection', 'connected', circle(12, 12, 9) + p('M8 12l2.5 2.5L16.5 9'), 'success'],
  ['connection', 'disconnected', p('M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1') + line(4, 4, 20, 20), 'danger'],
  ['connection', 'duplicate-device', rect(8, 8, 12, 12, 2) + p('M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2')],
  ['connection', 'permission', p('M12 3l8 3v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z') + p('M8 12l2.5 2.5L16 9'), 'success'],
  ['connection', 'retry', p('M20 6v5h-5') + p('M18.5 10a7 7 0 1 0 .2 4')],
  ['connection', 'device', rect(6, 2, 12, 20, 2) + line(9, 18, 15, 18) + rect(9, 5, 6, 9, 1)],
  ['connection', 'device-manager', rect(5, 3, 14, 18, 2) + line(8, 7, 16, 7) + line(8, 11, 16, 11) + line(8, 15, 13, 15)],
  ['connection', 'battery', rect(3, 7, 17, 10, 2) + rect(20, 10, 2, 4, 1) + rect(6, 10, 8, 4, 1)],
  ['connection', 'location', p('M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z') + circle(12, 10, 2)],

  // Product tab
  ['product', 'category-all', rect(3, 3, 7, 7, 1) + rect(14, 3, 7, 7, 1) + rect(3, 14, 7, 7, 1) + rect(14, 14, 7, 7, 1)],
  ['product', 'category-fiber', p('M3 12h5c2 0 2-4 4-4s2 8 4 8 2-4 5-4') + circle(3, 12, 1) + circle(21, 12, 1)],
  ['product', 'category-cable', p('M4 5h16v5H4zM7 10v4m3-4v4m4-4v4m3-4v4') + p('M6 14h12v5H6z')],
  ['product', 'feature', p('M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z')],
  ['product', 'specification', line(4, 6, 20, 6) + circle(9, 6, 2) + line(4, 12, 20, 12) + circle(15, 12, 2) + line(4, 18, 20, 18) + circle(11, 18, 2)],
  ['product', 'document', p('M6 2h8l4 4v16H6z') + p('M14 2v5h5') + line(9, 12, 15, 12) + line(9, 16, 15, 16)],
  ['product', 'support', p('M4 13v-1a8 8 0 0 1 16 0v1') + rect(3, 12, 4, 7, 2) + rect(17, 12, 4, 7, 2) + p('M17 19c0 2-2 3-5 3')],
  ['product', 'download-file', p('M6 2h8l4 4v16H6z') + p('M14 2v5h5') + p('M12 10v7m-3-3 3 3 3-3')],
  ['product', 'comparison', p('M8 3H4v18h4M16 3h4v18h-4') + line(8, 8, 16, 8) + line(8, 16, 16, 16)],

  // Profile and app settings
  ['profile', 'account', circle(12, 8, 4) + p('M4 21a8 8 0 0 1 16 0')],
  ['profile', 'account-edit', circle(9, 8, 4) + p('M3 21a6 6 0 0 1 9-5.2') + p('M15 19l5-5 2 2-5 5h-2z')],
  ['profile', 'my-devices', rect(4, 3, 12, 18, 2) + line(8, 17, 12, 17) + p('M18 8h3v10h-3')],
  ['profile', 'records', p('M4 12a8 8 0 1 0 2.3-5.7L4 8') + p('M4 3v5h5') + p('M12 7v5l3 2')],
  ['profile', 'app-settings', line(4, 6, 20, 6) + circle(8, 6, 2) + line(4, 12, 20, 12) + circle(16, 12, 2) + line(4, 18, 20, 18) + circle(10, 18, 2)],
  ['profile', 'after-sales', p('M4 13v-1a8 8 0 0 1 16 0v1') + rect(3, 12, 4, 7, 2) + rect(17, 12, 4, 7, 2) + p('M17 19c0 2-2 3-5 3')],
  ['profile', 'language', circle(12, 12, 9) + p('M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18')],
  ['profile', 'notification', p('M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4')],
  ['profile', 'privacy', p('M12 3l8 3v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z') + rect(9, 10, 6, 5, 1) + p('M10 10V8.5a2 2 0 0 1 4 0V10')],
  ['profile', 'cache', p('M4 6c0-2 3.6-3 8-3s8 1 8 3-3.6 3-8 3-8-1-8-3z') + p('M4 6v6c0 2 3.6 3 8 3s8-1 8-3V6M4 12v6c0 2 3.6 3 8 3s8-1 8-3v-6')],
  ['profile', 'logout', p('M10 5H5v14h5M14 8l4 4-4 4M8 12h10'), 'danger'],
  ['profile', 'camera', p('M4 7h4l2-3h4l2 3h4v13H4z') + circle(12, 13, 4)],
  ['profile', 'email', rect(3, 5, 18, 14, 2) + p('M3 7l9 6 9-6')],
  ['profile', 'help', circle(12, 12, 9) + p('M9.6 9a2.5 2.5 0 1 1 4 2c-1.2.8-1.6 1.3-1.6 2.5') + circle(12, 17, .7)],
  ['profile', 'info', circle(12, 12, 9) + line(12, 11, 12, 17) + circle(12, 7.5, .7)],
  ['profile', 'feedback', p('M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z') + line(8, 9, 16, 9) + line(8, 13, 13, 13)],

  // Professional device functions shared by the five updated device families
  ['device', 'measurement', p('M3 12h3l2-6 4 12 3-9 2 3h4')],
  ['device', 'power-meter', p('M4 16a8 8 0 1 1 16 0') + p('M12 16l4-5') + line(7, 20, 17, 20)],
  ['device', 'vfl', circle(12, 12, 2) + line(12, 2, 12, 6) + line(12, 18, 12, 22) + line(2, 12, 6, 12) + line(18, 12, 22, 12) + line(5, 5, 8, 8) + line(16, 16, 19, 19) + line(19, 5, 16, 8) + line(8, 16, 5, 19)],
  ['device', 'flashlight', p('M9 2h6l1 5-2 3v10a2 2 0 0 1-4 0V10L8 7z') + line(9, 7, 15, 7) + line(10, 13, 14, 13)],
  ['device', 'history', p('M4 12a8 8 0 1 0 2.3-5.7L4 8') + p('M4 3v5h5') + p('M12 7v5l3 2')],
  ['device', 'output', p('M5 4h14v6H5z') + p('M8 14h8M12 10v9') + circle(12, 20, 1)],
  ['device', 'calibration', circle(12, 12, 7) + line(12, 2, 12, 5) + line(12, 19, 12, 22) + line(2, 12, 5, 12) + line(19, 12, 22, 12) + p('M9 12l2 2 4-5')],
  ['device', 'timer', circle(12, 13, 8) + line(12, 13, 12, 8) + line(12, 13, 16, 15) + line(9, 2, 15, 2) + line(12, 2, 12, 5)],
  ['device', 'batch', rect(4, 4, 16, 16, 2) + line(8, 8, 16, 8) + line(8, 12, 16, 12) + line(8, 16, 13, 16)],
  ['device', 'network-test', p('M4 18V8h4v10M10 18V4h4v14M16 18v-7h4v7') + line(3, 21, 21, 21)],
  ['device', 'cable-length', p('M3 7h18v10H3z') + line(7, 7, 7, 11) + line(11, 7, 11, 10) + line(15, 7, 15, 11) + line(19, 7, 19, 10)],
  ['device', 'wiremap', p('M4 5h5v5H4zM15 14h5v5h-5z') + p('M9 7.5h3a3 3 0 0 1 3 3V14M15 16.5h-3a3 3 0 0 1-3-3V10')],
  ['device', 'trace', circle(11, 11, 6) + line(15.5, 15.5, 21, 21) + p('M8 11h6M11 8v6')],
  ['device', 'records', p('M6 3h12v18H6z') + line(9, 8, 15, 8) + line(9, 12, 15, 12) + line(9, 16, 13, 16)],
  ['device', 'fid', p('M5 20V4h10a4 4 0 0 1 4 4v12') + p('M9 8h5M9 12h7M9 16h4')],
  ['device', 'onu', p('M4 10h16v9H4z') + line(8, 19, 8, 22) + line(16, 19, 16, 22) + p('M8 10V7a4 4 0 0 1 8 0v3') + circle(8, 14.5, 1) + circle(12, 14.5, 1) + circle(16, 14.5, 1)],
  ['device', 'rfid', p('M7 7a7 7 0 0 1 0 10M10 10a3 3 0 0 1 0 4M17 7a7 7 0 0 0 0 10M14 10a3 3 0 0 0 0 4') + circle(12, 12, 1)],
  ['device', 'upload', p('M12 16V4m-5 5 5-5 5 5') + p('M5 20h14')],
  ['device', 'cellular', p('M5 20v-3M10 20v-7M15 20V9M20 20V4')],
  ['device', 'event-map', p('M5 4v16M19 4v16M5 6l7-3 7 3M5 18l7 3 7-3') + p('M12 3v18')],
  ['device', 'loss-test', p('M3 17c3-7 5-7 8-2s5 4 10-8') + circle(3, 17, 1) + circle(21, 7, 1)],
  ['device', 'file-manager', p('M3 6h7l2 2h9v12H3z') + line(8, 13, 16, 13) + line(8, 17, 14, 17)],
  ['device', 'light-source', p('M3 12h8') + p('M11 7l5 5-5 5z') + line(18, 7, 21, 4) + line(19, 12, 23, 12) + line(18, 17, 21, 20)],
  ['device', 'cable-test', p('M5 3h5v6H5zM14 15h5v6h-5z') + p('M10 6h2a5 5 0 0 1 5 5v4M14 18h-2a5 5 0 0 1-5-5V9')],
  ['device', 'endface', circle(12, 12, 8) + circle(12, 12, 3) + p('M5 7l3 2M19 7l-3 2M5 17l3-2M19 17l-3-2')],
  ['device', 'screenshot', rect(3, 5, 18, 14, 2) + p('M8 5l1-2h6l1 2') + circle(12, 12, 4)],
  ['device', 'quick-menu', rect(4, 4, 5, 5, 1) + rect(15, 4, 5, 5, 1) + rect(4, 15, 5, 5, 1) + rect(15, 15, 5, 5, 1)],
  ['device', 'test-mode', line(4, 6, 20, 6) + circle(9, 6, 2) + line(4, 12, 20, 12) + circle(15, 12, 2) + line(4, 18, 20, 18) + circle(11, 18, 2)],
  ['device', 'power-off', p('M12 2v10') + p('M6.3 5.7a8 8 0 1 0 11.4 0'), 'danger'],

  // Semantic states
  ['status', 'success', circle(12, 12, 9) + p('M8 12l2.5 2.5L16.5 9'), 'success'],
  ['status', 'warning', p('M12 3L2.5 20h19z') + line(12, 9, 12, 14) + circle(12, 17, .7), 'warning'],
  ['status', 'error', circle(12, 12, 9) + line(8.5, 8.5, 15.5, 15.5) + line(15.5, 8.5, 8.5, 15.5), 'danger'],
  ['status', 'information', circle(12, 12, 9) + line(12, 11, 12, 17) + circle(12, 7.5, .7), 'primary'],
  ['status', 'loading', circle(12, 12, 9) + p('M12 3a9 9 0 0 1 9 9'), 'primary'],
  ['status', 'offline', p('M4.5 10.5a11 11 0 0 1 15 0M7.5 14a7 7 0 0 1 9 0M10.5 17.5a2.5 2.5 0 0 1 3 0M3 3l18 18'), 'danger'],
]

const illustrationSvg = (kind) => {
  const defs = `
    <style>
      .line{fill:none;stroke:${COLORS.primary};stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
      .muted{fill:none;stroke:${COLORS.disabled};stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
      .soft{fill:#EFF6FF;stroke:${COLORS.border};stroke-width:2}
      .dark{fill:${COLORS.instrument};stroke:${COLORS.instrumentRaised};stroke-width:2}
      .screen{fill:${COLORS.instrumentRaised};stroke:#26364C;stroke-width:2}
    </style>`
  const baseDevice = `<rect class="dark" x="112" y="58" width="176" height="244" rx="26"/><rect class="screen" x="136" y="92" width="128" height="124" rx="12"/><circle fill="${COLORS.primary}" cx="200" cy="262" r="12"/><circle fill="${COLORS.disabled}" cx="166" cy="262" r="8"/><circle fill="${COLORS.disabled}" cx="234" cy="262" r="8"/>`
  if (kind === 'empty-device') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360">${defs}${baseDevice}<path class="line" d="M164 154c20-22 52-22 72 0M178 169c12-12 32-12 44 0"/><circle fill="${COLORS.primary}" cx="200" cy="184" r="5"/><circle class="soft" cx="290" cy="85" r="42"/><circle class="line" cx="290" cy="85" r="20"/><path class="line" d="M304 100l17 17"/></svg>`
  if (kind === 'scanning') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360">${defs}${baseDevice}<circle class="line" cx="200" cy="154" r="25"/><circle class="line" cx="200" cy="154" r="49" stroke-dasharray="8 10"/><circle class="line" cx="200" cy="154" r="75" opacity=".45" stroke-dasharray="5 13"/><circle fill="${COLORS.primary}" cx="200" cy="154" r="8"/></svg>`
  if (kind === 'permission') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360">${defs}${baseDevice}<path class="line" d="M200 112v83M180 133l40 40-20 17v-73l20 16-40 40"/><path class="soft" d="M285 190l52 18v34c0 38-22 61-52 74-30-13-52-36-52-74v-34z"/><path class="line" d="M262 249l16 16 31-35"/></svg>`
  if (kind === 'connection-failed') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360">${defs}${baseDevice}<path class="muted" d="M160 154c22-25 58-25 80 0M179 174c11-12 31-12 42 0"/><path stroke="${COLORS.danger}" stroke-width="4" stroke-linecap="round" d="M164 119l72 72M236 119l-72 72"/><circle fill="#FEF2F2" stroke="${COLORS.danger}" stroke-width="2" cx="290" cy="92" r="42"/><path stroke="${COLORS.danger}" stroke-width="4" stroke-linecap="round" d="M276 78l28 28M304 78l-28 28"/></svg>`
  if (kind === 'empty-product') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360">${defs}<path class="soft" d="M89 104l111-55 111 55-111 55z"/><path class="dark" d="M89 104v139l111 63 111-63V104l-111 55z"/><path class="line" d="M200 159v147M89 104l111 55 111-55"/><circle fill="${COLORS.surface}" stroke="${COLORS.primary}" stroke-width="3" cx="292" cy="91" r="42"/><circle class="line" cx="284" cy="83" r="17"/><path class="line" d="M297 96l18 18"/></svg>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360">${defs}<path class="soft" d="M110 50h180v260H110z"/><path class="line" d="M145 97h110M145 133h110M145 169h72"/><circle class="line" cx="267" cy="238" r="45"/><path class="line" d="M267 213v27l18 12"/></svg>`
}

const productSvg = (type) => {
  const shell = COLORS.instrument
  const screen = COLORS.instrumentRaised
  const outline = '#26364C'
  const blue = COLORS.primary
  const cyan = COLORS.channel
  const amber = COLORS.reading
  const common = `<style>.o{stroke:${outline};stroke-width:5;stroke-linejoin:round}.l{fill:none;stroke:${blue};stroke-width:6;stroke-linecap:round;stroke-linejoin:round}.c{fill:none;stroke:${cyan};stroke-width:6;stroke-linecap:round}.a{fill:none;stroke:${amber};stroke-width:6;stroke-linecap:round;stroke-linejoin:round}</style>`
  if (type === 'fusion-splicer') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${common}<rect x="62" y="106" width="388" height="300" rx="48" fill="${shell}" class="o"/><rect x="116" y="144" width="280" height="156" rx="18" fill="${screen}" class="o"/><path class="a" d="M146 222h74l28-34 27 70 27-36h64"/><rect x="126" y="324" width="260" height="42" rx="12" fill="#1E293B"/><circle cx="170" cy="345" r="10" fill="${cyan}"/><circle cx="220" cy="345" r="10" fill="${blue}"/><circle cx="270" cy="345" r="10" fill="${amber}"/><path class="l" d="M12 256h105M395 256h105"/></svg>`
  if (type === 'portable-otdr') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${common}<rect x="92" y="44" width="328" height="424" rx="54" fill="${shell}" class="o"/><rect x="128" y="92" width="256" height="210" rx="18" fill="${screen}" class="o"/><path class="a" d="M148 248l40-68 50 22 34-92 38 108 54-21"/><path stroke="#334155" stroke-width="3" d="M148 132h216M148 176h216M148 220h216"/><circle cx="172" cy="360" r="25" fill="${blue}"/><circle cx="256" cy="360" r="25" fill="#1E293B" stroke="${outline}" stroke-width="4"/><circle cx="340" cy="360" r="25" fill="${cyan}"/></svg>`
  if (type === 'multi-opm') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${common}<rect x="118" y="44" width="276" height="424" rx="52" fill="${shell}" class="o"/><rect x="148" y="96" width="216" height="214" rx="18" fill="${screen}" class="o"/><text x="256" y="182" fill="${amber}" font-family="Arial" font-size="58" font-weight="700" text-anchor="middle">-18.42</text><text x="256" y="218" fill="#F8FAFC" font-family="Arial" font-size="22" text-anchor="middle">dBm · 1550nm</text><path class="c" d="M166 265h180"/><circle cx="188" cy="362" r="22" fill="${blue}"/><circle cx="256" cy="362" r="22" fill="#1E293B" stroke="${outline}" stroke-width="4"/><circle cx="324" cy="362" r="22" fill="${cyan}"/></svg>`
  if (type === 'smart-otdr') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${common}<rect x="42" y="88" width="428" height="336" rx="42" fill="${shell}" class="o"/><rect x="88" y="126" width="292" height="220" rx="16" fill="${screen}" class="o"/><path class="a" d="M112 291l52-89 68 38 36-83 41 121 47-40"/><path stroke="#334155" stroke-width="3" d="M112 166h244M112 208h244M112 250h244"/><rect x="398" y="132" width="36" height="36" rx="10" fill="${blue}"/><rect x="398" y="188" width="36" height="36" rx="10" fill="${cyan}"/><rect x="398" y="244" width="36" height="36" rx="10" fill="#1E293B" stroke="${outline}" stroke-width="3"/><rect x="398" y="300" width="36" height="36" rx="10" fill="${amber}"/></svg>`
  if (type === 'pon-power-meter') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${common}<rect x="126" y="40" width="260" height="432" rx="54" fill="${shell}" class="o"/><rect x="154" y="84" width="204" height="252" rx="18" fill="${screen}" class="o"/><text x="174" y="125" fill="${cyan}" font-family="Arial" font-size="20" font-weight="700">PON</text><text x="256" y="186" fill="${amber}" font-family="Arial" font-size="54" font-weight="700" text-anchor="middle">-18.42</text><rect x="154" y="212" width="204" height="42" fill="${cyan}"/><text x="174" y="240" fill="white" font-family="Arial" font-size="18" font-weight="700">1490nm</text><text x="256" y="296" fill="${amber}" font-family="Arial" font-size="48" font-weight="700" text-anchor="middle">-20.16</text><circle cx="192" cy="390" r="20" fill="#1E293B" stroke="${outline}" stroke-width="4"/><circle cx="256" cy="390" r="20" fill="${blue}"/><circle cx="320" cy="390" r="20" fill="#1E293B" stroke="${outline}" stroke-width="4"/></svg>`
  if (type === 'dual-pon') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${common}<rect x="76" y="54" width="360" height="404" rx="46" fill="${shell}" class="o"/><rect x="108" y="94" width="296" height="238" rx="18" fill="${screen}" class="o"/><rect x="128" y="124" width="96" height="70" rx="12" fill="#1E293B"/><rect x="288" y="124" width="96" height="70" rx="12" fill="#1E293B"/><path class="c" d="M153 153c10-12 34-12 44 0M313 153c10-12 34-12 44 0"/><path class="l" d="M176 194v42h160v-42M256 236v46"/><rect x="224" y="270" width="64" height="42" rx="9" fill="${blue}"/><rect x="116" y="356" width="280" height="48" rx="12" fill="#1E293B"/><path class="a" d="M145 380h222"/></svg>`
  if (type === 'stable-light-source') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${common}<rect x="124" y="42" width="264" height="428" rx="54" fill="${shell}" class="o"/><rect x="154" y="94" width="204" height="226" rx="18" fill="${screen}" class="o"/><circle cx="198" cy="143" r="14" fill="${amber}"/><path class="a" d="M220 143h108"/><text x="256" y="232" fill="${amber}" font-family="Arial" font-size="58" font-weight="700" text-anchor="middle">1550</text><text x="256" y="270" fill="#F8FAFC" font-family="Arial" font-size="22" text-anchor="middle">nm · 2kHz</text><circle cx="190" cy="382" r="22" fill="#1E293B" stroke="${outline}" stroke-width="4"/><circle cx="256" cy="382" r="22" fill="${blue}"/><circle cx="322" cy="382" r="22" fill="#1E293B" stroke="${outline}" stroke-width="4"/></svg>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${common}<rect x="94" y="50" width="324" height="412" rx="52" fill="${shell}" class="o"/><rect x="126" y="90" width="260" height="220" rx="18" fill="${screen}" class="o"/><text x="150" y="137" fill="#F8FAFC" font-family="Arial" font-size="24" font-weight="700">FID</text><text x="256" y="224" fill="${amber}" font-family="Arial" font-size="64" font-weight="700" text-anchor="middle">PASS</text><path class="c" d="M150 270h212"/><rect x="138" y="346" width="236" height="60" rx="14" fill="#1E293B"/><circle cx="176" cy="376" r="13" fill="${successOrBlue()}"/><circle cx="226" cy="376" r="13" fill="${blue}"/><circle cx="276" cy="376" r="13" fill="${cyan}"/><circle cx="326" cy="376" r="13" fill="${amber}"/></svg>`
}

function successOrBlue() {
  return COLORS.success
}

const backgroundSvg = (type) => {
  if (type === 'auth-fiber') return `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1624" viewBox="0 0 750 1624"><rect width="750" height="1624" fill="${COLORS.page}"/><g fill="none" stroke="#D8E2EF" stroke-width="2" opacity=".8"><path d="M-40 168C160 40 300 250 530 112S850 80 820 0"/><path d="M-60 230C150 102 330 304 552 166S810 128 800 56"/><path d="M-20 1450c220-162 356 40 544-90s274-82 296-34"/></g><g fill="none" stroke="${COLORS.primary}" stroke-width="3" opacity=".16"><path d="M-60 196C160 66 318 280 544 142S838 106 824 30"/><path d="M-20 1510c224-170 360 30 558-96s274-72 302-24"/></g><g fill="${COLORS.primary}" opacity=".2"><circle cx="132" cy="116" r="5"/><circle cx="312" cy="198" r="5"/><circle cx="530" cy="112" r="5"/><circle cx="180" cy="1430" r="5"/><circle cx="534" cy="1414" r="5"/></g></svg>`
  if (type === 'connection-grid') return `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="420" viewBox="0 0 750 420"><rect width="750" height="420" fill="${COLORS.page}"/><g stroke="#D8E2EF" stroke-width="1" opacity=".75">${Array.from({length:16},(_,i)=>line(i*50,0,i*50,420)).join('')}${Array.from({length:10},(_,i)=>line(0,i*50,750,i*50)).join('')}</g><g fill="none" stroke="${COLORS.primary}" stroke-width="2" opacity=".18"><circle cx="375" cy="210" r="70"/><circle cx="375" cy="210" r="130"/><circle cx="375" cy="210" r="190"/></g></svg>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="transparent"/><g stroke="#26364C" stroke-width="1" opacity=".55">${Array.from({length:7},(_,i)=>line((i+1)*32,0,(i+1)*32,256)).join('')}${Array.from({length:7},(_,i)=>line(0,(i+1)*32,256,(i+1)*32)).join('')}</g><g stroke="#334155" stroke-width="1" opacity=".6">${Array.from({length:3},(_,i)=>line((i+1)*64,0,(i+1)*64,256)).join('')}${Array.from({length:3},(_,i)=>line(0,(i+1)*64,256,(i+1)*64)).join('')}</g></svg>`
}

function iconDocument(body, color) {
  return `<!doctype html><html><head><style>*{box-sizing:border-box}html,body{margin:0;width:96px;height:96px;background:transparent;overflow:hidden}body{display:grid;place-items:center}svg{width:80px;height:80px;fill:none;stroke:${color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round}</style></head><body><svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg></body></html>`
}

function svgDocument(svg, width, height, background = 'transparent') {
  return `<!doctype html><html><head><style>*{box-sizing:border-box}html,body{margin:0;width:${width}px;height:${height}px;background:${background};overflow:hidden}svg{display:block;width:${width}px;height:${height}px}</style></head><body>${svg}</body></html>`
}

async function render(page, html, output, width, height, transparent = true) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'load' })
  await page.screenshot({
    path: output,
    type: 'png',
    omitBackground: transparent,
    clip: { x: 0, y: 0, width, height },
  })
}

async function main() {
  const executablePath = fs.access(CHROME).then(() => CHROME).catch(() => puppeteer.executablePath())
  const browser = await puppeteer.launch({
    executablePath: await executablePath,
    headless: true,
    args: ['--disable-gpu', '--hide-scrollbars'],
  })
  const page = await browser.newPage()
  const files = []

  try {
    for (const [category, name, body, tone = 'primary'] of ICONS) {
      const dir = path.join(ROOT, 'icons', category)
      await fs.mkdir(dir, { recursive: true })
      const output = path.join(dir, `${name}.png`)
      await render(page, iconDocument(body, COLORS[tone] || tone), output, 96, 96, true)
      files.push({ type: 'icon', category, name, path: path.relative(ROOT, output).replaceAll('\\', '/'), width: 96, height: 96, transparent: true, displaySize: '24x24px' })
    }

    const illustrations = ['empty-device', 'scanning', 'permission', 'connection-failed', 'empty-product', 'empty-records']
    for (const name of illustrations) {
      const dir = path.join(ROOT, 'illustrations')
      await fs.mkdir(dir, { recursive: true })
      const output = path.join(dir, `${name}.png`)
      await render(page, svgDocument(illustrationSvg(name), 400, 360), output, 400, 360, true)
      files.push({ type: 'illustration', name, path: path.relative(ROOT, output).replaceAll('\\', '/'), width: 400, height: 360, transparent: true })
    }

    const products = ['fusion-splicer', 'portable-otdr', 'multi-opm', 'smart-otdr', 'pon-power-meter', 'dual-pon', 'stable-light-source', 'port-audit']
    for (const name of products) {
      const dir = path.join(ROOT, 'products')
      await fs.mkdir(dir, { recursive: true })
      const output = path.join(dir, `${name}.png`)
      await render(page, svgDocument(productSvg(name), 512, 512), output, 512, 512, true)
      files.push({ type: 'product', name, path: path.relative(ROOT, output).replaceAll('\\', '/'), width: 512, height: 512, transparent: true })
    }

    const backgrounds = [
      ['auth-fiber', 750, 1624, false],
      ['connection-grid', 750, 420, false],
      ['instrument-grid', 256, 256, true],
    ]
    for (const [name, width, height, transparent] of backgrounds) {
      const dir = path.join(ROOT, 'backgrounds')
      await fs.mkdir(dir, { recursive: true })
      const output = path.join(dir, `${name}.png`)
      await render(page, svgDocument(backgroundSvg(name), width, height), output, width, height, transparent)
      files.push({ type: 'background', name, path: path.relative(ROOT, output).replaceAll('\\', '/'), width, height, transparent })
    }

    const manifest = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      designSystem: 'docs/APP_DESIGN_SYSTEM.md',
      iconSpec: {
        sourceGrid: '24x24',
        pngSize: '96x96',
        recommendedDisplaySize: '24x24',
        stroke: '2px rounded line at 24px source grid',
        background: 'transparent',
      },
      colors: COLORS,
      files,
    }
    await fs.writeFile(path.join(ROOT, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    console.log(`Generated ${files.length} PNG assets in ${ROOT}`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
