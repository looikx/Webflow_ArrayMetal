import type { MaterialPrices, PriceBreakdown } from '@/types'

// ── Constants (from Array Metal Products.xlsx → HDG Cable Ladder) ─────────────
const DENSITY = 7.9          // kg per (m × m × mm) — matches workbook convention
const LIP = 0.03             // m, side-rail lip fold (S in sheet)
const RUNG_SPACING = 0.3     // m (Y14)

// Rung weight height factor by ladder height (P3/P4/P5 in sheet)
const HEIGHT_FACTOR: Record<number, number> = {
  100: 0.08,
  125: 0.09,
  150: 0.09,
}

// SR-length parameters for elbows (E33–E36) and risers (E74–E77)
const ELBOW_PARAM: Record<string, number> = {
  E90: 1.572, E60: 1.05, E45: 0.786, E30: 0.525,
}
const RISER_PARAM: Record<string, number> = {
  IR90: 1.572, IR60: 1.048, IR45: 0.786, IR30: 0.524,
  OR90: 1.572, OR60: 1.048, OR45: 0.786, OR30: 0.524,
}

// Labour rolling constants (AD12, AD13, AD14)
const LAB_ELBOW = 7    // RM per (param × (P + 2V)) for elbows
const LAB_RISER = 7    // RM per term for risers
const LAB_RISER_PLATE = 3.5 // extra plate cost
const LAB_TEE   = 7    // RM per X for tees/cross
const LAB_REDUCER = 7  // RM per X for reducers
const LAB_VT    = 40   // constant for vertical tee (workbook row 71)

// ── Shared helpers ────────────────────────────────────────────────────────────

function heightFactor(heightMm: number): number {
  return HEIGHT_FACTOR[heightMm] ?? 0.09
}

function materialRate(thicknessMm: number, prices: MaterialPrices): number {
  const key = thicknessMm % 1 === 0
    ? `material_${thicknessMm}mm`
    : `material_${thicknessMm.toString().replace('.', '_')}mm`
  return prices[key] ?? 0
}

// margin-divisor unit price: ROUND(totalCost / (100 - margin%) * 100, 1)
function unitPriceFromCost(totalCost: number, marginPct: number): number {
  if (marginPct >= 100) return totalCost
  return Math.round(totalCost / (100 - marginPct) * 100 * 10) / 10
}

type Margin = 'body' | 'fittings'

function marginPct(type: Margin, prices: MaterialPrices): number {
  return type === 'body' ? (prices['markup_body'] ?? 20) : (prices['markup_fittings'] ?? 20)
}

// ── Per-product-type weight + labour strategies ───────────────────────────────

interface FormulaResult {
  weightKg: number
  labourCost: number
  marginType: Margin
}

type Inputs = {
  widthMm: number
  heightMm: number
  thicknessMm: number
  lengthM: number | null
  radiusMm: number | null
  width2Mm?: number | null
}

// ST — Straight Cable Ladder (row 19)
function straight(i: Inputs): FormulaResult {
  const widthM      = i.widthMm / 1000
  const heightM     = i.heightMm / 1000
  const lengthM     = i.lengthM!
  const thicknessMm = i.thicknessMm
  const hf          = heightFactor(i.heightMm)

  const rungCount  = lengthM / RUNG_SPACING
  const sideRailWt = (2 * heightM + 4 * LIP) * lengthM * thicknessMm * DENSITY
  const rungWt     = rungCount * widthM * hf * thicknessMm * DENSITY
  const weightKg   = sideRailWt + rungWt
  const labourCost = 1.01 * weightKg - 7.9

  return { weightKg, labourCost, marginType: 'body' }
}

