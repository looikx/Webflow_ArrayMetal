import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { ApiResponse } from '@/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const { data, error } = await supabase
    .from('category_settings')
    .select('id, key, displayName, value, unit, sortOrder, updatedAt')
    .eq('categoryId', params.categoryId)
    .order('sortOrder')

  if (error) return NextResponse.json<ApiResponse<never>>({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json<ApiResponse<unknown>>({ ok: true, data })
}
