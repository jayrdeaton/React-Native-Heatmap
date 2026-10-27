import type { DataPoint, Segment, TimelineDataPoint } from '../types'

// Whether two data arrays say the same thing, point by point in order, so a host building its data afresh each render
// keeps what's drawn from it (see useStable). A point's metadata is compared one level deep: nested objects made
// afresh count as changed, which only costs the redraw there would have been anyway

function sameRecord(a?: Record<string, unknown>, b?: Record<string, unknown>): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && Object.is(a[key], b[key]))
}

export function sameSegments(a?: Segment[], b?: Segment[]): boolean {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  return a.every((segment, i) => segment.color === b[i].color && segment.value === b[i].value && segment.weight === b[i].weight)
}

function sameEach<T>(a: T[], b: T[], same: (p: T, q: T) => boolean): boolean {
  if (a === b) return true
  return a.length === b.length && a.every((point, i) => point === b[i] || same(point, b[i]))
}

export function sameDataPoints(a: DataPoint[], b: DataPoint[]): boolean {
  return sameEach(a, b, (p, q) => p.date === q.date && p.value === q.value && p.color === q.color && sameSegments(p.segments, q.segments) && sameRecord(p.metadata, q.metadata))
}

export function sameTimelinePoints(a: TimelineDataPoint[], b: TimelineDataPoint[]): boolean {
  return sameEach(a, b, (p, q) => p.timestamp === q.timestamp && p.value === q.value && p.color === q.color && sameRecord(p.metadata, q.metadata))
}
