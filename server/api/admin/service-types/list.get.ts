import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const admin = createClient(cfg.public.supabaseUrl, cfg.supabaseServiceRoleKey)

  const q = getQuery(event)
  const page = Math.max(1, Number(q.page ?? 1))
  const perPage = Math.min(100, Number(q.perPage ?? 20))
  const search = String(q.q ?? '').trim()

  let sel = admin.from('service_types')
    .select('id, name, created_at', { count: 'exact' })
    .order('name', { ascending: true })

  if (search) sel = sel.ilike('name', `%${search}%`)

  const { data, error, count } = await sel.range((page-1)*perPage, page*perPage-1)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { page, perPage, count: count ?? 0, items: data ?? [] }
})
