/**
 * Medical history timeline + add record form.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  addMedicalRecord,
  getMedicalHistory,
  type MedicalRecord,
  type Patient,
} from '../services/patientService'
import { RECORD_TYPES } from '../utils/patientConstants'
import { StatusBadge } from '../components/PatientBadges'

const schema = z.object({
  record_type: z.enum(RECORD_TYPES),
  title: z.string().min(2).max(200),
  content: z.string().min(1).max(5000),
})

type FormValues = z.infer<typeof schema>

export default function MedicalHistoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { record_type: 'note' },
  })

  const load = async (patientId: string) => {
    const data = await getMedicalHistory(patientId)
    setPatient(data.patient)
    setRecords(data.records)
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        await load(id)
      } catch {
        if (!cancelled) {
          toast.error('History not found')
          navigate('/patients')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, navigate])

  const onSubmit = handleSubmit(async (values) => {
    if (!id) return
    setSubmitting(true)
    try {
      await addMedicalRecord(id, values)
      reset({ record_type: 'note', title: '', content: '' })
      await load(id)
      toast.success('Record added')
    } catch {
      toast.error('Failed to add record')
    } finally {
      setSubmitting(false)
    }
  })

  if (loading || !patient) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading history…
      </div>
    )
  }

  const fieldClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none ring-hospital-500 focus:ring-2'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to={`/patients/${patient.id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-hospital-700 hover:underline dark:text-hospital-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to patient
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Medical history
          </h2>
          <StatusBadge status={patient.status} />
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {patient.full_name} · {patient.mrn}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm"
        noValidate
      >
        <h3 className="font-display text-lg font-semibold">Add record</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select className={fieldClass} {...register('record_type')}>
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input className={fieldClass} {...register('title')} />
            {errors.title && (
              <p className="mt-1 text-xs text-danger">{errors.title.message}</p>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Content</label>
          <textarea rows={3} className={fieldClass} {...register('content')} />
          {errors.content && (
            <p className="mt-1 text-xs text-danger">{errors.content.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-hospital-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-hospital-700 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Add to history
        </button>
      </form>

      <div className="space-y-3">
        {records.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--text-muted)]">
            No history entries yet.
          </p>
        ) : (
          records.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold">{r.title}</h4>
                <span className="rounded-full bg-hospital-50 px-2.5 py-0.5 text-xs font-medium capitalize text-hospital-800 dark:bg-hospital-950/40 dark:text-hospital-100">
                  {r.record_type.replace('_', ' ')}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-muted)]">
                {r.content}
              </p>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                {r.recorded_by_name} · {new Date(r.recorded_at).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
