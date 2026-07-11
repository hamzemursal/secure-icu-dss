/**
 * Main dashboard — live hospital / security stats.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bot,
  Loader2,
  Shield,
  Stethoscope,
  Users,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { fetchDashboardStats, type DashboardStats } from '../services/securityService'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchDashboardStats()
        if (!cancelled) setStats(data)
      } catch {
        if (!cancelled) toast.error('Failed to load dashboard stats')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const cards = [
    {
      title: 'Patients',
      value: stats?.patients ?? '—',
      icon: Users,
      to: '/patients',
      hint: 'Active admissions',
    },
    {
      title: 'Critical',
      value: stats?.critical_patients ?? '—',
      icon: AlertTriangle,
      to: '/patients?status=critical',
      hint: 'Critical status / risk',
    },
    {
      title: 'Doctors',
      value: stats?.doctors ?? '—',
      icon: Stethoscope,
      hint: 'Active doctor accounts',
    },
    {
      title: 'Recommendations',
      value: stats?.recommendations ?? '—',
      icon: Bot,
      to: '/recommendations',
      hint: 'AI decision support runs',
    },
    {
      title: 'Blocked attacks',
      value: stats?.blocked_attacks ?? '—',
      icon: Shield,
      to: '/attacks',
      hint: 'Prompt injections stopped',
    },
    {
      title: 'System',
      value: stats?.system_status ?? '—',
      icon: Activity,
      hint: 'API health',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Welcome, {user?.full_name}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Secure ICU decision support overview. AI recommends; clinicians decide.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading stats…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const inner = (
              <>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-hospital-100 text-hospital-700 dark:bg-hospital-900/50 dark:text-hospital-200">
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {card.title}
                </p>
                <p className="mt-1 font-display text-2xl font-bold capitalize">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{card.hint}</p>
              </>
            )
            return card.to ? (
              <Link
                key={card.title}
                to={card.to}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm transition hover:border-hospital-300"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={card.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm"
              >
                {inner}
              </div>
            )
          })}
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Recent logs</h3>
          <Link
            to="/audit-logs"
            className="text-sm font-medium text-hospital-700 hover:underline dark:text-hospital-300"
          >
            View all
          </Link>
        </div>
        {!stats?.recent_logs?.length ? (
          <p className="text-sm text-[var(--text-muted)]">No recent activity.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {stats.recent_logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="text-xs text-[var(--text-muted)]">{log.actor_name}</p>
                </div>
                <time className="shrink-0 text-xs text-[var(--text-muted)]">
                  {new Date(log.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
