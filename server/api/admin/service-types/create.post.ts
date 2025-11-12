// server/api/service-types.create.post.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { name } = await readBody(event) as { name?: string }
  const clean = String(name ?? '').trim()
  if (clean.length < 2 || clean.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'name must be 2..120 chars' })
  }

  const cfg = useRuntimeConfig()
  const admin = createClient(cfg.public.supabaseUrl, cfg.supabaseServiceRoleKey)

  const { data, error } = await admin
    .from('service_types')
    .insert({ name: clean })
    .select('id, name, created_at')
    .single()

  if (error) {
    // дружелюбные сообщения по коду ошибки
    if ((error as any).code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Service type with this name already exists' })
    }
    if ((error as any).code === '23514') {
      throw createError({ statusCode: 400, statusMessage: 'Name must be 2..120 chars' })
    }
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  return data
})
