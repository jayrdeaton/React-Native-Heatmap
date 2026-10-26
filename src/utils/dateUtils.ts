import { fullMonthNames, monthNames } from '../constants'

export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseDate(dateStr)
  return `${fullMonthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/**
 * Builds a week grid from startDate to endDate (inclusive).
 * Each week is an array of 7 day strings (YYYY-MM-DD) starting on Sunday.
 * Days outside the range are represented as empty strings.
 * Only the days count, not the times: the grid is the same for any two Dates on the same days.
 */
export function buildWeekGrid(startDate: Date, endDate: Date): string[][] {
  const weeks: string[][] = []
  const startDay = toDateString(startDate)
  const endDay = toDateString(endDate)

  // Rewind to the Sunday on or before startDate. The cursor walks at noon, which no daylight saving change reaches,
  // and days compare as YYYY-MM-DD strings, so the end day is in whatever time either Date carries (a start later
  // in its day than the end used to drop the end day)
  const cursor = parseDate(startDay)
  cursor.setHours(12)
  cursor.setDate(cursor.getDate() - cursor.getDay())

  while (toDateString(cursor) <= endDay) {
    const week: string[] = []
    for (let i = 0; i < 7; i++) {
      const dayStr = toDateString(cursor)
      const isInRange = dayStr >= startDay && dayStr <= endDay
      week.push(isInRange ? dayStr : '')
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
}

/**
 * Builds a month as weeks of day strings (YYYY-MM-DD): only the weeks it needs (four to six,
 * five for most), or six for every month with fixedWeeks, so each takes the same height.
 * `month` is YYYY-MM. Each week starts on weekStartsOn (0 is Sunday); days before the month
 * starts and after it ends are empty strings, as in buildWeekGrid.
 */
export function buildMonthGrid(month: string, weekStartsOn = 0, fixedWeeks = false): string[][] {
  const [y, m] = month.split('-').map(Number)
  const leading = (new Date(y, m - 1, 1).getDay() - weekStartsOn + 7) % 7
  const length = new Date(y, m, 0).getDate()
  return Array.from({ length: fixedWeeks ? 6 : Math.ceil((leading + length) / 7) }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = week * 7 + day - leading + 1
      return date >= 1 && date <= length ? `${month}-${String(date).padStart(2, '0')}` : ''
    })
  )
}

/** A YYYY-MM month moved by some months, across years as needed. */
export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split('-').map(Number)
  return toDateString(new Date(y, m - 1 + by, 1)).slice(0, 7)
}

/** `2026-10` as `October 2026`. */
export function formatMonthTitle(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${fullMonthNames[m - 1]} ${y}`
}

export interface MonthLabel {
  label: string
  weekIndex: number
}

/**
 * Returns month labels with the week index at which each month first appears.
 * Skips a month if it starts too close to the previous label (< 2 weeks gap).
 */
export function getMonthLabels(weeks: string[][]): MonthLabel[] {
  const labels: MonthLabel[] = []
  let lastMonth = -1

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i]
    // Find first real day in this week
    const firstDay = week.find((d) => d !== '')
    if (!firstDay) continue

    const month = parseDate(firstDay).getMonth()
    if (month !== lastMonth) {
      // Skip if fewer than 2 weeks since last label (avoids crowding)
      if (labels.length === 0 || i - labels[labels.length - 1].weekIndex >= 2) {
        labels.push({ label: monthNames[month], weekIndex: i })
        lastMonth = month
      }
    }
  }

  return labels
}

export function getTodayString(): string {
  return toDateString(new Date())
}

export function getDefaultDateRange(): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)
  startDate.setDate(startDate.getDate() + 1)
  return { startDate, endDate }
}
