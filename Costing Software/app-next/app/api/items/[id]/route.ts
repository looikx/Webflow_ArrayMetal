import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { ApiResponse } from '@/types'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Invalid id' }, { status: 400 })

  const { data: item } = await supabase
    .from('items')
    .select('partNumber, artNo, categoryId, isActive')
    .eq('id', id)
    .single()

  if (!item) return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Item not found' }, { status: 404 })
  if (!item.isActive) return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Item already deactivated' }, { status: 409 })

  const { error } = await supabase.from('items').update({ isActive: false }).eq('id', id)
  if (error) return NextResponse.json<ApiResponse<never>>({ ok: false, error: error.message }, { status: 500 })

  await supabase.from('audit_logs').insert({
    categoryId: item.categoryId,
    action: 'ITEM_DEACTIVATED',
    entityType: 'item',
    entityId: String(id),
    description: `Deactivated item ${item.partNumber} (ART NO ${item.artNo})`,
  })

  return NextResponse.json<ApiResponse<unknown>>({ ok: true, data: { id } })
}
