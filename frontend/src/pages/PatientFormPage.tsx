/**
 * Add / Edit patient form — Zod + React Hook Form.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createPatient,
  getPatient,
  updatePatient,
} from '../services/patientService'
import {
  GENDERS,
  PATIENT_STATUSES,
  RISK_LEVELS,
} from '../utils/patientConstants'

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined
  if (typeof value === 'number' && Number.isNaN(value)) return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}, z.number().optional())

const schema = z.object({
  mrn: z.string().min(3, 'MRN required').max(40),
  full_name: z.string().min(2, 'Name required').max(120),
  age: z.preprocess((value) => Number(value), z.number().int().min(0).max(130)),
  gender: z.enum(GENDERS),
  status: z.enum(PATIENT_STATUSES),
  risk_level: z.enum(RISK_LEVELS),
  bed_number: z.string().max(20).optional(),
  chief_complaint: z.string().max(500).optional(),
  symptoms: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().max(2000).optional(),
  heart_rate: optionalNumber,
  spo2: optionalNumber,
  blood_pressure_systolic: optionalNumber,
  blood_pressure_diastolic: optionalNumber,
  temperature_c: optionalNumber,
  respiratory_rate: optionalNumber,
})

type FormValues = z.infer<typeof schema>

function splitList(value?: string): string[] {
  if (!value?.trim()) return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}


export default function PatientFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    // preprocess schemas widen input types; cast keeps RHF aligned with output
    resolver: zodResolver(schema) as never,
    defaultValues: {
      gender: 'unknown',
      status: 'admitted',
      risk_level: 'medium',
      age: 0,
    },
  })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const p = await getPatient(id)
        if (cancelled) return
        reset({
          mrn: p.mrn,
          full_name: p.full_name,
          age: p.age,
          gender: p.gender,
          status: p.status,
          risk_level: p.risk_level,
          bed_number: p.bed_number ?? '',
          chief_complaint: p.chief_complaint ?? '',
          symptoms: p.symptoms.join(', '),
          allergies: p.allergies.join(', '),
          notes: p.notes ?? '',
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

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      if (isEdit && id) {
        await updatePatient(id, {
          full_name: values.full_name,
          age: values.age,
          gender: values.gender,
          status: values.status,
          risk_level: values.risk_level,
          bed_number: values.bed_number || undefined,
          chief_complaint: values.chief_complaint || undefined,
          symptoms: splitList(values.symptoms),
          allergies: splitList(values.allergies),
          notes: values.notes || undefined,
        })
        toast.success('Patient updated')
        navigate(`/patients/${id}`)
      } else {
        const created = await createPatient({
          mrn: values.mrn,
          full_name: values.full_name,
          age: values.age,
          gender: values.gender,
          status: values.status,
          risk_level: values.risk_level,
          bed_number: values.bed_number || undefined,
          chief_complaint: values.chief_complaint || undefined,
          symptoms: splitList(values.symptoms),
          allergies: splitList(values.allergies),
          notes: values.notes || undefined,
          vitals: {
            heart_rate: values.heart_rate,
            spo2: values.spo2,
            blood_pressure_systolic: values.blood_pressure_systolic,
            blood_pressure_diastolic: values.blood_pressure_diastolic,
            temperature_c: values.temperature_c,
            respiratory_rate: values.respiratory_rate,
          },
        })
        toast.success('Patient admitted')
        navigate(`/patients/${created.id}`)
      }
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Save failed')
    } finally {
      setSubmitting(false)
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  const fieldClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none ring-hospital-500 focus:ring-2'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to={isEdit && id ? `/patients/${id}` : '/patients'}
          className="mb-3 inline-flex items-center gap-1 text-sm text-hospital-700 hover:underline dark:text-hospital-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit patient' : 'Add patient'}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Capture intake data for ICU decision support. AI recommendations come later.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-sm"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">MRN</label>
            <input
              className={fieldClass}
              disabled={isEdit}
              {...register('mrn')}
            />
            {errors.mrn && <p className="mt-1 text-xs text-danger">{errors.mrn.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full name</label>
            <input className={fieldClass} {...register('full_name')} />
            {errors.full_name && (
              <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Age</label>
            <input type="number" className={fieldClass} {...register('age', { valueAsNumber: true })} />
            {errors.age && <p className="mt-1 text-xs text-danger">{errors.age.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Gender</label>
            <select className={fieldClass} {...register('gender')}>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Status</label>
            <select className={fieldClass} {...register('status')}>
              {PATIENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Risk level</label>
            <select className={fieldClass} {...register('risk_level')}>
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Bed number</label>
            <input className={fieldClass} {...register('bed_number')} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Chief complaint</label>
            <input className={fieldClass} {...register('chief_complaint')} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Symptoms (comma-separated)
          </label>
          <input
            className={fieldClass}
            placeholder="fever, dyspnea, chest pain"
            {...register('symptoms')}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Allergies (comma-separated)
          </label>
          <input className={fieldClass} placeholder="penicillin" {...register('allergies')} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Notes</label>
          <textarea rows={3} className={fieldClass} {...register('notes')} />
        </div>

        {!isEdit && (
          <div>
            <p className="mb-3 text-sm font-semibold">Initial vitals (optional)</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {(
                [
                  ['heart_rate', 'Heart rate'],
                  ['spo2', 'SpO₂'],
                  ['blood_pressure_systolic', 'BP systolic'],
                  ['blood_pressure_diastolic', 'BP diastolic'],
                  ['temperature_c', 'Temp °C'],
                  ['respiratory_rate', 'Resp. rate'],
                ] as const
              ).map(([name, label]) => (
                <div key={name}>
                  <label className="mb-1.5 block text-sm font-medium">{label}</label>
                  <input
                    type="number"
                    step="any"
                    className={fieldClass}
                    {...register(name, { valueAsNumber: true })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/patients"
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--bg)]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-hospital-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-hospital-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Save changes' : 'Admit patient'}
          </button>
        </div>
      </form>
    </div>
  )
}
