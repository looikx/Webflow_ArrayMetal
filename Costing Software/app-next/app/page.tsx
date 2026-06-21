import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const FINISH_COLOR: Record<string, string> = { HDG: '#1e3a8c', SS316: '#0f766e', SS304: '#7c3aed' }
const FINISH_BG: Record<string, string> = { HDG: '#dbeafe', SS316: '#ccfbf1', SS304: '#ede9fe' }

type Cat = { id: string; displayName: string; finish: string; isActive: boolean }
type AuditEntry = { id: number; action: string; description: string | null; createdAt: string; categoryId: string | null }

const SERIES_DESC: Record<string, string> = {
  HDG_CABLE_LADDER:   'Roll-formed hot-dip galvanised cable ladders, fittings, covers and accessories',
  SS316_CABLE_LADDER: 'Grade 316 stainless steel cable ladders for corrosive and coastal environments',
  HDG_METAL_FRAMING:  'Flexistrut channel, cantilever arms, splice plates and support brackets',
  HDG_CABLE_TRUNKING: 'Hot-dip galvanised cable trunking with full fitting and cover range',
  SS304_CABLE_TRUNKING: 'Grade 304 stainless straight trunking and cover set',
  HDG_CABLE_TRAY:     'Perforated bottom cable tray, fittings, covers and accessories — HDG finish',
  LADDER_COVER:       'SS316 stainless steel ladder cover strips and accessories',
}

const ACTION_META: Record<string, { label: string; bg: string; color: string }> = {
  PRICE_UPDATED:    { label: 'Price Updated',  bg: '#fef3c7', color: '#92400e' },
  RECALCULATE_DONE: { label: 'Recalculated',   bg: '#d1fae5', color: '#065f46' },
  ITEM_CREATED:     { label: 'Item Created',   bg: '#dbeafe', color: '#1e40af' },
  ITEM_DEACTIVATED: { label: 'Deactivated',    bg: '#fee2e2', color: '#991b1b' },
}

async function getDashboardData() {
  const [totalRes, jobsRes, auditRes, categoriesRes, pricesRes] = await Promise.all([
    supabase.from('items').select('*', { count: 'exact', head: true }).eq('isActive', true),
    supabase.from('job_records').select('id,type,status,resultMsg,completedAt,createdAt')
      .eq('type', 'RECALCULATE').order('createdAt', { ascending: false }).limit(1),
    supabase.from('audit_logs').select('id,action,description,createdAt,categoryId')
      .order('createdAt', { ascending: false }).limit(8),
    supabase.from('product_categories').select('id,displayName,finish,isActive').eq('isActive', true),
    supabase.from('material_prices').select('finish', { count: 'exact', head: false }),
  ])

  // Count SKUs per category
  const cats = categoriesRes.data ?? []
  const skuCounts: Record<string, number> = {}
  if (cats.length > 0) {
    for (const cat of cats) {
      const { count } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('categoryId', cat.id)
        .eq('isActive', true)
      skuCounts[cat.id] = count ?? 0
    }
  }

  // Count distinct finishes with price sets
  const finishesWithPrices = new Set((pricesRes.data ?? []).map((r: { finish: string }) => r.finish))

  return {
    totalItems: totalRes.count ?? 0,
    lastJob: jobsRes.data?.[0] ?? null,
    auditLog: auditRes.data ?? [],
    categories: cats,
    skuCounts,
    finishesWithPrices: Array.from(finishesWithPrices),
  }
}

