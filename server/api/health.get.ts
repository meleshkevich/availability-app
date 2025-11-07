import { eventHandler } from 'h3'

export default eventHandler(() => {
  return {
    ok: true,
    db: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    region: process.env.VERCEL_REGION || 'local',
    time: new Date().toISOString()
  }
})


