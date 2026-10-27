import type React from 'react'
import { Animated, Platform, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'

import type { FadeLayer } from '../hooks/useFadeLayers'

interface FadeLayerViewProps {
  layer: FadeLayer<unknown>
  top: FadeLayer<unknown>
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

// One layer of a cell's fade (see useFadeLayers): natively its opacity runs on Animated's native driver. On web, where
// react-native-web would run Animated from JavaScript, a commit a frame, it's a CSS animation the compositor runs, as
// today's pulse is, paused where it is once a newer look is on top. A layer that came in without a fade is drawn whole.
export function FadeLayerView({ layer, top, style, children }: FadeLayerViewProps) {
  if (layer.fading && Platform.OS !== 'web') return <Animated.View style={[style, { opacity: layer.opacity }]}>{children}</Animated.View>
  const fade = layer.fading ? [styles.fadeIn, css({ animationDuration: `${layer.duration}ms`, animationDelay: `${layer.delay}ms`, animationPlayState: layer === top ? 'running' : 'paused' })] : null
  return <View style={[style, fade]}>{children}</View>
}

// react-native-web's CSS animation styles, which React Native's types don't list
const css = (style: Record<string, unknown>) => style as ViewStyle

const styles = StyleSheet.create({
  // A look fading in on web, waiting at 0 through its delay (fill mode both) and holding at 1 after. The curve is
  // Animated.timing's default, Easing.inOut(Easing.ease), which the phones' fade runs, to within 0.35%
  fadeIn: css({
    animationFillMode: 'both',
    animationKeyframes: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
    animationTimingFunction: 'cubic-bezier(0.385, 0.05, 0.615, 0.95)'
  })
})
