import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer'

const outputDir = process.argv[2]
const requestedPort = Number(process.argv[3] || '3105')

if (!outputDir) {
  console.error('Usage: node scripts/capture_prd_with_server.mjs <outputDir> [port]')
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
  { file: '06-file-manager.png', route: '/#/device/1782294527369/files', auth: true, wait: 1700 },
  { file: '07-smart-opm.png', route: '/#/device/1782294527369/smart-opm', auth: true, wait: 1600 },
  { file: '08-loss-test.png', route: '/#/device/1782294527369/loss-test', auth: true, wait: 1600 },
  { file: '10-light-source.png', route: '/#/device/1782294527369/light-source', auth: true, wait: 1600 },
  { file: '11-vfl.png', route: '/#/device/1782294527369/vfl', auth: true, wait: 1600 },
  { file: '12-cable-test.png', route: '/#/device/1782294527369/cable-test', auth: true, wait: 1600 },
  { file: '13-system-settings.png', route: '/#/device/1782294527369/system', auth: true, wait: 1600 },
  { file: '14-fusion-home.png', route: '/#/device/device_001', auth: true, wait: 1500 },
  { file: '15-portable-otdr-home.png', route: '/#/device/device_006', auth: true, wait: 1500 },
  { file: '16-multi-opm-home.png', route: '/#/device/device_007', auth: true, wait: 1500 },
  { file: '17-settings.png', route: '/#/settings', auth: true, wait: 1500 },
  { file: '18-catalog.png', route: '/#/catalog', auth: true, wait: 1500 },
  { file: '19-product-detail.png', route: '/#/product/1', auth: true, wait: 1500 },
  { file: '20-profile.png', route: '/#/profile', auth: true, wait: 1500 },
  { file: '21-after-sales.png', route: '/#/after-sales', auth: true, wait: 1500 }
]

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForViteReady(vite, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let settled = false
    let outputBuffer = ''

    const cleanup = () => {
      clearTimeout(timeout)
      vite.stdout?.off('data', onData)
      vite.stderr?.off('data', onData)
      vite.off('exit', onExit)
    }

    const finish = (fn, value) => {
      if (settled) return
      settled = true
      cleanup()
      fn(value)
    }

    const tryResolve = () => {
      const plainText = outputBuffer.replace(/\u001b\[[0-9;]*m/g, '')
      const match = plainText.match(/Local:\s+(https?:\/\/[^\s]+)/)
      if (match) {
        finish(resolve, match[1])
      }
    }

    const onData = (chunk) => {
      const text = chunk.toString()
      outputBuffer += text
      process.stdout.write(text)
      tryResolve()
    }

    const onExit = (code) => {
      finish(reject, new Error(`Vite exited before ready. exitCode=${code ?? 'unknown'}`))
    }

    const timeout = setTimeout(() => {
      finish(reject, new Error(`Timed out waiting for Vite to start.\n${outputBuffer}`))
    }, timeoutMs)

    vite.stdout?.on('data', onData)
    vite.stderr?.on('data', onData)
    vite.on('exit', onExit)
  })
}

async function applyAuth(page) {
  await page.evaluate((user) => {
    localStorage.setItem('auth_user', JSON.stringify(user))
    localStorage.setItem('auth_token', `token_${user.id}_prd`)
    localStorage.setItem('locale_app', 'zh-CN')
    localStorage.setItem('locale_device', 'zh-CN')
  }, authUser)
}

async function capturePage(page, baseUrl, config) {
  await page.goto(`${baseUrl}${config.route}`, { waitUntil: 'networkidle2' })
  if (config.auth) {
    await applyAuth(page)
    await page.goto(`${baseUrl}${config.route}`, { waitUntil: 'networkidle2' })
  }
  await wait(config.wait ?? 1200)
  await page.screenshot({
    path: path.join(outputDir, config.file),
    fullPage: false
  })
  console.log(`captured ${config.file}`)
}

const vite = spawn('npm.cmd', ['run', 'dev', '--', '--port', String(requestedPort)], {
  cwd: process.cwd(),
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe']
})

let browser

try {
  const baseUrl = await waitForViteReady(vite)

  browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1440,
      height: 1700,
      deviceScaleFactor: 1
    }
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 1700, deviceScaleFactor: 1 })

  for (const item of pages) {
    await capturePage(page, baseUrl, item)
  }
} finally {
  if (browser) {
    await browser.close()
  }
  vite.kill()
}