// Elbow — E90/E60/E45/E30 (rows 39/43/47/51)
function makeElbow(productType: string) {
  return (i: Inputs): FormulaResult => {
    const elbowParam  = ELBOW_PARAM[productType]!
    const widthM      = i.widthMm / 1000
    const heightM     = i.heightMm / 1000
    const radiusM     = i.radiusMm! / 1000
    const thicknessMm = i.thicknessMm
    const hf          = heightFactor(i.heightMm)

    const arcLengthM = (2 * radiusM + widthM) * elbowParam + 0.19 * 4
    const rungCount  = (arcLengthM / 2) / RUNG_SPACING + 1
    const sideRailWt = (heightM + 2 * LIP) * arcLengthM * thicknessMm * DENSITY
    const rungWt     = rungCount * widthM * hf * thicknessMm * DENSITY
    const weightKg   = sideRailWt + rungWt
    const labourCost = elbowParam * (widthM + 2 * radiusM) * LAB_ELBOW

    return { weightKg, labourCost, marginType: 'fittings' }
  }
}

// Horizontal Tee — T (row 55)
function tee(i: Inputs): FormulaResult {
  const widthM      = i.widthMm / 1000
  const heightM     = i.heightMm / 1000
  const radiusM     = i.radiusMm! / 1000
  const thicknessMm = i.thicknessMm
  const hf          = heightFactor(i.heightMm)

  const railLengthM = 3.143 * radiusM + 0.19 * 6 + widthM + 2 * radiusM
  const rungCount   = (widthM + 2 * radiusM + 0.3) / RUNG_SPACING + 2
  const rungLenTot  = rungCount * widthM + (2 * radiusM + widthM)
  const sideRailWt  = (heightM + 2 * LIP) * railLengthM * thicknessMm * DENSITY
  const rungWt      = rungLenTot * hf * thicknessMm * DENSITY
  const weightKg    = sideRailWt + rungWt
  const labourCost  = railLengthM * LAB_TEE

  return { weightKg, labourCost, marginType: 'fittings' }
}

// Unequal Tee — UT (row 59)
// width2Mm = wider leg width; radiusMm = radius
function unequalTee(i: Inputs): FormulaResult {
  const widthM      = i.widthMm / 1000
  const width2M     = (i.width2Mm ?? i.widthMm) / 1000
  const heightM     = i.heightMm / 1000
  const radiusM     = i.radiusMm! / 1000
  const thicknessMm = i.thicknessMm
  const hf          = heightFactor(i.heightMm)

  const railLengthM = 3.143 * radiusM + 0.19 * 6 + widthM + 2 * radiusM
  const rungCount   = (widthM + 2 * radiusM + 0.3) / RUNG_SPACING + 2
  const rungLenTot  = rungCount * width2M + 2 * widthM + 2 * radiusM
  const sideRailWt  = (heightM + 2 * LIP) * railLengthM * thicknessMm * DENSITY
  const rungWt      = rungLenTot * hf * thicknessMm * DENSITY
  const weightKg    = sideRailWt + rungWt
  const labourCost  = railLengthM * LAB_TEE

  return { weightKg, labourCost, marginType: 'fittings' }
}

// Horizontal Cross — CP (row 63)
function cross(i: Inputs): FormulaResult {
  const widthM      = i.widthMm / 1000
  const heightM     = i.heightMm / 1000
  const radiusM     = i.radiusMm! / 1000
  const thicknessMm = i.thicknessMm
  const hf          = heightFactor(i.heightMm)

  const railLengthM = 6.29 * radiusM + 0.19 * 8
  const rungCount   = (widthM + 2 * radiusM + 0.3) / RUNG_SPACING + 3
  const rungLenTot  = rungCount * widthM + (4 * radiusM + 2 * widthM)
  const sideRailWt  = (heightM + 2 * LIP) * railLengthM * thicknessMm * DENSITY
  const rungWt      = rungLenTot * hf * thicknessMm * DENSITY
  const weightKg    = sideRailWt + rungWt
  const labourCost  = railLengthM * LAB_TEE

  return { weightKg, labourCost, marginType: 'fittings' }
}

