import React, { memo, useCallback, useEffect, useState } from 'react'
import { Animated, Easing, Platform, Pressable as NativePressable, StyleSheet, View, type ViewStyle } from 'react-native'
import Svg, { Circle, ClipPath, Defs, G, RadialGradient, Rect, Stop } from 'react-native-svg'

import { useFadeLayers } from '../hooks/useFadeLayers'
import type { CellMode, DataPoint, PressableComponent, Segment } from '../types'
import { sameSegments } from '../utils/equalityUtils'
import { cellPadding, cellPitch } from '../utils/layoutUtils'
import { FadeLayerView } from './FadeLayerView'

interface HeatmapCellProps {
  date: string
  value: number
  color: string
  emptyColor: string
  size: number
  radius: number
  gutter: number
  cellMode: CellMode
  normalizedValue: number
  segments?: Segment[]
  onPress?: (date: string, value: number) => void
  isToday?: boolean
  isSelected?: boolean
  animated?: boolean
  renderCell?: (data: DataPoint | null, date: string) => React.ReactNode
  dataPoint?: DataPoint | null
  todayBorderColor: string
  selectedBorderColor: string
  dataFadeDelay?: number
  animationDuration?: number
  pressable?: PressableComponent
}

// Each half of today's pulse, up to 1.2 and back, takes this many animationDurations
const PULSE_HALF = 2.5

// What a cell draws for its day, kept with each layer of a fade so the look it's leaving stays drawn under the one coming in
interface Look {
  hasData: boolean
  cellMode: CellMode
  color: string
  emptyColor: string
  normalizedValue: number
  segments?: Segment[]
}

// Whether two looks draw the same: an empty day draws only the empty color, whatever its data says, and a solid one only its color
function sameLook(a: Look, b: Look): boolean {
  if (!a.hasData || !b.hasData) return a.hasData === b.hasData
  if (a.cellMode !== b.cellMode || a.color !== b.color) return false
  if (a.cellMode === 'solid') return true
  return a.emptyColor === b.emptyColor && a.normalizedValue === b.normalizedValue && sameSegments(a.segments, b.segments)
}

function getDotPositions(n: number, size: number): { x: number; y: number }[] {
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  const cellW = size / cols
  const cellH = size / rows
  return Array.from({ length: n }, (_, i) => ({
    x: (i % cols) * cellW + cellW / 2,
    y: Math.floor(i / cols) * cellH + cellH / 2
  }))
}

