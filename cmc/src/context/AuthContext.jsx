import { createContext, useEffect, useRef, useState } from 'react'

import { signIn, signOut, signUp } from '../lib/auth'
import { ensureProfile } from '../lib/profile'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const ensuredProfileUserIdRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (!error) {
        setSession(data.session ?? null)
        setUser(data.session?.user ?? null)
      }

      setLoading(false)
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession ?? null)
        setUser(nextSession?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user?.id || ensuredProfileUserIdRef.current === user.id) {
      return
    }

    let cancelled = false

    const createProfile = async () => {
      const { error } = await ensureProfile(user)

      if (!cancelled && !error) {
        ensuredProfileUserIdRef.current = user.id
      }
    }

    createProfile()

    return () => {
      cancelled = true
    }
  }, [user])

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}