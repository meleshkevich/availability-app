import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ updates: Array<{ user_id: string, display_name?: string|null, phone?: string|null }> }>(event)
  if (!body?.updates?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No updates' })
  }

  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const serviceKey = config.supabaseServiceRoleKey
  if (!serviceKey) {
    throw createError({ statusCode: 500, statusMessage: 'Missing service role key' })
  }

  const admin = createClient(url, serviceKey)

  // Upsert into user_meta
  const rows = body.updates.map(u => ({
    user_id: u.user_id,
    display_name: u.display_name ?? null,
    phone: u.phone ?? null,
    updated_at: new Date().toISOString()
  }))

  const { error } = await admin.from('user_meta').upsert(rows, { onConflict: 'user_id' })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true }
})
