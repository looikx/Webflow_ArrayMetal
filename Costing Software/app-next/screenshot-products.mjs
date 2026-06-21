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

await page.goto('http://localhost:3000/series/HDG_CABLE_LADDER', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.click('button:has-text("Product Settings")')
await page.waitForTimeout(4000) // wait for all type counts to load
await page.screenshot({ path: path.join(OUT, 'series-products.png') })
console.log('✓ series-products updated')

await browser.close()
