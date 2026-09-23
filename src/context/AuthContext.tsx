import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type UserRole = 'admin' | 'staff'

type Profile = {
  id: string
  full_name: string | null
  role: UserRole
}

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  login: (
    email: string,
    password: string
  ) => Promise<{
    error: Error | null
  }>
  logout: () => Promise<{
    error: Error | null
  }>
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Profile error:', error)
      setProfile(null)
      return
    }

    if (!data) {
      console.warn('No profile found for user:', userId)
      setProfile(null)
      return
    }

    setProfile(data)
  }

  useEffect(() => {
    async function getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadProfile(session.user.id)
      }

      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return {
      error: error ? new Error(error.message) : null,
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()

    return {
      error: error ? new Error(error.message) : null,
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}