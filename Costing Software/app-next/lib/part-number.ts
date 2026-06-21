import type { ParsedPart } from '@/types'

// Series → { categoryId, blockPrefix, heightMm }
const SERIES_MAP: Record<string, { categoryId: string; blockPrefix: string; heightMm: number }> = {
  AML100: { categoryId: 'HDG_CABLE_LADDER', blockPrefix: '113', heightMm: 100 },
  AML125: { categoryId: 'HDG_CABLE_LADDER', blockPrefix: '114', heightMm: 125 },
  AML150: { categoryId: 'HDG_CABLE_LADDER', blockPrefix: '115', heightMm: 150 },
  APO100: { categoryId: 'SS316_CABLE_LADDER', blockPrefix: '122', heightMm: 100 },
  APO125: { categoryId: 'SS316_CABLE_LADDER', blockPrefix: '123', heightMm: 125 },
  APO150: { categoryId: 'SS316_CABLE_LADDER', blockPrefix: '124', heightMm: 150 },
  LC:     { categoryId: 'LADDER_COVER',       blockPrefix: '156', heightMm: 0 },
}

// Product types that use a radius dimension (elbows, risers)
const RADIUS_TYPES = new Set([
  'E30','E45','E60','E90',
  'OR30','OR45','OR60','OR90',
  'IR30','IR45','IR60','IR90',
])

// Product types with two width dimensions: SERIES-TYPE-W1-W2-T-DIM-GRADE (7 segments)
const DUAL_WIDTH_TYPES = new Set(['UT', 'UCP', 'RC', 'RL', 'RR'])

export function parsePart(partNumber: string): ParsedPart | null {
  if (!partNumber) return null

  const parts = partNumber.split('-')
  if (parts.length < 5) return null

  // Detect series (first token)
  const series = parts[0]
  const seriesMeta = SERIES_MAP[series]
  if (!seriesMeta) return null

  // LC format: LC-{W}-{T}-{L}-{GRADE}  (no productType segment)
  if (series === 'LC') {
    if (parts.length < 5) return null
    const [, widthStr, thickStr, lenStr, gradeCode] = parts
    return {
      series,
      productType: 'LC',
      widthMm: parseFloat(widthStr),
      width2Mm: null,
      heightMm: null,
      thicknessMm: parseFloat(thickStr),
      lengthM: parseFloat(lenStr),
      radiusMm: null,
      gradeCode,
      categoryId: seriesMeta.categoryId,
      blockPrefix: seriesMeta.blockPrefix,
    }
  }

  // Determine productType to know which format to use
  const productType = parts[1]

  // Dual-width format: {SERIES}-{TYPE}-{W1}-{W2}-{T}-{DIM}-{GRADE} (7 segments)
  if (DUAL_WIDTH_TYPES.has(productType)) {
    if (parts.length < 7) return null
    const [, , widthStr, width2Str, thickStr, dimStr, gradeCode] = parts
    const widthMm = parseFloat(widthStr)
    const width2Mm = parseFloat(width2Str)
    const thicknessMm = parseFloat(thickStr)
    const radiusMm = dimStr.startsWith('R') ? parseFloat(dimStr.slice(1)) * 10 : null
    const lengthM = dimStr.startsWith('R') ? null : parseFloat(dimStr)
    return {
      series, productType, widthMm, width2Mm,
      heightMm: seriesMeta.heightMm, thicknessMm, lengthM, radiusMm,
      gradeCode, categoryId: seriesMeta.categoryId, blockPrefix: seriesMeta.blockPrefix,
    }
  }

  // Standard format: {SERIES}-{TYPE}-{W}-{T}-{DIM}-{GRADE} (6 segments)
  if (parts.length < 6) return null
  const [, , widthStr, thickStr, dimStr, gradeCode] = parts

  const widthMm = parseFloat(widthStr)
  const thicknessMm = parseFloat(thickStr)
  const radiusMm = dimStr.startsWith('R') ? parseFloat(dimStr.slice(1)) * 10 : null
  const lengthM = dimStr.startsWith('R') ? null : parseFloat(dimStr)

  return {
    series, productType, widthMm, width2Mm: null,
    heightMm: seriesMeta.heightMm, thicknessMm, lengthM, radiusMm,
    gradeCode, categoryId: seriesMeta.categoryId, blockPrefix: seriesMeta.blockPrefix,
  }
}

export function generatePartNumber(params: ParsedPart): string {
  const { series, productType, widthMm, width2Mm, thicknessMm, lengthM, radiusMm, gradeCode } = params

  if (series === 'LC') {
    return `LC-${widthMm}-${thicknessMm}-${lengthM}-${gradeCode}`
  }

  const dim = radiusMm != null ? `R${radiusMm / 10}` : `${lengthM}`

  if (DUAL_WIDTH_TYPES.has(productType) && width2Mm != null) {
    return `${series}-${productType}-${widthMm}-${width2Mm}-${thicknessMm}-${dim}-${gradeCode}`
  }

  return `${series}-${productType}-${widthMm}-${thicknessMm}-${dim}-${gradeCode}`
}

export function generateDescription(params: ParsedPart, categoryDisplayName: string): string {
  const { series, productType, widthMm, heightMm, thicknessMm, lengthM, radiusMm, gradeCode } = params

  const finish = gradeCode === 'G' ? 'HDG' : gradeCode === 'A4' ? 'SS316L' : gradeCode
  const hStr = heightMm ? `${heightMm}H ` : ''

  const typeLabels: Record<string, string> = {
    ST: 'Straight Cable Ladder',
    E30: 'Horizontal Elbow 30°', E45: 'Horizontal Elbow 45°',
    E60: 'Horizontal Elbow 60°', E90: 'Horizontal Elbow 90°',
    OR30: 'Outside Riser 30°', OR45: 'Outside Riser 45°',
    OR60: 'Outside Riser 60°', OR90: 'Outside Riser 90°',
    IR30: 'Inside Riser 30°', IR45: 'Inside Riser 45°',
    IR60: 'Inside Riser 60°', IR90: 'Inside Riser 90°',
    T: 'Horizontal Tee', UT: 'Horizontal Unequal Tee',
    CP: 'Horizontal Cross', UCP: 'Horizontal Unequal Cross',
    RC: 'Reducer', RL: 'Reducer Left', RR: 'Reducer Right',
    LC: 'Ladder Cover',
    DI: 'Divider', SP: 'Splice Plate', HSP: 'Horizontal Splice Plate',
    VSP: 'Vertical Splice Plate', VLSP: 'Vertical Lapped Splice Plate',
    VSF: 'Vertical Splice Flat', EP: 'End Plate', ESP: 'Earth Splice Plate',
    RP: 'Rung Protector', FDI: 'Fixed Divider',
  }

  const typeLabel = typeLabels[productType] ?? productType
  const dimParts: string[] = []
  if (widthMm != null) dimParts.push(`${widthMm}W`)
  dimParts.push(`${thicknessMm}T`)
  if (lengthM != null) dimParts.push(`${lengthM}L`)
  if (radiusMm != null) dimParts.push(`R${radiusMm}`)

  return `${finish} Roll Form ${hStr}${typeLabel}-${dimParts.join('-')}`
}
