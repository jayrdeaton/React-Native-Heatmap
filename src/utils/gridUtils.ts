import type { ColorScale, TimeBucket, TimelineDataPoint, TimelineGranularity } from '../types'
import { getAutoScaleColor, getColorForValue } from './colorUtils'
import { bucketStart, buildTimeDataMap, formatBucketLabel, shiftBucket } from './timeUtils'

export interface GridCell {
  bucket: TimeBucket
  /** The cell's color, or null while it's pending (drawn hollow). */
  fill: string | null
  pending: boolean
  /** The color of the tick under it, or null for none. */
  mark: string | null
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
}

type LineUnit = 'hour' | 'day' | 'week'

// The larger unit a line of cells spans exactly, if any: an hour of minutes, a day of hours or a week of days
function lineUnit(granularity: TimelineGranularity, length: number): LineUnit | null {
  if (granularity === 'minute' && length === 60) return 'hour'
  if (granularity === 'hour' && length === 24) return 'day'
  if (granularity === 'day' && length === 7) return 'week'
  return null
}

// Where the aligned line holding a moment starts: its hour, its local midnight, or its week's first day
function lineStart(moment: Date, unit: LineUnit, weekStartsOn: number): Date {
  if (unit === 'hour') return bucketStart(moment, 'hour')
  const day = bucketStart(moment, 'day')
  if (unit === 'day') return day
  return shiftBucket(day, 'day', -((day.getDay() - weekStartsOn + 7) % 7))
}

function shiftLine(start: Date, unit: LineUnit, by: number): Date {
  return unit === 'week' ? shiftBucket(start, 'day', 7 * by) : shiftBucket(start, unit, by)
}

/**
 * .Grid's cells as rows of columns, each a local bucket with its value and color, or null for a blank: a cell after the
 * one under way at `end`, which only an aligned grid has (the rest of today's row in a week of hours). Unaligned, the
 * cells are the `rows * columns` buckets ending with the one under way. Time runs across rows or down columns by
 * fillDirection. With autoScale a cell is scaled against the busiest in view from zero, as .Timeline does, rather than
 * across the data's min to max as .Calendar does: a steady stream then reads steady, where min to max would spread
 * small differences over the whole scale.
 */
export function buildGridCells({ data, rows, columns, granularity, fillDirection, align, weekStartsOn, end, colorScale, autoScale, marks, markColor, pendingBefore }: GridCellOptions): (GridCell | null)[][] {
  const total = rows * columns
  const lineLength = fillDirection === 'row' ? columns : rows
  const lines = fillDirection === 'row' ? rows : columns
  const last = bucketStart(end, granularity)
  const unit = lineUnit(granularity, lineLength)
  const aligned = unit !== null && (align ?? lines > 1)
  const firstLine = unit && aligned ? shiftLine(lineStart(last, unit, weekStartsOn), unit, 1 - lines) : null

  // Each cell's start, in time order
  const starts = Array.from({ length: total }, (_, k) => (unit && firstLine ? shiftBucket(shiftLine(firstLine, unit, Math.floor(k / lineLength)), granularity, k % lineLength) : shiftBucket(last, granularity, k - total + 1)))

  const values = buildTimeDataMap(data, granularity)
  const markColors = new Map<number, string>()
  for (const mark of marks ?? []) {
    if (mark.value > 0) markColors.set(bucketStart(new Date(mark.timestamp), granularity).getTime(), mark.color ?? markColor)
  }
  const pendingStart = pendingBefore ? bucketStart(pendingBefore, granularity).getTime() : -Infinity
  const buckets: (TimeBucket | null)[] = starts.map((startTime) => (startTime.getTime() > last.getTime() ? null : { startTime, endTime: shiftBucket(startTime, granularity, 1), granularity, value: values.get(startTime.getTime()) ?? 0 }))
  const busiest = Math.max(0, ...buckets.map((bucket) => (bucket && bucket.startTime.getTime() >= pendingStart ? bucket.value : 0)))

  const grid: (GridCell | null)[][] = Array.from({ length: rows }, () => [])
  buckets.forEach((bucket, k) => {
    const row = fillDirection === 'row' ? Math.floor(k / columns) : k % rows
    if (!bucket) {
      grid[row].push(null)
      return
    }
    const pending = bucket.startTime.getTime() < pendingStart
    const fill = pending ? null : autoScale ? getAutoScaleColor(bucket.value, 0, busiest, colorScale) : getColorForValue(bucket.value, colorScale)
    grid[row].push({ bucket, fill, pending, mark: markColors.get(bucket.startTime.getTime()) ?? null })
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

/** One cell read as a button: `October 24, 2026, 09:00: 12 events, marked`. */
export function getCellLabel(cell: GridCell, valueLabel: string): string {
  const { startTime, granularity, value } = cell.bucket
  const count = cell.pending ? 'not loaded yet' : value === 0 ? `no ${valueLabel}s` : `${value} ${plural(value, valueLabel)}`
  return `${formatBucketLabel(startTime, granularity)}: ${count}${cell.mark ? ', marked' : ''}`
}
