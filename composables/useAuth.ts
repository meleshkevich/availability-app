import { navigateTo, useState } from 'nuxt/app'
import { computed } from 'vue'
import useSupabase from './useSupabase'

export default function useAuth() {
  const { supabase } = useSupabase()

  // реактивный пользователь (shared между компонентами)
  const user = useState<any | null>('auth_user', () => null)

  const signUp = async ({ email, password, ...metadata }: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    if (error) throw error
    return data.user
  }

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    navigateTo('/')
  }

  const isLoggedIn = computed(() => !!user.value)

  return { user, isLoggedIn, signUp, signIn, signOut }
}