// Unequal Cross — UCP (row 67)
function unequalCross(i: Inputs): FormulaResult {
  const widthM      = i.widthMm / 1000
  const width2M     = (i.width2Mm ?? i.widthMm) / 1000
  const heightM     = i.heightMm / 1000
  const radiusM     = i.radiusMm! / 1000
  const thicknessMm = i.thicknessMm
  const hf          = heightFactor(i.heightMm)

  const railLengthM = 6.29 * radiusM + 0.19 * 8
  const rungCount   = (width2M + 2 * radiusM + 0.3) / RUNG_SPACING
  const rungLenTot  = rungCount * widthM + (4 * radiusM + 2 * widthM) + 3 * width2M
  const sideRailWt  = (heightM + 2 * LIP) * railLengthM * thicknessMm * DENSITY
  const rungWt      = rungLenTot * hf * thicknessMm * DENSITY
  const weightKg    = sideRailWt + rungWt
  const labourCost  = railLengthM * LAB_TEE

  return { weightKg, labourCost, marginType: 'fittings' }
}

// Vertical Tee — VT (row 71)
// Rung weight references a missing cell in the workbook → rungWt = 0
function verticalTee(i: Inputs): FormulaResult {
  const widthM      = i.widthMm / 1000
  const heightM     = i.heightMm / 1000
  const radiusM     = i.radiusMm! / 1000
  const thicknessMm = i.thicknessMm

  const sideRailHeightDim = heightM + 2 * LIP + radiusM + 0.19
  const sideRailWidthDim  = heightM + 2 * LIP + 2 * radiusM + 0.19 * 2
  const sideRailWt        = sideRailHeightDim * sideRailWidthDim * thicknessMm * DENSITY * 2

  const rungCount = (1.572 * 2) / RUNG_SPACING   // 10.48
  const rungWt    = rungCount * widthM * 0        // ref broken in sheet → 0
  const weightKg  = sideRailWt + rungWt

  return { weightKg, labourCost: LAB_VT, marginType: 'fittings' }
}

// Inside/Outside Riser — IR90/60/45/30, OR90/60/45/30 (rows 80/84/88/92)
function makeRiser(productType: string) {
  return (i: Inputs): FormulaResult => {
    const riserParam  = RISER_PARAM[productType]!
    const widthM      = i.widthMm / 1000
    const heightM     = i.heightMm / 1000
    const radiusM     = i.radiusMm! / 1000
    const thicknessMm = i.thicknessMm
    const hf          = heightFactor(i.heightMm)

    const railLengthM = (heightM + radiusM + 0.15) * riserParam * 2
    const rungCount   = railLengthM / 2 / RUNG_SPACING + 1
    const sideRailWt  = (heightM + 2 * LIP) * railLengthM * thicknessMm * DENSITY
    const rungWt      = rungCount * widthM * hf * thicknessMm * DENSITY
    const weightKg    = sideRailWt + rungWt
    const labourCost  = (riserParam * radiusM + (riserParam * radiusM + heightM)) * LAB_RISER + 0.15 * 4 * LAB_RISER_PLATE

    return { weightKg, labourCost, marginType: 'fittings' }
  }
}

// Straight Reducer — RC (row 96)
function straightReducer(i: Inputs): FormulaResult {
  const widthM        = i.widthMm / 1000
  const width2M       = (i.width2Mm ?? i.widthMm) / 1000
  const heightM       = i.heightMm / 1000
  const thicknessMm   = i.thicknessMm
  const hf            = heightFactor(i.heightMm)

  const reducerLengthM = 1.324
  const rungLenTot     = widthM + width2M
  const sideRailWt     = (heightM + 2 * LIP) * reducerLengthM * thicknessMm * DENSITY
  const rungWt         = rungLenTot * hf * thicknessMm * DENSITY
  const weightKg       = sideRailWt + rungWt
  const labourCost     = reducerLengthM * LAB_REDUCER

  return { weightKg, labourCost, marginType: 'fittings' }
}

// Offset Reducer — RL/RR (row 100)
function offsetReducer(i: Inputs): FormulaResult {
  const widthM         = i.widthMm / 1000
  const width2M        = (i.width2Mm ?? i.widthMm) / 1000
  const heightM        = i.heightMm / 1000
  const thicknessMm    = i.thicknessMm
  const hf             = heightFactor(i.heightMm)

  const reducerLengthM = 1.262
  const rungLenTot     = widthM + width2M
  const sideRailWt     = (heightM + 2 * LIP) * reducerLengthM * thicknessMm * DENSITY
  const rungWt         = rungLenTot * hf * thicknessMm * DENSITY
  const weightKg       = sideRailWt + rungWt
  const labourCost     = reducerLengthM * LAB_REDUCER

  return { weightKg, labourCost, marginType: 'fittings' }
}

