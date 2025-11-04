import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const serviceKey = config.supabaseServiceRoleKey

  if (!serviceKey) {
    throw createError({ statusCode: 500, statusMessage: 'Missing service role key' })
  }

  const admin = createClient(url, serviceKey)

  // query params: page, perPage, q (search)
  const q = getQuery(event)
  const page = Number(q.page ?? 1)
  const perPage = Math.min(Number(q.perPage ?? 20), 100)
  const search = String(q.q ?? '').trim().toLowerCase()

  // list users (Auth Admin)
  // Note: listUsers supports page/perPage
  const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers({
    page,
    perPage
  })
  if (usersErr) throw createError({ statusCode: 500, statusMessage: usersErr.message })

  const users = usersData?.users ?? []

  // merge user_meta
  const ids = users.map(u => u.id)
  let metaById: Record<string, {display_name: string|null, phone: string|null}> = {}
  if (ids.length) {
    const { data: meta, error: metaErr } = await admin
      .from('user_meta')
      .select('user_id, display_name, phone')
      .in('user_id', ids)
    if (metaErr) throw createError({ statusCode: 500, statusMessage: metaErr.message })
    metaById = Object.fromEntries((meta || []).map(m => [m.user_id, { display_name: m.display_name, phone: m.phone }]))
  }

  let result = users.map(u => ({
    user_id: u.id,
    email: u.email,
    last_sign_in_at: u.last_sign_in_at,
    display_name: metaById[u.id]?.display_name ?? null,
    phone: metaById[u.id]?.phone ?? null
  }))

  // client-side filter by q (email/display_name/phone)
  if (search) {
    result = result.filter(r =>
      (r.email || '').toLowerCase().includes(search) ||
      (r.display_name || '').toLowerCase().includes(search) ||
      (r.phone || '').toLowerCase().includes(search)
    )
  }

  return {
    page,
    perPage,
    count: result.length,
    items: result
  }
})
