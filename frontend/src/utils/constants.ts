/** Shared frontend constants. */
export const APP_NAME =
  import.meta.env.VITE_APP_NAME ?? 'Secure ICU Decision Support Agent'

export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]
