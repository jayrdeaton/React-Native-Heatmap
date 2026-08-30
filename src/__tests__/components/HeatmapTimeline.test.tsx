import { act, render } from '@testing-library/react'
import { PanResponder } from 'react-native'

import Heatmap from '../../index'
import type { TimeBucket, TimelineDataPoint } from '../../types'

const HOUR = 3600000

function iso(ms: number) {
  return new Date(ms).toISOString()
}

const BASE = new Date(2026, 0, 1).getTime()

const SAMPLE_DATA: TimelineDataPoint[] = [
  { timestamp: iso(BASE), value: 3 },
  { timestamp: iso(BASE + HOUR * 2), value: 12 },
  { timestamp: iso(BASE + HOUR * 5), value: 1 },
  { timestamp: iso(BASE + HOUR * 20), value: 20 }
]

const FIXED_START = new Date(BASE)
const FIXED_END = new Date(BASE + HOUR * 48)

function getLatestPanHandlers() {
  const results = (PanResponder.create as jest.Mock).mock.results
  const handlers = results[results.length - 1]?.value.panHandlers
  return handlers as {
    onStartShouldSetPanResponder: () => boolean
    onMoveShouldSetPanResponder: () => boolean
    onPanResponderGrant: (evt: unknown) => void
    onPanResponderMove: (evt: unknown, gestureState: unknown) => void
    onPanResponderRelease: (evt: unknown, gestureState: unknown) => void
    onPanResponderTerminate: () => void
  }
}

