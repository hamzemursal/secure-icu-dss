/**
 * Audit Logs — searchable trail of AI, auth, and security events.
 */
import { useEffect, useState } from 'react'
import { Loader2, ScrollText } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchAuditLogs, type AuditLogItem } from '../services/securityService'

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      ;(async () => {
        setLoading(true)
        try {
          const data = await fetchAuditLogs(action || undefined)
          if (!cancelled) setItems(data.items)
        } catch {
          if (!cancelled) toast.error('Failed to load audit logs')
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [action])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Audit Logs</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Immutable-style trail of agent steps, approvals, and attack simulations.
          </p>
        </div>
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Filter by action…"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none ring-hospital-500 focus:ring-2 sm:w-64"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[var(--text-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading logs…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-[var(--text-muted)]">
            <ScrollText className="h-10 w-10 opacity-40" />
            <p className="text-sm">No audit entries yet. Run AI or attack simulations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--bg)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Resource</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]/60"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--text-muted)]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{log.action}</td>
                    <td className="px-4 py-3">
                      {log.actor_name}
                      <span className="block text-xs capitalize text-[var(--text-muted)]">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {log.resource_type}
                      {log.resource_id ? ` · ${log.resource_id.slice(0, 8)}…` : ''}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-xs text-[var(--text-muted)]">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
