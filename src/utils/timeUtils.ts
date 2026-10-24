import type { TimelineDataPoint, TimelineGranularity } from '../types'
import { formatDisplayDate, toDateString } from './dateUtils'

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

/** Where the bucket holding a moment starts, on the device's clock: a day at local midnight, an hour at :00 even in a
 * half-hour time zone. Until 2026-10-24 .Timeline floored epoch milliseconds instead, so its days were UTC days (starting
 * at 07:00 on a UTC+7 device) and its labels read UTC times. */
export function bucketStart(date: Date, granularity: TimelineGranularity): Date {
  const start = new Date(date)
  if (granularity === 'day') start.setHours(0, 0, 0, 0)
  else if (granularity === 'hour') start.setMinutes(0, 0, 0)
  else start.setSeconds(0, 0)
  return start
}

/** A bucket's start moved by some buckets. Days step on the calendar, so a day across a daylight saving change
 * still starts at midnight; hours and minutes step in real time, so a repeated hour is a bucket of its own. */
export function shiftBucket(start: Date, granularity: TimelineGranularity, by: number): Date {
  if (granularity !== 'day') return new Date(start.getTime() + by * BUCKET_MS[granularity])
  const next = new Date(start)
  next.setDate(next.getDate() + by)
  return next
}

export function buildTimeDataMap(data: TimelineDataPoint[], granularity: TimelineGranularity): Map<number, number> {
  const map = new Map<number, number>()
  for (const point of data) {
    const key = bucketStart(new Date(point.timestamp), granularity).getTime()
    map.set(key, (map.get(key) ?? 0) + point.value)
  }
  return map
}

/** A bucket for reading aloud: `October 24, 2026`, with `, 09:00` for an hour or `, 09:41` for a minute. */
export function formatBucketLabel(start: Date, granularity: TimelineGranularity): string {
  const day = formatDisplayDate(toDateString(start))
  if (granularity === 'day') return day
  return `${day}, ${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
}

export function formatTimeLabel(date: Date, granularity: TimelineGranularity): string {
  if (granularity === 'day') {
    return `${monthAbbrevs[date.getMonth()]} ${date.getDate()}`
  }
  if (granularity === 'hour') {
    const h = date.getHours()
    return h === 0 ? `${monthAbbrevs[date.getMonth()]} ${date.getDate()}` : `${h}:00`
  }
  const h = date.getHours()
  const m = date.getMinutes()
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
