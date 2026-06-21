import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ItemsQuerySchema, CreateItemSchema } from '@/lib/validators'
import { calcPrice } from '@/lib/engine'
import type { MaterialPrices, ApiResponse } from '@/types'

export async function GET(req: NextRequest) {
  const params: Record<string, string> = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = ItemsQuerySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { categoryId, series, productType, search, cursor, limit, countOnly, gradeCode } = parsed.data

  if (countOnly) {
    let countQuery = supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('isActive', true)
    if (categoryId) countQuery = countQuery.eq('categoryId', categoryId)
    if (series) countQuery = countQuery.eq('series', series)
    if (productType) countQuery = countQuery.eq('productType', productType)
    if (gradeCode) countQuery = countQuery.eq('gradeCode', gradeCode)
    if (search) countQuery = countQuery.ilike('partNumber', `%${search}%`)
    const { count, error } = await countQuery
    if (error) return NextResponse.json<ApiResponse<never>>({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json<ApiResponse<null>>({ ok: true, data: null, meta: { count: count ?? 0, nextCursor: null } })
  }

  let query = supabase
    .from('items')
    .select(`
      id, partNumber, artNo, description, categoryId, series, productType,
      widthMm, heightMm, thicknessMm, lengthM, radiusMm, gradeCode, isActive, createdAt,
      price_records!inner(id, weightKg, materialCost, galvCost, labourCost, totalCost, markupPct, unitPrice, calculatedAt)
    `)
    .eq('isActive', true)
    .eq('price_records.isCurrent', true)
    .order('id')
    .limit(limit)

  if (categoryId) query = query.eq('categoryId', categoryId)
  if (series) query = query.eq('series', series)
  if (productType) query = query.eq('productType', productType)
  if (gradeCode) query = query.eq('gradeCode', gradeCode)
  if (search) query = query.ilike('partNumber', `%${search}%`)
  if (cursor) query = query.gt('id', cursor)

  const { data, error } = await query
  if (error) return NextResponse.json<ApiResponse<never>>({ ok: false, error: error.message }, { status: 500 })

  const nextCursor = data && data.length === limit ? data[data.length - 1].id : null
  return NextResponse.json<ApiResponse<unknown>>({ ok: true, data, meta: { nextCursor, count: data?.length ?? 0 } })
}

const SERIES_BLOCK_PREFIX: Record<string, string> = {
  AML100: '113', AML125: '114', AML150: '115',
  APO100: '122', APO125: '123', APO150: '124',
  LC: '156',
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const input = parsed.data

  // Atomically claim the next ART NO for this series block
  const blockPrefix = SERIES_BLOCK_PREFIX[input.series]
  if (!blockPrefix) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: `Unknown series: ${input.series}` }, { status: 400 })
  }
  const { data: artNo, error: artNoErr } = await supabase.rpc('claim_next_art_no', { p_block_prefix: blockPrefix })
  if (artNoErr || artNo == null) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: artNoErr?.message ?? 'ART NO assignment failed' }, { status: 500 })
  }

  // Get category finish for price calc
  const { data: cat } = await supabase.from('product_categories').select('finish').eq('id', input.categoryId).single()
  const VALID_FINISHES = ['HDG', 'SS316', 'SS304', 'PLAIN'] as const
  const rawFinish = cat?.finish
  if (!rawFinish || !VALID_FINISHES.includes(rawFinish as typeof VALID_FINISHES[number])) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: `Unknown category finish: ${rawFinish ?? 'null'}` }, { status: 400 })
  }
  const finish = rawFinish as typeof VALID_FINISHES[number]

  // Get merged prices: shared material rates (by finish) + category galv/markup
  const { data: priceRows } = await supabase.from('material_prices').select('key,value').eq('finish', finish)
  const { data: settingRows } = await supabase.from('category_settings').select('key,value').eq('categoryId', input.categoryId)
  const prices = {
    ...Object.fromEntries((priceRows ?? []).map((r: { key: string; value: number }) => [r.key, r.value])),
    ...Object.fromEntries((settingRows ?? []).map((r: { key: string; value: number }) => [r.key, r.value])),
  } as MaterialPrices

  // Calculate price
  const breakdown = calcPrice(
    {
      widthMm: input.widthMm,
      heightMm: input.heightMm,
      thicknessMm: input.thicknessMm,
      lengthM: input.lengthM,
      radiusMm: input.radiusMm,
      productType: input.productType,
      categoryId: input.categoryId,
    },
    prices,
    finish
  )

  // Insert item
  const { data: newItem, error: itemErr } = await supabase
    .from('items')
    .insert({
      partNumber: input.partNumber,
      artNo,
      description: input.description,
      categoryId: input.categoryId,
      series: input.series,
      productType: input.productType,
      widthMm: input.widthMm,
      heightMm: input.heightMm,
      thicknessMm: input.thicknessMm,
      lengthM: input.lengthM,
      radiusMm: input.radiusMm,
      gradeCode: input.gradeCode,
      source: 'CREATED',
      isActive: true,
    })
    .select('id')
    .single()

  if (itemErr) {
    // 23505 = Postgres unique_violation (duplicate partNumber or artNo)
    if (itemErr.code === '23505') {
      const field = itemErr.message.includes('artNo') ? 'ART NO already assigned' : 'Part number already exists'
      return NextResponse.json<ApiResponse<never>>({ ok: false, error: field }, { status: 409 })
    }
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: itemErr.message }, { status: 500 })
  }

  // Insert price record
  const { error: priceErr } = await supabase.from('price_records').insert({
    itemId: newItem!.id,
    weightKg: breakdown.weightKg ?? 0,
    materialCost: breakdown.materialCost,
    galvCost: breakdown.galvCost,
    labourCost: breakdown.labourCost,
    totalCost: breakdown.totalCost,
    markupPct: breakdown.markupPct,
    unitPrice: breakdown.unitPrice,
    pricesSnapshot: prices,
    isCurrent: true,
  })
  if (priceErr) {
    console.error('price_record insert failed for item', newItem!.id, priceErr.message)
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Item created but price calculation failed — contact admin' }, { status: 500 })
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    categoryId: input.categoryId,
    action: 'ITEM_CREATED',
    entityType: 'item',
    entityId: String(newItem!.id),
    description: `Created item ${input.partNumber} (ART NO ${artNo})`,
  })

  return NextResponse.json<ApiResponse<unknown>>({ ok: true, data: { id: newItem!.id, artNo } }, { status: 201 })
}
