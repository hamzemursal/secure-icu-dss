/**
 * Auth context — session state, login/logout, role helpers.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import toast from 'react-hot-toast'
import {
  clearSession,
  fetchMe,
  loginRequest,
  logoutRequest,
  persistSession,
  readStoredUser,
  type UserPublic,
} from '../services/authService'
import { TOKEN_STORAGE_KEY } from '../services/api'
import type { UserRole } from '../utils/constants'

interface AuthContextValue {
  user: UserPublic | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(readStoredUser)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const me = await fetchMe()
        if (!cancelled) {
          setUser(me)
          localStorage.setItem('icu_dss_user', JSON.stringify(me))
        }
      } catch {
        if (!cancelled) {
          clearSession()
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password)
    persistSession(result.token.access_token, result.user)
    setUser(result.user)
    toast.success(`Welcome, ${result.user.full_name}`)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      clearSession()
    }
    setUser(null)
    toast.success('Logged out')
  }, [])

  const hasRole = useCallback(
    (...roles: UserRole[]) => (user ? roles.includes(user.role) : false),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      hasRole,
    }),
    [user, isLoading, login, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
