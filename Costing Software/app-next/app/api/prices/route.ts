import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { ApiResponse } from '@/types'

export async function GET(req: NextRequest) {
  const finish = req.nextUrl.searchParams.get('finish')
  if (!finish) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'finish required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('material_prices')
    .select('id, key, displayName, value, unit, sortOrder, updatedAt')
    .eq('finish', finish)
    .order('sortOrder')

  if (error) return NextResponse.json<ApiResponse<never>>({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json<ApiResponse<unknown>>({ ok: true, data })
}
