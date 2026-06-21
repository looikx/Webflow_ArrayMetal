import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../screenshots')
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})

const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

// Capture console errors
const consoleErrors = []
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
page.on('pageerror', err => consoleErrors.push(err.message))

async function shot(url, name, waitMs = 3000) {
  await page.goto(`http://localhost:3000${url}`, { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(waitMs)
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true })
  console.log(`✓ ${name}`)
}

await shot('/', 'debug-dashboard', 2000)
await shot('/items', 'debug-items', 3000)
await shot('/series/HDG_CABLE_LADDER', 'debug-series', 3000)
await shot('/export', 'debug-export', 3000)

console.log('\nConsole errors:', consoleErrors.length ? consoleErrors : 'none')

await browser.close()
