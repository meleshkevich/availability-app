import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const date = String(body?.date ?? '').slice(0,10)
  const sailing = String(body?.sailing ?? '').trim()
  const service_type_id = String(body?.service_type_id ?? '').trim()

  if (!date || !sailing || !service_type_id) {
    throw createError({ statusCode: 400, statusMessage: 'date, sailing, service_type_id are required' })
  }

  const cfg = useRuntimeConfig()
  const admin = createClient(cfg.public.supabaseUrl, cfg.supabaseServiceRoleKey)

  const { data, error } = await admin
    .from('services')
    .insert({ date, sailing, service_type_id })
    .select('id, date, sailing, service_type_id')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
