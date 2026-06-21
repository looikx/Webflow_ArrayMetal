import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import type { ApiResponse } from '@/types'

const QuerySchema = z.object({
  categoryId: z.string().optional(),
  action: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  cursor: z.coerce.number().optional(),
})

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = QuerySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { categoryId, action, limit, cursor } = parsed.data

  let query = supabase
    .from('audit_logs')
    .select('id, categoryId, action, entityType, entityId, field, oldValue, newValue, description, createdAt')
    .order('id', { ascending: false })
    .limit(limit)

  if (categoryId) query = query.eq('categoryId', categoryId)
  if (action) query = query.eq('action', action)
  if (cursor) query = query.lt('id', cursor)

  const { data, error } = await query
  if (error) return NextResponse.json<ApiResponse<never>>({ ok: false, error: error.message }, { status: 500 })

  const nextCursor = data && data.length === limit ? data[data.length - 1].id : null
  return NextResponse.json<ApiResponse<unknown>>({ ok: true, data, meta: { nextCursor, count: data?.length ?? 0 } })
}
