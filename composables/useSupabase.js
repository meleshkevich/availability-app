import { createClient } from '@supabase/supabase-js'

export default function useSupabase() {
  const { supabaseUrl, supabaseAnonKey } = useRuntimeConfig().public

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase env missing', { supabaseUrl, supabaseAnonKey })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  return { supabase }
}
