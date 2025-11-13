import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const service_id = String(body?.service_id ?? '').trim()

  if (!service_id) {
    throw createError({ statusCode: 400, statusMessage: 'service_id is required' })
  }

  const cfg = useRuntimeConfig()
  const admin = createClient(cfg.public.supabaseUrl, cfg.supabaseServiceRoleKey)

  const { error } = await admin
    .from('services')
    .delete()
    .eq('id', service_id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true, message: `Service ${service_id} cancelled` }
})
