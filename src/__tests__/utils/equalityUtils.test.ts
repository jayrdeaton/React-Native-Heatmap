import type { DataPoint, TimelineDataPoint } from '../../types'
import { sameDataPoints, sameTimelinePoints } from '../../utils/equalityUtils'

const POINTS: DataPoint[] = [
  { date: '2026-10-25', value: 3, color: '#40c463', segments: [{ color: '#216e39', value: 2, weight: 2 }], metadata: { source: 'logs', count: 3 } },
  { date: '2026-10-26', value: 0 }
]

// A deep copy, each point and segment a new object, as data mapped from a host's rows each render would be
const copy = (points: DataPoint[]): DataPoint[] => points.map((point) => ({ ...point, segments: point.segments?.map((segment) => ({ ...segment })), metadata: point.metadata && { ...point.metadata } }))

describe('sameDataPoints', () => {
  it('is true for the same array, and for a copy made afresh', () => {
    expect(sameDataPoints(POINTS, POINTS)).toBe(true)
    expect(sameDataPoints(POINTS, copy(POINTS))).toBe(true)
    expect(sameDataPoints([], [])).toBe(true)
  })

  it.each<[string, (points: DataPoint[]) => void]>([
    ['a date', (points) => (points[1].date = '2026-10-27')],
    ['a value', (points) => (points[0].value = 4)],
    ['a color', (points) => (points[0].color = '#9be9a8')],
    ['a segment color', (points) => (points[0].segments![0].color = '#9be9a8')],
    ['a segment value', (points) => (points[0].segments![0].value = 1)],
    ['a segment weight', (points) => (points[0].segments![0].weight = undefined)],
    ['a segment more', (points) => points[0].segments!.push({ color: '#9be9a8', value: 1 })],
    ['segments where there were none', (points) => (points[1].segments = [])],
    ['a metadata value', (points) => (points[0].metadata!.count = 4)],
    ['a metadata key', (points) => (points[0].metadata = { source: 'logs', total: 3 })],
    ['a metadata key more', (points) => (points[0].metadata!.extra = true)],
    ['metadata where there was none', (points) => (points[1].metadata = {})],
    ['a point more', (points) => points.push({ date: '2026-10-27', value: 1 })],
    ['the order', (points) => points.reverse()]
  ])('is false for %s', (_, change) => {
    const changed = copy(POINTS)
    change(changed)
    expect(sameDataPoints(POINTS, changed)).toBe(false)
  })

  it('counts nested metadata made afresh as changed, since it only compares one level deep', () => {
    const nested: DataPoint[] = [{ date: '2026-10-25', value: 1, metadata: { tags: ['a'] } }]
    expect(sameDataPoints(nested, [{ date: '2026-10-25', value: 1, metadata: { tags: ['a'] } }])).toBe(false)
    expect(sameDataPoints(nested, [{ ...nested[0] }])).toBe(true)
  })
})

describe('sameTimelinePoints', () => {
  const TIMELINE: TimelineDataPoint[] = [{ timestamp: '2026-10-26T09:00:00.000Z', value: 2, color: '#40c463', metadata: { source: 'logs' } }]

  it('is true for a copy made afresh', () => {
    expect(sameTimelinePoints(TIMELINE, [{ ...TIMELINE[0], metadata: { source: 'logs' } }])).toBe(true)
  })

  it.each<[string, Partial<TimelineDataPoint>]>([
    ['a timestamp', { timestamp: '2026-10-26T10:00:00.000Z' }],
    ['a value', { value: 3 }],
    ['a color', { color: '#9be9a8' }],
    ['metadata', { metadata: { source: 'notes' } }]
  ])('is false for %s', (_, change) => {
    expect(sameTimelinePoints(TIMELINE, [{ ...TIMELINE[0], ...change }])).toBe(false)
  })
})
