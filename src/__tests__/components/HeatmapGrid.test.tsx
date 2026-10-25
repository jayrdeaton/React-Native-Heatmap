import { fireEvent, render, screen } from '@testing-library/react'

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
})
