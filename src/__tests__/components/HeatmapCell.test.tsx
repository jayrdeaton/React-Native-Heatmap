import { fireEvent, render } from '@testing-library/react'
import { Animated } from 'react-native'

import { HeatmapCell } from '../../components/HeatmapCell'
import type { CellMode, DataPoint, Segment } from '../../types'

const baseProps = {
  date: '2026-05-17',
  value: 5,
  color: '#216e39',
  emptyColor: '#ebedf0',
  size: 20,
  radius: 4,
  gutter: 4,
  cellMode: 'solid' as CellMode,
  normalizedValue: 0.5,
  todayBorderColor: '#1a7f37',
  selectedBorderColor: '#0969da'
}

const SEGMENTS: Segment[] = [
  { color: '#40c463', value: 6 },
  { color: '#216e39', value: 4 }
]

afterEach(() => {
  jest.restoreAllMocks()
})

describe('HeatmapCell', () => {
  describe('cellMode rendering', () => {
    const cellModes: CellMode[] = ['solid', 'gradient', 'density', 'stacked', 'dots', 'priority']

    it.each(cellModes)('renders cellMode %s without throwing', (cellMode) => {
      expect(() => {
        render(<HeatmapCell {...baseProps} cellMode={cellMode} />)
      }).not.toThrow()
    })

    it.each(cellModes)('renders cellMode %s with segments without throwing', (cellMode) => {
      expect(() => {
        render(<HeatmapCell {...baseProps} cellMode={cellMode} segments={SEGMENTS} />)
      }).not.toThrow()
    })

    it('renders an empty (value 0) density cell without throwing', () => {
      expect(() => {
        render(<HeatmapCell {...baseProps} cellMode='density' value={0} normalizedValue={0} />)
      }).not.toThrow()
    })

    it('renders with isSelected true', () => {
      expect(() => {
        render(<HeatmapCell {...baseProps} isSelected />)
      }).not.toThrow()
    })

    it('renders an empty (value 0) gradient cell without throwing', () => {
      expect(() => {
        render(<HeatmapCell {...baseProps} cellMode='gradient' value={0} normalizedValue={0} />)
      }).not.toThrow()
    })

    it('picks the later segment as dominant when it has the highest effective value', () => {
      const segments: Segment[] = [
        { color: '#9be9a8', value: 2 },
        { color: '#216e39', value: 9 }
      ]
      expect(() => {
        render(<HeatmapCell {...baseProps} cellMode='priority' segments={segments} />)
      }).not.toThrow()
    })
  })

  describe('data fade animation (animated=true)', () => {
    it('triggers fade-in timing when value goes from 0 to positive', () => {
      const timingSpy = jest.spyOn(Animated, 'timing')
      const { rerender } = render(<HeatmapCell {...baseProps} animated value={0} normalizedValue={0} />)
      timingSpy.mockClear()
      rerender(<HeatmapCell {...baseProps} animated value={5} normalizedValue={0.5} />)
      expect(timingSpy).toHaveBeenCalled()
    })

    it('triggers fade-out timing when value goes from positive to 0', () => {
      const timingSpy = jest.spyOn(Animated, 'timing')
      const { rerender } = render(<HeatmapCell {...baseProps} animated value={5} normalizedValue={0.5} />)
      timingSpy.mockClear()
      rerender(<HeatmapCell {...baseProps} animated value={0} normalizedValue={0} />)
      expect(timingSpy).toHaveBeenCalled()
    })

    it('does not trigger fade timing when value stays positive across a rerender', () => {
      const timingSpy = jest.spyOn(Animated, 'timing')
      const { rerender } = render(<HeatmapCell {...baseProps} animated value={5} normalizedValue={0.5} />)
      timingSpy.mockClear()
      rerender(<HeatmapCell {...baseProps} animated value={8} normalizedValue={0.8} />)
      expect(timingSpy).not.toHaveBeenCalled()
    })

    it('does not trigger fade timing when animated is false', () => {
      const timingSpy = jest.spyOn(Animated, 'timing')
      const { rerender } = render(<HeatmapCell {...baseProps} animated={false} value={0} normalizedValue={0} />)
      timingSpy.mockClear()
      rerender(<HeatmapCell {...baseProps} animated={false} value={5} normalizedValue={0.5} />)
      expect(timingSpy).not.toHaveBeenCalled()
    })
  })

  describe('today pulse animation', () => {
    it('starts and stops the pulse loop when isToday and animated are true', () => {
      const loopSpy = jest.spyOn(Animated, 'loop')
      const { unmount } = render(<HeatmapCell {...baseProps} isToday animated />)
      expect(loopSpy).toHaveBeenCalled()
      expect(() => unmount()).not.toThrow()
    })

    it('does not start the pulse loop when isToday is false', () => {
      const loopSpy = jest.spyOn(Animated, 'loop')
      render(<HeatmapCell {...baseProps} isToday={false} animated />)
      expect(loopSpy).not.toHaveBeenCalled()
    })

    it('does not start the pulse loop when animated is false', () => {
      const loopSpy = jest.spyOn(Animated, 'loop')
      render(<HeatmapCell {...baseProps} isToday animated={false} />)
      expect(loopSpy).not.toHaveBeenCalled()
    })
  })

  describe('press handling', () => {
    it('calls onPress with date and value when pressed', () => {
      const onPress = jest.fn()
      const { getByLabelText } = render(<HeatmapCell {...baseProps} value={5} onPress={onPress} />)
      fireEvent.click(getByLabelText('2026-05-17: 5 events'))
      expect(onPress).toHaveBeenCalledWith('2026-05-17', 5)
    })

    it('uses the singular "event" label for value 1', () => {
      const onPress = jest.fn()
      const { getByLabelText } = render(<HeatmapCell {...baseProps} value={1} onPress={onPress} />)
      fireEvent.click(getByLabelText('2026-05-17: 1 event'))
      expect(onPress).toHaveBeenCalledWith('2026-05-17', 1)
    })

    it('does not throw when clicked without an onPress handler', () => {
      const { getByLabelText } = render(<HeatmapCell {...baseProps} value={5} />)
      expect(() => fireEvent.click(getByLabelText('2026-05-17: 5 events'))).not.toThrow()
    })

    it('calls Animated.spring on press in and press out when animated is true', () => {
      const springSpy = jest.spyOn(Animated, 'spring')
      const onPress = jest.fn()
      const { getByLabelText } = render(<HeatmapCell {...baseProps} animated onPress={onPress} />)
      const cell = getByLabelText('2026-05-17: 5 events')
      fireEvent.mouseDown(cell)
      fireEvent.mouseUp(cell)
      expect(springSpy).toHaveBeenCalledTimes(2)
    })

    it('does not call Animated.spring on press in or press out when animated is false', () => {
      const springSpy = jest.spyOn(Animated, 'spring')
      const onPress = jest.fn()
      const { getByLabelText } = render(<HeatmapCell {...baseProps} animated={false} onPress={onPress} />)
      const cell = getByLabelText('2026-05-17: 5 events')
      fireEvent.mouseDown(cell)
      fireEvent.mouseUp(cell)
      expect(springSpy).not.toHaveBeenCalled()
    })
  })

  describe('renderCell override', () => {
    it('calls renderCell with the dataPoint and date, rendering its return value', () => {
      const dataPoint: DataPoint = { date: '2026-05-17', value: 5 }
      const renderCell = jest.fn(() => <div data-testid='custom-cell'>custom</div>)
      const { getByTestId } = render(<HeatmapCell {...baseProps} dataPoint={dataPoint} renderCell={renderCell} />)
      expect(renderCell).toHaveBeenCalledWith(dataPoint, '2026-05-17')
      expect(getByTestId('custom-cell')).toBeTruthy()
    })

    it('calls renderCell with null when no dataPoint is supplied', () => {
      const renderCell = jest.fn(() => null)
      render(<HeatmapCell {...baseProps} renderCell={renderCell} />)
      expect(renderCell).toHaveBeenCalledWith(null, '2026-05-17')
    })
  })
})
