// server/api/admin/services/list.get.ts
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const admin = createClient(cfg.public.supabaseUrl, cfg.supabaseServiceRoleKey)

  const q = getQuery(event)
  const page = Math.max(1, Number(q.page ?? 1))
  const perPage = Math.min(100, Number(q.perPage ?? 20))

  const search  = String(q.q ?? '').trim().toLowerCase()
  const sailing = String(q.sailing ?? '').trim()
  const status  = String(q.statusFilter ?? '').trim() // tentative|confirmed|cxl_requested|cxl
  const guideQ  = String(q.guide ?? '').trim().toLowerCase()
  const dateFrom = String(q.dateFrom ?? '')
  const dateTo   = String(q.dateTo ?? '')

  // 1) Базовый набор сервисов (id в нужном порядке), без пагинации
  let baseSvcQuery = admin.from('services')
    .select('id,sailing,date,service')
    .order('date', { ascending: true })

  if (sailing)  baseSvcQuery = baseSvcQuery.eq('sailing', sailing)
  if (dateFrom) baseSvcQuery = baseSvcQuery.gte('date', dateFrom)
  if (dateTo)   baseSvcQuery = baseSvcQuery.lte('date', dateTo)
  if (search)   baseSvcQuery = baseSvcQuery.or(`service.ilike.%${search}%,sailing.ilike.%${search}%`)

  const { data: baseServices, error: eBase } = await baseSvcQuery
  if (eBase) throw createError({ statusCode: 500, statusMessage: eBase.message })

  let filteredServiceIds = new Set((baseServices || []).map(s => s.id))

  // 2) Если есть фильтр по статусу/гиду — сузим набор service_id по кандидатам
  if ((status && status.length) || (guideQ && guideQ.length)) {
    const svcIdsArr = Array.from(filteredServiceIds)
    if (svcIdsArr.length === 0) {
      return { page, perPage, count: 0, items: [] }
    }

    // кандидаты по текущему набору сервисов
    let candQuery = admin
      .from('service_guides')
      .select('service_id, user_id, status')
      .in('service_id', svcIdsArr)

    if (status) candQuery = candQuery.eq('status', status)

    const { data: candidates, error: eCand } = await candQuery
    if (eCand) throw createError({ statusCode: 500, statusMessage: eCand.message })

    let filteredCands = candidates || []

    // фильтр по имени/email гида
    if (guideQ) {
      const userIds = Array.from(new Set(filteredCands.map(c => c.user_id)))
      // name из user_meta
      let metaById: Record<string, { display_name: string|null }> = {}
      if (userIds.length) {
        const { data: meta, error: eMeta } = await admin
          .from('user_meta')
          .select('user_id, display_name')
          .in('user_id', userIds)
        if (eMeta) throw createError({ statusCode: 500, statusMessage: eMeta.message })
        metaById = Object.fromEntries((meta || []).map(m => [m.user_id, { display_name: m.display_name ?? null }]))
      }
      // email через Admin API
      const emailById: Record<string, string|null> = {}
      for (const uid of userIds) {
        try {
          const { data } = await admin.auth.admin.getUserById(uid)
          emailById[uid] = data?.user?.email ?? null
        } catch {
          emailById[uid] = null
        }
      }
      filteredCands = filteredCands.filter(c => {
        const name  = (metaById[c.user_id]?.display_name || '').toLowerCase()
        const email = (emailById[c.user_id] || '').toLowerCase()
        return name.includes(guideQ) || email.includes(guideQ)
      })
    }

    // оставить только сервисы, где после фильтров остались кандидаты
    filteredServiceIds = new Set(filteredCands.map(c => c.service_id))
  }

  // 3) Пагинация ПОСЛЕ фильтров
  const orderedIds = (baseServices || [])
    .map(s => s.id)
    .filter(id => filteredServiceIds.has(id))

  const total = orderedIds.length
  if (total === 0) return { page, perPage, count: 0, items: [] }

  const start = (page - 1) * perPage
  const end   = start + perPage
  const pageIds = orderedIds.slice(start, end)
  if (pageIds.length === 0) return { page, perPage, count: total, items: [] }

  // 4) Дотягиваем сервисы по pageIds
  const { data: svcRows, error: eSvcPage } = await admin
    .from('services')
    .select('*')
    .in('id', pageIds)
  if (eSvcPage) throw createError({ statusCode: 500, statusMessage: eSvcPage.message })

  // восстановим порядок
  const orderMap = new Map(pageIds.map((id, i) => [id, i]))
  const svcPage = (svcRows || []).sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))

  // 5) Кандидаты для pageIds
  const { data: candPage, error: eCandPage } = await admin
    .from('service_guides')
    .select('service_id, user_id, status')
    .in('service_id', pageIds)
  if (eCandPage) throw createError({ statusCode: 500, statusMessage: eCandPage.message })

  const uids = Array.from(new Set((candPage || []).map(c => c.user_id)))

  // user_meta (display_name)
  let metaById2: Record<string, { display_name: string|null }> = {}
  if (uids.length) {
    const { data: meta2 } = await admin
      .from('user_meta')
      .select('user_id, display_name')
      .in('user_id', uids)
    metaById2 = Object.fromEntries((meta2 || []).map(m => [m.user_id, { display_name: m.display_name ?? null }]))
  }

  // emails
  const emailById2: Record<string, string|null> = {}
  for (const uid of uids) {
    try {
      const { data } = await admin.auth.admin.getUserById(uid)
      emailById2[uid] = data?.user?.email ?? null
    } catch {
      emailById2[uid] = null
    }
  }

  // сгруппировать кандидатов по сервису
  const candsBySvc: Record<string, any[]> = {}
  for (const c of (candPage || [])) {
    const arr = candsBySvc[c.service_id] || (candsBySvc[c.service_id] = [])
    arr.push({
      user_id: c.user_id,
      status:  c.status,
      display_name: metaById2[c.user_id]?.display_name ?? null,
      email: emailById2[c.user_id] ?? null
    })
  }

  const items = svcPage.map(s => {
    const cands = candsBySvc[s.id] || []
    const confirmed = cands.find(c => c.status === 'confirmed') || null
    return { ...s, candidates: cands, confirmed }
  })

  return { page, perPage, count: total, items }
})
