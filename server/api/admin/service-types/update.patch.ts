// server/api/admin/service-types/update.patch.ts
import { createError, readBody } from 'h3'
import { createClient } from '@supabase/supabase-js'

const TABLE = 'service_types'

function normalizeHHMM(v: unknown): string | null {
  if (v == null || v === '') return null
  if (typeof v !== 'string') throw createError({ statusCode: 400, statusMessage: 'start_time/end_time must be string HH:mm' })
  if (/^\d{2}:\d{2}$/.test(v)) return v
  const d = new Date(v)
  if (isNaN(+d)) throw createError({ statusCode: 400, statusMessage: 'Invalid time value' })
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function sanitizeName(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v !== 'string') throw createError({ statusCode: 400, statusMessage: 'name must be a string' })
  const clean = v.trim()
  if (clean.length < 2 || clean.length > 120) throw createError({ statusCode: 400, statusMessage: 'name must be 2..120 characters' })
  return clean
}

function sanitizeDuration(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) throw createError({ statusCode: 400, statusMessage: 'duration_minutes must be a non-negative number' })
  return Math.floor(n)
}

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const admin = createClient(cfg.public.supabaseUrl, cfg.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  const body = await readBody(event)
  const id = body?.id as string | undefined
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const updates: Record<string, any> = {}
  if ('name' in body) updates.name = sanitizeName(body.name)
  if ('start_time' in body) updates.start_time = normalizeHHMM(body.start_time)
  if ('end_time' in body) updates.end_time = normalizeHHMM(body.end_time)
  if ('duration_minutes' in body) updates.duration_minutes = sanitizeDuration(body.duration_minutes)

  if (Object.keys(updates).length === 0)
    throw createError({ statusCode: 400, statusMessage: 'No updatable fields provided' })

  updates.updated_at = new Date().toISOString()

  const { data, error } = await admin
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    if (/duplicate key/i.test(String(error.message))) {
      throw createError({ statusCode: 409, statusMessage: 'Service type with this name already exists' })
    }
    throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to update service type' })
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Service type not found' })
  }

  return { item: data }
})
