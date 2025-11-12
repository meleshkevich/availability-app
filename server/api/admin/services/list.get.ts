import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const admin = createClient(cfg.public.supabaseUrl, cfg.supabaseServiceRoleKey)

  const q = getQuery(event)
  const page = Math.max(1, Number(q.page ?? 1))
  const perPage = Math.min(100, Number(q.perPage ?? 20))
  const offset = (page - 1) * perPage

  const search = String(q.q ?? '').trim().toLowerCase()
  const sailing = String(q.sailing ?? '').trim()
  const status = String(q.statusFilter ?? '').trim() // renamed from status
  const guideQ = String(q.guide ?? '').trim().toLowerCase()
  const dateFrom = String(q.dateFrom ?? '')
  const dateTo = String(q.dateTo ?? '')
  const wantAll = String(q.all ?? '') === '1'

  // 1️⃣ Базовый список сервисов (id + базовые поля)
let svcQuery = admin.from('services')
  .select('id, sailing, date, service_type_id, service_types(name)', { count: 'exact' })
  .order('date', { ascending: true })

  if (sailing) svcQuery = svcQuery.eq('sailing', sailing)
  if (dateFrom) svcQuery = svcQuery.gte('date', dateFrom)
  if (dateTo) svcQuery = svcQuery.lte('date', dateTo)
  if (search) svcQuery = svcQuery.or(`service.ilike.%${search}%,sailing.ilike.%${search}%`)

  const { data: services, error: e1, count: totalCount } = await svcQuery
  if (e1) throw createError({ statusCode: 500, statusMessage: e1.message })

  if (!services?.length) return { page, perPage, count: 0, items: [] }

  const ids = services.map(s => s.id)

  // 2️⃣ Кандидаты по выбранным сервисам
  let candQuery = admin.from('service_guides')
    .select('service_id, user_id, status')
    .in('service_id', ids)
  if (status) candQuery = candQuery.eq('status', status)

  const { data: candidates, error: e2 } = await candQuery
  if (e2) throw createError({ statusCode: 500, statusMessage: e2.message })

  // 3️⃣ user_meta (имена) + email
  const userIds = Array.from(new Set((candidates || []).map(c => c.user_id)))
  const metaById: Record<string, any> = {}
  if (userIds.length) {
    const { data: meta } = await admin.from('user_meta')
      .select('user_id, display_name')
      .in('user_id', userIds)
    for (const m of meta || []) metaById[m.user_id] = m
  }

  const emailById: Record<string, string | null> = {}
  for (const uid of userIds) {
    try {
      const { data } = await admin.auth.admin.getUserById(uid)
      emailById[uid] = data?.user?.email ?? null
    } catch {
      emailById[uid] = null
    }
  }

   // 3.1️⃣ Все гиды (для дропдауна), не только кандидаты
  // ⚠️ при необходимости подправь фильтр под вашу модель:
  //    .eq('role', 'guide') ИЛИ вовсе убери .eq(...) если все пользователи — гиды
  const { data: allGuidesRaw, error: eAll } = await admin
    .from('user_meta')
    .select('user_id, display_name')
  if (eAll) throw createError({ statusCode: 500, statusMessage: eAll.message })

  // дотянем email и для всех гидов
  const allGuideIds = Array.from(new Set((allGuidesRaw || []).map(g => g.user_id)))
  const emailsAll: Record<string, string | null> = {}
  for (const uid of allGuideIds) {
    if (uid in emailById) { emailsAll[uid] = emailById[uid]; continue }
    try {
      const { data } = await admin.auth.admin.getUserById(uid)
      emailsAll[uid] = data?.user?.email ?? null
    } catch {
      emailsAll[uid] = null
    }
  }

  // 4️⃣ фильтр по имени/email гида
  const filteredCands = (candidates || []).filter(c => {
    if (!guideQ) return true
    const name = (metaById[c.user_id]?.display_name || '').toLowerCase()
    const email = (emailById[c.user_id] || '').toLowerCase()
    return name.includes(guideQ) || email.includes(guideQ)
  })

  // 5️⃣ сгруппировать по сервису
  const bySvc: Record<string, any[]> = {}
  for (const c of filteredCands) {
    const arr = bySvc[c.service_id] || (bySvc[c.service_id] = [])
    arr.push({
      user_id: c.user_id,
      status: c.status,
      display_name: metaById[c.user_id]?.display_name ?? null,
      email: emailById[c.user_id] ?? null
    })
  }

// const itemsAll = services.map(s => {
//   const cands = bySvc[s.id] || []
//   const confirmed = cands.find(c => c.status === 'confirmed') || null
//   const serviceName = (s as any).service_types?.name ?? (s as any).service ?? null
//   return { ...s, service: serviceName, candidates: cands, confirmed }
// })

const itemsAll = services.map(s => {
  const cands = bySvc[s.id] || []
  const confirmed = cands.find(c => c.status === 'confirmed') || null
  const serviceName = (s as any).service_types?.name ?? (s as any).service ?? null

  // карта статусов по user_id для этого сервиса
  const statusMap: Record<string, string|null> = {}
  for (const c of cands) statusMap[c.user_id] = c.status

  // полный список гидов для дропдауна
  const all_guides = (allGuidesRaw || []).map(g => ({
    user_id: g.user_id,
    display_name: g.display_name ?? null,
    email: (emailsAll[g.user_id] ?? emailById[g.user_id]) ?? null,
    status: statusMap[g.user_id] ?? null
  }))

  return { ...s, service: serviceName, candidates: cands, confirmed, all_guides }
})

// 🔧 фильтруем по статусу, если он передан
let itemsFiltered = itemsAll
if (status) {
  itemsFiltered = itemsAll.filter(it => (it.candidates || []).some(c => c.status === status))
}

// учитываем wantAll (возврат без пагинации)
if (wantAll) {
  return {
    page,
    perPage,
    count: itemsFiltered.length,
    items: itemsFiltered
  }
}

 

  // 6️⃣ Если нужен весь набор (all=1) — возвращаем всё без пагинации
  if (wantAll) {
    return {
      page: 1,
      perPage: itemsAll.length,
      count: itemsAll.length,
      items: itemsAll
    }
  }

  // 7️⃣ Обычная пагинация по строкам
  const paged = itemsAll.slice(offset, offset + perPage)
  return {
    page,
    perPage,
    count: totalCount ?? itemsAll.length,
    items: paged
  }
})
