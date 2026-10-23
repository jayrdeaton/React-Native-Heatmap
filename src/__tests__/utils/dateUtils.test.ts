import { buildMonthGrid, buildWeekGrid, formatDisplayDate, formatMonthTitle, getDefaultDateRange, getMonthLabels, getTodayString, shiftMonth, toDateString } from '../../utils/dateUtils'

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
    // May 20 2026 is a Wednesday - rest of the week (Thu-Sat) should be empty
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

  it('skips a week that is entirely empty strings', () => {
    const weeks = [
      ['2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09', '2026-01-10'],
      ['', '', '', '', '', '', ''],
      ['2026-02-01', '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05', '2026-02-06', '2026-02-07']
    ]
    const labels = getMonthLabels(weeks)
    expect(labels).toEqual([
      { label: 'Jan', weekIndex: 0 },
      { label: 'Feb', weekIndex: 2 }
    ])
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

describe('buildMonthGrid', () => {
  it('returns only the weeks the month needs, seven days each', () => {
    const weeks = buildMonthGrid('2026-10')
    expect(weeks).toHaveLength(5)
    weeks.forEach((week) => expect(week).toHaveLength(7))
  })

  it('starts the month on its weekday, Sunday first, with empty strings around it', () => {
    // October 1, 2026 is a Thursday
    const weeks = buildMonthGrid('2026-10')
    expect(weeks[0]).toEqual(['', '', '', '', '2026-10-01', '2026-10-02', '2026-10-03'])
    expect(weeks[4]).toEqual(['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'])
  })

  it('starts each week on weekStartsOn', () => {
    expect(buildMonthGrid('2026-10', 1)[0]).toEqual(['', '', '', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
    expect(buildMonthGrid('2026-10', 4)[0]).toEqual(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'])
  })

  it('draws four weeks for a month that fits in four', () => {
    // February 2026 starts on a Sunday and has 28 days
    const weeks = buildMonthGrid('2026-02')
    expect(weeks).toHaveLength(4)
    expect(weeks[0][0]).toBe('2026-02-01')
    expect(weeks[3][6]).toBe('2026-02-28')
  })

  it('reaches into a sixth week when the month needs it', () => {
    // August 2026 starts on a Saturday and has 31 days
    const weeks = buildMonthGrid('2026-08')
    expect(weeks).toHaveLength(6)
    expect(weeks[0]).toEqual(['', '', '', '', '', '', '2026-08-01'])
    expect(weeks[5]).toEqual(['2026-08-30', '2026-08-31', '', '', '', '', ''])
  })

  it('counts the weeks from weekStartsOn', () => {
    // October 2026 needs five weeks from Sunday, six from Friday (the 1st is a Thursday, the last of seven)
    expect(buildMonthGrid('2026-10', 5)).toHaveLength(6)
  })

  it('pads every month to six weeks with fixedWeeks', () => {
    const february = buildMonthGrid('2026-02', 0, true)
    expect(february).toHaveLength(6)
    expect(february[4].concat(february[5]).every((day) => day === '')).toBe(true)
    expect(buildMonthGrid('2026-10', 0, true)[5]).toEqual(['', '', '', '', '', '', ''])
    expect(buildMonthGrid('2026-08', 0, true)).toEqual(buildMonthGrid('2026-08'))
  })

  it('counts a leap day', () => {
    expect(buildMonthGrid('2028-02').flat().filter(Boolean)).toHaveLength(29)
  })
})

describe('shiftMonth', () => {
  it('moves a month either way', () => {
    expect(shiftMonth('2026-10', -1)).toBe('2026-09')
    expect(shiftMonth('2026-10', 1)).toBe('2026-11')
  })

  it('moves across years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-10', -22)).toBe('2024-12')
  })
})

describe('formatMonthTitle', () => {
  it('names the month and year', () => {
    expect(formatMonthTitle('2026-10')).toBe('October 2026')
    expect(formatMonthTitle('2027-01')).toBe('January 2027')
  })
})
