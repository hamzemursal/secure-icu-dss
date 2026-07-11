/**
 * Patients list — search, filter, navigate to details / add.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Plus, Search, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { listPatients, type Patient } from '../services/patientService'
import { RiskBadge, StatusBadge } from '../components/PatientBadges'
import { PATIENT_STATUSES, type PatientStatus } from '../utils/patientConstants'

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PatientStatus | ''>('')

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      ;(async () => {
        setLoading(true)
        try {
          const data = await listPatients({
            search: search || undefined,
            status: status || undefined,
          })
          if (!cancelled) {
            setPatients(data.items)
            setTotal(data.total)
          }
        } catch {
          if (!cancelled) toast.error('Failed to load patients')
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, status])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Patients</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {total} patient{total === 1 ? '' : 's'} · ICU decision support intake
          </p>
        </div>
        <Link
          to="/patients/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-hospital-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-hospital-700"
        >
          <Plus className="h-4 w-4" />
          Add patient
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, MRN, or bed…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] py-2.5 pl-10 pr-3 text-sm outline-none ring-hospital-500 focus:ring-2"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PatientStatus | '')}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none ring-hospital-500 focus:ring-2"
        >
          <option value="">All statuses</option>
          {PATIENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[var(--text-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading patients…
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-[var(--text-muted)]">
            <Users className="h-10 w-10 opacity-40" />
            <p>No patients found. Admit a patient to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--bg)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold">Bed</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Risk</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/patients/${p.id}`}
                        className="font-medium text-hospital-700 hover:underline dark:text-hospital-300"
                      >
                        {p.full_name}
                      </Link>
                      <p className="text-xs text-[var(--text-muted)]">
                        {p.mrn} · {p.age}y · {p.gender}
                      </p>
                    </td>
                    <td className="px-4 py-3">{p.bed_number || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge risk={p.risk_level} />
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {new Date(p.updated_at).toLocaleString()}
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
