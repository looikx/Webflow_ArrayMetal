'use client'

import { useState, useRef } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2, Search, PlusIcon } from 'lucide-react'
import ReactQueryProvider from '@/components/ReactQueryProvider'
import { Button } from '@/components/ui/button'
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

function ItemRegistryInner() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('HDG_CABLE_LADDER')
  const [series, setSeries] = useState('')
  const [productType, setProductType] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [addOpen, setAddOpen] = useState(false)
  const queryClient = useQueryClient()
  const parentRef = useRef<HTMLDivElement>(null)

  const filters: Record<string, string> = { categoryId: category }
  if (series) filters.series = series
  if (productType) filters.productType = productType
  if (search) filters.search = search

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['items', filters],
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

  const lastVirtualItem = virtualItems[virtualItems.length - 1]
  if (lastVirtualItem && lastVirtualItem.index >= allItems.length - 1 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage()
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b bg-white shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search part number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 w-64 text-sm"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v ?? 'HDG_CABLE_LADDER')}>
          <SelectTrigger className="h-8 w-48 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HDG_CABLE_LADDER">HDG Cable Ladder</SelectItem>
            <SelectItem value="SS316_CABLE_LADDER">SS316L Cable Ladder</SelectItem>
          </SelectContent>
        </Select>
        <Select value={series} onValueChange={(v) => setSeries(v ?? '')}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="All series" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All series</SelectItem>
            <SelectItem value="AML100">AML100</SelectItem>
            <SelectItem value="AML125">AML125</SelectItem>
            <SelectItem value="AML150">AML150</SelectItem>
          </SelectContent>
        </Select>
        <Select value={productType} onValueChange={(v) => setProductType(v ?? '')}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {PRODUCT_TYPES.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {allItems.length > 0 && (
          <span className="text-xs text-gray-500 ml-auto">
            {allItems.length.toLocaleString()} loaded
          </span>
        )}
        <Button size="sm" className="h-8 gap-1.5" onClick={() => setAddOpen(true)}>
          <PlusIcon size={13} />
          Add Item
        </Button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[120px_240px_1fr_90px_90px_100px] gap-4 px-6 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500 shrink-0">
        <div>ART NO</div>
        <div>PART NUMBER</div>
        <div>DESCRIPTION</div>
        <div>TYPE</div>
        <div className="text-right">WEIGHT</div>
        <div className="text-right">UNIT PRICE</div>
      </div>

      {/* Virtualised rows */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <Loader2 size={18} className="animate-spin mr-2" /> Loading...
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
                  className={isLoader ? 'flex items-center justify-center py-3 text-gray-400 text-sm' : ''}
                >
                  {isLoader ? (
                    isFetchingNextPage ? <><Loader2 size={14} className="animate-spin mr-2" /> Loading more...</> : null
                  ) : item ? (
                    <button
                      onClick={() => setSelected(item)}
                      className="grid grid-cols-[120px_240px_1fr_90px_90px_100px] gap-4 px-6 py-2.5 w-full text-left hover:bg-blue-50 transition-colors border-b border-gray-100 text-sm"
                    >
                      <span className="font-mono text-xs text-gray-500">{item.artNo}</span>
                      <span className="font-medium text-gray-900 truncate">{item.partNumber}</span>
                      <span className="text-gray-600 truncate">{item.description}</span>
                      <span>
                        <Badge variant="secondary" className="text-xs">{item.productType}</Badge>
                      </span>
                      <span className="text-right text-gray-700">
                        {item.price_records?.[0]?.weightKg != null
                          ? `${item.price_records[0].weightKg.toFixed(2)} kg`
                          : '—'}
                      </span>
                      <span className="text-right font-medium text-gray-900">
                        {item.price_records?.[0]?.unitPrice != null
                          ? `RM ${item.price_records[0].unitPrice.toFixed(2)}`
                          : '—'}
                      </span>
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selected && (
        <ItemDetailSheet
          item={selected}
          open={!!selected}
          onOpenChange={open => { if (!open) setSelected(null) }}
          onDeleted={() => {
            setSelected(null)
            queryClient.invalidateQueries({ queryKey: ['items'] })
          }}
        />
      )}

      <AddItemSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['items'] })}
      />
    </div>
  )
}

export function ItemRegistry() {
  return (
    <ReactQueryProvider>
      <ItemRegistryInner />
    </ReactQueryProvider>
  )
}
