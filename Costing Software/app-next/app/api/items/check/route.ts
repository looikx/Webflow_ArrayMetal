import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CheckPartNumberSchema } from '@/lib/validators'
import type { ApiResponse } from '@/types'

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const parsed = CheckPartNumberSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'partNumber required' }, { status: 400 })
  }

  const { data } = await supabase
    .from('items')
    .select('id, partNumber, artNo')
    .eq('partNumber', parsed.data.partNumber)
    .maybeSingle()

  return NextResponse.json<ApiResponse<unknown>>({
    ok: true,
    data: { exists: !!data, item: data ?? null },
  })
}
