import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'

import Heatmap from '../../index'
import type { DataPoint } from '../../types'

const SAMPLE_DATA: DataPoint[] = [
  { date: '2026-01-15', value: 3 },
  { date: '2026-02-20', value: 12 },
  { date: '2026-03-01', value: 1 },
  { date: '2026-05-17', value: 20 }
]

const FIXED_START = new Date(2025, 4, 17)
const FIXED_END = new Date(2026, 4, 17)

describe('Heatmap.Calendar', () => {
  it('renders without throwing', () => {
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} />)
    }).not.toThrow()
  })

  it('renders with empty data', () => {
    expect(() => {
      render(<Heatmap.Calendar data={[]} startDate={FIXED_START} endDate={FIXED_END} />)
    }).not.toThrow()
  })

  it('renders with cellMode solid', () => {
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} cellMode='solid' />)
    }).not.toThrow()
  })

  it('renders with cellMode gradient', () => {
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} cellMode='gradient' />)
    }).not.toThrow()
  })

  it('renders with cellMode density', () => {
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} cellMode='density' />)
    }).not.toThrow()
  })

  it('renders with showMonthLabels false', () => {
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} showMonthLabels={false} />)
    }).not.toThrow()
  })

  it('renders with showDayLabels false', () => {
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} showDayLabels={false} />)
    }).not.toThrow()
  })

  it('renders with custom theme', () => {
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} theme={{ cellSize: 20, gutterSize: 4, backgroundColor: '#000' }} />)
    }).not.toThrow()
  })

  it('renders with custom colorScale', () => {
    expect(() => {
      render(
        <Heatmap.Calendar
          data={SAMPLE_DATA}
          startDate={FIXED_START}
          endDate={FIXED_END}
          colorScale={{
            thresholds: [1, 5, 10],
            colors: ['#eee', '#aaa', '#555', '#111'],
            emptyColor: '#eee'
          }}
        />
      )
    }).not.toThrow()
  })

  it('calls onDayPress when provided', () => {
    const onPress = jest.fn()
    const { container } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onDayPress={onPress} />)
    expect(container).toBeTruthy()
  })

  it('accepts animated prop without throwing', () => {
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} animated={true} />)
    }).not.toThrow()
  })

  it('uses default date range when no dates provided', () => {
    expect(() => {
      render(<Heatmap.Calendar data={[]} />)
    }).not.toThrow()
  })

  it('accepts renderTooltip prop', () => {
    const renderTooltip = jest.fn(() => null)
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} renderTooltip={renderTooltip} />)
    }).not.toThrow()
  })

  it('renders with cellMode stacked', () => {
    const dataWithSegments: DataPoint[] = [
      {
        date: '2026-05-17',
        value: 10,
        segments: [
          { color: '#40c463', value: 6 },
          { color: '#216e39', value: 4 }
        ]
      }
    ]
    expect(() => {
      render(<Heatmap.Calendar data={dataWithSegments} startDate={FIXED_START} endDate={FIXED_END} cellMode='stacked' />)
    }).not.toThrow()
  })

  it('renders with cellMode dots', () => {
    const dataWithSegments: DataPoint[] = [
      {
        date: '2026-05-17',
        value: 10,
        segments: [
          { color: '#40c463', value: 6 },
          { color: '#216e39', value: 4 }
        ]
      }
    ]
    expect(() => {
      render(<Heatmap.Calendar data={dataWithSegments} startDate={FIXED_START} endDate={FIXED_END} cellMode='dots' />)
    }).not.toThrow()
  })

  it('renders with cellMode priority', () => {
    const dataWithSegments: DataPoint[] = [
      {
        date: '2026-05-17',
        value: 10,
        segments: [
          { color: '#40c463', value: 6 },
          { color: '#216e39', value: 4 }
        ]
      }
    ]
    expect(() => {
      render(<Heatmap.Calendar data={dataWithSegments} startDate={FIXED_START} endDate={FIXED_END} cellMode='priority' />)
    }).not.toThrow()
  })

  it('accepts tooltipLabel and tooltipEmptyLabel props', () => {
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} tooltipLabel='workout' tooltipEmptyLabel='Rest day' />)
    }).not.toThrow()
  })

  it('accepts renderCell prop', () => {
    const renderCell = jest.fn(() => null)
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} renderCell={renderCell} />)
    }).not.toThrow()
  })

  it('accepts onEndReached prop', () => {
    const onEndReached = jest.fn()
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onEndReached={onEndReached} />)
    }).not.toThrow()
  })

  it('renders with autoScale disabled', () => {
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} autoScale={false} />)
    }).not.toThrow()
  })

  it('accepts todayBorderColor via theme', () => {
    expect(() => {
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} theme={{ todayBorderColor: 'blue' }} />)
    }).not.toThrow()
  })

  // The grid waits for the first idle moment: requestIdleCallback where the runtime has it
  // (React Native, Chrome), a zero-delay timeout where it doesn't (Safari on web).
  describe('deferred grid render', () => {
    const CELL_LABEL = '2026-01-15: 3 events'
    const originalRequestIdleCallback = globalThis.requestIdleCallback
    const originalCancelIdleCallback = globalThis.cancelIdleCallback

    function removeIdleCallbacks() {
      delete (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback
      delete (globalThis as { cancelIdleCallback?: unknown }).cancelIdleCallback
    }

    // Unmounts first (RTL's own cleanup runs after this hook) so the effect's cleanup still
    // sees the stubs. jsdom has no idle callbacks today, so this usually just removes them.
    afterEach(() => {
      cleanup()
      removeIdleCallbacks()
      if (typeof originalRequestIdleCallback === 'function') Object.assign(globalThis, { requestIdleCallback: originalRequestIdleCallback, cancelIdleCallback: originalCancelIdleCallback })
      jest.useRealTimers()
    })

    describe('with requestIdleCallback', () => {
      let idleCallback: IdleRequestCallback | undefined

      beforeEach(() => {
        idleCallback = undefined
        globalThis.requestIdleCallback = jest.fn((callback: IdleRequestCallback) => {
          idleCallback = callback
          return 7
        })
        globalThis.cancelIdleCallback = jest.fn()
      })

      it('draws no cells until the idle callback fires', () => {
        render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} />)
        expect(globalThis.requestIdleCallback).toHaveBeenCalledTimes(1)
        expect(screen.queryByLabelText(CELL_LABEL)).toBeNull()
        act(() => idleCallback?.({ didTimeout: false, timeRemaining: () => 50 }))
        expect(screen.getByLabelText(CELL_LABEL)).toBeTruthy()
      })

      it('cancels the pending idle callback on unmount', () => {
        const { unmount } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} />)
        unmount()
        expect(globalThis.cancelIdleCallback).toHaveBeenCalledWith(7)
      })
    })

    describe('without requestIdleCallback', () => {
      beforeEach(() => {
        removeIdleCallbacks()
        jest.useFakeTimers()
      })

      it('draws no cells until a zero-delay timeout fires', () => {
        render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} />)
        expect(screen.queryByLabelText(CELL_LABEL)).toBeNull()
        act(() => jest.advanceTimersByTime(0))
        expect(screen.getByLabelText(CELL_LABEL)).toBeTruthy()
      })

      it('clears the pending timeout on unmount', () => {
        const { unmount } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} />)
        expect(jest.getTimerCount()).toBe(1)
        unmount()
        expect(jest.getTimerCount()).toBe(0)
      })
    })
  })

  describe('handleScroll', () => {
    // jsdom exposes scrollWidth/clientWidth as getter-only properties, so they must be
    // overridden with defineProperty before firing the scroll event (scrollLeft has a real
    // setter and can go through fireEvent's target option).
    function stubScrollMetrics(el: HTMLElement, scrollWidth: number, clientWidth: number) {
      Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true })
      Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true })
    }

    it('does nothing when onEndReached is not provided', () => {
      const { getByTestId } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} />)
      const scrollView = getByTestId('mock-scrollview')
      stubScrollMetrics(scrollView, 1000, 300)
      expect(() => {
        fireEvent.scroll(scrollView, { target: { scrollLeft: 650 } })
      }).not.toThrow()
    })

    it('calls onEndReached once the scroll position crosses the threshold', () => {
      const onEndReached = jest.fn()
      const { getByTestId } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onEndReached={onEndReached} />)
      const scrollView = getByTestId('mock-scrollview')
      stubScrollMetrics(scrollView, 1000, 300)
      fireEvent.scroll(scrollView, { target: { scrollLeft: 650 } })
      expect(onEndReached).toHaveBeenCalledTimes(1)
    })

    it('does not call onEndReached while far from the end', () => {
      const onEndReached = jest.fn()
      const { getByTestId } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onEndReached={onEndReached} />)
      const scrollView = getByTestId('mock-scrollview')
      stubScrollMetrics(scrollView, 1000, 300)
      fireEvent.scroll(scrollView, { target: { scrollLeft: 0 } })
      expect(onEndReached).not.toHaveBeenCalled()
    })
  })

  describe('handleCellPress', () => {
    it('calls onDayPress with the matching data point for a date with data', async () => {
      const onDayPress = jest.fn()
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onDayPress={onDayPress} />)
      const cell = await screen.findByLabelText('2026-01-15: 3 events')
      fireEvent.click(cell)
      expect(onDayPress).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-01-15', value: 3 }), '2026-01-15')
    })

    it('calls onDayPress with null for a date with no data', async () => {
      const onDayPress = jest.fn()
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onDayPress={onDayPress} />)
      const cell = await screen.findByLabelText('2026-01-16: 0 events')
      fireEvent.click(cell)
      expect(onDayPress).toHaveBeenCalledWith(null, '2026-01-16')
    })

    // A cell's press stops at its Pressable (as in React Native), so a tap selects the day and a second tap on it clears it
    it('calls onDayPress on every click, independent of tooltip open/dismiss state', async () => {
      const onDayPress = jest.fn()
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onDayPress={onDayPress} />)
      const cell = await screen.findByLabelText('2026-01-15: 3 events')
      fireEvent.click(cell)
      fireEvent.click(cell)
      expect(onDayPress).toHaveBeenCalledTimes(2)
      expect(onDayPress).toHaveBeenNthCalledWith(1, expect.objectContaining({ date: '2026-01-15', value: 3 }), '2026-01-15')
      expect(onDayPress).toHaveBeenNthCalledWith(2, expect.objectContaining({ date: '2026-01-15', value: 3 }), '2026-01-15')
    })

    it('calls onDayPress with each date-specific point when different cells are clicked in sequence', async () => {
      const onDayPress = jest.fn()
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onDayPress={onDayPress} />)
      const firstCell = await screen.findByLabelText('2026-01-15: 3 events')
      const secondCell = await screen.findByLabelText('2026-02-20: 12 events')
      fireEvent.click(firstCell)
      fireEvent.click(secondCell)
      expect(onDayPress).toHaveBeenNthCalledWith(1, expect.objectContaining({ date: '2026-01-15', value: 3 }), '2026-01-15')
      expect(onDayPress).toHaveBeenNthCalledWith(2, expect.objectContaining({ date: '2026-02-20', value: 12 }), '2026-02-20')
    })
  })

  describe('onSelectionChange', () => {
    it('reports a tapped day, and null when a second tap clears it', async () => {
      const onSelectionChange = jest.fn()
      render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onSelectionChange={onSelectionChange} />)
      const cell = await screen.findByLabelText('2026-01-15: 3 events')
      fireEvent.click(cell)
      expect(onSelectionChange).toHaveBeenLastCalledWith('2026-01-15')
      fireEvent.click(cell)
      expect(onSelectionChange).toHaveBeenLastCalledWith(null)
      expect(onSelectionChange).toHaveBeenCalledTimes(2)
    })

    it('reports null when a tap elsewhere on the calendar dismisses the selection', async () => {
      const onSelectionChange = jest.fn()
      const { getByTestId } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onSelectionChange={onSelectionChange} />)
      fireEvent.click(await screen.findByLabelText('2026-01-15: 3 events'))
      fireEvent.click(getByTestId('mock-touchable-without-feedback'))
      expect(onSelectionChange).toHaveBeenLastCalledWith(null)
    })

    it('reports each new day, and says nothing until the selection changes', async () => {
      const onSelectionChange = jest.fn()
      const { getByTestId } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onSelectionChange={onSelectionChange} />)
      await screen.findByLabelText('2026-01-15: 3 events')
      fireEvent.click(getByTestId('mock-touchable-without-feedback'))
      expect(onSelectionChange).not.toHaveBeenCalled()
      fireEvent.click(await screen.findByLabelText('2026-01-15: 3 events'))
      fireEvent.click(await screen.findByLabelText('2026-02-20: 12 events'))
      expect(onSelectionChange.mock.calls).toEqual([['2026-01-15'], ['2026-02-20']])
    })
  })

  describe('selectedDate', () => {
    it('shows the day the host selects, and clears it when the host does', async () => {
      const { container, rerender } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} selectedDate='2026-02-20' />)
      await screen.findByLabelText('2026-02-20: 12 events')
      expect(container.textContent).toContain('12 events')
      rerender(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} selectedDate={null} />)
      expect(container.textContent).not.toContain('12 events')
    })

    it('reports taps without taking them, leaving the host to decide', async () => {
      const onSelectionChange = jest.fn()
      const { container } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} selectedDate={null} onSelectionChange={onSelectionChange} />)
      fireEvent.click(await screen.findByLabelText('2026-01-15: 3 events'))
      expect(onSelectionChange).toHaveBeenLastCalledWith('2026-01-15')
      expect(container.textContent).not.toContain('3 events')
    })

    it('asks for null on a second tap and on a tap elsewhere, and says nothing when nothing would change', async () => {
      const onSelectionChange = jest.fn()
      const { getByTestId, rerender } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} selectedDate='2026-01-15' onSelectionChange={onSelectionChange} />)
      fireEvent.click(await screen.findByLabelText('2026-01-15: 3 events'))
      expect(onSelectionChange).toHaveBeenLastCalledWith(null)
      fireEvent.click(getByTestId('mock-touchable-without-feedback'))
      expect(onSelectionChange).toHaveBeenCalledTimes(2)
      rerender(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} selectedDate={null} onSelectionChange={onSelectionChange} />)
      fireEvent.click(getByTestId('mock-touchable-without-feedback'))
      expect(onSelectionChange).toHaveBeenCalledTimes(2)
    })

    it("isn't reported back when the host changes it", async () => {
      const onSelectionChange = jest.fn()
      const { rerender } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} selectedDate='2026-01-15' onSelectionChange={onSelectionChange} />)
      await screen.findByLabelText('2026-01-15: 3 events')
      rerender(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} selectedDate={null} onSelectionChange={onSelectionChange} />)
      expect(onSelectionChange).not.toHaveBeenCalled()
    })
  })

  describe('dismissTooltip', () => {
    it('runs without throwing when the outer touchable wrapper is pressed directly', async () => {
      const { container, getByTestId } = render(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} />)
      await screen.findByLabelText('2026-01-15: 3 events')
      expect(() => {
        fireEvent.click(getByTestId('mock-touchable-without-feedback'))
      }).not.toThrow()
      expect(container.textContent).not.toContain('3 events')
    })
  })
})
