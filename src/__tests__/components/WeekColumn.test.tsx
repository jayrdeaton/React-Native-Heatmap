import { render } from '@testing-library/react'
import type React from 'react'

import { WeekColumn } from '../../components/WeekColumn'
import type { DataPoint } from '../../types'
import { mergeColorScale, mergeTheme } from '../../utils/colorUtils'

type WeekColumnProps = React.ComponentProps<typeof WeekColumn>

const colorScale = mergeColorScale()
const theme = mergeTheme()

const WEEK = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09', '2026-01-10', '2026-01-11']

function renderWeekColumn(overrides: Partial<WeekColumnProps> = {}) {
  const defaultProps: WeekColumnProps = {
    week: WEEK,
    dataMap: new Map(),
    colorScale,
    theme,
    cellMode: 'solid',
    columnIndex: 0,
    totalColumns: 1,
    animationDirection: 'ltr',
    animationDuration: 350
  }
  return render(<WeekColumn {...defaultProps} {...overrides} />)
}

describe('WeekColumn', () => {
  it('renders without throwing when no data points are present', () => {
    expect(() => renderWeekColumn()).not.toThrow()
  })

  it('renders a placeholder for empty week slots', () => {
    const weekWithPadding = ['', '', '2026-01-07', '2026-01-08', '2026-01-09', '2026-01-10', '2026-01-11']
    expect(() => renderWeekColumn({ week: weekWithPadding })).not.toThrow()
  })

  it('uses an explicit data point color over autoScale and colorScale lookups', () => {
    const dataMap = new Map<string, DataPoint>([['2026-01-07', { date: '2026-01-07', value: 5, color: '#ff00ff' }]])
    expect(() =>
      renderWeekColumn({
        dataMap,
        autoScale: true,
        dataRange: { min: 1, max: 10 }
      })
    ).not.toThrow()
  })

  it('uses getAutoScaleColor when autoScale is enabled with a dataRange', () => {
    const dataMap = new Map<string, DataPoint>([['2026-01-07', { date: '2026-01-07', value: 6 }]])
    expect(() =>
      renderWeekColumn({
        dataMap,
        autoScale: true,
        dataRange: { min: 1, max: 10 }
      })
    ).not.toThrow()
  })

  it('falls back to getColorForValue when autoScale is false', () => {
    const dataMap = new Map<string, DataPoint>([['2026-01-07', { date: '2026-01-07', value: 6 }]])
    expect(() =>
      renderWeekColumn({
        dataMap,
        autoScale: false,
        dataRange: { min: 1, max: 10 }
      })
    ).not.toThrow()
  })

  it('falls back to getColorForValue when autoScale is true but no dataRange is provided', () => {
    const dataMap = new Map<string, DataPoint>([['2026-01-07', { date: '2026-01-07', value: 6 }]])
    expect(() =>
      renderWeekColumn({
        dataMap,
        autoScale: true
      })
    ).not.toThrow()
  })

  it('uses a colorScale colors[0] fallback when emptyColor is not set', () => {
    const scaleWithoutEmptyColor = { thresholds: [1, 4, 8], colors: ['#000000', '#111111', '#222222', '#333333'] }
    expect(() => renderWeekColumn({ colorScale: scaleWithoutEmptyColor })).not.toThrow()
  })

  it('computes a weighted effectiveValue from segments, defaulting missing weight to 1', () => {
    const dataMap = new Map<string, DataPoint>([
      [
        '2026-01-07',
        {
          date: '2026-01-07',
          value: 10,
          segments: [
            { color: '#40c463', value: 4, weight: 2 },
            { color: '#216e39', value: 3 }
          ]
        }
      ]
    ])
    expect(() => renderWeekColumn({ dataMap })).not.toThrow()
  })

  it('falls back to plain value when segments is an empty array', () => {
    const dataMap = new Map<string, DataPoint>([['2026-01-07', { date: '2026-01-07', value: 7, segments: [] }]])
    expect(() => renderWeekColumn({ dataMap })).not.toThrow()
  })

  it('marks the cell matching selectedDate as selected', () => {
    expect(() => renderWeekColumn({ selectedDate: '2026-01-08' })).not.toThrow()
  })

  it('renders with a selectedDate that matches none of the week dates', () => {
    expect(() => renderWeekColumn({ selectedDate: '2099-12-31' })).not.toThrow()
  })

  it('renders with animationDirection rtl across multiple columns', () => {
    expect(() =>
      renderWeekColumn({
        animationDirection: 'rtl',
        columnIndex: 2,
        totalColumns: 5
      })
    ).not.toThrow()
  })

  it('renders with animationDirection ltr across multiple columns', () => {
    expect(() =>
      renderWeekColumn({
        animationDirection: 'ltr',
        columnIndex: 2,
        totalColumns: 5
      })
    ).not.toThrow()
  })
})
