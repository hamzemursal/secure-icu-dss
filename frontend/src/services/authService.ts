/**
 * Auth API calls — login, logout, profile, admin user provisioning.
 */
import api, { TOKEN_STORAGE_KEY } from './api'
import type { UserRole } from '../utils/constants'

export interface UserPublic {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  department?: string | null
  created_at: string
  last_login_at?: string | null
}

export interface LoginResponse {
  token: {
    access_token: string
    token_type: string
    expires_in_minutes: number
  }
  user: UserPublic
}

export interface CreateUserPayload {
  email: string
  password: string
  full_name: string
  role: UserRole
  department?: string
}

export const USER_STORAGE_KEY = 'icu_dss_user'

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export async function logoutRequest(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } finally {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  }
}

export async function fetchMe(): Promise<UserPublic> {
  const { data } = await api.get<UserPublic>('/auth/me')
  return data
}

export async function listUsersRequest(): Promise<UserPublic[]> {
  const { data } = await api.get<UserPublic[]>('/auth/users')
  return data
}

export async function createUserRequest(
  payload: CreateUserPayload,
): Promise<UserPublic> {
  const { data } = await api.post<UserPublic>('/auth/users', payload)
  return data
}

export function persistSession(token: string, user: UserPublic): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function readStoredUser(): UserPublic | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserPublic
  } catch {
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}
