// server/api/service-types.create.post.ts
import { createClient } from '@supabase/supabase-js'

type Body = {
  name?: string
  start_time?: string | null // "HH:mm" или "HH:mm:ss"
  end_time?: string | null   // "HH:mm" или "HH:mm:ss"
}

function toHHMMSS(v?: string | null) {
  if (!v) return null
  // допускаем "HH:mm" и "HH:mm:ss"
  if (/^\d{2}:\d{2}$/.test(v)) return `${v}:00`
  if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v
  // попытка парсинга в Date -> HH:mm:ss
  const d = new Date(`1970-01-01T${v}`)
  if (Number.isNaN(d.getTime())) return null
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export default defineEventHandler(async (event) => {
  const { name, start_time, end_time } = (await readBody(event)) as Body

  const clean = String(name ?? '').trim()
  if (clean.length < 2 || clean.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'name must be 2..120 chars' })
  }

  // Если пользователь передал одно время — требуем оба
  const hasS = !!start_time
  const hasE = !!end_time
  if (hasS !== hasE) {
    throw createError({ statusCode: 400, statusMessage: 'Both start_time and end_time must be provided together' })
  }

  const startHHMMSS = toHHMMSS(start_time)
  const endHHMMSS = toHHMMSS(end_time)

  // Если передали оба — валидируем, иначе оставляем дефолты БД
  if (hasS && hasE) {
    if (!startHHMMSS || !endHHMMSS) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid time format (use HH:mm or HH:mm:ss)' })
    }
    // простая проверка порядка; окончательную проверку всё равно делает constraint
    if (endHHMMSS <= startHHMMSS) {
      throw createError({ statusCode: 400, statusMessage: 'end_time must be greater than start_time' })
    }
  }

  const cfg = useRuntimeConfig()
  const admin = createClient(cfg.public.supabaseUrl, cfg.supabaseServiceRoleKey)

  const insertPayload: any = { name: clean }
  if (hasS && hasE) {
    insertPayload.start_time = startHHMMSS
    insertPayload.end_time = endHHMMSS
    // duration_minutes НЕ отправляем — это generated column
  }

  const { data, error } = await admin
    .from('service_types')
    .insert(insertPayload)
    .select('*')
    .single()

  if (error) {
    if ((error as any).code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Service type with this name already exists' })
    }
    if ((error as any).code === '23514') {
      // может сработать service_types_time_check
      throw createError({ statusCode: 400, statusMessage: 'Invalid time values' })
    }
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  return data
})
