import { useEffect, useState } from 'react'
import { Animated, Platform } from 'react-native'

/** A look as drawn, and the fade that brought it in, with its own delay and length so a resize mid-fade doesn't move it. */
export interface FadeLayer<T> {
  id: number
  look: T
  fading: boolean
  delay: number
  duration: number
  opacity: Animated.Value
}

interface FadeOptions<T> {
  /** Whether two looks draw the same, so a new value in the same shade isn't a new look. */
  same: (a: T, b: T) => boolean
  /** Whether a new look fades in at all; otherwise it replaces the old at once. */
  fades: boolean
  delay: number
  duration: number
  /** Whether a change between these two looks fades, when fades is on (a cell's hollow pending look snaps, say). */
  canFade?: (from: T, to: T) => boolean
}

// A cell holds at most this many looks at once while fades overlap: the one it settled on, the newest, and those caught
// mid-fade between them. Changes faster than a fade (a few quick taps on a filter) drop the oldest caught mid-fade, never
// the settled one: it's the only one drawn whole, and dropping it showed the day empty for a frame
const MAX_LAYERS = 4

/**
 * The looks a cell draws, oldest first, while its next one fades in over the one it shows on its own delay, so a change
 * to a whole grid ripples across it. Fading the new look in over the old, rather than out to empty and back, blends the
 * two: an opaque color drawn at opacity t over another is their mix at t, so a cell passes through the shades between.
 * Once the newest is in, the looks under it go. A newer one arriving first stops it where it is (a stopped native
 * animation holds its value; on web its CSS animation is paused, see FadeLayerView), so a cell caught mid-fade carries
 * on from the blend it showed, and one the wave hadn't reached yet still shows the look before. The look a cell mounts
 * with shows at once.
 */
export function useFadeLayers<T>(look: T, { same, fades, delay, duration, canFade }: FadeOptions<T>): { layers: FadeLayer<T>[]; top: FadeLayer<T> } {
  const [layers, setLayers] = useState<FadeLayer<T>[]>(() => [{ id: 0, look, fading: false, delay: 0, duration: 0, opacity: new Animated.Value(1) }])
  const top = layers[layers.length - 1]
  // A new look is taken during render, as state derived from props
  if (!same(look, top.look)) {
    const fade = fades && (canFade?.(top.look, look) ?? true)
    const next: FadeLayer<T> = { id: top.id + 1, look, fading: fade, delay, duration, opacity: new Animated.Value(fade ? 0 : 1) }
    const kept = layers.length < MAX_LAYERS ? layers : [layers[0], ...layers.slice(layers.length + 2 - MAX_LAYERS)]
    setLayers(fade ? [...kept, next] : [next])
  }

  useEffect(() => {
    if (!top.fading) return
    const settle = () =>
      setLayers((current) => {
        const i = current.indexOf(top)
        return i > 0 ? current.slice(i) : current
      })
    if (Platform.OS === 'web') {
      const handle = setTimeout(settle, top.delay + top.duration)
      return () => clearTimeout(handle)
    }
    const fade = Animated.timing(top.opacity, { toValue: 1, duration: top.duration, delay: top.delay, useNativeDriver: true })
    fade.start(({ finished }) => {
      if (finished) settle()
    })
    return () => fade.stop()
  }, [top])

  return { layers, top }
}