export default async function DashboardPage() {
  const { totalItems, lastJob, auditLog, categories, skuCounts, finishesWithPrices } = await getDashboardData()

  const lastCalcDate = lastJob?.completedAt
    ? new Date(lastJob.completedAt).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: 'short', year: 'numeric' })
    : 'Never'
  const lastCalcTime = lastJob?.completedAt
    ? new Date(lastJob.completedAt).toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' })
    : ''

  const hour = new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', hour12: false })
  const greeting = parseInt(hour) < 12 ? 'Good morning' : parseInt(hour) < 18 ? 'Good afternoon' : 'Good evening'

  // Group categories by finish to show shared price sets
  const finishGroups: Record<string, typeof categories> = {}
  for (const cat of categories) {
    if (!finishGroups[cat.finish]) finishGroups[cat.finish] = []
    finishGroups[cat.finish].push(cat)
  }
  const numFinishes = Object.keys(finishGroups).length

  return (
    <>
      {/* Top header */}
      <header className="h-14 bg-white border-b border-[#e8edf4] flex items-center px-6 shrink-0 z-20">
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
      </header>

      <main className="flex-1 overflow-y-auto bg-[#eef2fb]">
        <div style={{ padding: 28, maxWidth: 1280 }}>

          {/* Heading */}
          <div style={{ marginBottom: 26 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{greeting}</h1>
            <p style={{ fontSize: 13, color: '#64748b' }}>Array Metal (M) Sdn. Bhd. · Product Costing System</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>

            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8edf4', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Total SKUs</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a8c" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' }}>{totalItems.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>active products</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8edf4', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Series</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' }}>{categories.length}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>prices shared by finish</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8edf4', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Last Recalc</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{lastCalcDate}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{lastCalcTime ? `${lastCalcTime} · Malaysia time` : '—'}</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8edf4', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Price Sets</span>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' }}>{finishesWithPrices.length}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{finishesWithPrices.join(' · ') || '—'}</div>
            </div>

          </div>

          {/* Series grid — grouped by finish */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Product Series</h2>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{categories.length} series · {numFinishes} shared price {numFinishes === 1 ? 'set' : 'sets'}</span>
            </div>

            {Object.entries(finishGroups).map(([finish, cats]) => (
              <div key={finish} style={{ marginBottom: 22 }}>
                {/* Finish group header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: FINISH_COLOR[finish] ?? '#64748b', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: FINISH_COLOR[finish] ?? '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{finish}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>— shared material prices across {cats.length} {cats.length === 1 ? 'series' : 'series'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {cats.map((cat: Cat) => {
                    const skuCount = skuCounts[cat.id] ?? 0
                    return (
                      <div key={cat.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8edf4', overflow: 'hidden' }}>
                        <div style={{ height: 4, background: FINISH_COLOR[cat.finish] ?? '#64748b' }} />
                        <div style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.06em', background: FINISH_BG[cat.finish] ?? '#f1f5f9', color: FINISH_COLOR[cat.finish] ?? '#64748b' }}>{cat.finish}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: skuCount > 0 ? '#0f172a' : '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                              {skuCount > 0 ? skuCount.toLocaleString() + ' SKUs' : 'No SKUs'}
                            </span>
                          </div>
                          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 5, lineHeight: 1.3 }}>{cat.displayName}</h3>
                          <p style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.55, minHeight: 36, marginBottom: 13 }}>
                            {SERIES_DESC[cat.id] ?? cat.displayName}
                          </p>
                          <Link
                            href={`/series/${cat.id}`}
                            style={{ width: '100%', padding: '8px 0', borderRadius: 7, border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none' }}
                          >
                            Open Series
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Recent Activity</h2>
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8edf4', overflow: 'hidden' }}>
              {auditLog.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94a3b8', padding: '16px 18px' }}>No activity yet.</p>
              ) : (
                auditLog.map((entry: AuditEntry) => {
                  const meta = ACTION_META[entry.action]
                  const time = new Date(entry.createdAt).toLocaleString('en-MY', {
                    timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                  return (
                    <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 5, whiteSpace: 'nowrap', flexShrink: 0, background: meta?.bg ?? '#f1f5f9', color: meta?.color ?? '#374151' }}>
                        {meta?.label ?? entry.action}
                      </span>
                      <span style={{ fontSize: 13, color: '#374151', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.description ?? entry.action}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{time}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
