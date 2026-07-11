/**
 * Attack simulation + audit + evaluation API clients.
 */
import api from './api'

export interface AttackPreset {
  id: string
  name: string
  payload: string
  description: string
}

export interface AttackLog {
  id: string
  attack_name: string
  payload: string
  defense_enabled: boolean
  blocked: boolean
  attack_succeeded: boolean
  risk_score: number
  unprotected_output?: Record<string, unknown> | null
  protected_output?: Record<string, unknown> | null
  findings: Array<{ pattern?: string; weight?: number }>
  latency_ms: number
  actor_name: string
  created_at: string
}

export interface AttackSimulateResponse {
  log: AttackLog
  comparison: {
    without_protection: Record<string, unknown>
    with_protection: Record<string, unknown>
    risk_score: number
    threshold: number
    blocked_by_defense: boolean
  }
}

export interface AuditLogItem {
  id: string
  action: string
  actor_name: string
  actor_role: string
  patient_id?: string | null
  resource_type: string
  resource_id?: string | null
  details: Record<string, unknown>
  created_at: string
}

export interface DashboardStats {
  patients: number
  critical_patients: number
  doctors: number
  recommendations: number
  blocked_attacks: number
  system_status: string
  recent_logs: Array<{
    id: string
    action: string
    actor_name: string
    created_at: string
    details: Record<string, unknown>
  }>
}

export interface EvaluationMetrics {
  attack_success_before: number
  attack_success_after: number
  false_positive_rate: number
  false_negative_rate: number
  avg_latency_ms: number
  recovery_time_ms: number
  unsafe_tool_reduction: number
  human_approval_accuracy: number
  total_attacks: number
  total_blocked: number
  total_recommendations: number
  attack_success_series: Array<{ label: string; value: number }>
  latency_series: Array<{ label: string; value: number; defense: boolean }>
  generated_at: string
}

export async function fetchAttackPresets(): Promise<AttackPreset[]> {
  const { data } = await api.get<AttackPreset[]>('/attacks/presets')
  return data
}

export async function simulateAttack(payload: {
  attack_name: string
  payload: string
  defense_enabled: boolean
}): Promise<AttackSimulateResponse> {
  const { data } = await api.post<AttackSimulateResponse>('/attacks/simulate', payload)
  return data
}

export async function fetchAttackLogs(): Promise<{ items: AttackLog[]; total: number }> {
  const { data } = await api.get<{ items: AttackLog[]; total: number }>('/attacks/logs')
  return data
}

export async function fetchAuditLogs(action?: string) {
  const { data } = await api.get<{ items: AuditLogItem[]; total: number }>('/audit-logs', {
    params: action ? { action } : undefined,
  })
  return data
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats')
  return data
}

export async function fetchEvaluationMetrics(): Promise<EvaluationMetrics> {
  const { data } = await api.get<EvaluationMetrics>('/evaluation/metrics')
  return data
}
