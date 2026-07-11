/**
 * Patient details — vitals update, edit/delete, link to history.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  ArrowLeft,
  Bot,
  ClipboardList,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  deletePatient,
  getPatient,
  updateVitals,
  type Patient,
  type Vitals,
} from '../services/patientService'
import { RiskBadge, StatusBadge } from '../components/PatientBadges'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../utils/constants'

export default function PatientDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const canDelete = hasRole(ROLES.DOCTOR, ROLES.ADMIN)

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingVitals, setSavingVitals] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset } = useForm<Vitals>()

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await getPatient(id)
        if (cancelled) return
        setPatient(data)
        reset({
          heart_rate: data.vitals?.heart_rate ?? undefined,
          spo2: data.vitals?.spo2 ?? undefined,
          blood_pressure_systolic: data.vitals?.blood_pressure_systolic ?? undefined,
          blood_pressure_diastolic: data.vitals?.blood_pressure_diastolic ?? undefined,
          temperature_c: data.vitals?.temperature_c ?? undefined,
          respiratory_rate: data.vitals?.respiratory_rate ?? undefined,
          glasgow_coma_scale: data.vitals?.glasgow_coma_scale ?? undefined,
        })
      } catch {
        toast.error('Patient not found')
        navigate('/patients')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, navigate, reset])

  const onVitals = handleSubmit(async (values) => {
    if (!id) return
    setSavingVitals(true)
    try {
      const cleaned: Vitals = {}
      for (const [key, value] of Object.entries(values)) {
        if (value !== undefined && value !== null && String(value) !== '') {
          cleaned[key as keyof Vitals] = Number(value) as never
        }
      }
      const updated = await updateVitals(id, cleaned)
      setPatient(updated)
      toast.success('Vitals updated')
    } catch {
      toast.error('Failed to update vitals')
    } finally {
      setSavingVitals(false)
    }
  })

  const onDelete = async () => {
    if (!id || !canDelete) return
    if (!window.confirm('Soft-delete this patient? History is retained for audit.')) return
    setDeleting(true)
    try {
      await deletePatient(id)
      toast.success('Patient deleted')
      navigate('/patients')
    } catch {
      toast.error('Delete failed (doctors/admins only)')
    } finally {
      setDeleting(false)
    }
  }

  if (loading || !patient) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading patient…
      </div>
    )
  }

  const fieldClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none ring-hospital-500 focus:ring-2'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/patients"
            className="mb-3 inline-flex items-center gap-1 text-sm text-hospital-700 hover:underline dark:text-hospital-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Patients
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {patient.full_name}
            </h2>
            <StatusBadge status={patient.status} />
            <RiskBadge risk={patient.risk_level} />
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {patient.mrn} · {patient.age}y · {patient.gender}
            {patient.bed_number ? ` · Bed ${patient.bed_number}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/recommendations?patient=${patient.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-hospital-300 px-3 py-2 text-sm font-medium text-hospital-800 hover:bg-hospital-50 dark:border-hospital-700 dark:text-hospital-100 dark:hover:bg-hospital-950/40"
          >
            <Bot className="h-4 w-4" />
            AI recommend
          </Link>
          <Link
            to={`/patients/${patient.id}/history`}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--bg)]"
          >
            <ClipboardList className="h-4 w-4" />
            History
          </Link>
          <Link
            to={`/patients/${patient.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-hospital-600 px-3 py-2 text-sm font-semibold text-white hover:bg-hospital-700"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
          {canDelete && (
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm">
          <h3 className="font-display text-lg font-semibold">Clinical summary</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                Chief complaint
              </dt>
              <dd className="mt-0.5">{patient.chief_complaint || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                Symptoms
              </dt>
              <dd className="mt-0.5">
                {patient.symptoms.length ? patient.symptoms.join(', ') : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                Allergies
              </dt>
              <dd className="mt-0.5">
                {patient.allergies.length ? patient.allergies.join(', ') : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">Notes</dt>
              <dd className="mt-0.5 whitespace-pre-wrap">{patient.notes || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                Admitted
              </dt>
              <dd className="mt-0.5">{new Date(patient.admitted_at).toLocaleString()}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-sm">
          <h3 className="font-display text-lg font-semibold">Update vitals</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Saves to the patient chart and appends a history entry.
          </p>
          <form onSubmit={onVitals} className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ['heart_rate', 'Heart rate'],
                ['spo2', 'SpO₂ %'],
                ['blood_pressure_systolic', 'BP systolic'],
                ['blood_pressure_diastolic', 'BP diastolic'],
                ['temperature_c', 'Temp °C'],
                ['respiratory_rate', 'Resp. rate'],
                ['glasgow_coma_scale', 'GCS'],
              ] as const
            ).map(([name, label]) => (
              <div key={name}>
                <label className="mb-1 block text-xs font-medium">{label}</label>
                <input
                  type="number"
                  step="any"
                  className={fieldClass}
                  {...register(name, { valueAsNumber: true })}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={savingVitals}
                className="inline-flex items-center gap-2 rounded-xl bg-hospital-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-hospital-700 disabled:opacity-60"
              >
                {savingVitals ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save vitals
              </button>
              {patient.vitals?.recorded_at && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Last recorded: {new Date(patient.vitals.recorded_at).toLocaleString()}
                </p>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
