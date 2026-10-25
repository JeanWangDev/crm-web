import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CrmUser } from './api/auth'

interface AuthValue {
  token: string | null
  user: CrmUser | null
  setSession: (token: string, user: CrmUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

function readUser(): CrmUser | null {
  try {
    const raw = localStorage.getItem('crm_user')
    return raw ? (JSON.parse(raw) as CrmUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('crm_token'))
  const [user, setUser] = useState<CrmUser | null>(() => readUser())

  const value = useMemo<AuthValue>(
    () => ({
      token,
      user,
      setSession(nextToken, nextUser) {
        localStorage.setItem('crm_token', nextToken)
        localStorage.setItem('crm_user', JSON.stringify(nextUser))
        setToken(nextToken)
        setUser(nextUser)
      },
      logout() {
        localStorage.removeItem('crm_token')
        localStorage.removeItem('crm_user')
        setToken(null)
        setUser(null)
      },
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider missing')
  return value
}
