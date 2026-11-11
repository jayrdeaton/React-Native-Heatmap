import { render } from '@testing-library/react'
import type React from 'react'
import { Animated } from 'react-native'
import * as svg from 'react-native-svg'

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
    animationDuration: 350,
    // A day outside the week, so none is today unless a test says
    today: '2099-01-01'
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

  // .Calendar reads today each render and hands it down. It used to be read once, when this module loaded, so a calendar
  // left open past midnight kept outlining the day the app started on
  describe('today', () => {
    afterEach(() => jest.restoreAllMocks())

    const TODAY_COLOR = '#ff00aa'
    // Each Rect as an element carrying its stroke, so the day holding today's outline can be read from its cell's label
    const outlinedDays = (container: HTMLElement) => Array.from(container.querySelectorAll(`[data-stroke="${TODAY_COLOR}"]`)).map((element) => element.closest('[aria-label]')?.getAttribute('aria-label'))

    it('outlines the day it is given as today, and moves the outline when today moves on', () => {
      jest.spyOn(svg, 'Rect').mockImplementation(((props: { stroke?: string }) => <i data-stroke={props.stroke} />) as never)
      const todayTheme = { ...theme, todayBorderColor: TODAY_COLOR }
      const { container, rerender } = renderWeekColumn({ theme: todayTheme, today: '2026-01-07' })
      expect(outlinedDays(container)).toEqual(['2026-01-07: 0 events'])

      rerender(<WeekColumn week={WEEK} dataMap={new Map()} colorScale={colorScale} theme={todayTheme} cellMode='solid' columnIndex={0} totalColumns={1} animationDirection='ltr' animationDuration={350} today='2026-01-08' />)
      expect(outlinedDays(container)).toEqual(['2026-01-08: 0 events'])
    })
  })

  describe('the fade wave', () => {
    afterEach(() => jest.restoreAllMocks())

    const delayWhenDataArrives = (props: Partial<WeekColumnProps>) => {
      const timing = jest.spyOn(Animated, 'timing')
      timing.mockClear()
      const { rerender } = renderWeekColumn({ animated: true, ...props })
      const dataMap = new Map<string, DataPoint>([['2026-01-07', { date: '2026-01-07', value: 5 }]])
      rerender(<WeekColumn week={WEEK} dataMap={dataMap} colorScale={colorScale} theme={theme} cellMode='solid' columnIndex={0} totalColumns={1} animationDirection='ltr' animationDuration={350} today='2099-01-01' animated {...props} />)
      return timing.mock.calls.map(([, config]) => config.delay)
    }

    it('delays each fade by the wave step for every column from where the wave starts', () => {
      // Right to left, the wave starts at the last column, three columns from this one
      expect(delayWhenDataArrives({ columnIndex: 0, totalColumns: 4, animationDirection: 'rtl', waveStep: 20 })).toEqual([60])
      expect(delayWhenDataArrives({ columnIndex: 2, totalColumns: 4, animationDirection: 'ltr', waveStep: 20 })).toEqual([40])
    })

    it('takes a tenth of animationDuration a column without a wave step', () => {
      expect(delayWhenDataArrives({ columnIndex: 0, totalColumns: 4, animationDirection: 'rtl' })).toEqual([105])
    })
  })
})
