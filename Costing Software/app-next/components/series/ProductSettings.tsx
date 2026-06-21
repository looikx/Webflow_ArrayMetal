'use client'

import { useState, useRef } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Loader2, Search, Plus } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ReactQueryProvider from '@/components/ReactQueryProvider'
import { AddItemSheet } from '@/components/items/AddItemSheet'
import { toast } from 'sonner'

const LIMIT = 50

const PRODUCT_TYPES = [
  'ST','E30','E45','E90','OR30','OR45','OR90','IR30','IR45','IR90',
  'T','UT','CP','UCP','RC','RL','RR','LC','DI','SP','HSP','VSP',
  'VLSP','VSF','EP','ESP','RP','FDI','PC6D','PEC','CCDP6',
  'CCE','CCG','CCH','CCK',
  'HDCA1','HDCA2','HDCA3','HDCAV','HDCAV1','HDCAV2',
  'HDCB1','HDCB2','HDCB3','HDCC1','HDCC2','HDCC3',
  'HDCD1','HDCD2','HDCD3',
  'HDCF38','HDCF50','HDCF75','HDCF100',
  'HDCG1','HDCG2','HDCG3','HDCJ1','HDCJ2','HDCJ3',
]

async function fetchItems({ pageParam, filters }: { pageParam: number | null; filters: Record<string, string> }) {
  const params = new URLSearchParams({ limit: String(LIMIT), ...filters })
  if (pageParam) params.set('cursor', String(pageParam))
  const res = await fetch(`/api/items?${params}`)
  return res.json()
}

const FINISH_GRADE: Record<string, string> = { HDG: 'G', SS316: 'A4', SS304: 'A2' }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-900 text-sm font-medium text-right">{value}</span>
    </>
  )
}

