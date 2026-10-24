import type { ColorScale, TimelineDataPoint } from '../../types'
import { mergeColorScale } from '../../utils/colorUtils'
import { buildGridCells, getCellLabel, getGridLabel, type GridCell } from '../../utils/gridUtils'

// 09:41 on Saturday, October 24, so the hour under way is 09:00
const END = new Date(2026, 9, 24, 9, 41)
const hour = (h: number, day = 24) => new Date(2026, 9, day, h)
const point = (date: Date, value: number, color?: string): TimelineDataPoint => ({ timestamp: date.toISOString(), value, color })

const SCALE: ColorScale = { thresholds: [1, 4, 8, 16], colors: ['#eeeeee', '#cccccc', '#999999', '#666666', '#333333'], emptyColor: '#eeeeee' }

const build = (overrides: Partial<Parameters<typeof buildGridCells>[0]> = {}) => buildGridCells({ data: [], rows: 1, columns: 4, granularity: 'hour', fillDirection: 'row', weekStartsOn: 0, end: END, colorScale: SCALE, autoScale: true, markColor: '#cf222e', ...overrides })
// A single row's cells, none of them blank
const strip = (overrides: Partial<Parameters<typeof buildGridCells>[0]> = {}) => build(overrides)[0] as GridCell[]
const starts = (row: (GridCell | null)[]) => row.map((cell) => cell?.bucket.startTime ?? null)

describe('buildGridCells in one row', () => {
  it('ends with the cell under way, oldest first', () => {
    const cells = strip()
    expect(starts(cells)).toEqual([hour(6), hour(7), hour(8), hour(9)])
    expect(cells[3].bucket.endTime).toEqual(hour(10))
    expect(cells.every((cell) => cell.bucket.granularity === 'hour')).toBe(true)
  })

  it('maps points already one per cell 1:1, and sums any that share one', () => {
    const cells = strip({ data: [point(hour(6), 3), point(hour(8), 1), point(new Date(2026, 9, 24, 8, 30), 2)] })
    expect(cells.map((cell) => cell.bucket.value)).toEqual([3, 0, 3, 0])
  })

  it('leaves out points outside the window, and scales against the busiest in view', () => {
    const cells = strip({ data: [point(hour(5), 50), point(hour(10), 50), point(hour(7), 2)] })
    expect(cells.map((cell) => cell.bucket.value)).toEqual([0, 2, 0, 0])
    expect(cells[1].fill).toBe('#333333')
  })

  it('scales from zero, so a steady stream reads steady', () => {
    const cells = strip({ data: [point(hour(6), 95), point(hour(7), 100), point(hour(8), 98), point(hour(9), 97)] })
    expect(cells[1].fill).toBe('#333333')
    // 95 of 100 is near the top, where min to max would have put it at the bottom
    expect(parseInt(cells[0].fill!.slice(1, 3), 16)).toBeLessThan(0x40)
  })

  it('gives an empty cell the empty color', () => {
    const cells = strip({ data: [point(hour(9), 4)] })
    expect(cells[0].fill).toBe('#eeeeee')
    expect(cells[3].fill).toBe('#333333')
  })

  it("uses the scale's thresholds without autoScale", () => {
    const cells = strip({ autoScale: false, data: [point(hour(6), 2), point(hour(7), 9), point(hour(8), 40)] })
    expect(cells.map((cell) => cell.fill)).toEqual(['#cccccc', '#666666', '#333333', '#eeeeee'])
  })

  it('draws the cells before pendingBefore hollow, and scales the rest without them', () => {
    const cells = strip({ data: [point(hour(6), 40), point(hour(8), 2)], pendingBefore: new Date(2026, 9, 24, 8, 15) })
    expect(cells.map((cell) => cell.pending)).toEqual([true, true, false, false])
    expect(cells[0].fill).toBeNull()
    expect(cells[2].fill).toBe('#333333')
  })

  it('draws every cell hollow when pendingBefore is past the window, and none when it is before', () => {
    expect(strip({ pendingBefore: hour(10) }).every((cell) => cell.pending)).toBe(true)
    expect(strip({ pendingBefore: hour(1) }).some((cell) => cell.pending)).toBe(false)
  })

  it('marks the cells holding a mark above 0, in its own color or the default', () => {
    const cells = strip({ marks: [point(hour(7), 1), point(hour(8), 1, '#e879f9'), point(hour(9), 0)] })
    expect(cells.map((cell) => cell.mark)).toEqual([null, '#cf222e', '#e879f9', null])
  })

  it('buckets days from local midnight', () => {
    const cells = strip({ granularity: 'day', columns: 3, data: [point(new Date(2026, 9, 23, 23, 30), 1), point(new Date(2026, 9, 24, 0, 30), 2)] })
    expect(starts(cells)).toEqual([new Date(2026, 9, 22), new Date(2026, 9, 23), new Date(2026, 9, 24)])
    expect(cells.map((cell) => cell.bucket.value)).toEqual([0, 1, 2])
  })

  it('keeps a single row of 60 minutes the last 60, rather than the clock hour', () => {
    const cells = strip({ granularity: 'minute', columns: 60 })
    expect(cells[0].bucket.startTime).toEqual(new Date(2026, 9, 24, 8, 42))
    expect(cells[59].bucket.startTime).toEqual(new Date(2026, 9, 24, 9, 41))
  })

  it("reads the library's own scale for a color", () => {
    const cells = strip({ colorScale: mergeColorScale(undefined, 'dark', '#3b82f6'), data: [point(hour(9), 5)] })
    expect(cells[3].fill).toBe('#3b82f6')
  })
})

