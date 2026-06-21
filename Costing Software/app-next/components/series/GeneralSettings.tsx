'use client'

import { useEffect, useState } from 'react'

const FORMULA_GROUPS = [
  {
    group: 'Body',
    items: [
      { code: 'ST', name: 'Straight' },
    ],
  },
  {
    group: 'Fittings',
    items: [
      { code: 'E90',  name: 'Elbow 90°' },
      { code: 'E60',  name: 'Elbow 60°' },
      { code: 'E45',  name: 'Elbow 45°' },
      { code: 'E30',  name: 'Elbow 30°' },
      { code: 'T',    name: 'Equal Tee' },
      { code: 'UT',   name: 'Unequal Tee' },
      { code: 'CP',   name: 'Equal Cross' },
      { code: 'UCP',  name: 'Unequal Cross' },
      { code: 'VT',   name: 'Vertical Tee' },
      { code: 'IR90', name: 'Inside Riser 90°' },
      { code: 'IR60', name: 'Inside Riser 60°' },
      { code: 'IR45', name: 'Inside Riser 45°' },
      { code: 'IR30', name: 'Inside Riser 30°' },
      { code: 'OR90', name: 'Outside Riser 90°' },
      { code: 'OR60', name: 'Outside Riser 60°' },
      { code: 'OR45', name: 'Outside Riser 45°' },
      { code: 'OR30', name: 'Outside Riser 30°' },
      { code: 'RC',   name: 'Straight Reducer' },
      { code: 'RL',   name: 'Offset Reducer (Left)' },
      { code: 'RR',   name: 'Offset Reducer (Right)' },
    ],
  },
  { group: 'Covers',      items: [] as { code: string; name: string }[] },
  { group: 'Accessories', items: [] as { code: string; name: string }[] },
]
import { toast } from 'sonner'
import { usePriceStore, type PriceEntry } from '@/store/usePriceStore'
import { Loader2 } from 'lucide-react'

interface Props {
  categoryId: string
  finish: string
}

