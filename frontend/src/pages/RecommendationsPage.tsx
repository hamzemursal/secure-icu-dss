/**
 * AI Recommendations — run pipeline, inspect agent trace, doctor approve/reject.
 */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Bot,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  listRecommendations,
  reviewRecommendation,
  runRecommendation,
  type Recommendation,
  type RecommendationStatus,
} from '../services/recommendationService'
import { listPatients, type Patient } from '../services/patientService'
import { RiskBadge } from '../components/PatientBadges'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../utils/constants'

const statusClass: Record<RecommendationStatus, string> = {
  pending_approval:
    'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100',
  approved:
    'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100',
  rejected: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  blocked: 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-100',
}

export default function RecommendationsPage() {
  const { hasRole } = useAuth()
  const canReview = hasRole(ROLES.DOCTOR, ROLES.ADMIN)
  const [searchParams] = useSearchParams()

  const [patients, setPatients] = useState<Patient[]>([])
  const [items, setItems] = useState<Recommendation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [patientId, setPatientId] = useState(searchParams.get('patient') ?? '')
  const [extraNotes, setExtraNotes] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null

  const refresh = async () => {
    const data = await listRecommendations()
    setItems(data.items)
    if (data.items.length && !selectedId) {
      setSelectedId(data.items[0].id)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [p, r] = await Promise.all([listPatients(), listRecommendations()])
        if (cancelled) return
        setPatients(p.items)
        setItems(r.items)
        if (r.items.length) setSelectedId(r.items[0].id)
      } catch {
        toast.error('Failed to load recommendations')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const onRun = async () => {
    if (!patientId) {
      toast.error('Select a patient first')
      return
    }
    setRunning(true)
    try {
      const rec = await runRecommendation(patientId, extraNotes || undefined)
      toast.success(
        rec.blocked ? 'Pipeline blocked by Security Agent' : 'Recommendation ready for review',
      )
      setExtraNotes('')
      await refresh()
      setSelectedId(rec.id)
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Pipeline failed')
    } finally {
      setRunning(false)
    }
  }

  const onReview = async (approve: boolean) => {
    if (!selected || !canReview) return
    setReviewing(true)
    try {
      const updated = await reviewRecommendation(
        selected.id,
        approve,
        reviewNotes || undefined,
      )
      toast.success(approve ? 'Approved by doctor' : 'Rejected by doctor')
      setReviewNotes('')
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Review failed')
    } finally {
      setReviewing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading AI recommendations…
      </div>
    )
  }

  const fieldClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none ring-hospital-500 focus:ring-2'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          AI Recommendation
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Multi-agent decision support with prompt-injection defense and mandatory
          human doctor approval. AI does not replace clinicians.
        </p>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
          <Bot className="h-5 w-5 text-hospital-600" />
          Run agent pipeline
        </h3>
        <div className="grid gap-3 lg:grid-cols-[1fr_2fr_auto]">
          <select
            className={fieldClass}
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            <option value="">Select patient…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} ({p.mrn})
              </option>
            ))}
          </select>
          <input
            className={fieldClass}
            placeholder="Optional notes (scanned by Security Agent)"
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void onRun()}
            disabled={running || !patientId}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-hospital-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-hospital-700 disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Run AI
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Try injecting text like “Ignore previous instructions” to see Security Agent
          block the run.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm">
          <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
            Recent ({items.length})
          </div>
          <ul className="max-h-[560px] overflow-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                No recommendations yet.
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full border-b border-[var(--border)] px-4 py-3 text-left text-sm transition last:border-0 ${
                      selected?.id === item.id
                        ? 'bg-hospital-50 dark:bg-hospital-950/30'
                        : 'hover:bg-[var(--bg)]'
                    }`}
                  >
                    <p className="font-medium">{item.patient_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusClass[item.status]}`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        {selected ? (
          <div className="space-y-4">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/patients/${selected.patient_id}`}
                    className="font-display text-xl font-bold text-hospital-700 hover:underline dark:text-hospital-300"
                  >
                    {selected.patient_name}
                  </Link>
                  <p className="text-sm text-[var(--text-muted)]">
                    {selected.patient_mrn} · source: {selected.source}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusClass[selected.status]}`}
                  >
                    {selected.status.replace('_', ' ')}
                  </span>
                  <RiskBadge risk={selected.suggested_risk_level} />
                </div>
              </div>

              {selected.blocked && (
                <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Blocked by security / verification</p>
                    <p>{selected.block_reason}</p>
                  </div>
                </div>
              )}

              <p className="mt-4 text-sm leading-relaxed">{selected.rationale}</p>
              {selected.reasoning_summary && (
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {selected.reasoning_summary}
                </p>
              )}

              {selected.clinical_flags.length > 0 && (
                <ul className="mt-3 list-inside list-disc text-sm text-[var(--text-muted)]">
                  {selected.clinical_flags.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                    Suggested actions
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {selected.actions.map((a) => (
                      <li key={a} className="rounded-lg bg-[var(--bg)] px-3 py-2">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                    Monitoring
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {selected.monitoring.map((m) => (
                      <li key={m} className="rounded-lg bg-[var(--bg)] px-3 py-2">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="mt-4 rounded-xl bg-hospital-50 p-3 text-xs text-hospital-900 dark:bg-hospital-950/40 dark:text-hospital-100">
                {selected.disclaimer}
              </p>

              {selected.status === 'pending_approval' && canReview && (
                <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                  <p className="text-sm font-semibold">Human-in-the-loop review</p>
                  <textarea
                    className={fieldClass}
                    rows={2}
                    placeholder="Review notes (optional)"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={reviewing}
                      onClick={() => void onReview(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={reviewing}
                      onClick={() => void onReview(false)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {selected.reviewed_by_name && (
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  Reviewed by {selected.reviewed_by_name}
                  {selected.reviewed_at
                    ? ` · ${new Date(selected.reviewed_at).toLocaleString()}`
                    : ''}
                  {selected.review_notes ? ` · “${selected.review_notes}”` : ''}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm">
              <h3 className="font-display text-lg font-semibold">Agent pipeline trace</h3>
              <ol className="mt-4 space-y-2">
                {selected.pipeline_trace.map((step, idx) => (
                  <li
                    key={`${step.agent}-${idx}`}
                    className="flex items-start gap-3 rounded-xl bg-[var(--bg)] px-3 py-2.5 text-sm"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-hospital-100 text-xs font-bold text-hospital-800 dark:bg-hospital-900 dark:text-hospital-100">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{step.agent}</p>
                      <p className="text-[var(--text-muted)]">{step.message}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {step.duration_ms.toFixed(1)} ms ·{' '}
                        {step.success ? 'ok' : 'failed'}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center text-sm text-[var(--text-muted)]">
            Run the pipeline on a patient to see agent output here.
          </div>
        )}
      </div>
    </div>
  )
}
