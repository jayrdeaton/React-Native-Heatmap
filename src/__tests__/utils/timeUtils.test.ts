import type { TimelineDataPoint } from '../../types'
import { bucketStart, buildTimeDataMap, clampZoom, formatBucketLabel, formatTimeLabel, getCellWidth, getGranularity, getLabelInterval, inferTimeBounds, shiftBucket } from '../../utils/timeUtils'

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

describe('buildTimeDataMap', () => {
  it('sums values for multiple points landing in the same bucket', () => {
    const data: TimelineDataPoint[] = [
      { timestamp: new Date(2026, 4, 17, 13, 5, 0).toISOString(), value: 2 },
      { timestamp: new Date(2026, 4, 17, 13, 40, 0).toISOString(), value: 3 }
    ]
    const map = buildTimeDataMap(data, 'hour')
    expect(map.size).toBe(1)
    expect(map.get(new Date(2026, 4, 17, 13).getTime())).toBe(5)
  })

  it('returns an empty Map for empty input', () => {
    const map = buildTimeDataMap([], 'day')
    expect(map.size).toBe(0)
  })
})

describe('formatTimeLabel', () => {
  it('formats a day-granularity label using month/day', () => {
    expect(formatTimeLabel(new Date(2026, 4, 17), 'day')).toBe('May 17')
  })

  it('falls back to month/day format for hour granularity at hour 0', () => {
    expect(formatTimeLabel(new Date(2026, 4, 17, 0), 'hour')).toBe('May 17')
  })

  it('formats a non-zero hour for hour granularity', () => {
    expect(formatTimeLabel(new Date(2026, 4, 17, 9), 'hour')).toBe('9:00')
  })

  it('falls back to H:00 for minute granularity at minute 0', () => {
    expect(formatTimeLabel(new Date(2026, 4, 17, 9, 0), 'minute')).toBe('9:00')
  })

  it('zero-pads a non-zero minute for minute granularity', () => {
    expect(formatTimeLabel(new Date(2026, 4, 17, 9, 5), 'minute')).toBe('9:05')
  })

  it('reads the local clock, not UTC', () => {
    // 00:30 local is the previous day's evening in UTC anywhere east of Greenwich
    expect(formatTimeLabel(new Date(2026, 4, 17, 0, 30), 'day')).toBe('May 17')
    expect(formatTimeLabel(new Date(2026, 4, 17, 21), 'hour')).toBe('21:00')
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

describe('bucketStart', () => {
  const moment = new Date(2026, 9, 24, 9, 41, 30, 500)

  it('starts a day at local midnight', () => {
    expect(bucketStart(moment, 'day')).toEqual(new Date(2026, 9, 24))
  })

  it('starts an hour at :00 and a minute at :00 seconds', () => {
    expect(bucketStart(moment, 'hour')).toEqual(new Date(2026, 9, 24, 9))
    expect(bucketStart(moment, 'minute')).toEqual(new Date(2026, 9, 24, 9, 41))
  })

  it("starts a day at the device's midnight rather than UTC's", () => {
    // Floored epoch milliseconds would start this day at 07:00 on a UTC+7 device
    const justAfterMidnight = bucketStart(new Date(2026, 4, 17, 0, 30), 'day')
    expect([justAfterMidnight.getDate(), justAfterMidnight.getHours(), justAfterMidnight.getMinutes()]).toEqual([17, 0, 0])
  })

  it('leaves a moment already on its bucket where it is', () => {
    const hour = new Date(2026, 9, 24, 9)
    expect(bucketStart(hour, 'hour')).toEqual(hour)
  })
})

describe('shiftBucket', () => {
  it('steps days on the calendar, across months and years', () => {
    expect(shiftBucket(new Date(2026, 9, 31), 'day', 1)).toEqual(new Date(2026, 10, 1))
    expect(shiftBucket(new Date(2026, 0, 1), 'day', -1)).toEqual(new Date(2025, 11, 31))
  })

  it('steps hours and minutes in real time', () => {
    const hour = new Date(2026, 9, 24, 9)
    expect(shiftBucket(hour, 'hour', -47).getTime()).toBe(hour.getTime() - 47 * 3600000)
    expect(shiftBucket(hour, 'minute', 5).getTime()).toBe(hour.getTime() + 5 * 60000)
  })
})

describe('buildTimeDataMap across buckets', () => {
  it('sums the points in each local bucket, keyed by its start', () => {
    const data: TimelineDataPoint[] = [
      { timestamp: new Date(2026, 9, 24, 9, 5).toISOString(), value: 2 },
      { timestamp: new Date(2026, 9, 24, 9, 55).toISOString(), value: 3 },
      { timestamp: new Date(2026, 9, 24, 10, 0).toISOString(), value: 1 }
    ]
    const map = buildTimeDataMap(data, 'hour')
    expect(map.get(new Date(2026, 9, 24, 9).getTime())).toBe(5)
    expect(map.get(new Date(2026, 9, 24, 10).getTime())).toBe(1)
    expect(buildTimeDataMap(data, 'day').get(new Date(2026, 9, 24).getTime())).toBe(6)
  })
})

describe('formatBucketLabel', () => {
  it('names a day by its date and an hour or minute by its time too', () => {
    expect(formatBucketLabel(new Date(2026, 9, 24), 'day')).toBe('October 24, 2026')
    expect(formatBucketLabel(new Date(2026, 9, 24, 9), 'hour')).toBe('October 24, 2026, 09:00')
    expect(formatBucketLabel(new Date(2026, 9, 24, 21, 7), 'minute')).toBe('October 24, 2026, 21:07')
  })
})
