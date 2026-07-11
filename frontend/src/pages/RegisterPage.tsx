/**
 * Create account — doctor or nurse self-registration.
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { APP_NAME } from '../utils/constants'

const schema = z
  .object({
    full_name: z.string().min(2, 'Name required').max(120),
    email: z.email('Enter a valid email'),
    password: z
      .string()
      .transform((v) => v.trim())
      .pipe(z.string().min(8, 'At least 8 characters')),
    confirm_password: z
      .string()
      .transform((v) => v.trim())
      .pipe(z.string().min(8, 'Confirm your password')),
    role: z.enum(['doctor', 'nurse']),
    department: z.string().max(80).optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match — type the same password in both fields',
    path: ['confirm_password'],
  })

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: registerAccount, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'nurse', department: 'ICU' },
  })

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      await registerAccount({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        role: values.role,
        department: values.department || undefined,
      })
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  })

  const fieldClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none ring-hospital-500 focus:ring-2'

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-hospital-200/60 via-transparent to-transparent dark:from-hospital-900/40"
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 shadow-xl shadow-hospital-900/5">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-hospital-600 text-white shadow-lg shadow-hospital-600/30">
            <Activity className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Create account</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Register as a doctor or nurse for {APP_NAME}.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3" noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full name</label>
            <input className={fieldClass} {...register('full_name')} />
            {errors.full_name && (
              <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input type="email" className={fieldClass} {...register('email')} />
            {errors.email && (
              <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Role</label>
            <select className={fieldClass} {...register('role')}>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Department</label>
            <input className={fieldClass} placeholder="ICU" {...register('department')} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              className={fieldClass}
              placeholder="Min. 8 characters"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
            <input
              type="password"
              autoComplete="new-password"
              className={fieldClass}
              placeholder="Type the same password again"
              {...register('confirm_password')}
            />
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-danger">{errors.confirm_password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-hospital-600 py-2.5 text-sm font-semibold text-white hover:bg-hospital-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create account
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-hospital-700 hover:underline dark:text-hospital-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
