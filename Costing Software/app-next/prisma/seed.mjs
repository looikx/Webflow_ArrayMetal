/**
 * Seed script — AML HDG Cable Ladder
 * Run: node prisma/seed.mjs
 */
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
)

// ── Constants ────────────────────────────────────────────────────────────────

const HDG_PRICES = {
  material_2_5mm: 4.125,
  material_2mm: 3.975,
  material_1_6mm: 4.200,
  material_1_5mm: 4.275,
  material_1_2mm: 4.725,
  galv_over_3kg: 2.42,
  galv_under_3kg: 3.85,
  markup_body: 20.0,
  markup_fittings: 20.0,
  markup_screws: 40.0,
}

const SERIES_META = {
  AML100: { heightMm: 100 },
  AML125: { heightMm: 125 },
  AML150: { heightMm: 150 },
}

// ── Engine (mirrors lib/engine.ts — same formulas from Array Metal Products.xlsx) ──

const DENSITY = 7.9
const LIP = 0.03
const RUNG_SPACING = 0.3
const HEIGHT_FACTOR = { 100: 0.08, 125: 0.09, 150: 0.09 }
const ELBOW_PARAM = { E90: 1.572, E60: 1.05, E45: 0.786, E30: 0.525 }
const RISER_PARAM = { IR90: 1.572, IR60: 1.048, IR45: 0.786, IR30: 0.524,
                      OR90: 1.572, OR60: 1.048, OR45: 0.786, OR30: 0.524 }

function hf(heightMm) { return HEIGHT_FACTOR[heightMm] ?? 0.09 }

function matRate(thicknessMm) {
  const key = Number.isInteger(thicknessMm)
    ? `material_${thicknessMm}mm`
    : `material_${String(thicknessMm).replace('.', '_')}mm`
  return HDG_PRICES[key] ?? 0
}

function unitPriceFromCost(totalCost, marginPct) {
  return Math.round(totalCost / (100 - marginPct) * 100 * 10) / 10
}

