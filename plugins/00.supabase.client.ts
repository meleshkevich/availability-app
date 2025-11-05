import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Приводим типы к string, чтобы TS не ругался
  const supabaseUrl = String(config.public.supabaseUrl)
  const supabaseAnonKey = String(config.public.supabaseAnonKey)

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'availability-auth',
    },
  })

  return {
    provide: { supabase },
  }
})
