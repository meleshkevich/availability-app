import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { service_id, user_id } = await readBody(event)
  if (!service_id || !user_id) {
    throw createError({ statusCode: 400, statusMessage: 'service_id and user_id are required' })
  }
  const cfg = useRuntimeConfig()
  const admin = createClient(cfg.public.supabaseUrl, cfg.supabaseServiceRoleKey)

  const { error } = await admin.rpc('admin_confirm', { p_service: service_id, p_user: user_id })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true }
})
