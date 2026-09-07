import * as React from 'react'

import type {
  Session,
  User,
} from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

import { queryClient } from '@/lib/queryClient'

import type { Profile } from '@/types/domain'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean

  signUp: (params: {
    email: string
    password: string
    fullName: string
    phone?: string
  }) => Promise<void>

  signIn: (params: {
    email: string
    password: string
  }) => Promise<void>

  signInWithGoogle: () => Promise<void>

  signOut: () => Promise<void>

  requestPasswordReset: (
    email: string,
  ) => Promise<void>

  updatePassword: (
    newPassword: string,
  ) => Promise<void>

  refreshProfile: () => Promise<void>
}

const AuthContext =
  React.createContext<AuthContextValue | null>(
    null,
  )

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] =
    React.useState<Session | null>(null)

  const [profile, setProfile] =
    React.useState<Profile | null>(null)

  const [isLoading, setIsLoading] =
    React.useState(true)

  const loadProfile =
    React.useCallback(
      async (userId: string) => {
        const {
          data,
          error,
        } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error(
            'AUTH_PROFILE_LOAD_FAILED',
            error,
          )

          setProfile(null)
          return
        }

        setProfile(data ?? null)
      },
      [],
    )

  React.useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      setIsLoading(true)

      const {
        data,
        error,
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        console.error(
          'AUTH_SESSION_LOAD_FAILED',
          error,
        )

        setSession(null)
        setProfile(null)
        setIsLoading(false)

        return
      }

      const currentSession =
        data.session

      setSession(currentSession)

      if (currentSession?.user) {
        await loadProfile(
          currentSession.user.id,
        )
      } else {
        setProfile(null)
      }

      if (mounted) {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: subscription,
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          newSession,
        ) => {
          if (!mounted) return

          setSession(newSession)

          if (!newSession?.user) {
            setProfile(null)
            setIsLoading(false)
            return
          }

          setIsLoading(true)

          await loadProfile(
            newSession.user.id,
          )

          if (mounted) {
            setIsLoading(false)
          }
        },
      )

    return () => {
      mounted = false

      subscription.subscription.unsubscribe()
    }
  }, [loadProfile])

  const value: AuthContextValue = {
    session,

    user: session?.user ?? null,

    profile,

    isLoading,

    isAdmin:
      profile?.role === 'admin' ||
      profile?.role === 'super_admin',

    async signUp({
      email,
      password,
      fullName,
      phone,
    }) {
      const {
        error,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      })

      if (error) {
        throw error
      }
    },

    async signIn({
      email,
      password,
    }) {
      const {
        error,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (error) {
        throw error
      }
    },

    async signInWithGoogle() {
      const {
        error,
      } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo:
              `${window.location.origin}/auth/callback`,
          },
        })

      if (error) {
        throw error
      }
    },

    async signOut() {
      setIsLoading(true)

      try {
        /*
         * 1. Sign out from Supabase first.
         * This destroys the authenticated session.
         */
        const {
          error,
        } = await supabase.auth.signOut()

        if (error) {
          throw error
        }

        /*
         * 2. Clear local authentication state.
         */
        setSession(null)
        setProfile(null)

        /*
         * 3. Cancel any queries belonging to
         * the previous account.
         */
        await queryClient.cancelQueries()

        /*
         * 4. Completely remove React Query's
         * cached data so the next account starts
         * with a clean slate.
         */
        queryClient.clear()

        /*
         * 5. Send the user straight back to
         * the homepage.
         *
         * replace() prevents the authenticated
         * page from remaining in browser history.
         */
        window.location.replace('/')
      } catch (error) {
        setIsLoading(false)
        throw error
      }
    },

    async requestPasswordReset(
      email: string,
    ) {
      const {
        error,
      } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              `${window.location.origin}/reset-password`,
          },
        )

      if (error) {
        throw error
      }
    },

    async updatePassword(
      newPassword: string,
    ) {
      const {
        error,
      } =
        await supabase.auth.updateUser({
          password: newPassword,
        })

      if (error) {
        throw error
      }
    },

    async refreshProfile() {
      if (!session?.user) {
        setProfile(null)
        return
      }

      await loadProfile(
        session.user.id,
      )
    },
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx =
    React.useContext(AuthContext)

  if (!ctx) {
    throw new Error(
      'useAuth must be used within AuthProvider',
    )
  }

  return ctx
}