'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import ReactQueryProvider from '@/components/ReactQueryProvider'

const ACTION_META: Record<string, { label: string; bg: string; color: string }> = {
  PRICE_UPDATED:       { label: 'Price Updated',   bg: '#fef3c7', color: '#92400e' },
  RECALCULATE_DONE:    { label: 'Recalculated',    bg: '#d1fae5', color: '#065f46' },
  RECALCULATE_STARTED: { label: 'Recalc Started',  bg: '#e0f2fe', color: '#0369a1' },
  ITEM_CREATED:        { label: 'Item Created',    bg: '#dbeafe', color: '#1e40af' },
  ITEM_DEACTIVATED:    { label: 'Deactivated',     bg: '#fee2e2', color: '#991b1b' },
  VARIANTS_GENERATED:  { label: 'Variants Gen.',   bg: '#ede9fe', color: '#5b21b6' },
  EXPORT_GENERATED:    { label: 'Export',          bg: '#f0fdf4', color: '#15803d' },
}

async function fetchAuditLogs(categoryId: string) {
  const res = await fetch(`/api/audit-logs?categoryId=${categoryId}&limit=50`)
  const json = await res.json()
  if (!res.ok || !json.ok) throw new Error(json.error ?? 'Failed to load audit log')
  return json.data as AuditLogEntry[]
}

interface AuditLogEntry {
  id: number
  action: string
  description: string | null
  field: string | null
  oldValue: string | null
  newValue: string | null
  createdAt: string
}

function AuditTrailInner({ categoryId }: { categoryId: string }) {
  const { data: logs, isLoading, isError, error } = useQuery({
    queryKey: ['audit-logs', categoryId],
    queryFn: () => fetchAuditLogs(categoryId),
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', padding: '32px 0' }}>
        <Loader2 size={16} className="animate-spin" />
        <span style={{ fontSize: 13 }}>Loading audit trail...</span>
      </div>
    )
  }

  if (isError) {
    return <p style={{ fontSize: 13, color: '#ef4444', padding: '16px 0' }}>Failed to load audit trail: {(error as Error).message}</p>
  }

  if (!logs?.length) {
    return <p style={{ fontSize: 13, color: '#94a3b8', padding: '16px 0' }}>No activity recorded yet.</p>
  }

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8edf4', overflow: 'hidden', maxWidth: 900 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '190px 155px 1fr', background: '#f8fafc', borderBottom: '1px solid #e8edf4' }}>
        {['Timestamp', 'Action', 'Details'].map(h => (
          <div key={h} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
        ))}
      </div>
      {logs.map((log: AuditLogEntry) => {
        const meta = ACTION_META[log.action]
        const time = new Date(log.createdAt).toLocaleString('en-MY', {
          timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
        const desc = log.description ?? (log.field ? `${log.field}: ${log.oldValue} → ${log.newValue}` : '—')
        return (
          <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '190px 155px 1fr', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
            <div style={{ padding: '13px 16px', fontSize: 11.5, color: '#64748b', fontFamily: 'var(--font-mono)' }}>{time}</div>
            <div style={{ padding: '13px 16px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: meta?.bg ?? '#f1f5f9', color: meta?.color ?? '#374151' }}>
                {meta?.label ?? log.action}
              </span>
            </div>
            <div style={{ padding: '13px 16px', fontSize: 13, color: '#374151' }}>{desc}</div>
          </div>
        )
      })}
    </div>
  )
}

export function AuditTrail({ categoryId }: { categoryId: string }) {
  return (
    <ReactQueryProvider>
      <AuditTrailInner categoryId={categoryId} />
    </ReactQueryProvider>
  )
}
