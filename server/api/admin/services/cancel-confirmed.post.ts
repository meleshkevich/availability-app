import { eventHandler, readBody, createError, sendError, type H3Event } from 'h3'
import { createClient, type PostgrestError } from '@supabase/supabase-js'

type Body = { service_id: string; user_id: string }

export default eventHandler(async (event: H3Event) => {
  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL as string
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  if (!supabaseUrl || !serviceKey) {
    throw createError({ statusCode: 500, statusMessage: 'Missing Supabase env' })
  }
  const admin = createClient(supabaseUrl, serviceKey)

  let body: Body
  try {
    body = await readBody<Body>(event)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body' })
  }
  const { service_id, user_id } = body || ({} as Body)
  if (!service_id || !user_id) {
    throw createError({ statusCode: 400, statusMessage: 'service_id and user_id are required' })
  }

  const { data, error } = await admin
    .from('service_guides')
    .update({ status: 'cxl' })
    .eq('service_id', service_id)
    .eq('user_id', user_id)
    .eq('status', 'confirmed')
    .select('service_id, user_id, status')
    .maybeSingle()

  if (error) {
    return sendError(event, createError({ statusCode: 500, statusMessage: (error as PostgrestError).message }))
  }
  if (!data) {
    throw createError({ statusCode: 409, statusMessage: 'Invalid status transition or already processed' })
  }
  return { ok: true, item: data }
})
