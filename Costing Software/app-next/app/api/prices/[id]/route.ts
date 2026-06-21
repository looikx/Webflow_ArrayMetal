import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { UpdatePriceSchema } from '@/lib/validators'
import type { ApiResponse } from '@/types'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Invalid id' }, { status: 400 })

  const body: Record<string, unknown> = await req.json()
  const parsed = UpdatePriceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Fetch current value for audit
  const { data: current } = await supabase
    .from('material_prices')
    .select('value, key, finish')
    .eq('id', id)
    .single()
  if (!current) return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Price not found' }, { status: 404 })

  const { error } = await supabase.from('material_prices').update({ value: parsed.data.value }).eq('id', id)
  if (error) return NextResponse.json<ApiResponse<never>>({ ok: false, error: error.message }, { status: 500 })

  // Audit log — categoryId is optional context passed by the caller
  const callerCategoryId: string | undefined = typeof body.categoryId === 'string' ? body.categoryId : undefined

  await supabase.from('audit_logs').insert({
    categoryId: callerCategoryId ?? null,
    priceId: id,
    action: 'PRICE_UPDATED',
    entityType: 'material_price',
    entityId: String(id),
    field: current.key,
    oldValue: String(current.value),
    newValue: String(parsed.data.value),
    description: `Shared ${current.finish} price updated: ${current.key} ${current.value} → ${parsed.data.value}`,
  })

  return NextResponse.json<ApiResponse<unknown>>({ ok: true, data: { id, value: parsed.data.value } })
}