describe('buildGridCells in several rows', () => {
  it('starts each row of a week of hours at local midnight, leaving the hours after the one under way blank', () => {
    const grid = build({ rows: 7, columns: 24 })
    expect(grid).toHaveLength(7)
    grid.forEach((row) => expect(row).toHaveLength(24))
    expect(grid[0][0]?.bucket.startTime).toEqual(hour(0, 18))
    expect(grid[0][23]?.bucket.startTime).toEqual(hour(23, 18))
    expect(grid[6][0]?.bucket.startTime).toEqual(hour(0, 24))
    expect(grid[6][9]?.bucket.startTime).toEqual(hour(9, 24))
    expect(grid[6].slice(10).every((cell) => cell === null)).toBe(true)
    expect(grid.slice(0, 6).every((row) => row.every((cell) => cell !== null))).toBe(true)
  })

  it('slides a week of hours with align off, ending at the hour under way', () => {
    const grid = build({ rows: 7, columns: 24, align: false })
    expect(grid[0][0]?.bucket.startTime).toEqual(hour(10, 17))
    expect(grid[6][23]?.bucket.startTime).toEqual(hour(9, 24))
    expect(grid.flat().every((cell) => cell !== null)).toBe(true)
  })

  it("fills days down columns as .Calendar's weeks, from weekStartsOn", () => {
    // Wednesday, October 21: the last week runs Sunday the 18th to Saturday, its days after Wednesday blank
    const wednesday = new Date(2026, 9, 21, 15)
    const grid = build({ rows: 7, columns: 3, granularity: 'day', fillDirection: 'column', end: wednesday })
    expect(starts(grid[0])).toEqual([new Date(2026, 9, 4), new Date(2026, 9, 11), new Date(2026, 9, 18)])
    expect(starts(grid[3])).toEqual([new Date(2026, 9, 7), new Date(2026, 9, 14), new Date(2026, 9, 21)])
    expect(grid[4][2]).toBeNull()
    expect(grid[6][2]).toBeNull()

    const mondays = build({ rows: 7, columns: 3, granularity: 'day', fillDirection: 'column', end: wednesday, weekStartsOn: 1 })
    expect(starts(mondays[0])).toEqual([new Date(2026, 9, 5), new Date(2026, 9, 12), new Date(2026, 9, 19)])
    expect(mondays[3][2]).toBeNull()
  })

  it('slides a grid whose rows span no larger unit, filled across', () => {
    const grid = build({ rows: 2, columns: 12 })
    expect(grid[0][0]?.bucket.startTime).toEqual(hour(10, 23))
    expect(grid[0][11]?.bucket.startTime).toEqual(hour(21, 23))
    expect(grid[1][11]?.bucket.startTime).toEqual(hour(9, 24))
  })

  it('fills down columns when asked, in time order', () => {
    const grid = build({ rows: 3, columns: 2, fillDirection: 'column' })
    expect(starts(grid[0])).toEqual([hour(4), hour(7)])
    expect(starts(grid[2])).toEqual([hour(6), hour(9)])
  })

  it('starts each row of an hour of minutes at :00 in several rows', () => {
    const grid = build({ rows: 2, columns: 60, granularity: 'minute' })
    expect(grid[0][0]?.bucket.startTime).toEqual(hour(8))
    expect(grid[1][41]?.bucket.startTime).toEqual(new Date(2026, 9, 24, 9, 41))
    expect(grid[1][42]).toBeNull()
  })
})

describe('getGridLabel', () => {
  it('counts the cells with values and the marked ones', () => {
    const grid = build({ data: [point(hour(6), 3), point(hour(9), 1)], marks: [point(hour(9), 1)] })
    expect(getGridLabel(grid, 'hour', 'event')).toBe('Events in 2 of the last 4 hours, 1 marked')
    expect(getGridLabel(grid, 'hour', 'log')).toBe('Logs in 2 of the last 4 hours, 1 marked')
  })

  it("doesn't count blank cells, and says a single cell", () => {
    expect(getGridLabel(build({ rows: 7, columns: 24 }), 'hour', 'event')).toBe(`Events in 0 of the last ${6 * 24 + 10} hours`)
    expect(getGridLabel(build({ columns: 1, granularity: 'day' }), 'day', 'event')).toBe('Events in 0 of the last 1 day')
  })
})

describe('getCellLabel', () => {
  it('reads a cell by its time and value', () => {
    const cells = strip({ data: [point(hour(6), 3), point(hour(7), 1)], marks: [point(hour(6), 1)], pendingBefore: hour(7) })
    expect(getCellLabel(cells[0], 'log')).toBe('October 24, 2026, 06:00: not loaded yet, marked')
    expect(getCellLabel(cells[1], 'log')).toBe('October 24, 2026, 07:00: 1 log')
    expect(getCellLabel(cells[2], 'log')).toBe('October 24, 2026, 08:00: no logs')
  })
})
