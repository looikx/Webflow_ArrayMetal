import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import ExcelJS from 'exceljs'
import type { ApiResponse } from '@/types'

const PAGE = 1000

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { ExportSchema } = await import('@/lib/validators')
  const parsed = ExportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>({ ok: false, error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const categoryId = parsed.data.categoryId ?? 'HDG_CABLE_LADDER'
  const series: string | undefined = parsed.data.series

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Price List')

  ws.columns = [
    { header: 'ART NO', key: 'artNo', width: 12 },
    { header: 'PART NUMBER', key: 'partNumber', width: 30 },
    { header: 'DESCRIPTION', key: 'description', width: 60 },
    { header: 'SERIES', key: 'series', width: 10 },
    { header: 'TYPE', key: 'productType', width: 10 },
    { header: 'WIDTH (mm)', key: 'widthMm', width: 12 },
    { header: 'THICKNESS (mm)', key: 'thicknessMm', width: 15 },
    { header: 'LENGTH (m)', key: 'lengthM', width: 12 },
    { header: 'RADIUS (mm)', key: 'radiusMm', width: 12 },
    { header: 'WEIGHT (kg)', key: 'weightKg', width: 12 },
    { header: 'MATERIAL COST (RM)', key: 'materialCost', width: 20 },
    { header: 'GALV COST (RM)', key: 'galvCost', width: 16 },
    { header: 'LABOUR COST (RM)', key: 'labourCost', width: 18 },
    { header: 'TOTAL COST (RM)', key: 'totalCost', width: 16 },
    { header: 'MARKUP (%)', key: 'markupPct', width: 12 },
    { header: 'UNIT PRICE (RM)', key: 'unitPrice', width: 16 },
  ]

  // Freeze header
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.getRow(1).font = { bold: true }

  // Stream items
  let from = 0
  let totalRows = 0
  while (true) {
    let query = supabase
      .from('items')
      .select(`
        artNo, partNumber, description, series, productType, widthMm, thicknessMm, lengthM, radiusMm,
        price_records!inner(weightKg, materialCost, galvCost, labourCost, totalCost, markupPct, unitPrice)
      `)
      .eq('categoryId', categoryId)
      .eq('isActive', true)
      .eq('price_records.isCurrent', true)
      .order('artNo')
      .range(from, from + PAGE - 1)

    if (series) query = query.eq('series', series)

    const { data, error } = await query
    if (error) return NextResponse.json<ApiResponse<never>>({ ok: false, error: error.message }, { status: 500 })
    if (!data?.length) break

    for (const item of data) {
      const pr = Array.isArray(item.price_records) ? item.price_records[0] : item.price_records
      ws.addRow({
        artNo: item.artNo,
        partNumber: item.partNumber,
        description: item.description,
        series: item.series,
        productType: item.productType,
        widthMm: item.widthMm,
        thicknessMm: item.thicknessMm,
        lengthM: item.lengthM,
        radiusMm: item.radiusMm,
        weightKg: pr?.weightKg != null ? Math.round(pr.weightKg * 100) / 100 : '',
        materialCost: pr?.materialCost != null ? Math.round(pr.materialCost * 100) / 100 : '',
        galvCost: pr?.galvCost != null ? Math.round(pr.galvCost * 100) / 100 : '',
        labourCost: pr?.labourCost != null ? Math.round(pr.labourCost * 100) / 100 : '',
        totalCost: pr?.totalCost != null ? Math.round(pr.totalCost * 100) / 100 : '',
        markupPct: pr?.markupPct,
        unitPrice: pr?.unitPrice != null ? Math.round(pr.unitPrice * 100) / 100 : '',
      })
    }

    totalRows += data.length
    from += PAGE
    if (data.length < PAGE) break
  }

  const buffer = await wb.xlsx.writeBuffer()
  const filename = `array-metal-${categoryId.toLowerCase().replace(/_/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`

  await supabase.from('audit_logs').insert({
    categoryId,
    action: 'EXPORT_GENERATED',
    entityType: 'export',
    description: `Exported ${totalRows} items — ${series ?? 'all series'}`,
  })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Total-Rows': String(totalRows),
    },
  })
}
