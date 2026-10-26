import { fireEvent, render } from '@testing-library/react'
import * as ReactNative from 'react-native'
import { Animated, Platform } from 'react-native'
import * as svg from 'react-native-svg'

import { HeatmapCell } from '../../components/HeatmapCell'
import type { CellMode, DataPoint, Segment } from '../../types'
import { feedback, FeedbackPressable } from '../feedbackPressable'

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

    it('outlines today in the today color, and in the selection color once it is selected', () => {
      const rect = jest.spyOn(svg, 'Rect')
      const strokes = () => rect.mock.calls.map(([props]) => props.stroke).filter(Boolean)

      render(<HeatmapCell {...baseProps} isToday />)
      expect(strokes()).toEqual([baseProps.todayBorderColor])

      rect.mockClear()
      render(<HeatmapCell {...baseProps} isToday isSelected />)
      expect(strokes()).toEqual([baseProps.selectedBorderColor])
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

    // Every style a View or Animated.View was drawn with, flattened one level, so a test can find the pulse's and the scales
    const styles = (component: jest.SpyInstance) => component.mock.calls.map(([props]) => [props.style].flat())
    const pulseStyle = (view: jest.SpyInstance) => styles(view).find((style) => style.some((part) => part && 'animationKeyframes' in part))
    const scales = (animatedView: jest.SpyInstance) => styles(animatedView).find((style) => style.some((part) => part && 'transform' in part))?.[0].transform

    it('pulses on the native driver beside the press scale on iOS, with no CSS animation', () => {
      const view = jest.spyOn(ReactNative, 'View')
      const animatedView = jest.spyOn(Animated, 'View')
      const timing = jest.spyOn(Animated, 'timing')
      render(<HeatmapCell {...baseProps} isToday animated />)
      expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ toValue: 1.2, duration: 875, useNativeDriver: true }))
      expect(scales(animatedView)).toHaveLength(2)
      expect(pulseStyle(view)).toBeUndefined()
    })

    describe('on web', () => {
      beforeEach(() => Object.assign(Platform, { OS: 'web' }))
      afterEach(() => Object.assign(Platform, { OS: 'ios' }))

      it('pulses with a CSS animation around the cell instead of an Animated loop', () => {
        const view = jest.spyOn(ReactNative, 'View')
        const animatedView = jest.spyOn(Animated, 'View')
        const loopSpy = jest.spyOn(Animated, 'loop')
        render(<HeatmapCell {...baseProps} isToday animated />)
        expect(loopSpy).not.toHaveBeenCalled()
        // 1 to 1.2 and back, each half eased in and out along a sine, as the native loop's two timings
        expect(pulseStyle(view)).toEqual([
          {
            animationIterationCount: 'infinite',
            animationKeyframes: { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.2)' }, '100%': { transform: 'scale(1)' } },
            animationTimingFunction: 'cubic-bezier(0.37, 0, 0.63, 1)'
          },
          { animationDuration: '1750ms' }
        ])
        // The press spring keeps its own view, which the CSS animation's transform would otherwise override
        expect(scales(animatedView)).toHaveLength(1)
      })

      it('takes as long as the native loop for any animationDuration', () => {
        const view = jest.spyOn(ReactNative, 'View')
        render(<HeatmapCell {...baseProps} isToday animated animationDuration={200} />)
        expect(pulseStyle(view)?.[1]).toEqual({ animationDuration: '1000ms' })
      })

      it('draws no pulse for a day that is not today, or when not animated', () => {
        const view = jest.spyOn(ReactNative, 'View')
        render(<HeatmapCell {...baseProps} animated />)
        render(<HeatmapCell {...baseProps} isToday animated={false} />)
        expect(pulseStyle(view)).toBeUndefined()
      })
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

    it('presses through an injected pressable, handing it the press-in and press-out that run the press animation', () => {
      feedback.mockClear()
      const springSpy = jest.spyOn(Animated, 'spring')
      const onPress = jest.fn()
      const { getByLabelText } = render(<HeatmapCell {...baseProps} animated onPress={onPress} pressable={FeedbackPressable} />)
      const cell = getByLabelText('2026-05-17: 5 events')
      fireEvent.mouseDown(cell)
      expect(feedback).toHaveBeenCalledTimes(1)
      expect(springSpy).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ toValue: 0.82 }))
      fireEvent.mouseUp(cell)
      expect(springSpy).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ toValue: 1 }))
      fireEvent.click(cell)
      expect(onPress).toHaveBeenCalledWith('2026-05-17', 5)
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
