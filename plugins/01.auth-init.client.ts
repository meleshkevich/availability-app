// plugins/01.auth-init.client.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import { defineNuxtPlugin, useState } from 'nuxt/app'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Явно берём типизированный клиент из NuxtApp
  const supabase = nuxtApp.$supabase as SupabaseClient
  if (!supabase) return

  const user   = useState<any | null>('auth_user', () => null)
  const authSub = useState<any | null>('auth_sub', () => null)

  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user || null

  if (!authSub.value) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      user.value = sess?.user || null
    })
    authSub.value = subscription
  }
})
