/** Small status / risk pills for patient tables and headers. */
import {
  riskBadgeClass,
  statusBadgeClass,
  type PatientStatus,
  type RiskLevel,
} from '../utils/patientConstants'

export function StatusBadge({ status }: { status: PatientStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadgeClass[status]}`}
    >
      {status}
    </span>
  )
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${riskBadgeClass[risk]}`}
    >
      {risk}
    </span>
  )
}