describe('Heatmap.Timeline', () => {
  it('renders without throwing with nonempty data', () => {
    expect(() => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} />)
    }).not.toThrow()
  })

  it('renders with empty data (infers bounds from empty array)', () => {
    expect(() => {
      render(<Heatmap.Timeline data={[]} />)
    }).not.toThrow()
  })

  it('infers bounds from data when no startTime/endTime provided', () => {
    expect(() => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} />)
    }).not.toThrow()
  })

  it('renders with zoom in the day granularity band', () => {
    expect(() => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={2} />)
    }).not.toThrow()
  })

  it('renders with zoom in the hour granularity band', () => {
    expect(() => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} />)
    }).not.toThrow()
  })

  it('renders with zoom in the minute granularity band', () => {
    expect(() => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={new Date(BASE + HOUR * 2)} zoom={200} />)
    }).not.toThrow()
  })

  it('renders with colorScheme dark', () => {
    expect(() => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} colorScheme='dark' />)
    }).not.toThrow()
  })

  it('renders with colorScheme light (default)', () => {
    expect(() => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} colorScheme='light' />)
    }).not.toThrow()
  })

  it('renders with a custom theme override', () => {
    expect(() => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} theme={{ height: 40, labelColor: '#123456' }} />)
    }).not.toThrow()
  })

  it('renders with a custom colorScale override', () => {
    expect(() => {
      render(
        <Heatmap.Timeline
          data={SAMPLE_DATA}
          startTime={FIXED_START}
          endTime={FIXED_END}
          colorScale={{
            thresholds: [1, 5, 10],
            colors: ['#eee', '#aaa', '#555', '#111'],
            emptyColor: '#eee'
          }}
        />
      )
    }).not.toThrow()
  })

  it('renders buckets with data (auto-scale color) alongside empty buckets', () => {
    // zoom=2 -> day granularity, spans 2 days so some day buckets have data and some don't
    expect(() => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={2} />)
    }).not.toThrow()
  })

  describe('controlled zoom prop', () => {
    it('syncs internal zoom state when zoom prop changes externally', () => {
      const { rerender } = render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} />)
      expect(() => {
        rerender(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={50} />)
      }).not.toThrow()
    })

    it('skips the sync branch when zoom prop is rerendered with the same value', () => {
      const { rerender } = render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} />)
      expect(() => {
        rerender(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} />)
      }).not.toThrow()
    })
  })

  describe('gesture handling', () => {
    it('always claims the responder on touch start/move', () => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} />)
      const handlers = getLatestPanHandlers()
      expect(handlers.onStartShouldSetPanResponder()).toBe(true)
      expect(handlers.onMoveShouldSetPanResponder()).toBe(true)
    })

    it('tap-to-select calls onTimePress with a TimeBucket', () => {
      const onTimePress = jest.fn()
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} onTimePress={onTimePress} />)
      const handlers = getLatestPanHandlers()

      act(() => {
        handlers.onPanResponderGrant({ nativeEvent: { touches: [{ pageX: 50, pageY: 10, locationX: 50 }] } })
      })
      act(() => {
        handlers.onPanResponderMove({ nativeEvent: { touches: [{ pageX: 50, pageY: 10 }] } }, { dx: 0, dy: 0 })
      })
      act(() => {
        handlers.onPanResponderRelease({ nativeEvent: { touches: [], locationX: 50 } }, { dx: 2, dy: 1, vx: 0, x0: 50 })
      })

      expect(onTimePress).toHaveBeenCalledTimes(1)
      const bucket = onTimePress.mock.calls[0][0] as TimeBucket
      expect(bucket).toEqual(
        expect.objectContaining({
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          granularity: expect.any(String),
          value: expect.any(Number)
        })
      )
    })

    it('pan-drag beyond the tap threshold starts momentum instead of calling onTimePress', () => {
      // Invokes the rAF callback synchronously exactly once (the momentum loop's first
      // frame) so startMomentum's animate() body runs for real, then stops recursing —
      // any frame it schedules from inside itself just gets a fake id, never a callback.
      let rafCalls = 0
      jest.spyOn(global, 'requestAnimationFrame').mockImplementation(((cb: FrameRequestCallback) => {
        rafCalls++
        if (rafCalls === 1) cb(0)
        return 0
      }) as typeof requestAnimationFrame)
      const onTimePress = jest.fn()
      const { unmount } = render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} onTimePress={onTimePress} />)
      const handlers = getLatestPanHandlers()

      act(() => {
        handlers.onPanResponderGrant({ nativeEvent: { touches: [{ pageX: 50, pageY: 10, locationX: 50 }] } })
      })
      act(() => {
        handlers.onPanResponderMove({ nativeEvent: { touches: [{ pageX: 20, pageY: 10 }] } }, { dx: -30, dy: 0 })
      })
      act(() => {
        handlers.onPanResponderRelease({ nativeEvent: { touches: [], locationX: 10 } }, { dx: -40, dy: 0, vx: -2, x0: 50 })
      })

      expect(onTimePress).not.toHaveBeenCalled()

      // A fresh grant mid-momentum exercises cancelMomentum's "frame already scheduled"
      // branch (momentumFrameRef.current !== null, set by the release above).
      expect(() => {
        act(() => {
          handlers.onPanResponderGrant({ nativeEvent: { touches: [{ pageX: 50, pageY: 10, locationX: 50 }] } })
        })
      }).not.toThrow()

      unmount()
      ;(global.requestAnimationFrame as jest.Mock).mockRestore()
    })

    it('momentum animate() takes the below-threshold early-return branch when velocity starts small', () => {
      let rafCalls = 0
      jest.spyOn(global, 'requestAnimationFrame').mockImplementation(((cb: FrameRequestCallback) => {
        rafCalls++
        if (rafCalls === 1) cb(0)
        return 0
      }) as typeof requestAnimationFrame)
      const onTimePress = jest.fn()
      const { unmount } = render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} onTimePress={onTimePress} />)
      const handlers = getLatestPanHandlers()

      act(() => {
        handlers.onPanResponderGrant({ nativeEvent: { touches: [{ pageX: 50, pageY: 10, locationX: 50 }] } })
      })
      act(() => {
        handlers.onPanResponderMove({ nativeEvent: { touches: [{ pageX: 20, pageY: 10 }] } }, { dx: -30, dy: 0 })
      })
      // vx small enough that velocity (-vx * 16) starts under the 0.5 stop threshold.
      act(() => {
        handlers.onPanResponderRelease({ nativeEvent: { touches: [], locationX: 10 } }, { dx: -40, dy: 0, vx: 0.01, x0: 50 })
      })

      expect(onTimePress).not.toHaveBeenCalled()
      unmount()
      ;(global.requestAnimationFrame as jest.Mock).mockRestore()
    })

    it('pinch gesture calls onZoomChange with a new zoom value', () => {
      const onZoomChange = jest.fn()
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} onZoomChange={onZoomChange} />)
      const handlers = getLatestPanHandlers()

      act(() => {
        handlers.onPanResponderGrant({
          nativeEvent: {
            touches: [
              { pageX: 0, pageY: 0, locationX: 0 },
              { pageX: 100, pageY: 0, locationX: 100 }
            ]
          }
        })
      })
      act(() => {
        handlers.onPanResponderMove(
          {
            nativeEvent: {
              touches: [
                { pageX: 0, pageY: 0 },
                { pageX: 300, pageY: 0 }
              ]
            }
          },
          { dx: 0, dy: 0 }
        )
      })

      expect(onZoomChange).toHaveBeenCalled()
      const calls = onZoomChange.mock.calls
      const newZoom = calls[calls.length - 1]?.[0]
      expect(typeof newZoom).toBe('number')
    })

    it('handles a pan gesture transitioning into a pinch mid-gesture', () => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} />)
      const handlers = getLatestPanHandlers()

      act(() => {
        handlers.onPanResponderGrant({ nativeEvent: { touches: [{ pageX: 50, pageY: 10, locationX: 50 }] } })
      })
      expect(() => {
        act(() => {
          handlers.onPanResponderMove(
            {
              nativeEvent: {
                touches: [
                  { pageX: 0, pageY: 0 },
                  { pageX: 100, pageY: 0 }
                ]
              }
            },
            { dx: 0, dy: 0 }
          )
        })
      }).not.toThrow()
    })

    it('a pinch that drops to one touch mid-move stays in the pinch branch without recomputing zoom', () => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} />)
      const handlers = getLatestPanHandlers()

      act(() => {
        handlers.onPanResponderGrant({
          nativeEvent: {
            touches: [
              { pageX: 0, pageY: 0, locationX: 0 },
              { pageX: 100, pageY: 0, locationX: 100 }
            ]
          }
        })
      })
      // gestureTypeRef is now 'pinch'; a move reporting only one active touch should
      // still take the pinch branch (via the gestureTypeRef.current === 'pinch' check)
      // but skip the zoom-recompute block, since that's guarded on touches.length >= 2.
      expect(() => {
        act(() => {
          handlers.onPanResponderMove({ nativeEvent: { touches: [{ pageX: 50, pageY: 0 }] } }, { dx: 0, dy: 0 })
        })
      }).not.toThrow()
    })

    it('tap release falls back to gestureState.x0 when locationX is absent', () => {
      const onTimePress = jest.fn()
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} onTimePress={onTimePress} />)
      const handlers = getLatestPanHandlers()

      act(() => {
        handlers.onPanResponderGrant({ nativeEvent: { touches: [{ pageX: 50, pageY: 10, locationX: 50 }] } })
      })
      act(() => {
        handlers.onPanResponderMove({ nativeEvent: { touches: [{ pageX: 50, pageY: 10 }] } }, { dx: 0, dy: 0 })
      })
      act(() => {
        handlers.onPanResponderRelease({ nativeEvent: { touches: [] } }, { dx: 2, dy: 1, vx: 0, x0: 50 })
      })

      expect(onTimePress).toHaveBeenCalledTimes(1)
    })

    it('tap-to-select on an empty bucket falls back to a zero value', () => {
      const onTimePress = jest.fn()
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} onTimePress={onTimePress} />)
      const handlers = getLatestPanHandlers()

      // touchX 200 at zoom 20 (hour granularity, 20px/hour) lands ~10h in, an hour
      // bucket with no data points, so dataMapsRef.current[gran].get(...) is undefined.
      act(() => {
        handlers.onPanResponderGrant({ nativeEvent: { touches: [{ pageX: 200, pageY: 10, locationX: 200 }] } })
      })
      act(() => {
        handlers.onPanResponderMove({ nativeEvent: { touches: [{ pageX: 200, pageY: 10 }] } }, { dx: 0, dy: 0 })
      })
      act(() => {
        handlers.onPanResponderRelease({ nativeEvent: { touches: [], locationX: 200 } }, { dx: 0, dy: 0, vx: 0, x0: 200 })
      })

      expect(onTimePress).toHaveBeenCalledWith(expect.objectContaining({ value: 0 }))
    })

    it('release while mid-pinch does not treat it as a tap or pan', () => {
      const onTimePress = jest.fn()
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} onTimePress={onTimePress} />)
      const handlers = getLatestPanHandlers()

      act(() => {
        handlers.onPanResponderGrant({
          nativeEvent: {
            touches: [
              { pageX: 0, pageY: 0, locationX: 0 },
              { pageX: 100, pageY: 0, locationX: 100 }
            ]
          }
        })
      })
      expect(() => {
        act(() => {
          handlers.onPanResponderRelease({ nativeEvent: { touches: [] } }, { dx: 0, dy: 0, vx: 0, x0: 0 })
        })
      }).not.toThrow()
      expect(onTimePress).not.toHaveBeenCalled()
    })

    it('onPanResponderTerminate resets gesture state without throwing', () => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} />)
      const handlers = getLatestPanHandlers()

      act(() => {
        handlers.onPanResponderGrant({ nativeEvent: { touches: [{ pageX: 50, pageY: 10, locationX: 50 }] } })
      })
      expect(() => {
        act(() => {
          handlers.onPanResponderTerminate()
        })
      }).not.toThrow()
    })

    it('does not throw when onTimePress/onZoomChange are not supplied', () => {
      render(<Heatmap.Timeline data={SAMPLE_DATA} startTime={FIXED_START} endTime={FIXED_END} zoom={20} />)
      const handlers = getLatestPanHandlers()

      act(() => {
        handlers.onPanResponderGrant({ nativeEvent: { touches: [{ pageX: 50, pageY: 10, locationX: 50 }] } })
      })
      act(() => {
        handlers.onPanResponderMove({ nativeEvent: { touches: [{ pageX: 50, pageY: 10 }] } }, { dx: 0, dy: 0 })
      })
      expect(() => {
        act(() => {
          handlers.onPanResponderRelease({ nativeEvent: { touches: [], locationX: 50 } }, { dx: 2, dy: 1, vx: 0, x0: 50 })
        })
      }).not.toThrow()

      act(() => {
        handlers.onPanResponderGrant({
          nativeEvent: {
            touches: [
              { pageX: 0, pageY: 0, locationX: 0 },
              { pageX: 100, pageY: 0, locationX: 100 }
            ]
          }
        })
      })
      expect(() => {
        act(() => {
          handlers.onPanResponderMove(
            {
              nativeEvent: {
                touches: [
                  { pageX: 0, pageY: 0 },
                  { pageX: 300, pageY: 0 }
                ]
              }
            },
            { dx: 0, dy: 0 }
          )
        })
      }).not.toThrow()
    })
  })
})
