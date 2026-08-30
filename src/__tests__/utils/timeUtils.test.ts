import type { TimelineDataPoint } from '../../types'
import { bucketStart, buildTimeDataMap, clampZoom, formatTimeLabel, getCellWidth, getGranularity, getLabelInterval, inferTimeBounds } from '../../utils/timeUtils'

describe('clampZoom', () => {
  it('clamps a value below the minimum', () => {
    expect(clampZoom(-5, 1, 200)).toBe(1)
  })

  it('clamps a value above the maximum', () => {
    expect(clampZoom(500, 1, 200)).toBe(200)
  })

  it('returns the value unchanged when within range', () => {
    expect(clampZoom(50, 1, 200)).toBe(50)
  })
})

describe('getGranularity', () => {
  it('returns day for zoom below 4', () => {
    expect(getGranularity(3)).toBe('day')
    expect(getGranularity(0)).toBe('day')
  })

  it('returns hour right at the lower boundary (zoom === 4)', () => {
    expect(getGranularity(4)).toBe('hour')
  })

  it('returns hour right at the upper boundary (zoom === 79)', () => {
    expect(getGranularity(79)).toBe('hour')
  })

  it('returns minute for zoom >= 80', () => {
    expect(getGranularity(80)).toBe('minute')
    expect(getGranularity(1000)).toBe('minute')
  })
})

describe('getCellWidth', () => {
  it('computes width for day granularity (zoom * 24)', () => {
    expect(getCellWidth('day', 2)).toBe(48)
  })

  it('computes width for hour granularity (zoom)', () => {
    expect(getCellWidth('hour', 10)).toBe(10)
  })

  it('computes width for minute granularity (zoom / 60)', () => {
    expect(getCellWidth('minute', 120)).toBe(2)
  })
})

describe('bucketStart', () => {
  it('floors to the day boundary, zeroing out time-of-day', () => {
    const date = new Date(Date.UTC(2026, 4, 17, 13, 45, 30))
    const bucket = bucketStart(date, 'day')
    expect(bucket.getTime()).toBe(Date.UTC(2026, 4, 17, 0, 0, 0))
  })

  it('floors to the hour boundary, zeroing out minutes and seconds', () => {
    const date = new Date(Date.UTC(2026, 4, 17, 13, 45, 30))
    const bucket = bucketStart(date, 'hour')
    expect(bucket.getTime()).toBe(Date.UTC(2026, 4, 17, 13, 0, 0))
  })

  it('floors to the minute boundary, zeroing out seconds', () => {
    const date = new Date(Date.UTC(2026, 4, 17, 13, 45, 30))
    const bucket = bucketStart(date, 'minute')
    expect(bucket.getTime()).toBe(Date.UTC(2026, 4, 17, 13, 45, 0))
  })
})

describe('buildTimeDataMap', () => {
  it('sums values for multiple points landing in the same bucket', () => {
    const data: TimelineDataPoint[] = [
      { timestamp: new Date(Date.UTC(2026, 4, 17, 13, 5, 0)).toISOString(), value: 2 },
      { timestamp: new Date(Date.UTC(2026, 4, 17, 13, 40, 0)).toISOString(), value: 3 }
    ]
    const map = buildTimeDataMap(data, 'hour')
    const key = Date.UTC(2026, 4, 17, 13, 0, 0)
    expect(map.size).toBe(1)
    expect(map.get(key)).toBe(5)
  })

  it('returns an empty Map for empty input', () => {
    const map = buildTimeDataMap([], 'day')
    expect(map.size).toBe(0)
  })
})

describe('formatTimeLabel', () => {
  it('formats a day-granularity label using month/day', () => {
    const date = new Date(Date.UTC(2026, 4, 17))
    expect(formatTimeLabel(date, 'day')).toBe('May 17')
  })

  it('falls back to month/day format for hour granularity at hour 0', () => {
    const date = new Date(Date.UTC(2026, 4, 17, 0, 0, 0))
    expect(formatTimeLabel(date, 'hour')).toBe('May 17')
  })

  it('formats a non-zero hour for hour granularity', () => {
    const date = new Date(Date.UTC(2026, 4, 17, 9, 0, 0))
    expect(formatTimeLabel(date, 'hour')).toBe('9:00')
  })

  it('falls back to H:00 for minute granularity at minute 0', () => {
    const date = new Date(Date.UTC(2026, 4, 17, 9, 0, 0))
    expect(formatTimeLabel(date, 'minute')).toBe('9:00')
  })

  it('zero-pads a non-zero minute for minute granularity', () => {
    const date = new Date(Date.UTC(2026, 4, 17, 9, 5, 0))
    expect(formatTimeLabel(date, 'minute')).toBe('9:05')
  })
})

describe('getLabelInterval', () => {
  it('computes an interval for day granularity at low zoom', () => {
    // cellWidth = 1 * 24 = 24 -> ceil(60 / 24) = 3
    expect(getLabelInterval(1, 'day')).toBe(3)
  })

  it('computes an interval for minute granularity at moderate zoom', () => {
    // cellWidth = 600 / 60 = 10 -> ceil(60 / 10) = 6
    expect(getLabelInterval(600, 'minute')).toBe(6)
  })

  it('clamps the interval up to the Math.max(1, ...) floor at high zoom', () => {
    // cellWidth = 1000 -> ceil(60 / 1000) = 1, already at the floor
    expect(getLabelInterval(1000, 'hour')).toBe(1)
  })
})

describe('inferTimeBounds', () => {
  it('falls back to "now minus 1 day" to "now" for an empty array', () => {
    const { start, end } = inferTimeBounds([])
    expect(start).toBeInstanceOf(Date)
    expect(end).toBeInstanceOf(Date)
    const gap = end.getTime() - start.getTime()
    expect(gap).toBeGreaterThanOrEqual(86400000 - 1000)
    expect(gap).toBeLessThanOrEqual(86400000 + 1000)
  })

  it('returns the exact min/max timestamps for a non-empty array', () => {
    const earliest = new Date(Date.UTC(2026, 0, 1)).toISOString()
    const middle = new Date(Date.UTC(2026, 5, 15)).toISOString()
    const latest = new Date(Date.UTC(2026, 11, 31)).toISOString()
    const data: TimelineDataPoint[] = [
      { timestamp: middle, value: 1 },
      { timestamp: latest, value: 2 },
      { timestamp: earliest, value: 3 }
    ]

    const { start, end } = inferTimeBounds(data)
    expect(start.getTime()).toBe(new Date(earliest).getTime())
    expect(end.getTime()).toBe(new Date(latest).getTime())
  })
})
