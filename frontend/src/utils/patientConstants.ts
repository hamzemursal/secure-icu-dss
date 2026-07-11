/** Patient-domain constants and types. */

export const PATIENT_STATUSES = [
  'admitted',
  'critical',
  'stable',
  'discharged',
  'transferred',
] as const

export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const

export const GENDERS = ['male', 'female', 'other', 'unknown'] as const

export const RECORD_TYPES = [
  'note',
  'diagnosis',
  'lab',
  'procedure',
  'medication',
  'vitals_update',
  'other',
] as const

export type PatientStatus = (typeof PATIENT_STATUSES)[number]
export type RiskLevel = (typeof RISK_LEVELS)[number]
export type Gender = (typeof GENDERS)[number]
export type RecordType = (typeof RECORD_TYPES)[number]

export const statusBadgeClass: Record<PatientStatus, string> = {
  admitted: 'bg-hospital-100 text-hospital-800 dark:bg-hospital-900/50 dark:text-hospital-100',
  critical: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
  stable: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  discharged: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  transferred: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
}

export const riskBadgeClass: Record<RiskLevel, string> = {
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
}
