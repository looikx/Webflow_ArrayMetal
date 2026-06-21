export interface ParsedPart {
  series: string
  productType: string
  widthMm: number | null
  width2Mm: number | null
  heightMm: number | null
  thicknessMm: number
  lengthM: number | null
  radiusMm: number | null
  gradeCode: string
  categoryId: string
  blockPrefix: string
}

export interface MaterialPrices {
  [key: string]: number
}

export interface PriceBreakdown {
  weightKg: number
  materialCost: number
  galvCost: number
  labourCost: number
  totalCost: number
  markupPct: number
  unitPrice: number
}

export interface ItemWithPrice {
  id: number
  partNumber: string
  artNo: number
  description: string
  categoryId: string
  series: string
  productType: string
  widthMm: number | null
  heightMm: number | null
  thicknessMm: number
  lengthM: number | null
  radiusMm: number | null
  gradeCode: string
  source: string
  currentPrice: PriceBreakdown | null
}

export type ApiResponse<T> =
  | { ok: true; data: T; meta?: Record<string, unknown> }
  | { ok: false; error: unknown }