// Returns { weightKg, labourCost, galvKey, marginType }
function formulaFor(item) {
  const { productType, widthMm, heightMm, thicknessMm, lengthM, radiusMm } = item
  const P = widthMm / 1000, R = heightMm / 1000, W = thicknessMm
  const V = radiusMm != null ? radiusMm / 1000 : 0

  if (productType === 'ST') {
    const T = lengthM
    const rungCount = T / RUNG_SPACING
    const sideRailWt = (2 * R + 4 * LIP) * T * W * DENSITY
    const rungWt = rungCount * P * hf(heightMm) * W * DENSITY
    const weightKg = sideRailWt + rungWt
    return { weightKg, labourCost: 1.01 * weightKg - 7.9, galvKey: 'galv_over_3kg', marginType: 'body' }
  }

  if (ELBOW_PARAM[productType] != null) {
    const E = ELBOW_PARAM[productType]
    const X = (2 * V + P) * E + 0.19 * 4
    const rungCount = (X / 2) / RUNG_SPACING + 1
    const sideRailWt = (R + 2 * LIP) * X * W * DENSITY
    const rungWt = rungCount * P * hf(heightMm) * W * DENSITY
    const weightKg = sideRailWt + rungWt
    return { weightKg, labourCost: Math.round(E * (P + 2 * V) * 7 * 10) / 10, galvKey: 'galv_over_3kg', marginType: 'fittings' }
  }

  if (RISER_PARAM[productType] != null) {
    const Er = RISER_PARAM[productType]
    const X = (R + V + 0.15) * Er * 2
    const rungCount = X / 2 / RUNG_SPACING + 1
    const sideRailWt = (R + 2 * LIP) * X * W * DENSITY
    const rungWt = rungCount * P * hf(heightMm) * W * DENSITY
    const weightKg = sideRailWt + rungWt
    const labour = (Er * V + (Er * V + R)) * 7 + 0.15 * 4 * 3.5
    const galvKey = (productType === 'IR90' || productType === 'OR90') ? 'galv_over_3kg' : 'galv_under_3kg'
    return { weightKg, labourCost: labour, galvKey, marginType: 'fittings' }
  }

  if (productType === 'T') {
    const X = 3.143 * V + 0.19 * 6 + P + 2 * V
    const rungCount = (P + 2 * V + 0.3) / RUNG_SPACING + 2
    const rungLenTot = rungCount * P + (2 * V + P)
    const sideRailWt = (R + 2 * LIP) * X * W * DENSITY
    const rungWt = rungLenTot * hf(heightMm) * W * DENSITY
    return { weightKg: sideRailWt + rungWt, labourCost: X * 7, galvKey: 'galv_over_3kg', marginType: 'fittings' }
  }

  if (productType === 'UT') {
    const Q = P  // width2 not tracked in DB yet; approximate with P
    const X = 3.143 * V + 0.19 * 6 + P + 2 * V
    const rungCount = (P + 2 * V + 0.3) / RUNG_SPACING + 2
    const rungLenTot = rungCount * Q + 2 * P + 2 * V
    const sideRailWt = (R + 2 * LIP) * X * W * DENSITY
    const rungWt = rungLenTot * hf(heightMm) * W * DENSITY
    return { weightKg: sideRailWt + rungWt, labourCost: X * 7, galvKey: 'galv_over_3kg', marginType: 'fittings' }
  }

  if (productType === 'CP') {
    const X = 6.29 * V + 0.19 * 8
    const rungCount = (P + 2 * V + 0.3) / RUNG_SPACING + 3
    const rungLenTot = rungCount * P + (4 * V + 2 * P)
    const sideRailWt = (R + 2 * LIP) * X * W * DENSITY
    const rungWt = rungLenTot * hf(heightMm) * W * DENSITY
    return { weightKg: sideRailWt + rungWt, labourCost: X * 7, galvKey: 'galv_over_3kg', marginType: 'fittings' }
  }

  if (productType === 'UCP') {
    const Q = P
    const X = 6.29 * V + 0.19 * 8
    const rungCount = (Q + 2 * V + 0.3) / RUNG_SPACING
    const rungLenTot = rungCount * P + (4 * V + 2 * P) + 3 * Q
    const sideRailWt = (R + 2 * LIP) * X * W * DENSITY
    const rungWt = rungLenTot * hf(heightMm) * W * DENSITY
    return { weightKg: sideRailWt + rungWt, labourCost: X * 7, galvKey: 'galv_over_3kg', marginType: 'fittings' }
  }

  if (productType === 'VT') {
    const T1 = R + 2 * LIP + V + 0.19
    const U1 = R + 2 * LIP + 2 * V + 0.19 * 2
    const weightKg = T1 * U1 * W * DENSITY * 2
    return { weightKg, labourCost: 40, galvKey: 'galv_over_3kg', marginType: 'fittings' }
  }

  if (productType === 'RC') {
    const X = 1.324
    const sideRailWt = (R + 2 * LIP) * X * W * DENSITY
    const rungWt = P * 2 * hf(heightMm) * W * DENSITY  // P+Q approx 2P
    return { weightKg: sideRailWt + rungWt, labourCost: X * 7, galvKey: 'galv_under_3kg', marginType: 'fittings' }
  }

  if (productType === 'RL' || productType === 'RR') {
    const X = 1.262
    const sideRailWt = (R + 2 * LIP) * X * W * DENSITY
    const rungWt = P * 2 * hf(heightMm) * W * DENSITY
    return { weightKg: sideRailWt + rungWt, labourCost: X * 7, galvKey: 'galv_over_3kg', marginType: 'fittings' }
  }

  return null  // unknown type — will produce zero price record
}

function calcPrice(item) {
  const formula = formulaFor(item)
  if (!formula) {
    return { weightKg: 0, materialCost: 0, galvCost: 0, labourCost: 0, totalCost: 0, markupPct: HDG_PRICES.markup_fittings, unitPrice: 0 }
  }
  const { weightKg, labourCost, galvKey, marginType } = formula
  const mat = weightKg * matRate(item.thicknessMm)
  const galv = weightKg * (HDG_PRICES[galvKey] ?? 0)
  const totalCost = mat + galv + labourCost
  const markupPct = marginType === 'body' ? HDG_PRICES.markup_body : HDG_PRICES.markup_fittings
  const unitPrice = unitPriceFromCost(totalCost, markupPct)
  return { weightKg, materialCost: mat, galvCost: galv, labourCost, totalCost, markupPct, unitPrice }
}

