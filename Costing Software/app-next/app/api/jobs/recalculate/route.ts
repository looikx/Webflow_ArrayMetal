import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calcPrice } from '@/lib/engine'
import type { MaterialPrices, ApiResponse } from '@/types'

const BATCH = 500
const PAGE = 1000

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  // Resolve the set of categoryIds to recalculate.
  // Accepts either { finish } (recalculate all categories of that finish)
  // or { categoryId } (single category, legacy).
  let categoryIds: string[] = []
  let finish: string | null = null

  if (body.finish) {
    finish = body.finish as string
    const { data: cats } = await supabase
      .from('product_categories')
      .select('id')
      .eq('finish', finish)
      .eq('isActive', true)
    categoryIds = (cats ?? []).map((c: { id: string }) => c.id)
  } else {
    const categoryId = body.categoryId ?? 'HDG_CABLE_LADDER'
    categoryIds = [categoryId]
    const { data: cat } = await supabase.from('product_categories').select('finish').eq('id', categoryId).single()
    finish = cat?.finish ?? 'HDG'
  }

  if (categoryIds.length === 0) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: 'No categories found' }, { status: 400 })
  }

  // Shared material rates for this finish
  const { data: priceRows } = await supabase
    .from('material_prices')
    .select('key,value')
    .eq('finish', finish)
  const materialPrices = Object.fromEntries((priceRows ?? []).map((r: { key: string; value: number }) => [r.key, r.value]))

  // Create one job record
  const { data: job } = await supabase
    .from('job_records')
    .insert({
      type: 'RECALCULATE',
      status: 'RUNNING',
      categoryId: categoryIds[0],
      startedAt: new Date().toISOString(),
    })
    .select('id')
    .single()
  const jobId = job?.id

  try {
    let totalProcessed = 0

    for (const categoryId of categoryIds) {
      // Merge material rates (finish-wide) with galv+markup (per category)
      const { data: settingRows } = await supabase
        .from('category_settings')
        .select('key,value')
        .eq('categoryId', categoryId)
      const prices = {
        ...materialPrices,
        ...Object.fromEntries((settingRows ?? []).map((r: { key: string; value: number }) => [r.key, r.value])),
      } as MaterialPrices

      // Fetch all items in this category
      let allItems: any[] = []
      let from = 0
      while (true) {
        const { data, error } = await supabase
          .from('items')
          .select('id,productType,widthMm,heightMm,thicknessMm,lengthM,radiusMm')
          .eq('categoryId', categoryId)
          .eq('isActive', true)
          .order('id')
          .range(from, from + PAGE - 1)
        if (error) throw new Error(error.message)
        if (!data?.length) break
        allItems = allItems.concat(data)
        from += PAGE
        if (data.length < PAGE) break
      }

      if (allItems.length === 0) continue

      // Mark old price records not-current
      const itemIds = allItems.map((item: any) => item.id)
      for (let i = 0; i < itemIds.length; i += PAGE) {
        const { error } = await supabase
          .from('price_records')
          .update({ isCurrent: false })
          .eq('isCurrent', true)
          .in('itemId', itemIds.slice(i, i + PAGE))
        if (error) throw new Error(error.message)
      }

      // Build and insert new price records
      const newRecords = allItems.map((item: any) => {
        const breakdown = calcPrice(
          {
            widthMm: item.widthMm,
            heightMm: item.heightMm,
            thicknessMm: item.thicknessMm,
            lengthM: item.lengthM,
            radiusMm: item.radiusMm,
            productType: item.productType,
            categoryId,
          },
          prices,
          finish as 'HDG' | 'SS316' | 'SS304' | 'PLAIN'
        )
        return {
          itemId: item.id,
          weightKg: breakdown.weightKg ?? 0,
          materialCost: breakdown.materialCost,
          galvCost: breakdown.galvCost,
          labourCost: breakdown.labourCost,
          totalCost: breakdown.totalCost,
          markupPct: breakdown.markupPct,
          unitPrice: breakdown.unitPrice,
          pricesSnapshot: prices,
          isCurrent: true,
        }
      })

      for (let i = 0; i < newRecords.length; i += BATCH) {
        const { error } = await supabase.from('price_records').insert(newRecords.slice(i, i + BATCH))
        if (error) throw new Error(error.message)
      }

      // Audit log per category
      await supabase.from('audit_logs').insert({
        categoryId,
        action: 'RECALCULATE_DONE',
        description: `Recalculated ${allItems.length} items`,
      })

      totalProcessed += allItems.length
    }

    await supabase.from('job_records').update({
      status: 'DONE',
      processed: totalProcessed,
      totalItems: totalProcessed,
      progress: 100,
      resultMsg: `Recalculated ${totalProcessed} items across ${categoryIds.length} categories`,
      completedAt: new Date().toISOString(),
    }).eq('id', jobId)

    return NextResponse.json<ApiResponse<unknown>>({ ok: true, data: { jobId, processed: totalProcessed } })
  } catch (err: any) {
    await supabase.from('job_records').update({
      status: 'FAILED',
      errorMsg: err.message,
      completedAt: new Date().toISOString(),
    }).eq('id', jobId)
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: err.message }, { status: 500 })
  }
}
