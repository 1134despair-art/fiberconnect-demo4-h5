import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer'

const parseSize = (value) => {
  const size = Number.parseInt(String(value), 10)
  return Number.isFinite(size) && size > 0 ? size : 512
}

const ensureDir = (filePath) => {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
}

const main = async () => {
  const [inputArg, outputArg, sizeArg] = process.argv.slice(2)
  if (!inputArg || !outputArg) {
    process.stderr.write('Usage: node scripts/svg-to-png.js <input.svg> <output.png> [size]\n')
    process.exit(1)
  }

  const inputPath = path.resolve(process.cwd(), inputArg)
  const outputPath = path.resolve(process.cwd(), outputArg)
  const size = parseSize(sizeArg)

  const svg = fs.readFileSync(inputPath, 'utf8')

  ensureDir(outputPath)

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 })

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        html, body { margin: 0; padding: 0; width: ${size}px; height: ${size}px; background: transparent; }
        #root { width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; color: #111827; }
        #root svg { width: 100%; height: 100%; display: block; }
      </style>
    </head>
    <body>
      <div id="root">${svg}</div>
    </body>
  </html>`

  await page.setContent(html, { waitUntil: 'networkidle0' })
  const root = await page.$('#root')
  if (!root) {
    throw new Error('Render failed: #root not found')
  }
  const box = await root.boundingBox()
  if (!box) {
    throw new Error('Render failed: bounding box not found')
  }

  await page.screenshot({
    path: outputPath,
    omitBackground: true,
    clip: { x: box.x, y: box.y, width: box.width, height: box.height },
  })

  await browser.close()
  process.stdout.write(`Saved: ${outputPath}\n`)
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err) + '\n')
  process.exit(1)
})
