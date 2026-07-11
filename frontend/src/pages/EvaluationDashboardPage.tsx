/**
 * Evaluation Dashboard — security metrics charts (Recharts).
 */
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  fetchEvaluationMetrics,
  type EvaluationMetrics,
} from '../services/securityService'

export default function EvaluationDashboardPage() {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setMetrics(await fetchEvaluationMetrics())
    } catch {
      toast.error('Failed to load evaluation metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Computing metrics…
      </div>
    )
  }

  if (!metrics) return null

  const cards = [
    { label: 'Attack success (before)', value: `${metrics.attack_success_before}%` },
    { label: 'Attack success (after)', value: `${metrics.attack_success_after}%` },
    { label: 'False positive rate', value: `${metrics.false_positive_rate}%` },
    { label: 'False negative rate', value: `${metrics.false_negative_rate}%` },
    { label: 'Avg latency', value: `${metrics.avg_latency_ms} ms` },
    { label: 'Recovery time', value: `${metrics.recovery_time_ms} ms` },
    { label: 'Unsafe tool reduction', value: `${metrics.unsafe_tool_reduction}%` },
    { label: 'Human approval accuracy', value: `${metrics.human_approval_accuracy}%` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Evaluation Dashboard
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Metrics from attack simulations, pipeline latency, and doctor reviews.
            Run attack sims to populate charts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--bg)]"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {c.label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-semibold">
            Attack success rate
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.attack_success_series}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} name="Success %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-semibold">
            Simulation latency
          </h3>
          <div className="h-64">
            {metrics.latency_series.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
                No latency samples yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.latency_series}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis unit="ms" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} name="Latency ms" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Totals: {metrics.total_attacks} attacks · {metrics.total_blocked} blocked ·{' '}
        {metrics.total_recommendations} recommendations · generated{' '}
        {new Date(metrics.generated_at).toLocaleString()}
      </p>
    </div>
  )
}
