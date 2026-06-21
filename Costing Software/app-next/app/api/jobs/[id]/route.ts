import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { ApiResponse } from '@/types'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Invalid id' }, { status: 400 })

  const { data, error } = await supabase
    .from('job_records')
    .select('id,type,status,categoryId,progress,totalItems,processed,resultMsg,errorMsg,startedAt,completedAt,createdAt')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'Job not found' }, { status: 404 })
  return NextResponse.json<ApiResponse<unknown>>({ ok: true, data })
}
