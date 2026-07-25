import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'

interface AuthContextValue {
  session: Session | null
  userId: string | null
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  userId: null,
  loading: true,
  error: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      if (!isSupabaseConfigured) {
        setError(
          'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the dev server.',
        )
        setLoading(false)
        return
      }

      const { data: existing } = await supabase.auth.getSession()

      if (existing.session) {
        if (active) {
          setSession(existing.session)
          setLoading(false)
        }
        return
      }

      const { data, error: signInError } = await supabase.auth.signInAnonymously()

      if (!active) return

      if (signInError) {
        setError(
          signInError.message.includes('Anonymous sign-ins are disabled')
            ? 'Anonymous sign-ins are disabled for this Supabase project. Enable them in Authentication → Sign In / Providers → Anonymous Sign-ins.'
            : signInError.message,
        )
        setLoading(false)
        return
      }

      setSession(data.session)
      setLoading(false)
    }

    bootstrap()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, userId: session?.user.id ?? null, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
