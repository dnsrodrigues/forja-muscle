import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

const TRAINER_MODE_KEY = 'musc-trainer-mode'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  isAdmin: boolean        // mantido para compatibilidade = isSuperAdmin
  isSuperAdmin: boolean
  isTrainer: boolean
  isManager: boolean      // true para super_admin e trainer
  trainerMode: 'gestao' | 'treino'
  setTrainerMode: (mode: 'gestao' | 'treino') => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [trainerMode, setTrainerModeState] = useState<'gestao' | 'treino'>(() => {
    const saved = localStorage.getItem(TRAINER_MODE_KEY)
    return saved === 'treino' ? 'treino' : 'gestao'
  })

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) setProfile(data as UserProfile)
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  function setTrainerMode(mode: 'gestao' | 'treino') {
    setTrainerModeState(mode)
    localStorage.setItem(TRAINER_MODE_KEY, mode)
  }

  const isSuperAdmin = profile?.role === 'super_admin'
  const isTrainer = profile?.role === 'trainer'
  const isManager = isSuperAdmin || isTrainer

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      isAdmin: isSuperAdmin,
      isSuperAdmin,
      isTrainer,
      isManager,
      trainerMode,
      setTrainerMode,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
      refreshProfile: async () => { if (user) await fetchProfile(user.id) },
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro do AuthProvider')
  return context
}
