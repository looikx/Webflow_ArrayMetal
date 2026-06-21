'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GeneralSettings } from '@/components/series/GeneralSettings'
import { ProductSettings } from '@/components/series/ProductSettings'
import { AuditTrail } from '@/components/series/AuditTrail'

const FINISH_COLOR: Record<string, string> = { HDG: '#1e3a8c', SS316: '#0f766e', SS304: '#7c3aed' }
const FINISH_BG: Record<string, string> = { HDG: '#dbeafe', SS316: '#ccfbf1', SS304: '#ede9fe' }

interface Props {
  categoryId: string
  displayName: string
  finish: string
  description: string
  skuCount: number
}

type Tab = 'general' | 'products' | 'audit'

export function SeriesDetailClient({ categoryId, displayName, finish, description, skuCount }: Props) {
  const [tab, setTab] = useState<Tab>('general')
  const finishColor = FINISH_COLOR[finish] ?? '#64748b'
  const finishBg = FINISH_BG[finish] ?? '#f1f5f9'

  const tabStyle = (t: Tab) => ({
    padding: '10px 22px',
    border: 'none',
    borderBottom: `2.5px solid ${tab === t ? '#2563eb' : 'transparent'}`,
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    fontWeight: 600,
    color: tab === t ? '#2563eb' : '#64748b',
    marginBottom: -2,
  } as React.CSSProperties)

  return (
    <>
      {/* Header */}
      <header style={{ height: 56, background: '#ffffff', borderBottom: '1px solid #e8edf4', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, flexShrink: 0, zIndex: 20 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: '#64748b', padding: 0, flexShrink: 0, whiteSpace: 'nowrap', textDecoration: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-[#eef2fb]">
        <div style={{ padding: 28 }}>

          {/* Series info */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{displayName}</h1>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.06em', background: finishBg, color: finishColor }}>{finish}</span>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{skuCount.toLocaleString()} SKUs</span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b' }}>{description}</p>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e8edf4', marginBottom: 24, gap: 0 }}>
            <button onClick={() => setTab('general')} style={tabStyle('general')}>General Settings</button>
            <button onClick={() => setTab('products')} style={tabStyle('products')}>Product Settings</button>
            <button onClick={() => setTab('audit')} style={tabStyle('audit')}>Audit Trail</button>
          </div>

          {tab === 'general' && <GeneralSettings categoryId={categoryId} finish={finish} />}
          {tab === 'products' && <ProductSettings categoryId={categoryId} finish={finish} />}
          {tab === 'audit' && <AuditTrail categoryId={categoryId} />}

        </div>
      </main>
    </>
  )
}
