const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

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
  return `${FULL_MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/**
 * Builds a week grid from startDate to endDate (inclusive).
 * Each week is an array of 7 day strings (YYYY-MM-DD) starting on Sunday.
 * Days outside the range are represented as empty strings.
 */
export function buildWeekGrid(startDate: Date, endDate: Date): string[][] {
  const weeks: string[][] = []

  // Rewind to the Sunday on or before startDate
  const cursor = new Date(startDate)
  cursor.setDate(cursor.getDate() - cursor.getDay())

  const end = new Date(endDate)

  while (cursor <= end) {
    const week: string[] = []
    for (let i = 0; i < 7; i++) {
      const dayStr = toDateString(cursor)
      const isInRange = cursor >= startDate && cursor <= end
      week.push(isInRange ? dayStr : '')
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
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
        labels.push({ label: MONTH_NAMES[month], weekIndex: i })
        lastMonth = month
      }
    }
  }

  return labels
}

export function getDefaultDateRange(): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)
  startDate.setDate(startDate.getDate() + 1)
  return { startDate, endDate }
}
