import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { AppError, friendlyError } from '../lib/errors'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthContextValue {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  error: string | null
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setLoading(false)
      setError(null)
    })
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      setSession(data.session)
      if (sessionError) setError(friendlyError(sessionError, 'Không thể khôi phục phiên đăng nhập.').message)
      setLoading(false)
    }).catch((sessionError: unknown) => {
      if (!active) return
      setError(friendlyError(sessionError, 'Không thể khôi phục phiên đăng nhập.').message)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new AppError('Supabase chưa được cấu hình.')
    setError(null)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (signInError) {
      const mapped = friendlyError(signInError, 'Không thể đăng nhập. Vui lòng thử lại.')
      setError(mapped.message)
      throw mapped
    }
    setSession(data.session)
    setLoading(false)
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw friendlyError(signOutError, 'Không thể đăng xuất. Vui lòng thử lại.')
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    configured: isSupabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    error,
    signIn,
    signOut,
  }), [loading, session, error, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
