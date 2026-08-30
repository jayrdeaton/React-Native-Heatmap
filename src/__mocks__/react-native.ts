import React, { useEffect } from 'react'

const stub = ({ children }: { children?: React.ReactNode }) => children ?? null

type LayoutEvent = { nativeEvent: { layout: { x: number; y: number; width: number; height: number } } }

// Real View reports its measured size via onLayout after mount. Fires once with a fixed
// size so components that gate rendering on a measured width (e.g. HeatmapTimeline) are
// testable — most callers don't pass onLayout, so this is a no-op for them.
const View = ({ children, onLayout }: { children?: React.ReactNode; onLayout?: (e: LayoutEvent) => void }) => {
  useEffect(() => {
    onLayout?.({ nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 100 } } })
  }, [onLayout])
  return children ?? null
}

const InteractionManager = {
  runAfterInteractions: (callback: () => void) => {
    callback()
    return { cancel: () => {} }
  }
}

const noop = () => {}
const animatedObj = {
  start: (cb?: () => void) => {
    cb?.()
  },
  stop: noop,
  reset: noop
}

class AnimatedValue {
  constructor(_v: number) {}
  setValue(_v: number) {}
}

const Animated = {
  Value: AnimatedValue,
  timing: (_value: unknown, _config: unknown) => animatedObj,
  spring: (_value: unknown, _config: unknown) => animatedObj,
  loop: (_anim: unknown) => animatedObj,
  sequence: (_anims: unknown[]) => animatedObj,
  View: stub
}

const Easing = {
  inOut: (fn: unknown) => fn,
  sin: (t: number) => t
}

const StyleSheet = {
  create: <T extends object>(styles: T): T => styles,
  flatten: (style: unknown) => style
}

// `create` is a jest.fn so tests can pull the gesture-handler config it was called
// with (e.g. `PanResponder.create.mock.results.at(-1)?.value.panHandlers`) and invoke
// onPanResponderGrant/Move/Release/Terminate directly — the View stub below discards
// props, so there's no DOM element to dispatch real touch events through.
const PanResponder = {
  create: jest.fn((config: Record<string, unknown>) => ({ panHandlers: config }))
}

type PressableProps = {
  children?: React.ReactNode
  onPress?: () => void
  onPressIn?: () => void
  onPressOut?: () => void
  disabled?: boolean
  accessibilityLabel?: string
  accessibilityRole?: string
}

// Renders a real clickable div (accessibilityLabel -> aria-label) instead of discarding
// props, so tests can fire onPress/onPressIn/onPressOut via fireEvent.click/mouseDown/mouseUp
// and query individual cells with getByLabelText.
const Pressable = ({ children, onPress, onPressIn, onPressOut, disabled, accessibilityLabel, accessibilityRole }: PressableProps) =>
  React.createElement(
    'div',
    {
      role: accessibilityRole,
      'aria-label': accessibilityLabel,
      'aria-disabled': disabled || undefined,
      onClick: disabled ? undefined : onPress,
      onMouseDown: disabled ? undefined : onPressIn,
      onMouseUp: disabled ? undefined : onPressOut
    },
    children
  )

// Renders a real clickable div so tests can fire the wrapped onPress via fireEvent.click.
const TouchableWithoutFeedback = ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => React.createElement('div', { 'data-testid': 'mock-touchable-without-feedback', onClick: onPress }, children)

type ScrollEvent = {
  nativeEvent: {
    contentOffset: { x: number; y: number }
    contentSize: { width: number; height: number }
    layoutMeasurement: { width: number; height: number }
  }
}

// Bridges the DOM scroll event to RN's onScroll shape so tests can drive it with
// fireEvent.scroll(getByTestId('mock-scrollview'), { target: { scrollLeft, scrollWidth, clientWidth } }).
const ScrollView = ({ children, onScroll }: { children?: React.ReactNode; onScroll?: (e: ScrollEvent) => void }) =>
  React.createElement(
    'div',
    {
      'data-testid': 'mock-scrollview',
      onScroll: (e: React.UIEvent<HTMLDivElement>) => {
        const t = e.currentTarget
        onScroll?.({
          nativeEvent: {
            contentOffset: { x: t.scrollLeft, y: t.scrollTop },
            contentSize: { width: t.scrollWidth, height: t.scrollHeight },
            layoutMeasurement: { width: t.clientWidth, height: t.clientHeight }
          }
        })
      }
    },
    children
  )

export { Animated, Easing, InteractionManager, PanResponder, Pressable, ScrollView, StyleSheet, TouchableWithoutFeedback, View }

export const Text = stub
export const TouchableOpacity = stub
export const Platform = { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios ?? obj.default }