function ItemDetailSheet({
  item,
  open,
  onOpenChange,
  onDeleted,
}: {
  item: any
  open: boolean
  onOpenChange: (v: boolean) => void
  onDeleted: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.ok) { toast.error(json.error ?? 'Delete failed'); return }
      toast.success(`Removed ${item.partNumber}`)
      onOpenChange(false)
      onDeleted()
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setDeleting(false)
    }
  }

  const pr = item?.price_records?.[0]

  return (
    <Sheet open={open} onOpenChange={v => { onOpenChange(v); if (!v) setConfirmDelete(false) }}>
      <SheetContent className="w-[460px] overflow-y-auto flex flex-col gap-0 p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b bg-gray-50">
          <SheetHeader>
            <SheetTitle className="font-mono text-sm text-gray-900 leading-tight">{item.partNumber}</SheetTitle>
            <SheetDescription className="text-xs text-gray-500 mt-1 leading-snug">{item.description}</SheetDescription>
          </SheetHeader>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{item.productType}</Badge>
            <span className="text-xs text-gray-400 font-mono">ART {item.artNo}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Dimensions */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dimensions</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-gray-50 rounded-lg px-4 py-3">
              <Row label="Series" value={item.series} />
              {item.widthMm != null && <Row label="Width" value={`${item.widthMm} mm`} />}
              {item.heightMm != null && <Row label="Height" value={`${item.heightMm} mm`} />}
              <Row label="Thickness" value={`${item.thicknessMm} mm`} />
              {item.lengthM != null && <Row label="Length" value={`${item.lengthM} m`} />}
              {item.radiusMm != null && <Row label="Radius" value={`${item.radiusMm} mm`} />}
            </div>
          </div>

          {/* Price breakdown */}
          {pr && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Price Breakdown</p>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-50">
                    {[
                      ['Weight', `${pr.weightKg.toFixed(3)} kg`],
                      ['Material cost', `RM ${pr.materialCost.toFixed(2)}`],
                      ['Galv cost', `RM ${pr.galvCost.toFixed(2)}`],
                      ['Labour cost', `RM ${pr.labourCost.toFixed(2)}`],
                      ['Total cost', `RM ${pr.totalCost.toFixed(2)}`],
                      ['Markup', `${pr.markupPct}%`],
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-end px-4 py-2.5 gap-1">
                        <span className="text-sm text-gray-500 shrink-0">{label}</span>
                        <span className="flex-1 border-b border-dotted border-gray-200 mb-1" />
                        <span className="text-sm text-gray-800 tabular-nums text-right shrink-0">{val}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Unit Price</span>
                  <span className="text-xl font-bold tabular-nums">RM {pr.unitPrice.toFixed(2)}</span>
                </CardFooter>
              </Card>
              <p className="text-xs text-gray-400 mt-2">
                Calculated {new Date(pr.calculatedAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
              </p>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="px-6 pb-6 pt-4 border-t">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Danger Zone</p>
          {!confirmDelete ? (
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Item
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                Remove <span className="font-mono font-semibold">{item.partNumber}</span>? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                  Confirm Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ProductSettingsInner({ categoryId, finish }: { categoryId: string; finish: string }) {
  const [search, setSearch] = useState('')
  const [productType, setProductType] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const gradeCode = FINISH_GRADE[finish]
  const filters: Record<string, string> = { categoryId }
  if (gradeCode) filters.gradeCode = gradeCode
  if (productType) filters.productType = productType
  if (search) filters.search = search

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useInfiniteQuery({
    queryKey: ['product-settings-items', filters],
    queryFn: ({ pageParam }) => fetchItems({ pageParam: pageParam as number | null, filters }),
    initialPageParam: null as number | null,
    getNextPageParam: (last) => last?.meta?.nextCursor ?? null,
  })

  const allItems = data?.pages.flatMap(p => p.data ?? []) ?? []

  const virtualizer = useVirtualizer({
    count: hasNextPage ? allItems.length + 1 : allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const last = virtualItems[virtualItems.length - 1]
  if (last && last.index >= allItems.length - 1 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search part number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 7, padding: '8px 13px 8px 32px', fontSize: 13, fontFamily: 'var(--font-sans)', background: '#fff', color: '#0f172a', outline: 'none' }}
          />
        </div>

        {/* Product type filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={productType}
            onChange={e => setProductType(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: 7, padding: '8px 32px 8px 13px', fontSize: 13, fontFamily: 'var(--font-sans)', background: '#fff', color: productType ? '#0f172a' : '#94a3b8', appearance: 'none', cursor: 'pointer', outline: 'none' }}
          >
            <option value="">All types</option>
            {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {isLoading ? '…' : `${allItems.length.toLocaleString()} loaded`}
        </span>

        {/* Add Item */}
        <button
          onClick={() => setAddOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, background: '#2563eb', color: '#fff', marginLeft: 'auto', flexShrink: 0 }}
        >
          <Plus size={13} />
          Add Item
        </button>
      </div>

      <AddItemSheet open={addOpen} onOpenChange={setAddOpen} onSuccess={() => refetch()} />

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8edf4', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '108px 1fr 80px 80px 70px 100px 96px 96px', background: '#f8fafc', borderBottom: '1px solid #e8edf4' }}>
          {['Art No', 'Part Number', 'H (mm)', 'W (mm)', 'T (mm)', 'L / R (mm)', 'Weight (kg)', 'Price (RM)'].map((h, i) => (
            <div key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: i >= 2 ? 'center' : 'left', whiteSpace: 'nowrap' }}>{h}</div>
          ))}
        </div>

        {/* Virtualised rows */}
        <div ref={parentRef} style={{ height: 440, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: '#94a3b8' }}>
              <Loader2 size={16} className="animate-spin" />
              <span style={{ fontSize: 13 }}>Loading…</span>
            </div>
          ) : allItems.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>
              No items found
            </div>
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualItems.map(vItem => {
                const item = allItems[vItem.index]
                const isLoader = vItem.index >= allItems.length
                return (
                  <div
                    key={vItem.key}
                    ref={virtualizer.measureElement}
                    data-index={vItem.index}
                    style={{ position: 'absolute', top: vItem.start, left: 0, right: 0 }}
                  >
                    {isLoader ? (
                      isFetchingNextPage ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 6, color: '#94a3b8', fontSize: 12 }}>
                          <Loader2 size={13} className="animate-spin" /> Loading more…
                        </div>
                      ) : null
                    ) : item ? (
                      <button
                        onClick={() => setSelected(item)}
                        style={{ display: 'grid', gridTemplateColumns: '108px 1fr 80px 80px 70px 100px 96px 96px', borderBottom: '1px solid #f8fafc', alignItems: 'center', width: '100%', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ padding: '11px 14px', fontSize: 12, fontWeight: 400, fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{item.artNo}</div>
                        <div style={{ padding: '11px 14px', fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--font-mono)', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.partNumber}</div>
                        <div style={{ padding: '11px 14px', fontSize: 13, color: '#374151', textAlign: 'center', fontWeight: 400 }}>{item.heightMm ?? '—'}</div>
                        <div style={{ padding: '11px 14px', fontSize: 13, color: '#374151', textAlign: 'center', fontWeight: 400 }}>{item.widthMm ?? '—'}</div>
                        <div style={{ padding: '11px 14px', fontSize: 13, color: '#374151', textAlign: 'center', fontWeight: 400 }}>{item.thicknessMm ?? '—'}</div>
                        <div style={{ padding: '11px 14px', fontSize: 13, color: '#374151', textAlign: 'center', fontWeight: 400 }}>
                          {item.lengthM != null ? Math.round(item.lengthM * 1000) : item.radiusMm != null ? `R${item.radiusMm}` : '—'}
                        </div>
                        <div style={{ padding: '11px 14px', fontSize: 13, color: '#374151', textAlign: 'center', fontWeight: 400 }}>
                          {item.price_records?.[0]?.weightKg != null ? Number(item.price_records[0].weightKg).toFixed(2) : '—'}
                        </div>
                        <div style={{ padding: '11px 14px', fontSize: 13, color: '#0f172a', textAlign: 'center', fontWeight: 600 }}>
                          {item.price_records?.[0]?.unitPrice != null ? Number(item.price_records[0].unitPrice).toFixed(2) : '—'}
                        </div>
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <ItemDetailSheet
          item={selected}
          open={!!selected}
          onOpenChange={open => { if (!open) setSelected(null) }}
          onDeleted={() => {
            setSelected(null)
            refetch()
            queryClient.invalidateQueries({ queryKey: ['items'] })
          }}
        />
      )}
    </div>
  )
}

export function ProductSettings({ categoryId, finish }: { categoryId: string; finish: string }) {
  return (
    <ReactQueryProvider>
      <ProductSettingsInner categoryId={categoryId} finish={finish} />
    </ReactQueryProvider>
  )
}
