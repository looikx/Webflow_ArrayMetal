'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORY_LABELS: Record<string, string> = {
  HDG_CABLE_LADDER: 'HDG Cable Ladder',
  SS316_CABLE_LADDER: 'SS316L Cable Ladder',
}

type TrailEntry = {
  id: number
  categoryId: string | null
  description: string | null
  createdAt: string
}

function parseTrailDescription(desc: string | null) {
  if (!desc) return { rows: '—', series: '—' }
  const rowsMatch = desc.match(/Exported (\d+) items/)
  const seriesMatch = desc.match(/— (.+)$/)
  const seriesRaw = seriesMatch?.[1] ?? 'all series'
  return {
    rows: rowsMatch ? parseInt(rowsMatch[1], 10).toLocaleString() : '—',
    series: seriesRaw === 'all series' ? '—' : seriesRaw,
  }
}

export default function ExportPage() {
  const [categoryId, setCategoryId] = useState('HDG_CABLE_LADDER')
  const [series, setSeries] = useState('')
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [trail, setTrail] = useState<TrailEntry[]>([])

  const fetchTrail = useCallback(() => {
    fetch('/api/audit-logs?action=EXPORT_GENERATED&limit=20')
      .then(r => r.json())
      .then(data => setTrail(data.data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchTrail() }, [fetchTrail])

  useEffect(() => {
    setPreviewCount(null)
    const params = new URLSearchParams({ categoryId, countOnly: 'true' })
    if (series) params.set('series', series)
    fetch(`/api/items?${params}`)
      .then(r => r.json())
      .then(data => setPreviewCount(data.meta?.count ?? 0))
  }, [categoryId, series])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, series: series || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Export failed')
      }
      const blob = await res.blob()
      const filename = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? 'export.xlsx'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      const rows = res.headers.get('X-Total-Rows')
      toast.success(`Exported ${parseInt(rows ?? '0', 10).toLocaleString()} rows`)
      fetchTrail()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Header title="Export" subtitle="Download price lists as Excel" />
      <main className="flex-1 p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Export Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Product Line</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? 'HDG_CABLE_LADDER')}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HDG_CABLE_LADDER">HDG Cable Ladder</SelectItem>
                  <SelectItem value="SS316_CABLE_LADDER">SS316L Cable Ladder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Series (optional)</Label>
              <Select value={series} onValueChange={(v) => setSeries(v ?? '')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All series" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All series</SelectItem>
                  <SelectItem value="AML100">AML100</SelectItem>
                  <SelectItem value="AML125">AML125</SelectItem>
                  <SelectItem value="AML150">AML150</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 rounded-md px-4 py-3">
              <p className="text-xs text-gray-500">Preview</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {previewCount === null ? '...' : previewCount.toLocaleString()} items
              </p>
              {previewCount === 0
                ? <p className="text-xs text-amber-600 mt-0.5">No items found for this combination.</p>
                : <p className="text-xs text-gray-400 mt-0.5">will be exported</p>
              }
            </div>

            <Button onClick={handleExport} disabled={exporting || previewCount === 0} className="w-full">
              {exporting
                ? <><Loader2 size={14} className="animate-spin mr-2" /> Generating...</>
                : <><Download size={14} className="mr-2" /> Export to Excel</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="max-w-3xl mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Export Trail</CardTitle>
          </CardHeader>
          <CardContent>
            {trail.length === 0 ? (
              <p className="text-xs text-gray-400">No exports yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b">
                    <th className="text-left pb-2 font-medium">Timestamp</th>
                    <th className="text-left pb-2 font-medium">Product Line</th>
                    <th className="text-left pb-2 font-medium">Series</th>
                    <th className="text-right pb-2 font-medium">Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {trail.map(entry => {
                    const { rows, series: s } = parseTrailDescription(entry.description)
                    const ts = new Date(entry.createdAt)
                    const label = entry.categoryId ? (CATEGORY_LABELS[entry.categoryId] ?? entry.categoryId) : '—'
                    return (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="py-2 text-gray-600 tabular-nums whitespace-nowrap pr-6">
                          {ts.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })},{' '}
                          {ts.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 text-gray-800 pr-6">{label}</td>
                        <td className="py-2 text-gray-600 pr-6">{s}</td>
                        <td className="py-2 text-gray-800 text-right tabular-nums">{rows}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
