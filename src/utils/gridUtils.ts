import type { ColorScale, TimeBucket, TimelineDataPoint, TimelineGranularity, TimeZone } from '../types'
import { clockFor } from './clock'
import { getAutoScaleColor, getColorForValue } from './colorUtils'
import { bucketStart, buildTimeDataMap, formatBucketLabel, shiftBucket } from './timeUtils'

export interface GridCell {
  bucket: TimeBucket
  /** The cell's color, or null while it's pending (drawn hollow). */
  fill: string | null
  pending: boolean
  /** Before .Grid's minTime: dimmed, and not a button. Never pending. */
  unavailable: boolean
  /** The color of the tick under it, or null for none. */
  mark: string | null
  /** The first cell of an aligned line that starts a new hour, day or week among lines of a share of one (6 hours of a
   * day, 15 minutes of an hour), which .Grid sets apart by the theme's boundaryGap. Every line of a whole unit starts one. */
  boundary: boolean
}

interface GridCellOptions {
  data: TimelineDataPoint[]
  rows: number
  columns: number
  granularity: TimelineGranularity
  fillDirection: 'row' | 'column'
  align?: boolean
  weekStartsOn: number
  end: Date
  colorScale: ColorScale
  autoScale: boolean
  marks?: TimelineDataPoint[]
  markColor: string
  pendingBefore?: Date
  minTime?: Date
  /** The clock the cells are on: the device's (the default) or UTC's. */
  timeZone?: TimeZone
}

type LineUnit = 'hour' | 'day' | 'week'

// The larger unit a line of cells spans exactly or evenly divides, if any: an hour of minutes (or 15, 20 or 30 of them),
// a day of hours (or 6, 8 or 12 of them), or a week of days
function lineUnit(granularity: TimelineGranularity, length: number): LineUnit | null {
  if (granularity === 'minute' && length > 1 && 60 % length === 0) return 'hour'
  if (granularity === 'hour' && length > 1 && 24 % length === 0) return 'day'
  if (granularity === 'day' && length === 7) return 'week'
  return null
}

const UNIT_LENGTH: Record<LineUnit, number> = { hour: 60, day: 24, week: 7 }

// Where the aligned line holding a moment starts: its share of the hour or the day (the whole of it for a line of 60
// minutes or 24 hours: its hour or its midnight), or its week's first day, on the zone's clock
function lineStart(moment: Date, unit: LineUnit, length: number, weekStartsOn: number, timeZone: TimeZone): Date {
  const clock = clockFor(timeZone)
  if (unit === 'week') {
    const day = bucketStart(moment, 'day', timeZone)
    return shiftBucket(day, 'day', -((clock.day(day) - weekStartsOn + 7) % 7), timeZone)
  }
  if (unit === 'day' && length === 24) return bucketStart(moment, 'day', timeZone)
  const start = bucketStart(moment, unit === 'hour' ? 'minute' : 'hour', timeZone)
  if (unit === 'hour') clock.setMinutes(start, clock.minutes(start) - (clock.minutes(start) % length))
  else clock.setHours(start, clock.hours(start) - (clock.hours(start) % length))
  return start
}

// Whole units step as their buckets do (days on the calendar). A share of a day steps on the clock, so a line of 6 hours
// still starts at 06:00 across a daylight saving change (in UTC, which has none, the clock and real time agree)
function shiftLine(start: Date, unit: LineUnit, length: number, by: number, timeZone: TimeZone): Date {
  if (unit === 'week') return shiftBucket(start, 'day', 7 * by, timeZone)
  if (length === UNIT_LENGTH[unit]) return shiftBucket(start, unit, by, timeZone)
  const clock = clockFor(timeZone)
  const next = new Date(start)
  if (unit === 'day') clock.setHours(next, clock.hours(next) + length * by)
  else clock.setMinutes(next, clock.minutes(next) + length * by)
  return next
}

// Whether an aligned line starting here opens a new unit: :00, midnight, or the week's first day, on the zone's clock
function opensUnit(start: Date, unit: LineUnit, weekStartsOn: number, timeZone: TimeZone): boolean {
  const clock = clockFor(timeZone)
  if (unit === 'hour') return clock.minutes(start) === 0
  if (unit === 'day') return clock.hours(start) === 0
  return clock.day(start) === weekStartsOn
}

/**
 * .Grid's cells as rows of columns, each a bucket on the zone's clock (local by default) with its value and color, or null
 * for a blank: a cell after the one under way at `end`, which only an aligned grid has (the rest of today's row in a week
 * of hours). Unaligned, the cells are the `rows * columns` buckets ending with the one under way. Time runs across rows or
 * down columns by fillDirection. With autoScale a cell is scaled against the busiest in view from zero, as .Timeline does, rather than
 * across the data's min to max as .Calendar does: a steady stream then reads steady, where min to max would spread
 * small differences over the whole scale.
 */
