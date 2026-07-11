/**
 * Recommendations API — multi-agent pipeline + doctor review.
 */
import api from './api'
import type { RiskLevel } from '../utils/patientConstants'

export type RecommendationStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'blocked'

export interface PipelineStep {
  agent: string
  success: boolean
  message: string
  duration_ms: number
  timestamp: string
}

export interface Recommendation {
  id: string
  patient_id: string
  patient_mrn: string
  patient_name: string
  status: RecommendationStatus
  suggested_risk_level: RiskLevel
  actions: string[]
  monitoring: string[]
  rationale: string
  disclaimer: string
  reasoning_summary?: string | null
  clinical_flags: string[]
  pipeline_trace: PipelineStep[]
  security: Record<string, unknown>
  verification: Record<string, unknown>
  source: string
  created_by_name: string
  reviewed_by_name?: string | null
  review_notes?: string | null
  reviewed_at?: string | null
  blocked: boolean
  block_reason?: string | null
  created_at: string
  updated_at: string
}

export async function runRecommendation(
  patientId: string,
  extraNotes?: string,
): Promise<Recommendation> {
  const { data } = await api.post<Recommendation>(
    `/recommendations/patients/${patientId}/run`,
    { extra_notes: extraNotes || null },
  )
  return data
}

export async function listRecommendations(params?: {
  patient_id?: string
  status?: RecommendationStatus
}): Promise<{ items: Recommendation[]; total: number }> {
  const { data } = await api.get<{ items: Recommendation[]; total: number }>(
    '/recommendations',
    { params },
  )
  return data
}

export async function getRecommendation(id: string): Promise<Recommendation> {
  const { data } = await api.get<Recommendation>(`/recommendations/${id}`)
  return data
}

export async function reviewRecommendation(
  id: string,
  approve: boolean,
  notes?: string,
): Promise<Recommendation> {
  const { data } = await api.post<Recommendation>(`/recommendations/${id}/review`, {
    approve,
    notes: notes || null,
  })
  return data
}
