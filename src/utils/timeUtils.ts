import type { TimelineDataPoint, TimelineGranularity } from '../types'

const BUCKET_MS: Record<TimelineGranularity, number> = {
  day: 86400000,
  hour: 3600000,
  minute: 60000
}

const monthAbbrevs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function clampZoom(zoom: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, zoom))
}

export function getGranularity(zoom: number): TimelineGranularity {
  if (zoom < 4) return 'day'
  if (zoom < 80) return 'hour'
  return 'minute'
}

export function getCellWidth(granularity: TimelineGranularity, zoom: number): number {
  if (granularity === 'day') return zoom * 24
  if (granularity === 'hour') return zoom
  return zoom / 60
}

export function bucketStart(date: Date, granularity: TimelineGranularity): Date {
  const ms = date.getTime()
  return new Date(Math.floor(ms / BUCKET_MS[granularity]) * BUCKET_MS[granularity])
}

export function buildTimeDataMap(data: TimelineDataPoint[], granularity: TimelineGranularity): Map<number, number> {
  const map = new Map<number, number>()
  for (const point of data) {
    const key = bucketStart(new Date(point.timestamp), granularity).getTime()
    map.set(key, (map.get(key) ?? 0) + point.value)
  }
  return map
}

export function formatTimeLabel(date: Date, granularity: TimelineGranularity): string {
  if (granularity === 'day') {
    return `${monthAbbrevs[date.getUTCMonth()]} ${date.getUTCDate()}`
  }
  if (granularity === 'hour') {
    const h = date.getUTCHours()
    return h === 0 ? `${monthAbbrevs[date.getUTCMonth()]} ${date.getUTCDate()}` : `${h}:00`
  }
  const h = date.getUTCHours()
  const m = date.getUTCMinutes()
  return m === 0 ? `${h}:00` : `${h}:${m.toString().padStart(2, '0')}`
}

export function getLabelInterval(zoom: number, granularity: TimelineGranularity): number {
  const cellWidth = getCellWidth(granularity, zoom)
  return Math.max(1, Math.ceil(60 / cellWidth))
}

export function inferTimeBounds(data: TimelineDataPoint[]): { start: Date; end: Date } {
  if (data.length === 0) {
    const end = new Date()
    return { start: new Date(end.getTime() - 86400000), end }
  }
  let min = Infinity
  let max = -Infinity
  for (const pt of data) {
    const t = new Date(pt.timestamp).getTime()
    if (t < min) min = t
    if (t > max) max = t
  }
  return { start: new Date(min), end: new Date(max) }
}
