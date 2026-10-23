import { fireEvent, render, screen } from '@testing-library/react'

import Heatmap from '../../index'
import type { DataPoint, MonthProps } from '../../types'

const DATA: DataPoint[] = [
  { date: '2026-10-05', value: 2 },
  { date: '2026-10-12', value: 8 },
  { date: '2026-10-20', value: 1 }
]

const renderMonth = (props: Partial<MonthProps> = {}) => {
  const onDayPress = jest.fn()
  const onMonthChange = jest.fn()
  const utils = render(<Heatmap.Month data={DATA} month='2026-10' onDayPress={onDayPress} onMonthChange={onMonthChange} {...props} />)
  return { ...utils, onDayPress, onMonthChange }
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 23, 12) })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('Heatmap.Month', () => {
  it('shows the month and its weekdays, Sunday first', () => {
    const { container } = renderMonth()
    expect(container.textContent).toMatch(/^October 2026SMTWTFS1234/)
  })

  it('draws the same days with fixedWeeks', () => {
    renderMonth({ fixedWeeks: true })
    expect(screen.getAllByRole('button')).toHaveLength(31 + 2)
  })

  it('starts each week on weekStartsOn', () => {
    const { container } = renderMonth({ weekStartsOn: 1 })
    expect(container.textContent).toMatch(/^October 2026MTWTFSS1234/)
  })

  it("draws only the month's own days", () => {
    renderMonth()
    expect(screen.getAllByRole('button')).toHaveLength(31 + 2)
    expect(screen.queryByLabelText(/^September/)).toBeNull()
    expect(screen.queryByLabelText(/^November/)).toBeNull()
  })

  it('labels each day with its date and value, and today as today', () => {
    renderMonth()
    expect(screen.getByLabelText('October 12, 2026: 8 events')).toBeTruthy()
    expect(screen.getByLabelText('October 20, 2026: 1 event')).toBeTruthy()
    expect(screen.getByLabelText('October 6, 2026: no events')).toBeTruthy()
    expect(screen.getByLabelText('October 23, 2026: no events, today')).toBeTruthy()
  })

  it('names the value with valueLabel', () => {
    renderMonth({ valueLabel: 'log' })
    expect(screen.getByLabelText('October 12, 2026: 8 logs')).toBeTruthy()
    expect(screen.getByLabelText('October 20, 2026: 1 log')).toBeTruthy()
    expect(screen.getByLabelText('October 6, 2026: no logs')).toBeTruthy()
  })

  it("calls onDayPress with the day's point and date", () => {
    const { onDayPress } = renderMonth()
    fireEvent.click(screen.getByLabelText('October 12, 2026: 8 events'))
    expect(onDayPress).toHaveBeenLastCalledWith(DATA[1], '2026-10-12')
    fireEvent.click(screen.getByLabelText('October 6, 2026: no events'))
    expect(onDayPress).toHaveBeenLastCalledWith(null, '2026-10-06')
  })

  it("doesn't press days outside minDate and maxDate", () => {
    const { onDayPress } = renderMonth({ minDate: '2026-10-05', maxDate: '2026-10-23' })
    const before = screen.getByLabelText('October 4, 2026: no events')
    const after = screen.getByLabelText('October 24, 2026: no events')
    expect(before.getAttribute('aria-disabled')).toBe('true')
    expect(after.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(before)
    fireEvent.click(after)
    expect(onDayPress).not.toHaveBeenCalled()

    fireEvent.click(screen.getByLabelText('October 5, 2026: 2 events'))
    fireEvent.click(screen.getByLabelText('October 23, 2026: no events, today'))
    expect(onDayPress).toHaveBeenCalledTimes(2)
  })

  it('leaves days unpressable without onDayPress', () => {
    renderMonth({ onDayPress: undefined })
    expect(screen.getByLabelText('October 12, 2026: 8 events').getAttribute('aria-disabled')).toBe('true')
  })

  it('marks selectedDate as selected', () => {
    renderMonth({ selectedDate: '2026-10-12' })
    expect(screen.getByLabelText('October 12, 2026: 8 events').getAttribute('aria-selected')).toBe('true')
    expect(screen.getByLabelText('October 5, 2026: 2 events').getAttribute('aria-selected')).toBeNull()
  })

  it('moves a month either way with the arrows', () => {
    const { onMonthChange } = renderMonth()
    fireEvent.click(screen.getByLabelText('Previous month'))
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-09')
    fireEvent.click(screen.getByLabelText('Next month'))
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-11')
  })

  it('moves across a year', () => {
    const { onMonthChange } = renderMonth({ month: '2026-01' })
    fireEvent.click(screen.getByLabelText('Previous month'))
    expect(onMonthChange).toHaveBeenLastCalledWith('2025-12')
  })

  it('stops the arrows at the months of minDate and maxDate', () => {
    const { onMonthChange } = renderMonth({ minDate: '2026-10-05', maxDate: '2026-10-23' })
    expect(screen.getByLabelText('Previous month').getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByLabelText('Next month').getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(screen.getByLabelText('Previous month'))
    fireEvent.click(screen.getByLabelText('Next month'))
    expect(onMonthChange).not.toHaveBeenCalled()
  })

  it('lets the arrows reach the months of minDate and maxDate', () => {
    const { onMonthChange } = renderMonth({ minDate: '2026-09-14', maxDate: '2026-11-02' })
    fireEvent.click(screen.getByLabelText('Previous month'))
    fireEvent.click(screen.getByLabelText('Next month'))
    expect(onMonthChange.mock.calls).toEqual([['2026-09'], ['2026-11']])
  })

  it('has no arrows without onMonthChange', () => {
    renderMonth({ onMonthChange: undefined })
    expect(screen.queryByLabelText('Previous month')).toBeNull()
    expect(screen.queryByLabelText('Next month')).toBeNull()
  })

  it("takes the calendar's color and theme props", () => {
    expect(() => {
      renderMonth({ color: '#3b82f6', colorScheme: 'dark', theme: { cellRadius: 6, gutterSize: 4, selectedBorderColor: '#fbbf24', todayBorderColor: 'transparent' }, selectedDate: '2026-10-23', textStyle: { fontFamily: 'Menlo' } })
      renderMonth({ autoScale: false, colorScale: { thresholds: [1, 5], colors: ['#eee', '#aaa', '#555'], emptyColor: 'transparent' } })
    }).not.toThrow()
  })

  it("draws a point's own color and its segments", () => {
    const data: DataPoint[] = [
      { date: '2026-10-05', value: 2, color: 'rgba(255, 0, 0, 0.5)' },
      {
        date: '2026-10-12',
        value: 10,
        segments: [
          { color: '#40c463', value: 6, weight: 2 },
          { color: '#216e39', value: 4 }
        ]
      }
    ]
    renderMonth({ data })
    expect(screen.getByLabelText('October 5, 2026: 2 events')).toBeTruthy()
    expect(screen.getByLabelText('October 12, 2026: 10 events')).toBeTruthy()
  })
})
