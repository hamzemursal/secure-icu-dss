/**
 * Profile page — authenticated user details.
 */
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  const fields = [
    { label: 'Full name', value: user.full_name },
    { label: 'Email', value: user.email },
    { label: 'Role', value: user.role },
    { label: 'Department', value: user.department ?? '—' },
    { label: 'Status', value: user.is_active ? 'Active' : 'Inactive' },
    {
      label: 'Last login',
      value: user.last_login_at
        ? new Date(user.last_login_at).toLocaleString()
        : '—',
    },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">Profile</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Your hospital staff account details.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm font-medium capitalize">{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
