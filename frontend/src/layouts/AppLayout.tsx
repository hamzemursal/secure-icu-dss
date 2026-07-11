/**
 * App shell — sidebar navigation, top bar, logout, theme toggle.
 */
import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Bot,
  LayoutDashboard,
  LogOut,
  Moon,
  ScrollText,
  ShieldAlert,
  Sun,
  UserRound,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { APP_NAME } from '../utils/constants'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-hospital-600 text-white shadow-sm'
      : 'text-[var(--text-muted)] hover:bg-hospital-50 hover:text-hospital-800 dark:hover:bg-hospital-900/40 dark:hover:text-hospital-100',
  ].join(' ')

export function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex min-h-svh bg-[var(--bg)] text-[var(--text)]">
      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--bg-elevated)] p-4 md:flex md:flex-col">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hospital-600 text-white">
            <Activity className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="font-display text-sm font-bold leading-tight">Secure ICU</p>
            <p className="text-xs text-[var(--text-muted)]">Decision Support</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
          <NavLink to="/patients" className={navLinkClass}>
            <Users className="h-4 w-4" />
            Patients
          </NavLink>
          <NavLink to="/recommendations" className={navLinkClass}>
            <Bot className="h-4 w-4" />
            AI Recommendation
          </NavLink>
          <NavLink to="/attacks" className={navLinkClass}>
            <ShieldAlert className="h-4 w-4" />
            Attack Simulation
          </NavLink>
          <NavLink to="/audit-logs" className={navLinkClass}>
            <ScrollText className="h-4 w-4" />
            Audit Logs
          </NavLink>
          <NavLink to="/evaluation" className={navLinkClass}>
            <BarChart3 className="h-4 w-4" />
            Evaluation
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            <UserRound className="h-4 w-4" />
            Profile
          </NavLink>
        </nav>

        <p className="mt-4 px-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
          AI provides recommendations only. Final decisions belong to clinicians.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 sm:px-6">
          <div>
            <h1 className="font-display text-base font-semibold sm:text-lg">{APP_NAME}</h1>
            <p className="text-xs text-[var(--text-muted)] capitalize">
              {user?.role} · {user?.department ?? 'Hospital'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-[var(--border)] p-2 text-[var(--text-muted)] hover:bg-[var(--bg)]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-xl bg-hospital-600 px-3 py-2 text-sm font-medium text-white hover:bg-hospital-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