// One look in a square of its own. As a layer of a fade it's opaque: an empty day is its empty color, and a gradient
// blooms from the empty color rather than from whatever is under it, so a finished fade can drop the layers under it and
// the cell doesn't change
function drawLook({ hasData, cellMode, color, emptyColor, normalizedValue, segments }: Look, id: string, size: number, radius: number, layer: boolean, border: React.ReactNode) {
  if (layer && !hasData) {
    return (
      <Svg width={size} height={size}>
        <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={emptyColor} />
      </Svg>
    )
  }

  const gradientId = `grad-${id}`
  const clipId = `clip-${id}`
  const activeSegments = segments && segments.length > 0 ? segments : null
  const weightedSegments = activeSegments ? activeSegments.map((s) => ({ ...s, effectiveValue: s.value * (s.weight ?? 1) })) : null
  const effectiveTotal = weightedSegments ? weightedSegments.reduce((acc, s) => acc + s.effectiveValue, 0) : 0
  const dominantSegment = weightedSegments ? weightedSegments.reduce((prev, cur) => (cur.effectiveValue > prev.effectiveValue ? cur : prev)) : null

  return (
    <Svg width={size} height={size}>
      {cellMode === 'solid' && <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={color} />}

      {cellMode === 'gradient' && (
        <>
          <Defs>
            <RadialGradient id={gradientId} cx='50%' cy='50%' r='50%' fx='50%' fy='50%'>
              <Stop offset='0%' stopColor={emptyColor} stopOpacity={hasData ? 0.4 : 1} />
              <Stop offset='100%' stopColor={color} stopOpacity={1} />
            </RadialGradient>
          </Defs>
          {layer && <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={emptyColor} />}
          <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={`url(#${gradientId})`} />
        </>
      )}

      {cellMode === 'density' && (
        <>
          <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={emptyColor} />
          {hasData && <Circle cx={size / 2} cy={size / 2} r={(size / 2 - 1) * normalizedValue} fill={color} />}
        </>
      )}

      {cellMode === 'stacked' &&
        (weightedSegments && effectiveTotal > 0 ? (
          <>
            <Defs>
              <ClipPath id={clipId}>
                <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} />
              </ClipPath>
            </Defs>
            <G clipPath={`url(#${clipId})`}>
              {weightedSegments.map((seg, i) => {
                const sliceHeight = (seg.effectiveValue / effectiveTotal) * size
                const y = weightedSegments.slice(0, i).reduce((acc, s) => acc + (s.effectiveValue / effectiveTotal) * size, 0)
                return <Rect key={i} x={0} y={y} width={size} height={sliceHeight} fill={seg.color} />
              })}
            </G>
          </>
        ) : (
          <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={color} />
        ))}

      {cellMode === 'dots' &&
        (weightedSegments && effectiveTotal > 0 ? (
          <>
            <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={emptyColor} />
            {getDotPositions(weightedSegments.length, size).map((pos, i) => {
              const seg = weightedSegments[i]
              const cols = Math.ceil(Math.sqrt(weightedSegments.length))
              const rows = Math.ceil(weightedSegments.length / cols)
              const maxR = Math.min(size / (2 * cols), size / (2 * rows)) * 0.8
              const r = maxR * (seg.effectiveValue / effectiveTotal) + maxR * 0.2
              return <Circle key={i} cx={pos.x} cy={pos.y} r={Math.min(r, maxR)} fill={seg.color} />
            })}
          </>
        ) : (
          <>
            <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={emptyColor} />
            {hasData && <Circle cx={size / 2} cy={size / 2} r={(size / 2 - 1) * normalizedValue} fill={color} />}
          </>
        ))}

      {cellMode === 'priority' && (
        <>
          <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={emptyColor} />
          {hasData && <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={dominantSegment ? dominantSegment.color : color} fillOpacity={0.2 + normalizedValue * 0.8} />}
        </>
      )}

      {border}
    </Svg>
  )
}

