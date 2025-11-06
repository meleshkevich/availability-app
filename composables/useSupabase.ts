import type { SupabaseClient } from '@supabase/supabase-js'
import { useNuxtApp } from 'nuxt/app'

export default function useSupabase() {
  const { $supabase } = useNuxtApp()
  return { supabase: $supabase as SupabaseClient }
}