export function GeneralSettings({ categoryId, finish }: Props) {
  const {
    prices, dirtyPrices, setPrices, setDirtyPrice, clearDirtyPrices,
    categorySettings, dirtyCategorySettings, setCategorySettings, setDirtyCategorySetting, clearDirtyCategorySettings,
    hasDirty,
  } = usePriceStore()

  const [savingMaterial, setSavingMaterial] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)
  const [calculating, setCalculating] = useState(false)

  const materialEntries = prices[finish] ?? []
  const dirtyMaterial = dirtyPrices[finish] ?? {}

  const catEntries = categorySettings[categoryId] ?? []
  const dirtyCat = dirtyCategorySettings[categoryId] ?? {}

  const galvEntries = catEntries.filter(e => e.key.startsWith('galv_'))
  const markupEntries = catEntries.filter(e => e.key.startsWith('markup_'))

  useEffect(() => {
    fetch(`/api/prices?finish=${encodeURIComponent(finish)}`)
      .then(r => r.json())
      .then(res => {
        if (res.ok) setPrices(finish, res.data)
        else toast.error('Failed to load material rates')
      })
      .catch(() => toast.error('Network error loading material rates'))
  }, [finish, setPrices])

  useEffect(() => {
    fetch(`/api/categories/${encodeURIComponent(categoryId)}/settings`)
      .then(r => r.json())
      .then(res => {
        if (res.ok) setCategorySettings(categoryId, res.data)
        else toast.error('Failed to load category rates')
      })
      .catch(() => toast.error('Network error loading category rates'))
  }, [categoryId, setCategorySettings])

  const handleSaveMaterial = async () => {
    const dirtyEntries = Object.entries(dirtyMaterial)
    if (dirtyEntries.length === 0) return
    setSavingMaterial(true)
    try {
      for (const [key, value] of dirtyEntries) {
        const entry = materialEntries.find(e => e.key === key)
        if (!entry) continue
        const res = await fetch(`/api/prices/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value, categoryId }),
        })
        if (!res.ok) throw new Error(`Failed to save ${key}`)
      }
      const res = await fetch(`/api/prices?finish=${encodeURIComponent(finish)}`)
      const data = await res.json()
      if (data.ok) setPrices(finish, data.data)
      clearDirtyPrices(finish)
      toast.success('Material rates saved')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingMaterial(false)
    }
  }

  const handleSaveCategory = async () => {
    const dirtyEntries = Object.entries(dirtyCat)
    if (dirtyEntries.length === 0) return
    setSavingCategory(true)
    try {
      for (const [key, value] of dirtyEntries) {
        const entry = catEntries.find(e => e.key === key)
        if (!entry) continue
        const res = await fetch(`/api/categories/${encodeURIComponent(categoryId)}/settings/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        })
        if (!res.ok) throw new Error(`Failed to save ${key}`)
      }
      const res = await fetch(`/api/categories/${encodeURIComponent(categoryId)}/settings`)
      const data = await res.json()
      if (data.ok) setCategorySettings(categoryId, data.data)
      clearDirtyCategorySettings(categoryId)
      toast.success('Rates saved')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleCalculate = async () => {
    if (hasDirty(finish, categoryId)) {
      toast.warning('Save changes before recalculating')
      return
    }
    setCalculating(true)
    try {
      const res = await fetch('/api/jobs/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finish }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(`Recalculated ${data.data.processed.toLocaleString()} items`)
      } else {
        toast.error(data.error ?? 'Recalculation failed')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setCalculating(false)
    }
  }

  const renderField = (
    entry: PriceEntry,
    isDirty: Record<string, number>,
    onChange: (key: string, value: number) => void
  ) => {
    const currentVal = isDirty[entry.key] !== undefined ? isDirty[entry.key] : entry.value
    return (
      <div key={entry.key} style={{ display: 'grid', gridTemplateColumns: '1fr 94px', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
        <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{entry.displayName}</label>
        <input
          type="number"
          step="0.001"
          value={currentVal}
          onChange={e => onChange(entry.key, parseFloat(e.target.value))}
          style={{ width: '100%', border: `1px solid ${isDirty[entry.key] !== undefined ? '#fbbf24' : '#e2e8f0'}`, borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-sans)', textAlign: 'right', background: '#fafbfc', color: '#0f172a', outline: 'none' }}
        />
      </div>
    )
  }

  const latestOf = (entries: PriceEntry[]) =>
    entries.length === 0 ? null
      : entries.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b).updatedAt

  const fmtTimestamp = (iso: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    const date = d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
    const time = d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${date}, ${time}`
  }

  const sectionCard = (
    title: string,
    accentColor: string,
    unit: string,
    fields: PriceEntry[],
    isDirty: Record<string, number>,
    onChange: (key: string, value: number) => void,
    lastUpdated?: string | null
  ) => (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8edf4', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: accentColor }} />
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>
          {fmtTimestamp(lastUpdated ?? null) && (
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, marginTop: 2 }}>
              Last updated: {fmtTimestamp(lastUpdated ?? null)}
            </p>
          )}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', background: '#eef2ff', borderRadius: 4, padding: '2px 7px', marginLeft: 'auto' }}>{unit}</span>
      </div>
      {fields.map(e => renderField(e, isDirty, onChange))}
    </div>
  )

  const hasDirtyMaterial = Object.keys(dirtyMaterial).length > 0
  const hasDirtyCategory = Object.keys(dirtyCat).length > 0

  const saveBtn = (label: string, saving: boolean, dirty: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={!dirty || saving}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 7, border: 'none', cursor: dirty && !saving ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, background: dirty && !saving ? '#16a34a' : '#d1d5db', color: '#fff', opacity: dirty && !saving ? 1 : 0.7 }}
    >
      {saving ? <Loader2 size={13} className="animate-spin" /> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13"/><polyline points="7 3 7 8 15 8"/></svg>}
      {saving ? 'Saving…' : label}
    </button>
  )

  return (
    <div>
      {/* Unsaved warning */}
      {(hasDirtyMaterial || hasDirtyCategory) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '11px 16px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12.5, color: '#92400e' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          You have unsaved changes. Save before running Recalculate.
        </div>
      )}

      {/* Recalculate */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 7, border: 'none', cursor: calculating ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, background: '#2563eb', color: '#fff', opacity: calculating ? 0.7 : 1 }}
        >
          {calculating ? <Loader2 size={13} className="animate-spin" /> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          {calculating ? 'Calculating…' : 'Recalculate Prices'}
        </button>
      </div>

      {/* ── Pricing Variables ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Pricing Variables</h2>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Material rates are shared across all <strong>{finish}</strong> series. Galv & markup are specific to this series.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {saveBtn('Save Material Rates', savingMaterial, hasDirtyMaterial, handleSaveMaterial)}
            {saveBtn('Save Rates', savingCategory, hasDirtyCategory, handleSaveCategory)}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {sectionCard('Steel (RM / kg)', '#2563eb', 'RM / kg', materialEntries, dirtyMaterial, (k, v) => setDirtyPrice(finish, k, v), latestOf(materialEntries))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sectionCard('Galvanising Rates', '#0f766e', 'RM / kg', galvEntries, dirtyCat, (k, v) => setDirtyCategorySetting(categoryId, k, v), latestOf(galvEntries))}
            {sectionCard('Markup', '#7c3aed', 'percentage', markupEntries, dirtyCat, (k, v) => setDirtyCategorySetting(categoryId, k, v), latestOf(markupEntries))}
          </div>
        </div>
      </div>

      {/* ── Supported Item Types ── */}
      {(() => {
        const activeGroups = FORMULA_GROUPS.filter(g => g.items.length > 0)
        const totalTypes = activeGroups.reduce((n, g) => n + g.items.length, 0)
        return (
          <div>
            <div style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Supported Item Types</h2>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{totalTypes} item types with active pricing formulas</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeGroups.length}, 1fr)`, gap: 20 }}>
              {activeGroups.map(g => (
                <div key={g.group} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8edf4', padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: '#94a3b8' }} />
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{g.group}</h3>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', background: '#eef2ff', borderRadius: 4, padding: '2px 7px', marginLeft: 'auto' }}>{g.items.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {g.items.map(item => (
                      <div key={item.code} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#1e3a8c', background: '#dbeafe', borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>{item.code}</span>
                        <span style={{ fontSize: 12, color: '#475569' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
