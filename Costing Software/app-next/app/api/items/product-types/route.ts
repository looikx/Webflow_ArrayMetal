import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import type { ApiResponse } from '@/types'

const QuerySchema = z.object({
  categoryId: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = QuerySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { categoryId } = parsed.data

  // Page through all items to count by productType (PostgREST default max 1000/page)
  const PAGE = 1000
  const counts: Record<string, number> = {}
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('items')
      .select('productType')
      .eq('categoryId', categoryId)
      .eq('isActive', true)
      .range(from, from + PAGE - 1)

    if (error) return NextResponse.json<ApiResponse<never>>({ ok: false, error: error.message }, { status: 500 })
    if (!data || data.length === 0) break

    for (const row of data) {
      counts[row.productType] = (counts[row.productType] ?? 0) + 1
    }

    if (data.length < PAGE) break
    from += PAGE
  }

  const result = Object.entries(counts)
    .map(([productType, count]) => ({ productType, count }))
    .sort((a, b) => a.productType.localeCompare(b.productType))

  return NextResponse.json<ApiResponse<unknown>>({ ok: true, data: result })
}

