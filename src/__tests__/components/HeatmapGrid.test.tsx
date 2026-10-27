import { fireEvent, render, screen } from '@testing-library/react'
import type React from 'react'
import * as ReactNative from 'react-native'
import { Animated } from 'react-native'

import Heatmap from '../../index'
import type { TimelineDataPoint } from '../../types'
import { feedback, FeedbackPressable } from '../feedbackPressable'

const END = new Date(2026, 9, 24, 9, 41)
const SPACED = { marginTop: 12 }
const DATA: TimelineDataPoint[] = [
  { timestamp: new Date(2026, 9, 24, 7).toISOString(), value: 4 },
  { timestamp: new Date(2026, 9, 24, 9).toISOString(), value: 1 }
]

describe('Heatmap.Grid', () => {
  it('takes no touches without onCellPress', () => {
    render(<Heatmap.Grid data={DATA} columns={4} granularity='hour' endTime={END} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('makes each cell a button with onCellPress, labeled by its time and value', () => {
    const onCellPress = jest.fn()
    render(<Heatmap.Grid data={DATA} columns={4} granularity='hour' endTime={END} onCellPress={onCellPress} valueLabel='log' />)
    expect(screen.getAllByRole('button')).toHaveLength(4)
    fireEvent.click(screen.getByLabelText('October 24, 2026, 07:00: 4 logs'))
    expect(onCellPress).toHaveBeenCalledWith({ startTime: new Date(2026, 9, 24, 7), endTime: new Date(2026, 9, 24, 8), granularity: 'hour', value: 4 })
    expect(screen.getByLabelText('October 24, 2026, 06:00: no logs')).toBeTruthy()
  })

  it('presses each cell through pressable, and still takes no touches without onCellPress', () => {
    feedback.mockClear()
    const onCellPress = jest.fn()
    const { rerender } = render(<Heatmap.Grid data={DATA} columns={4} granularity='hour' endTime={END} onCellPress={onCellPress} valueLabel='log' pressable={FeedbackPressable} />)
    const cell = screen.getByLabelText('October 24, 2026, 07:00: 4 logs')
    fireEvent.mouseDown(cell)
    fireEvent.click(cell)
    expect(feedback).toHaveBeenCalledTimes(1)
    expect(onCellPress).toHaveBeenCalledTimes(1)
    rerender(<Heatmap.Grid data={DATA} columns={4} granularity='hour' endTime={END} pressable={FeedbackPressable} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it("leaves a week of hours' cells after the one under way blank, not buttons", () => {
    render(<Heatmap.Grid data={DATA} rows={7} columns={24} granularity='hour' endTime={END} onCellPress={jest.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(6 * 24 + 10)
    expect(screen.getByLabelText('October 24, 2026, 09:00: 1 event')).toBeTruthy()
    expect(screen.queryByLabelText(/October 24, 2026, 10:00/)).toBeNull()
  })

  it('draws 30 days in a row by default, ending today', () => {
    render(<Heatmap.Grid data={[]} onCellPress={jest.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(30)
  })

  it('takes the color, theme, marks and pending props at any shape', () => {
    expect(() => {
      render(<Heatmap.Grid data={DATA} columns={10} granularity='minute' endTime={END} color='#3b82f6' colorScheme='dark' theme={{ cellHeight: 8, gap: 1.5, pendingColor: '#3b82f6' }} marks={[{ timestamp: END.toISOString(), value: 1 }]} pendingBefore={END} accessibilityLabel='Activity' style={SPACED} />)
      render(<Heatmap.Grid data={DATA} rows={7} columns={53} fillDirection='column' weekStartsOn={1} autoScale={false} colorScale={{ thresholds: [1, 4], colors: ['#eee', '#aaa', '#555'] }} marks={[]} />)
    }).not.toThrow()
  })

  // Six hours a column, a day in four: at 09:41 on Saturday the columns start Friday 06:00, 12:00, 18:00, then Saturday
  // 00:00 and 06:00
  describe('6-hour columns', () => {
    afterEach(() => jest.restoreAllMocks())

    const hourly = (props: Partial<React.ComponentProps<typeof Heatmap.Grid>> = {}) => <Heatmap.Grid data={DATA} rows={6} columns={5} granularity='hour' fillDirection='column' endTime={END} {...props} />
    // Every style a View was drawn with, flattened one level
    const viewStyles = (view: jest.SpyInstance) => view.mock.calls.map(([props]) => Object.assign({}, ...[props.style].flat(2).filter(Boolean)))

    it('sets each day apart by boundaryGap, down the whole column that opens it', () => {
      const view = jest.spyOn(ReactNative, 'View')
      render(hourly({ theme: { boundaryGap: 4 } }))
      // Saturday's column, all six of its hours
      expect(viewStyles(view).filter((style) => style.marginLeft === 4)).toHaveLength(6)
    })

    it('outlines the selected cell in selectedColor', () => {
      const view = jest.spyOn(ReactNative, 'View')
      render(hourly({ selected: new Date(2026, 9, 24, 7, 30), theme: { selectedColor: '#ff00ff' } }))
      expect(viewStyles(view).filter((style) => style.borderColor === '#ff00ff' && style.borderWidth === 1.5)).toHaveLength(1)
    })

    it('ripples a changed cell in on its column, the newest first', () => {
      const timing = jest.spyOn(Animated, 'timing')
      const { rerender } = render(hourly({ animated: true }))
      expect(timing).not.toHaveBeenCalled()
      // 02:00 is in Saturday's first column, one from the newest; 5 columns cross in 4 steps of the full 35ms
      rerender(hourly({ animated: true, data: [...DATA, { timestamp: new Date(2026, 9, 24, 2).toISOString(), value: 4 }] }))
      expect(timing).toHaveBeenCalledWith(expect.anything(), { toValue: 1, duration: 350, delay: 35, useNativeDriver: true })
    })

    it("doesn't fade for the same data, or as the window moves on", () => {
      const timing = jest.spyOn(Animated, 'timing')
      const { rerender } = render(hourly({ animated: true }))
      rerender(hourly({ animated: true, data: DATA.map((point) => ({ ...point })) }))
      // At 12:10 the window moves on a column; the cells still in it keep their looks
      rerender(hourly({ animated: true, endTime: new Date(2026, 9, 24, 12, 10) }))
      expect(timing).not.toHaveBeenCalled()
    })

    it('changes hollow pending cells at once, fading only a cell that was drawn', () => {
      const timing = jest.spyOn(Animated, 'timing')
      const { rerender } = render(hourly({ animated: true, pendingBefore: END }))
      rerender(hourly({ animated: true }))
      // 09:00 was the only cell drawn, the busiest of one; 07:00's 4 coming in rescales it
      expect(timing).toHaveBeenCalledTimes(1)
      expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ delay: 0 }))
    })

    it('reports a pressed cell to the newest onCellPress when animated', () => {
      const first = jest.fn()
      const onCellPress = jest.fn()
      const { rerender } = render(hourly({ animated: true, onCellPress: first, valueLabel: 'log' }))
      rerender(hourly({ animated: true, onCellPress, valueLabel: 'log' }))
      fireEvent.click(screen.getByLabelText('October 24, 2026, 07:00: 4 logs'))
      expect(onCellPress).toHaveBeenCalledWith({ startTime: new Date(2026, 9, 24, 7), endTime: new Date(2026, 9, 24, 8), granularity: 'hour', value: 4 })
      expect(first).not.toHaveBeenCalled()
      // The hours after the one under way are blank, not buttons
      expect(screen.getAllByRole('button')).toHaveLength(6 * 4 + 4)
    })
  })
})
