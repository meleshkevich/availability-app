/**
 * Возвращает сегодняшнюю дату в формате "YYYY-MM-DD"
 */
export function todayYMD(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Преобразует дату (Date | dayjs | string) в формат "YYYY-MM-DD"
 * Возвращает undefined, если дата некорректна
 */
export function toYMD(d: any): string | undefined {
  if (!d) return undefined
  if (typeof d === 'string') return d // уже "YYYY-MM-DD"
  if (typeof d?.toDate === 'function') d = d.toDate() // dayjs? -> Date

  if (d instanceof Date && !isNaN(d.getTime())) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  return undefined
}