// ── Formula registry ─────────────────────────────────────────────────────────
// To add a new product type: add one entry here + one unit test. No other changes needed.

type FormulaFn = (i: Inputs) => FormulaResult

const FORMULAS: Record<string, FormulaFn> = {
  // Straight body
  ST: straight,

  // Horizontal elbows
  E90: makeElbow('E90'),
  E60: makeElbow('E60'),
  E45: makeElbow('E45'),
  E30: makeElbow('E30'),

  // Horizontal tees and crosses
  T:   tee,
  UT:  unequalTee,
  CP:  cross,
  UCP: unequalCross,

  // Vertical tee
  VT: verticalTee,

  // Inside risers
  IR90: makeRiser('IR90'),
  IR60: makeRiser('IR60'),
  IR45: makeRiser('IR45'),
  IR30: makeRiser('IR30'),

  // Outside risers (same geometry as inside risers)
  OR90: makeRiser('OR90'),
  OR60: makeRiser('OR60'),
  OR45: makeRiser('OR45'),
  OR30: makeRiser('OR30'),

  // Reducers
  RC: straightReducer,
  RL: offsetReducer,
  RR: offsetReducer,
}

// ── Public API ────────────────────────────────────────────────────────────────

// calcWeight is still exported for backward compatibility (seed.mjs, tests)
export function calcWeight(params: {
  widthMm: number | null
  heightMm: number | null
  thicknessMm: number
  lengthM: number | null
  radiusMm?: number | null
  productType: string
}): number {
  const fn = FORMULAS[params.productType]
  if (!fn || params.widthMm == null || params.heightMm == null) return 0
  try {
    return fn({
      widthMm:   params.widthMm,
      heightMm:  params.heightMm,
      thicknessMm: params.thicknessMm,
      lengthM:   params.lengthM,
      radiusMm:  params.radiusMm ?? null,
    }).weightKg
  } catch {
    return 0
  }
}

export function calcPrice(
  item: {
    widthMm: number | null
    heightMm: number | null
    thicknessMm: number
    lengthM: number | null
    radiusMm: number | null
    productType: string
    categoryId: string
  },
  prices: MaterialPrices,
  categoryFinish: 'HDG' | 'SS316' | 'SS304' | 'PLAIN'
): PriceBreakdown {
  const fn = FORMULAS[item.productType]
  const hasInputs = item.widthMm != null && item.heightMm != null

  if (!fn || !hasInputs) {
    // Unknown or non-geometric type: return zeroed breakdown
    const markupPct = prices['markup_fittings'] ?? 20
    return { weightKg: 0, materialCost: 0, galvCost: 0, labourCost: 0, totalCost: 0, markupPct, unitPrice: 0 }
  }

  const result = fn({
    widthMm:    item.widthMm!,
    heightMm:   item.heightMm!,
    thicknessMm: item.thicknessMm,
    lengthM:    item.lengthM,
    radiusMm:   item.radiusMm,
  })

  const { weightKg, labourCost, marginType } = result
  const galvKey = weightKg < 3 ? 'galv_under_3kg' : 'galv_over_3kg'

  const matRate     = materialRate(item.thicknessMm, prices)
  const materialCost = weightKg * matRate

  let galvCost = 0
  if (categoryFinish === 'HDG' && weightKg > 0) {
    const gRate = prices[galvKey] ?? 0
    galvCost = weightKg * gRate
  }

  const totalCost = materialCost + galvCost + labourCost
  const markupPct  = marginPct(marginType, prices)
  const unitPrice  = unitPriceFromCost(totalCost, markupPct)

  return { weightKg, materialCost, galvCost, labourCost, totalCost, markupPct, unitPrice }
}
