'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { PlusIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { generatePartNumber, generateDescription } from '@/lib/part-number'

const SERIES_OPTIONS = ['AML100', 'AML125', 'AML150'] as const
const THICKNESS_OPTIONS = ['1.2', '1.5', '1.6', '2.0', '2.5']

const SERIES_META: Record<string, { categoryId: string; heightMm: number; gradeCode: string }> = {
  AML100: { categoryId: 'HDG_CABLE_LADDER', heightMm: 100, gradeCode: 'G' },
  AML125: { categoryId: 'HDG_CABLE_LADDER', heightMm: 125, gradeCode: 'G' },
  AML150: { categoryId: 'HDG_CABLE_LADDER', heightMm: 150, gradeCode: 'G' },
}

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

const RADIUS_TYPES = new Set([
  'E30','E45','E60','E90',
  'OR30','OR45','OR60','OR90',
  'IR30','IR45','IR60','IR90',
])

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultSeries?: string
}

interface FormState {
  series: string
  productType: string
  widthMm: string
  thicknessMm: string
  dim: string  // length (m) or radius (mm) depending on type
}

const EMPTY: FormState = {
  series: 'AML100',
  productType: 'ST',
  widthMm: '',
  thicknessMm: '1.5',
  dim: '',
}

export function AddItemSheet({ open, onOpenChange, onSuccess, defaultSeries }: Props) {
  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY,
    series: defaultSeries ?? EMPTY.series,
  }))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRadiusType = RADIUS_TYPES.has(form.productType)
  const meta = SERIES_META[form.series]

  const preview = useMemo(() => {
    const widthMm = parseFloat(form.widthMm)
    const thicknessMm = parseFloat(form.thicknessMm)
    const dim = parseFloat(form.dim)
    if (!form.series || !form.productType || isNaN(thicknessMm) || isNaN(dim)) return null
    const parsed = {
      series: form.series,
      productType: form.productType,
      widthMm: isNaN(widthMm) ? null : widthMm,
      width2Mm: null,
      heightMm: meta.heightMm,
      thicknessMm,
      lengthM: isRadiusType ? null : dim,
      radiusMm: isRadiusType ? dim : null,
      gradeCode: meta.gradeCode,
      categoryId: meta.categoryId,
      blockPrefix: '',
    }
    return {
      partNumber: generatePartNumber(parsed),
      description: generateDescription(parsed, 'HDG Cable Ladder'),
    }
  }, [form, isRadiusType, meta])

  const canSubmit = !!(
    form.series && form.productType && form.thicknessMm && form.dim &&
    preview && !submitting
  )

  async function handleSubmit() {
    if (!preview || !canSubmit) return
    setSubmitting(true)
    setError(null)

    const widthMm = parseFloat(form.widthMm)
    const thicknessMm = parseFloat(form.thicknessMm)
    const dim = parseFloat(form.dim)

    const body = {
      partNumber: preview.partNumber,
      description: preview.description,
      categoryId: meta.categoryId,
      series: form.series,
      productType: form.productType,
      widthMm: isNaN(widthMm) ? null : widthMm,
      heightMm: meta.heightMm,
      thicknessMm,
      lengthM: isRadiusType ? null : dim,
      radiusMm: isRadiusType ? dim : null,
      gradeCode: meta.gradeCode,
    }

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error ?? (res.status === 409 ? 'Part number already exists' : 'Failed to create item'))
        return
      }
      toast.success(`Created ${preview.partNumber} — ART NO ${json.data.artNo}`)
      setForm(EMPTY)
      onOpenChange(false)
      onSuccess()
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  function set(field: keyof FormState, value: string) {
    setError(null)
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Reset dim when switching between radius/length types
      if (field === 'productType') {
        const wasRadius = RADIUS_TYPES.has(prev.productType)
        const nowRadius = RADIUS_TYPES.has(value)
        if (wasRadius !== nowRadius) next.dim = ''
      }
      return next
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>Add Item Variant</SheetTitle>
          <SheetDescription>Create a new SKU with custom dimensions. ART NO is assigned automatically.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-4">
          {/* Series */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-700">Series</label>
            <Select value={form.series} onValueChange={v => v && set('series', v)} disabled={!!defaultSeries}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERIES_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-700">Product Type</label>
            <Select value={form.productType} onValueChange={v => v && set('productType', v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {PRODUCT_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Width */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-700">Width (mm)</label>
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 200"
              value={form.widthMm}
              onChange={e => set('widthMm', e.target.value)}
              className="h-9"
            />
          </div>

          {/* Thickness */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-700">Thickness (mm)</label>
            <Select value={form.thicknessMm} onValueChange={v => v && set('thicknessMm', v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THICKNESS_OPTIONS.map(t => (
                  <SelectItem key={t} value={t}>{t} mm</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Length or Radius */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-700">
              {isRadiusType ? 'Radius (mm)' : 'Length (m)'}
            </label>
            <Input
              type="number"
              min="0.001"
              step={isRadiusType ? '1' : '0.1'}
              placeholder={isRadiusType ? 'e.g. 300' : 'e.g. 2.4'}
              value={form.dim}
              onChange={e => set('dim', e.target.value)}
              className="h-9"
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 space-y-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Preview</p>
              <p className="text-sm font-mono font-semibold text-gray-900">{preview.partNumber}</p>
              <p className="text-xs text-gray-500">{preview.description}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="flex-1">
            {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Create Item
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