export function buildGridCells({ data, rows, columns, granularity, fillDirection, align, weekStartsOn, end, colorScale, autoScale, marks, markColor, pendingBefore, minTime, timeZone = 'local' }: GridCellOptions): (GridCell | null)[][] {
  const total = rows * columns
  const lineLength = fillDirection === 'row' ? columns : rows
  const lines = fillDirection === 'row' ? rows : columns
  const last = bucketStart(end, granularity, timeZone)
  const unit = lineUnit(granularity, lineLength)
  const aligned = unit !== null && (align ?? lines > 1)
  const firstLine = unit && aligned ? shiftLine(lineStart(last, unit, lineLength, weekStartsOn, timeZone), unit, lineLength, 1 - lines, timeZone) : null

  // Each cell's start, in time order
  const starts = Array.from({ length: total }, (_, k) => (unit && firstLine ? shiftBucket(shiftLine(firstLine, unit, lineLength, Math.floor(k / lineLength), timeZone), granularity, k % lineLength, timeZone) : shiftBucket(last, granularity, k - total + 1, timeZone)))

  const values = buildTimeDataMap(data, granularity, timeZone)
  const markColors = new Map<number, string>()
  for (const mark of marks ?? []) {
    if (mark.value > 0) markColors.set(bucketStart(new Date(mark.timestamp), granularity, timeZone).getTime(), mark.color ?? markColor)
  }
  const pendingStart = pendingBefore ? bucketStart(pendingBefore, granularity, timeZone).getTime() : -Infinity
  const minStart = minTime ? bucketStart(minTime, granularity, timeZone).getTime() : -Infinity
  const buckets: (TimeBucket | null)[] = starts.map((startTime) => (startTime.getTime() > last.getTime() ? null : { startTime, endTime: shiftBucket(startTime, granularity, 1, timeZone), granularity, value: values.get(startTime.getTime()) ?? 0 }))
  const busiest = Math.max(0, ...buckets.map((bucket) => (bucket && bucket.startTime.getTime() >= Math.max(pendingStart, minStart) ? bucket.value : 0)))

  const grid: (GridCell | null)[][] = Array.from({ length: rows }, () => [])
  buckets.forEach((bucket, k) => {
    const row = fillDirection === 'row' ? Math.floor(k / columns) : k % rows
    if (!bucket) {
      grid[row].push(null)
      return
    }
    const unavailable = bucket.startTime.getTime() < minStart
    const pending = !unavailable && bucket.startTime.getTime() < pendingStart
    const fill = pending ? null : autoScale ? getAutoScaleColor(bucket.value, 0, busiest, colorScale) : getColorForValue(bucket.value, colorScale)
    const boundary = unit !== null && firstLine !== null && k % lineLength === 0 && opensUnit(bucket.startTime, unit, weekStartsOn, timeZone)
    grid[row].push({ bucket, fill, pending, unavailable, mark: markColors.get(bucket.startTime.getTime()) ?? null, boundary })
  })
  return grid
}

const plural = (count: number, unit: string) => (count === 1 ? unit : `${unit}s`)

/** The whole grid read as one: `Events in 12 of the last 48 hours, 2 marked`. Blank cells don't count. */
export function getGridLabel(grid: (GridCell | null)[][], granularity: TimelineGranularity, valueLabel: string): string {
  const cells = grid.flat().filter((cell): cell is GridCell => cell !== null)
  const active = cells.filter((cell) => cell.bucket.value > 0).length
  const marked = cells.filter((cell) => cell.mark).length
  const unit = `${valueLabel.charAt(0).toUpperCase()}${valueLabel.slice(1)}s`
  return `${unit} in ${active} of the last ${cells.length} ${plural(cells.length, granularity)}${marked ? `, ${marked} marked` : ''}`
}

/** One cell read as a button: `October 24, 2026, 09:00: 12 events, marked`, its time on the zone's clock. */
export function getCellLabel(cell: GridCell, valueLabel: string, timeZone: TimeZone = 'local'): string {
  const { startTime, granularity, value } = cell.bucket
  const count = cell.unavailable ? 'unavailable' : cell.pending ? 'not loaded yet' : value === 0 ? `no ${valueLabel}s` : `${value} ${plural(value, valueLabel)}`
  return `${formatBucketLabel(startTime, granularity, timeZone)}: ${count}${cell.mark ? ', marked' : ''}`
}
