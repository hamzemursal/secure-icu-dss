/**
 * Patient API client — CRUD, vitals, medical history.
 */
import api from './api'
import type {
  Gender,
  PatientStatus,
  RecordType,
  RiskLevel,
} from '../utils/patientConstants'

export interface Vitals {
  heart_rate?: number | null
  blood_pressure_systolic?: number | null
  blood_pressure_diastolic?: number | null
  respiratory_rate?: number | null
  temperature_c?: number | null
  spo2?: number | null
  glasgow_coma_scale?: number | null
  recorded_at?: string | null
}

export interface Patient {
  id: string
  mrn: string
  full_name: string
  age: number
  gender: Gender
  status: PatientStatus
  risk_level: RiskLevel
  bed_number?: string | null
  chief_complaint?: string | null
  symptoms: string[]
  allergies: string[]
  vitals?: Vitals | null
  notes?: string | null
  admitted_at: string
  discharged_at?: string | null
  created_at: string
  updated_at: string
}

export interface PatientCreatePayload {
  mrn: string
  full_name: string
  age: number
  gender: Gender
  status: PatientStatus
  risk_level: RiskLevel
  bed_number?: string
  chief_complaint?: string
  symptoms: string[]
  allergies: string[]
  vitals?: Vitals
  notes?: string
}

export type PatientUpdatePayload = Partial<
  Omit<PatientCreatePayload, 'mrn' | 'vitals'>
>

export interface MedicalRecord {
  id: string
  patient_id: string
  record_type: RecordType
  title: string
  content: string
  recorded_by: string
  recorded_by_name: string
  recorded_at: string
  created_at: string
}

export async function listPatients(params?: {
  status?: PatientStatus
  search?: string
}): Promise<{ items: Patient[]; total: number }> {
  const { data } = await api.get<{ items: Patient[]; total: number }>('/patients', {
    params,
  })
  return data
}

export async function getPatient(id: string): Promise<Patient> {
  const { data } = await api.get<Patient>(`/patients/${id}`)
  return data
}

export async function createPatient(payload: PatientCreatePayload): Promise<Patient> {
  const { data } = await api.post<Patient>('/patients', payload)
  return data
}

export async function updatePatient(
  id: string,
  payload: PatientUpdatePayload,
): Promise<Patient> {
  const { data } = await api.patch<Patient>(`/patients/${id}`, payload)
  return data
}

export async function deletePatient(id: string): Promise<void> {
  await api.delete(`/patients/${id}`)
}

export async function updateVitals(id: string, vitals: Vitals): Promise<Patient> {
  const { data } = await api.put<Patient>(`/patients/${id}/vitals`, vitals)
  return data
}

export async function getMedicalHistory(
  id: string,
): Promise<{ patient: Patient; records: MedicalRecord[] }> {
  const { data } = await api.get<{ patient: Patient; records: MedicalRecord[] }>(
    `/patients/${id}/history`,
  )
  return data
}

export async function addMedicalRecord(
  id: string,
  payload: { record_type: RecordType; title: string; content: string },
): Promise<MedicalRecord> {
  const { data } = await api.post<MedicalRecord>(`/patients/${id}/records`, payload)
  return data
}