function HeatmapCellComponent({ date, value, color, emptyColor, size, radius, gutter, cellMode, normalizedValue, segments, onPress, isToday = false, isSelected = false, animated: isAnimated = false, renderCell, dataPoint, todayBorderColor, selectedBorderColor, dataFadeDelay = 0, animationDuration = 350, pressable }: HeatmapCellProps) {
  // A host's pressable (a haptic on touch-down, say) is handed the cell's own onPressIn/onPressOut, so it adds to the press animation
  const Pressable = pressable ?? NativePressable
  const [pressScale] = useState(() => new Animated.Value(1))
  const [pulseScale] = useState(() => new Animated.Value(1))

  // When the day's data changes, its next look fades in over the one it shows, on its column's delay, so a change to the
  // whole calendar (a filter, a new busiest day rescaling every shade) ripples across it as the first data does (see
  // useFadeLayers). Only where the cell draws itself and animates; otherwise the look changes at once
  const look: Look = { hasData: value > 0, cellMode, color, emptyColor, normalizedValue, segments }
  const { layers, top } = useFadeLayers(look, { same: sameLook, fades: isAnimated && !renderCell, delay: dataFadeDelay, duration: animationDuration })

  // Today's pulse runs natively on iOS and Android. react-native-web can't drive Animated natively, so there it would
  // run from JavaScript, a React commit every frame for as long as today is on screen; a CSS animation of the same
  // scale runs on the compositor instead (styles.pulse)
  const pulsing = isToday && isAnimated
  const cssPulse = pulsing && Platform.OS === 'web'

  useEffect(() => {
    if (!pulsing || cssPulse) {
      pulseScale.setValue(1)
      return
    }
    const pulse = Animated.loop(Animated.sequence([Animated.timing(pulseScale, { toValue: 1.2, duration: animationDuration * PULSE_HALF, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }), Animated.timing(pulseScale, { toValue: 1, duration: animationDuration * PULSE_HALF, useNativeDriver: true, easing: Easing.inOut(Easing.sin) })]))
    pulse.start()
    return () => {
      pulse.stop()
      pulseScale.setValue(1)
    }
  }, [pulsing, cssPulse, pulseScale, animationDuration])

  const handlePress = useCallback(() => {
    onPress?.(date, value)
  }, [date, value, onPress])

  const handlePressIn = useCallback(() => {
    if (!isAnimated) return
    Animated.spring(pressScale, { toValue: 0.82, useNativeDriver: true, speed: 50, bounciness: 0 }).start()
  }, [isAnimated, pressScale])

  const handlePressOut = useCallback(() => {
    if (!isAnimated) return
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start()
  }, [isAnimated, pressScale])

  const transform: Array<{ scale: Animated.Value }> = [{ scale: pressScale }]
  if (pulsing && !cssPulse) transform.push({ scale: pulseScale })

  const cellPad = cellPadding(size)
  // The rest of the pitch past the padding (see cellPitch), so a cell takes exactly one pitch each way.
  const extra = cellPitch(size, gutter) - size - 2 * cellPad
  const borderInset = 1
  const borderWidth = 1.5

  // A selection outranks today, so a host whose todayBorderColor is 'transparent' (today marked by its pulse alone)
  // still outlines today when it's tapped
  const borderColor = isSelected ? selectedBorderColor : todayBorderColor
  const todayBorder = isToday || isSelected ? <Rect x={borderInset} y={borderInset} width={size - borderInset * 2} height={size - borderInset * 2} rx={Math.max(0, radius - borderInset)} ry={Math.max(0, radius - borderInset)} fill='none' stroke={borderColor} strokeWidth={borderWidth} /> : null

  // Every look the cell holds, oldest at the bottom, over an empty base. An empty look at the bottom is the base itself.
  // The outline goes over them all, so it never fades
  const layerViews = layers.map((layer, i) => {
    if (i === 0 && !layer.look.hasData) return null
    // An empty look draws in the empty color as it is now, as the base does
    return (
      <FadeLayerView key={layer.id} layer={layer} top={top} style={styles.overlay}>
        {drawLook(layer.look.hasData ? layer.look : { ...layer.look, emptyColor }, `${date}-${layer.id}`, size, radius, true, null)}
      </FadeLayerView>
    )
  })

  const cell = (
    <Animated.View style={{ transform }}>
      {renderCell ? (
        renderCell(dataPoint ?? null, date)
      ) : isAnimated ? (
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
            <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={emptyColor} />
          </Svg>
          {layerViews}
          {todayBorder && (
            <View style={styles.overlay}>
              <Svg width={size} height={size}>
                {todayBorder}
              </Svg>
            </View>
          )}
        </View>
      ) : (
        drawLook(look, date, size, radius, false, todayBorder)
      )}
    </Animated.View>
  )

  // On web the pulse goes on a view of its own around the cell, since a CSS animation of transform would override the
  // press spring's transform on the same view. The two scales compose about the same center, as they do natively
  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={!onPress} accessibilityLabel={`${date}: ${value} ${value === 1 ? 'event' : 'events'}`} accessibilityRole='button' style={{ padding: cellPad, marginRight: extra, marginBottom: extra }}>
      {cssPulse ? <View style={[styles.pulse, css({ animationDuration: `${animationDuration * PULSE_HALF * 2}ms` })]}>{cell}</View> : cell}
    </Pressable>
  )
}

// react-native-web's CSS animation styles, which React Native's types don't list
const css = (style: Record<string, unknown>) => style as ViewStyle

const styles = StyleSheet.create({
  overlay: { left: 0, position: 'absolute', top: 0 },
  // The native loop's look: 1 to 1.2 and back, each half eased with Easing.inOut(Easing.sin), whose curve this
  // cubic-bezier follows to within 0.2%. A timing function applies to each interval between keyframes, so to each half
  pulse: css({
    animationIterationCount: 'infinite',
    // As CSS strings: react-native-web only turns a transform array into CSS at a style's top level, and inside a
    // keyframe one becomes a declaration the browser drops, leaving every step empty
    animationKeyframes: { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.2)' }, '100%': { transform: 'scale(1)' } },
    animationTimingFunction: 'cubic-bezier(0.37, 0, 0.63, 1)'
  })
})

export const HeatmapCell = memo(HeatmapCellComponent)
