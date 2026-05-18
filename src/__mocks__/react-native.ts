/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'

const stub = ({ children }: { children?: React.ReactNode }) => children ?? null

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

export { Animated, Easing, InteractionManager, StyleSheet }

export const View = stub
export const Text = stub
export const ScrollView = stub
export const Pressable = stub
export const TouchableOpacity = stub
export const TouchableWithoutFeedback = stub
export const Platform = { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios ?? obj.default }
