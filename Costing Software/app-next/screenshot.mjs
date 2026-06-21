import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '../screenshots')

import fs from 'fs'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})

const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

async function shot(url, name, waitFor) {
  await page.goto(`http://localhost:3000${url}`, { waitUntil: 'networkidle' })
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
  console.log(`✓ ${name}`)
}

// Dashboard
await shot('/', 'dashboard', 'h1, [class*="text-2xl"]')

// Item Registry
await shot('/items', 'item-registry', 'input[placeholder*="Search"]')

// Series page — General Settings
await shot('/series/HDG_CABLE_LADDER', 'series-general', 'input[type="number"]')

// Series page — Product Settings tab
await page.goto('http://localhost:3000/series/HDG_CABLE_LADDER', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.click('button:has-text("Product Settings")')
await page.waitForTimeout(2000)
await page.screenshot({ path: path.join(OUT, 'series-products.png') })
console.log('✓ series-products')

// Series page — Audit Trail tab
await page.click('button:has-text("Audit Trail")')
await page.waitForTimeout(2000)
await page.screenshot({ path: path.join(OUT, 'series-audit.png') })
console.log('✓ series-audit')

// Export page
await shot('/export', 'export', 'button:has-text("Export")')

await browser.close()
console.log('\nAll screenshots saved to ../screenshots/')
