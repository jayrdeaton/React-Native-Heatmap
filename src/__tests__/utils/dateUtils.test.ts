import { buildWeekGrid, formatDisplayDate, getDefaultDateRange, getMonthLabels, getTodayString, toDateString } from '../../utils/dateUtils'

describe('toDateString', () => {
  it('formats a date to YYYY-MM-DD', () => {
    expect(toDateString(new Date(2026, 4, 17))).toBe('2026-05-17')
  })

  it('zero-pads month and day', () => {
    expect(toDateString(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})

describe('formatDisplayDate', () => {
  it('formats a date string for display', () => {
    expect(formatDisplayDate('2026-05-17')).toBe('May 17, 2026')
  })

  it('formats January correctly', () => {
    expect(formatDisplayDate('2026-01-01')).toBe('January 1, 2026')
  })
})

describe('buildWeekGrid', () => {
  it('returns an array of 7-element week arrays', () => {
    const start = new Date(2026, 4, 17) // Sunday
    const end = new Date(2026, 4, 23) // Saturday
    const weeks = buildWeekGrid(start, end)

    expect(weeks.length).toBeGreaterThanOrEqual(1)
    for (const week of weeks) {
      expect(week).toHaveLength(7)
    }
  })

  it('produces ~53 weeks for a full year', () => {
    const { startDate, endDate } = getDefaultDateRange()
    const weeks = buildWeekGrid(startDate, endDate)
    expect(weeks.length).toBeGreaterThanOrEqual(52)
    expect(weeks.length).toBeLessThanOrEqual(54)
  })

  it('pads the first week with empty strings before startDate', () => {
    // May 20 2026 is a Wednesday (day index 3)
    const start = new Date(2026, 4, 20)
    const end = new Date(2026, 4, 20)
    const weeks = buildWeekGrid(start, end)

    // First week should have empty strings for Sun, Mon, Tue
    expect(weeks[0][0]).toBe('') // Sunday
    expect(weeks[0][1]).toBe('') // Monday
    expect(weeks[0][2]).toBe('') // Tuesday
    expect(weeks[0][3]).toBe('2026-05-20') // Wednesday
  })

  it('fills trailing days with empty strings after endDate', () => {
    // May 20 2026 is a Wednesday — rest of the week (Thu-Sat) should be empty
    const start = new Date(2026, 4, 20)
    const end = new Date(2026, 4, 20)
    const weeks = buildWeekGrid(start, end)

    const firstWeek = weeks[0]
    expect(firstWeek[4]).toBe('') // Thursday
    expect(firstWeek[5]).toBe('') // Friday
    expect(firstWeek[6]).toBe('') // Saturday
  })

  it('includes every day in range as a non-empty string', () => {
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 0, 31)
    const allDays = buildWeekGrid(start, end)
      .flat()
      .filter((d: string) => d !== '')

    expect(allDays).toHaveLength(31)
    expect(allDays[0]).toBe('2026-01-01')
    expect(allDays[30]).toBe('2026-01-31')
  })
})

describe('getMonthLabels', () => {
  it('returns 12 or 13 labels for a full year (range can straddle 13 calendar months)', () => {
    const { startDate, endDate } = getDefaultDateRange()
    const weeks = buildWeekGrid(startDate, endDate)
    const labels = getMonthLabels(weeks)
    expect(labels.length).toBeGreaterThanOrEqual(12)
    expect(labels.length).toBeLessThanOrEqual(13)
  })

  it('each label has a string label and numeric weekIndex', () => {
    const { startDate, endDate } = getDefaultDateRange()
    const weeks = buildWeekGrid(startDate, endDate)
    const labels = getMonthLabels(weeks)

    for (const { label, weekIndex } of labels) {
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
      expect(typeof weekIndex).toBe('number')
      expect(weekIndex).toBeGreaterThanOrEqual(0)
    }
  })

  it('weekIndex values are in ascending order', () => {
    const { startDate, endDate } = getDefaultDateRange()
    const weeks = buildWeekGrid(startDate, endDate)
    const labels = getMonthLabels(weeks)

    for (let i = 1; i < labels.length; i++) {
      expect(labels[i].weekIndex).toBeGreaterThan(labels[i - 1].weekIndex)
    }
  })
})

describe('getTodayString', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const result = getTodayString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result).toBe(toDateString(new Date()))
  })
})

describe('getDefaultDateRange', () => {
  it('endDate is today', () => {
    const { endDate } = getDefaultDateRange()
    const today = new Date()
    expect(toDateString(endDate)).toBe(toDateString(today))
  })

  it('startDate is approximately 1 year before endDate', () => {
    const { startDate, endDate } = getDefaultDateRange()
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBeGreaterThanOrEqual(364)
    expect(diffDays).toBeLessThanOrEqual(366)
  })
})
