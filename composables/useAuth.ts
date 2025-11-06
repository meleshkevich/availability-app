// composables/useAuth.ts
import { computed, watchEffect } from 'vue'
import type { User } from '@supabase/supabase-js'
import useSupabase from './useSupabase'
import { navigateTo, useState } from 'nuxt/app'

type UserMeta = {
  display_name?: string | null
  phone?: string | null
}

export default function useAuth() {
  const { supabase } = useSupabase()

  // user выставляется в plugins/01.auth-init.client.ts
  const user = useState<User | null>('auth_user', () => null)

  // локальная мета пользователя
  const userMeta = useState<UserMeta | null>('auth_user_meta', () => null)
  const loadingMeta = useState<boolean>('auth_loading_meta', () => false)

  /** Подтянуть (и при необходимости создать) user_meta для текущего пользователя */
  async function loadUserMeta(uid: string) {
    if (!uid) return
    loadingMeta.value = true
    try {
      // пробуем прочитать
      const { data, error } = await supabase
        .from('user_meta')
        .select('display_name, phone')
        .eq('user_id', uid)
        .maybeSingle()

      if (!error && data) {
        userMeta.value = data
        return
      }

      // если нет строки — создадим «лениво» (fallback display_name = префикс email)
      const emailPrefix =
        user.value?.email?.split('@')[0] || user.value?.user_metadata?.full_name || 'User'

      const { error: upsertErr } = await supabase.from('user_meta').upsert({
        user_id: uid,
        display_name: emailPrefix
      })
      if (upsertErr) {
        // не критично — просто оставим пустое meta
        console.warn('user_meta upsert failed:', upsertErr.message)
        userMeta.value = { display_name: emailPrefix }
        return
      }

      // перечитать
      const { data: reread } = await supabase
        .from('user_meta')
        .select('display_name, phone')
        .eq('user_id', uid)
        .maybeSingle()

      userMeta.value = reread ?? { display_name: emailPrefix }
    } catch (e) {
      console.warn('loadUserMeta error:', (e as any)?.message || e)
    } finally {
      loadingMeta.value = false
    }
  }

  // следим за сменой пользователя и подгружаем мету
  watchEffect(() => {
    const uid = user.value?.id
    if (uid) loadUserMeta(uid)
    else userMeta.value = null
  })

  /** AUTH API */
  const signUp = async ({ email, password, ...metadata }: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    if (error) throw error
    if (data.user?.id) await loadUserMeta(data.user.id)
    return data.user
  }

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user?.id) await loadUserMeta(data.user.id)
    return data.user
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    userMeta.value = null
    navigateTo('/')
  }

  /** Удобные вычисления */
  const isLoggedIn = computed(() => !!user.value)
  const displayName = computed(
    () =>
      userMeta.value?.display_name ||
      (user.value?.user_metadata as any)?.display_name ||
      user.value?.email ||
      'User'
  )

  return {
    // state
    user,
    userMeta,
    loadingMeta,
    // helpers
    displayName,
    isLoggedIn,
    // auth api
    signUp,
    signIn,
    signOut,
    // explicit meta loader (если нужно вручную обновить)
    loadUserMeta
  }
}
