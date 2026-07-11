/**
 * Admin staff management — provision emails/passwords; no public self-registration.
 */
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createUserRequest,
  listUsersRequest,
  type UserPublic,
} from '../services/authService'
import { ROLES } from '../utils/constants'

const schema = z.object({
  full_name: z.string().min(2, 'Name required').max(120),
  email: z.email('Enter a valid email'),
  password: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(8, 'At least 8 characters')),
  role: z.enum(['admin', 'doctor', 'nurse']),
  department: z.string().max(80).optional(),
})

type FormValues = z.infer<typeof schema>

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'doctor', department: 'ICU' },
  })

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await listUsersRequest())
    } catch {
      toast.error('Failed to load staff accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      await createUserRequest({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        role: values.role,
        department: values.department || undefined,
      })
      toast.success(`Account created for ${values.email}`)
      reset({ role: 'doctor', department: 'ICU', full_name: '', email: '', password: '' })
      await loadUsers()
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Could not create account')
    } finally {
      setSubmitting(false)
    }
  })

  const fieldClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none ring-hospital-500 focus:ring-2'

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">Staff accounts</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Only admins can issue login emails. Staff cannot self-register.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-sm"
        noValidate
      >
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-hospital-600" aria-hidden />
          <h3 className="font-semibold">Create staff account</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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
            <label className="mb-1.5 block text-sm font-medium">Temporary password</label>
            <input type="password" className={fieldClass} {...register('password')} />
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Role</label>
            <select className={fieldClass} {...register('role')}>
              <option value={ROLES.DOCTOR}>Doctor</option>
              <option value={ROLES.NURSE}>Nurse</option>
              <option value={ROLES.ADMIN}>Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Department</label>
            <input className={fieldClass} placeholder="ICU" {...register('department')} />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-hospital-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-hospital-700 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Issue account
        </button>
      </form>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h3 className="font-semibold">Provisioned staff</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-hospital-600" />
          </div>
        ) : users.length === 0 ? (
          <p className="px-6 py-8 text-sm text-[var(--text-muted)]">No accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg)] text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-[var(--border)]">
                    <td className="px-6 py-3 font-medium">{u.full_name}</td>
                    <td className="px-6 py-3 text-[var(--text-muted)]">{u.email}</td>
                    <td className="px-6 py-3 capitalize">{u.role}</td>
                    <td className="px-6 py-3">{u.is_active ? 'Active' : 'Inactive'}</td>
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