function parsePart(partNumber) {
  const parts = partNumber.split('-')
  if (parts.length < 6) return null
  const [series, productType, widthStr, thicknessStr, dimStr, gradeCode] = parts
  const meta = SERIES_META[series]
  if (!meta) return null
  const isRadius = dimStr.startsWith('R')
  return {
    series,
    productType,
    widthMm: parseFloat(widthStr),
    heightMm: meta.heightMm,
    thicknessMm: parseFloat(thicknessStr),
    lengthM: isRadius ? null : parseFloat(dimStr),
    radiusMm: isRadius ? parseFloat(dimStr.slice(1)) : null,
    gradeCode,
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

const xlsxPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../Costing Files/[Cable Ladder] AML100+125+150.xlsx'
)

console.log('Reading Excel:', xlsxPath)
const wb = new ExcelJS.Workbook()
await wb.xlsx.readFile(xlsxPath)

const BATCH = 500
let totalRows = 0

// ── Phase 1: Insert items ────────────────────────────────────────────────────

for (const sheet of wb.worksheets) {
  const series = sheet.name
  if (!SERIES_META[series]) { console.log(`Skipping sheet: ${series}`); continue }

  console.log(`\n[${series}] Reading ${sheet.rowCount - 1} rows...`)
  const batch = []

  sheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum === 1) return
    const artNo = parseInt(row.getCell(1).value?.toString() ?? '0', 10)
    const partNumber = row.getCell(2).value?.toString()?.trim()
    const description = row.getCell(3).value?.toString()?.trim()
    if (!artNo || !partNumber || !description) return
    const parsed = parsePart(partNumber)
    if (!parsed) return

    batch.push({
      partNumber,
      artNo,
      description,
      categoryId: 'HDG_CABLE_LADDER',
      series,
      productType: parsed.productType,
      widthMm: parsed.widthMm,
      heightMm: parsed.heightMm,
      thicknessMm: parsed.thicknessMm,
      lengthM: parsed.lengthM,
      radiusMm: parsed.radiusMm,
      gradeCode: parsed.gradeCode,
      source: 'IMPORTED',
      isActive: true,
    })
  })

  console.log(`[${series}] Inserting ${batch.length} items...`)
  for (let i = 0; i < batch.length; i += BATCH) {
    const chunk = batch.slice(i, i + BATCH)
    const { error } = await supabase.from('items').upsert(chunk, { onConflict: 'partNumber', ignoreDuplicates: true })
    if (error) throw new Error(`[${series}] items insert failed at row ${i}: ${error.message}`)
    process.stdout.write(`  ${Math.min(i + BATCH, batch.length)}/${batch.length}\r`)
  }
  totalRows += batch.length
  console.log(`[${series}] Done. ${batch.length} items.`)
}

console.log(`\nTotal items upserted: ${totalRows}`)

// ── Phase 2: Calculate & insert price records ─────────────────────────────────

console.log('\nFetching all items for price calculation...')
let allItems = []
let from = 0
const PAGE = 1000
while (true) {
  const { data, error } = await supabase
    .from('items')
    .select('id,productType,widthMm,heightMm,thicknessMm,lengthM,radiusMm')
    .eq('categoryId', 'HDG_CABLE_LADDER')
    .order('id')
    .range(from, from + PAGE - 1)
  if (error) throw new Error(`Fetch items: ${error.message}`)
  if (!data?.length) break
  allItems = allItems.concat(data)
  from += PAGE
  if (data.length < PAGE) break
}

console.log(`Fetched ${allItems.length} items. Marking old price records not-current...`)
await supabase.from('price_records').update({ isCurrent: false }).eq('isCurrent', true)

console.log('Calculating and inserting price records...')
const pricesSnapshot = HDG_PRICES
const priceBatch = []

for (const item of allItems) {
  const { weightKg, materialCost, galvCost, labourCost, totalCost, markupPct, unitPrice } =
    calcPrice(item)

  priceBatch.push({
    itemId: item.id,
    weightKg,
    materialCost,
    galvCost,
    labourCost,
    totalCost,
    markupPct,
    unitPrice,
    pricesSnapshot,
    isCurrent: true,
  })
}

for (let i = 0; i < priceBatch.length; i += BATCH) {
  const chunk = priceBatch.slice(i, i + BATCH)
  const { error } = await supabase.from('price_records').insert(chunk)
  if (error) throw new Error(`price_records insert failed at ${i}: ${error.message}`)
  if (i % 5000 === 0 || i + BATCH >= priceBatch.length) {
    process.stdout.write(`  ${Math.min(i + BATCH, priceBatch.length)}/${priceBatch.length}\r`)
  }
}

console.log('\n\nSeed complete!')
const { count: ic } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('categoryId', 'HDG_CABLE_LADDER')
const { count: pc } = await supabase.from('price_records').select('*', { count: 'exact', head: true }).eq('isCurrent', true)
console.log(`  items:                  ${ic}`)
console.log(`  price_records (current): ${pc}`)
