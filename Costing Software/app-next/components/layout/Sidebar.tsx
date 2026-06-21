'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const SERIES = [
  { id: 'HDG_CABLE_LADDER', name: 'HDG Cable Ladder', finish: 'HDG' },
  { id: 'SS316_CABLE_LADDER', name: 'SS316 Cable Ladder', finish: 'SS316' },
  { id: 'LADDER_COVER', name: 'Ladder Cover', finish: 'SS316' },
]

const FINISH_DOT: Record<string, string> = {
  HDG:   '#93c5fd',
  SS316: '#6ee7b7',
  SS304: '#c4b5fd',
}

export function Sidebar() {
  const path = usePathname()
  const isDashboard = path === '/'

  return (
    <aside className="w-[244px] h-screen flex flex-col shrink-0 overflow-hidden bg-[#1e3a8c]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.08] shrink-0">
        <div className="text-white font-bold text-sm leading-tight">Array Metal</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 8 }}>
          Product Costing System
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden">

        {/* Dashboard */}
        <Link
          href="/"
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[7px] text-[13px] font-medium mb-0.5 transition-colors',
            isDashboard ? 'bg-white/[0.18] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/>
            <rect x="3" y="16" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/>
          </svg>
          Dashboard
        </Link>

        {/* Series group */}
        <div style={{ padding: '10px 11px 5px', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', marginTop: 4 }}>
          Series
        </div>
        {SERIES.map(sr => {
          const isActive = path.startsWith(`/series/${sr.id}`)
          return (
            <Link
              key={sr.id}
              href={`/series/${sr.id}`}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-[7px] text-[12px] font-medium mb-px transition-colors',
                isActive ? 'bg-white/[0.18] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: FINISH_DOT[sr.finish] ?? '#64748b' }} />
              {sr.name}
              {isActive && (
                <svg className="ml-auto shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
            </Link>
          )
        })}

        {/* Tools group */}
        <div style={{ padding: '10px 11px 5px', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', marginTop: 8 }}>
          Tools
        </div>
        <Link
          href="/items"
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[7px] text-[13px] font-medium mb-px transition-colors',
            path.startsWith('/items') ? 'bg-white/[0.18] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <circle cx="3" cy="6" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="3" cy="12" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="3" cy="18" r="1.2" fill="currentColor" stroke="none"/>
          </svg>
          Item Registry
        </Link>
        <Link
          href="/export"
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[7px] text-[13px] font-medium transition-colors',
            path.startsWith('/export') ? 'bg-white/[0.18] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </Link>

      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/[0.07] shrink-0">
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>Array Metal (M) Sdn. Bhd.</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.14)', marginTop: 2 }}>Costing System · v2.0</div>
      </div>
    </aside>
  )
}
