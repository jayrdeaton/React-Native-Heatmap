import React, { memo, useCallback, useEffect, useRef } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'
import Svg, { Circle, ClipPath, Defs, G, RadialGradient, Rect, Stop } from 'react-native-svg'

import type { CellMode, DataPoint, Segment } from '../types'

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
  animated?: boolean
  renderCell?: (data: DataPoint | null, date: string) => React.ReactNode
  dataPoint?: DataPoint | null
  todayBorderColor: string
  dataFadeDelay?: number
  animationDuration?: number
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

function HeatmapCellComponent({ date, value, color, emptyColor, size, radius, gutter, cellMode, normalizedValue, segments, onPress, isToday = false, animated: isAnimated = false, renderCell, dataPoint, todayBorderColor, dataFadeDelay = 0, animationDuration = 350 }: HeatmapCellProps) {
  const pressScale = useRef(new Animated.Value(1)).current
  const pulseScale = useRef(new Animated.Value(1)).current
  // Top data layer: starts at 1 if cell has data on mount, 0 if not
  const dataFadeAnim = useRef(new Animated.Value(isAnimated ? (value > 0 ? 1 : 0) : 1)).current
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (!isAnimated) return
    const prev = prevValueRef.current
    prevValueRef.current = value
    if (prev === 0 && value > 0) {
      Animated.timing(dataFadeAnim, { toValue: 1, duration: animationDuration, delay: dataFadeDelay, useNativeDriver: true }).start()
    } else if (prev > 0 && value === 0) {
      Animated.timing(dataFadeAnim, { toValue: 0, duration: animationDuration, useNativeDriver: true }).start()
    }
  }, [value, isAnimated, dataFadeAnim, animationDuration, dataFadeDelay])

  useEffect(() => {
    if (!isToday || !isAnimated) {
      pulseScale.setValue(1)
      return
    }
    const pulse = Animated.loop(Animated.sequence([Animated.timing(pulseScale, { toValue: 1.2, duration: animationDuration * 2.5, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }), Animated.timing(pulseScale, { toValue: 1, duration: animationDuration * 2.5, useNativeDriver: true, easing: Easing.inOut(Easing.sin) })]))
    pulse.start()
    return () => {
      pulse.stop()
      pulseScale.setValue(1)
    }
  }, [isToday, isAnimated, pulseScale, animationDuration])

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
  if (isToday && isAnimated) transform.push({ scale: pulseScale })

  const hasData = value > 0
  const gradientId = `grad-${date}`
  const clipId = `clip-${date}`
  const activeSegments = segments && segments.length > 0 ? segments : null
  const weightedSegments = activeSegments ? activeSegments.map((s) => ({ ...s, effectiveValue: s.value * (s.weight ?? 1) })) : null
  const effectiveTotal = weightedSegments ? weightedSegments.reduce((acc, s) => acc + s.effectiveValue, 0) : 0
  const dominantSegment = weightedSegments ? weightedSegments.reduce((prev, cur) => (cur.effectiveValue > prev.effectiveValue ? cur : prev)) : null

  const borderInset = 1
  const borderWidth = 1.5

  const todayBorder = isToday ? <Rect x={borderInset} y={borderInset} width={size - borderInset * 2} height={size - borderInset * 2} rx={Math.max(0, radius - borderInset)} ry={Math.max(0, radius - borderInset)} fill='none' stroke={todayBorderColor} strokeWidth={borderWidth} /> : null

  const dataLayer = (
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

      {todayBorder}
    </Svg>
  )

  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={!onPress} accessibilityLabel={`${date}: ${value} ${value === 1 ? 'event' : 'events'}`} accessibilityRole='button'>
      <Animated.View style={[{ marginBottom: gutter }, { transform }]}>
        {renderCell ? (
          renderCell(dataPoint ?? null, date)
        ) : isAnimated ? (
          <View style={{ width: size, height: size }}>
            {/* Base layer: always visible empty cell */}
            <Svg width={size} height={size}>
              <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={emptyColor} />
              {todayBorder}
            </Svg>
            {/* Data layer: fades in when data arrives */}
            <Animated.View style={[styles.overlay, { opacity: dataFadeAnim }]}>{dataLayer}</Animated.View>
          </View>
        ) : (
          dataLayer
        )}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0 }
})

export const HeatmapCell = memo(HeatmapCellComponent)
