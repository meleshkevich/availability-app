import type { SupabaseClient } from '@supabase/supabase-js'

export default function useSupabase() {
  const { $supabase } = useNuxtApp()
  return { supabase: $supabase as SupabaseClient }
}
