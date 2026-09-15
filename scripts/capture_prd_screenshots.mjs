import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer'

const outputDir = process.argv[2]
const baseUrl = process.argv[3] || 'http://localhost:3002'

if (!outputDir) {
  console.error('Usage: node scripts/capture_prd_screenshots.mjs <outputDir> [baseUrl]')
  process.exit(1)
}

fs.mkdirSync(outputDir, { recursive: true })

const authUser = {
  id: 'prd-user-001',
  phone: '13800138000',
  email: 'test@example.com',
  name: '张三',
  role: 'user',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=13800138000',
  devices: [
    {
      id: 'device_001',
      name: '六马达熔接机-001',
      model: 'WM-6000',
      serialNumber: 'WM6000001',
      deviceType: 'fusion_splicer',
      status: 'connected',
      lastConnected: '2026-07-01 09:30:00',
      activationStatus: 'activated',
      authorizationExpiry: '2026-12-31',
      hasPassword: true
    },
    {
      id: 'device_006',
      name: '便携式OTDR测试仪-001',
      model: 'FWV-100-V10',
      serialNumber: 'FWV100V10001',
      deviceType: 'portable_otdr',
      status: 'connected',
      lastConnected: '2026-07-01 09:20:00',
      activationStatus: 'activated',
      authorizationExpiry: '2026-12-31',
      hasPassword: false
    },
    {
      id: 'device_007',
      name: '手持式多功能光功率计-001',
      model: 'MOPM-4G',
      serialNumber: 'MOPM4G0001',
      deviceType: 'multi_opm_meter',
      status: 'connected',
      activationStatus: 'activated',
      authorizationExpiry: '2026-12-31',
      hasPassword: false,
      lightSourceColor: 'red'
    },
    {
      id: '1782294527369',
      name: '智能OTDR测试仪-001',
      model: 'SOTDR-200',
      serialNumber: 'SOTDR392601',
      deviceType: 'smart_otdr',
      status: 'connected',
      lastConnected: '2026-07-01 09:10:00',
      activationStatus: 'activated',
      authorizationExpiry: '2026-12-31',
      hasPassword: false
    }
  ],
  createdAt: '2026-01-15 10:00:00'
}

const pages = [
  { file: '01-login.png', route: '/#/login', auth: false, wait: 1200 },
  { file: '02-home.png', route: '/#/', auth: true, wait: 1500 },
  { file: '03-smart-otdr-home.png', route: '/#/device/1782294527369', auth: true, wait: 1500 },
  { file: '04-smart-otdr-measure.png', route: '/#/device/1782294527369/smart-otdr', auth: true, wait: 1800 },
  { file: '05-event-map.png', route: '/#/device/1782294527369/event-map', auth: true, wait: 1800 },
  { file: '06-file-manager.png', route: '/#/device/1782294527369/files', auth: true, wait: 1600 },
  { file: '07-smart-opm.png', route: '/#/device/1782294527369/smart-opm', auth: true, wait: 1600 },
  { file: '08-loss-test.png', route: '/#/device/1782294527369/loss-test', auth: true, wait: 1600 },
  { file: '10-light-source.png', route: '/#/device/1782294527369/light-source', auth: true, wait: 1600 },
  { file: '11-vfl.png', route: '/#/device/1782294527369/vfl', auth: true, wait: 1600 },
  { file: '12-cable-test.png', route: '/#/device/1782294527369/cable-test', auth: true, wait: 1600 },
  { file: '13-system-settings.png', route: '/#/device/1782294527369/system', auth: true, wait: 1600 }
]

async function applyAuth(page) {
  await page.evaluate((user) => {
    localStorage.setItem('auth_user', JSON.stringify(user))
    localStorage.setItem('auth_token', `token_${user.id}_prd`)
    localStorage.setItem('locale_app', 'zh-CN')
    localStorage.setItem('locale_device', 'zh-CN')
  }, authUser)
}

async function capturePage(page, config) {
  await page.goto(`${baseUrl}${config.route}`, { waitUntil: 'networkidle2' })
  if (config.auth) {
    await applyAuth(page)
    await page.goto(`${baseUrl}${config.route}`, { waitUntil: 'networkidle2' })
  }
  await page.waitForTimeout(config.wait ?? 1200)
  await page.screenshot({
    path: path.join(outputDir, config.file),
    fullPage: false
  })
  console.log(`captured ${config.file}`)
}

const browser = await puppeteer.launch({
  headless: true,
  defaultViewport: {
    width: 1440,
    height: 1700,
    deviceScaleFactor: 1
  }
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 1700, deviceScaleFactor: 1 })
  for (const item of pages) {
    await capturePage(page, item)
  }
} finally {
  await browser.close()
}
