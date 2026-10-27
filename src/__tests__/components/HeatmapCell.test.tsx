import { act, fireEvent, render } from '@testing-library/react'
import type React from 'react'
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

  // A day's next look fades in over the one it shows, on its column's delay, and the looks under it go once it's in
  describe('fading to the next look (animated=true)', () => {
    const A = '#216e39'
    const B = '#da3633'
    const C = '#8957e5'
    const D = '#d29922'

    // Each Rect as an element carrying its fill, in drawing order (bottom first), so a test reads what the cell draws now
    const fills = (container: HTMLElement) => Array.from(container.querySelectorAll('[data-fill]')).map((element) => element.getAttribute('data-fill'))
    beforeEach(() => {
      jest.spyOn(svg, 'Rect').mockImplementation(((props: { fill?: string }) => <i data-fill={props.fill} />) as never)
    })

    // Animated.timing as fades the test finishes, or sees stopped, itself
    const holdFades = () => {
      const fades: { config: Animated.TimingAnimationConfig; finish: () => void; stop: jest.Mock }[] = []
      jest.spyOn(Animated, 'timing').mockImplementation((_value, config) => {
        let done: Animated.EndCallback | undefined
        const fade = { config, finish: () => act(() => done?.({ finished: true })), stop: jest.fn(() => done?.({ finished: false })) }
        fades.push(fade)
        return { start: (callback?: Animated.EndCallback) => (done = callback), stop: fade.stop, reset: () => {} } as unknown as Animated.CompositeAnimation
      })
      return fades
    }

    const cell = (props: Partial<React.ComponentProps<typeof HeatmapCell>>) => <HeatmapCell {...baseProps} animated dataFadeDelay={70} {...props} />

    it('shows a day that has data when it mounts at once', () => {
      const timing = jest.spyOn(Animated, 'timing')
      const { container } = render(cell({ color: A }))
      expect(timing).not.toHaveBeenCalled()
      expect(fills(container)).toEqual([baseProps.emptyColor, A])
    })

    it('fades data in on its column delay when it arrives, as the first load ripples in', () => {
      const fades = holdFades()
      const { container, rerender } = render(cell({ value: 0, normalizedValue: 0 }))
      expect(fills(container)).toEqual([baseProps.emptyColor])
      rerender(cell({ color: A }))
      expect(fades.map((fade) => fade.config)).toEqual([{ toValue: 1, duration: 350, delay: 70, useNativeDriver: true }])
      expect(fills(container)).toEqual([baseProps.emptyColor, A])
    })

    it('fades a new color in over the old one on its delay, then drops the old one', () => {
      const fades = holdFades()
      const { container, rerender } = render(cell({ color: A }))
      rerender(cell({ color: B, dataFadeDelay: 140 }))
      expect(fades.map((fade) => fade.config.delay)).toEqual([140])
      expect(fills(container)).toEqual([baseProps.emptyColor, A, B])
      fades[0].finish()
      expect(fills(container)).toEqual([baseProps.emptyColor, B])
    })

    it('fades out to empty on its delay too, rather than all at once', () => {
      const fades = holdFades()
      const { container, rerender } = render(cell({ color: A }))
      rerender(cell({ value: 0, normalizedValue: 0, color: baseProps.emptyColor }))
      expect(fades.map((fade) => fade.config)).toEqual([{ toValue: 1, duration: 350, delay: 70, useNativeDriver: true }])
      // The empty color fades in over the data, which reads as the data fading out
      expect(fills(container)).toEqual([baseProps.emptyColor, A, baseProps.emptyColor])
      fades[0].finish()
      expect(fills(container)).toEqual([baseProps.emptyColor])
    })

    it('stops a fade where it is when a newer look arrives, keeping it drawn over the look before', () => {
      const fades = holdFades()
      const { container, rerender } = render(cell({ color: A }))
      rerender(cell({ color: B }))
      rerender(cell({ color: C }))
      expect(fades[0].stop).toHaveBeenCalled()
      expect(fills(container)).toEqual([baseProps.emptyColor, A, B, C])
      fades[1].finish()
      expect(fills(container)).toEqual([baseProps.emptyColor, C])
    })

    it('holds at most four looks while fades overlap, dropping the oldest caught mid-fade but never the one it settled on', () => {
      holdFades()
      const E = '#3fb950'
      const { container, rerender } = render(cell({ color: A }))
      rerender(cell({ color: B }))
      rerender(cell({ color: C }))
      rerender(cell({ color: D }))
      expect(fills(container)).toEqual([baseProps.emptyColor, A, B, C, D])
      // A is the only look drawn whole: dropped, the day showed empty for a frame
      rerender(cell({ color: E }))
      expect(fills(container)).toEqual([baseProps.emptyColor, A, C, D, E])
    })

    it("doesn't fade for data that draws the same", () => {
      const timing = jest.spyOn(Animated, 'timing')
      const { rerender } = render(cell({ color: A, cellMode: 'stacked', segments: SEGMENTS }))
      rerender(cell({ color: A, cellMode: 'stacked', segments: SEGMENTS.map((segment) => ({ ...segment })) }))
      // A solid day draws only its color, so a new value in the same shade isn't a new look
      render(cell({ color: A, value: 5, normalizedValue: 0.5 })).rerender(cell({ color: A, value: 8, normalizedValue: 0.8 }))
      expect(timing).not.toHaveBeenCalled()
    })

    it('changes at once when not animated, or while a renderCell draws the day', () => {
      const timing = jest.spyOn(Animated, 'timing')
      const unanimated = render(cell({ animated: false, color: A }))
      unanimated.rerender(cell({ animated: false, color: B }))
      expect(fills(unanimated.container)).toEqual([B])

      const renderCell = () => null
      const custom = render(cell({ color: A, renderCell }))
      custom.rerender(cell({ color: B, renderCell }))
      custom.rerender(cell({ color: B }))
      expect(fills(custom.container)).toEqual([baseProps.emptyColor, B])
      expect(timing).not.toHaveBeenCalled()
    })

    it('outlines the day once, over every look, so the outline never fades', () => {
      holdFades()
      const { container, rerender } = render(cell({ color: A, isSelected: true }))
      rerender(cell({ color: B, isSelected: true }))
      expect(fills(container)).toEqual([baseProps.emptyColor, A, B, 'none'])
    })

    describe('on web', () => {
      beforeEach(() => {
        Object.assign(Platform, { OS: 'web' })
        jest.useFakeTimers()
      })
      afterEach(() => {
        Object.assign(Platform, { OS: 'ios' })
        jest.useRealTimers()
      })

      // The CSS fade of each layer drawn since the spy was last cleared, merged into one style
      const fadeStyles = (view: jest.SpyInstance) =>
        view.mock.calls
          .map(([props]) => [props.style].flat(Infinity).filter(Boolean))
          .filter((parts) => parts.some((part) => part.animationKeyframes?.['0%']?.opacity === 0))
          .map((parts) => Object.assign({}, ...parts))

      it('fades with a CSS animation on its delay, pausing one caught mid-fade, and settles once the newest is in', () => {
        const timing = jest.spyOn(Animated, 'timing')
        const view = jest.spyOn(ReactNative, 'View')
        const { container, rerender } = render(cell({ color: A }))
        rerender(cell({ color: B, dataFadeDelay: 140 }))
        expect(fadeStyles(view).at(-1)).toEqual({
          animationDelay: '140ms',
          animationDuration: '350ms',
          animationFillMode: 'both',
          animationKeyframes: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
          animationPlayState: 'running',
          animationTimingFunction: 'cubic-bezier(0.385, 0.05, 0.615, 0.95)',
          left: 0,
          position: 'absolute',
          top: 0
        })

        view.mockClear()
        rerender(cell({ color: C }))
        expect(fadeStyles(view).map((style) => [style.animationDelay, style.animationPlayState])).toEqual([
          ['140ms', 'paused'],
          ['70ms', 'running']
        ])
        expect(fills(container)).toEqual([baseProps.emptyColor, A, B, C])

        act(() => jest.advanceTimersByTime(70 + 349))
        expect(fills(container)).toEqual([baseProps.emptyColor, A, B, C])
        act(() => jest.advanceTimersByTime(1))
        expect(fills(container)).toEqual([baseProps.emptyColor, C])
        expect(timing).not.toHaveBeenCalled()
      })
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
