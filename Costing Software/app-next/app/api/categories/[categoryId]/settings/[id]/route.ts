import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { UpdatePriceSchema } from '@/lib/validators'
import type { ApiResponse } from '@/types'

export async function PUT(
  req: NextRequest,
  { params }: { params: { categoryId: string; id: string } }
) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const parsed = UpdatePriceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { data: current } = await supabase
    .from('category_settings')
    .select('value, key')
    .eq('id', id)
    .eq('categoryId', params.categoryId)
    .single()
  if (!current) return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Setting not found' }, { status: 404 })

  const { error } = await supabase
    .from('category_settings')
    .update({ value: parsed.data.value })
    .eq('id', id)
  if (error) return NextResponse.json<ApiResponse<never>>({ ok: false, error: error.message }, { status: 500 })

  await supabase.from('audit_logs').insert({
    categoryId: params.categoryId,
    categorySettingId: id,
    action: 'PRICE_UPDATED',
    entityType: 'category_setting',
    entityId: String(id),
    field: current.key,
    oldValue: String(current.value),
    newValue: String(parsed.data.value),
    description: `${params.categoryId} setting updated: ${current.key} ${current.value} → ${parsed.data.value}`,
  })

  return NextResponse.json<ApiResponse<unknown>>({ ok: true, data: { id, value: parsed.data.value } })
}
