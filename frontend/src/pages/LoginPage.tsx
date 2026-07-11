/**
 * Login page — email/password with Zod + React Hook Form.
 */
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../utils/constants'

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      await login(values.email, values.password)
      const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Login failed. Check your credentials.'
      toast.error(typeof message === 'string' ? message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[var(--bg)] px-4">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-hospital-200/60 via-transparent to-transparent dark:from-hospital-900/40"
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 shadow-xl shadow-hospital-900/5">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-hospital-600 text-white shadow-lg shadow-hospital-600/30">
            <Activity className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Sign in to access ICU decision support. Recommendations only — clinicians decide.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none ring-hospital-500 focus:ring-2"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none ring-hospital-500 focus:ring-2"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-hospital-600 py-2.5 text-sm font-semibold text-white hover:bg-hospital-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          Accounts are issued by an administrator. Contact your hospital admin for access.
        </p>
      </div>
    </div>
  )
}
