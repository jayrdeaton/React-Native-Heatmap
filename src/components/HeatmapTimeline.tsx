import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PanResponder, StyleSheet, Text, View } from 'react-native'
import { Rect, Svg } from 'react-native-svg'

import type { TimeBucket, TimelineDataPoint, TimelineGranularity, TimelineProps, TimelineTheme } from '../types'
import { getAutoScaleColor, mergeColorScale } from '../utils/colorUtils'
import { bucketStart, buildTimeDataMap, clampZoom, formatTimeLabel, getCellWidth, getGranularity, getLabelInterval, inferTimeBounds } from '../utils/timeUtils'

const BUCKET_MS: Record<TimelineGranularity, number> = {
  day: 86400000,
  hour: 3600000,
  minute: 60000
}

const defaultThemeLight: TimelineTheme = {
  height: 60,
  labelHeight: 20,
  backgroundColor: 'transparent',
  labelColor: '#57606a',
  emptyColor: '#ebedf0'
}

const defaultThemeDark: TimelineTheme = {
  height: 60,
  labelHeight: 20,
  backgroundColor: 'transparent',
  labelColor: '#8b949e',
  emptyColor: '#161b22'
}

export function HeatmapTimeline({ data, startTime, endTime, zoom: zoomProp = 20, minZoom = 0.5, maxZoom = 2000, color, colorScale: colorScaleProp, colorScheme, theme: themeProp, onZoomChange, onTimePress }: TimelineProps) {
  const theme: TimelineTheme = useMemo(() => ({ ...(colorScheme === 'dark' ? defaultThemeDark : defaultThemeLight), ...themeProp }), [colorScheme, themeProp])

  const colorScale = useMemo(() => mergeColorScale(colorScaleProp, colorScheme, color), [colorScaleProp, colorScheme, color])

  const bounds = useMemo(() => {
    const inferred = inferTimeBounds(data)
    return {
      start: startTime ?? inferred.start,
      end: endTime ?? inferred.end
    }
  }, [startTime, endTime, data])

  const dataMaps = useMemo(
    () => ({
      day: buildTimeDataMap(data, 'day'),
      hour: buildTimeDataMap(data, 'hour'),
      minute: buildTimeDataMap(data, 'minute')
    }),
    [data]
  )

  const dataMaxes = useMemo(() => {
    const max = (map: Map<number, number>) => Array.from(map.values()).reduce((m, v) => Math.max(m, v), 0)
    return {
      day: max(dataMaps.day),
      hour: max(dataMaps.hour),
      minute: max(dataMaps.minute)
    }
  }, [dataMaps])

  const [, setFrame] = useState(0)
  const forceUpdate = useCallback(() => setFrame((n) => n + 1), [])

  const scrollXRef = useRef(0)
  const zoomRef = useRef(zoomProp)
  const containerWidthRef = useRef(0)

  useEffect(() => {
    zoomRef.current = zoomProp
    forceUpdate()
  }, [zoomProp, forceUpdate])

  // Stable refs for latest prop values — read by gesture callbacks
  const boundsRef = useRef(bounds)
  boundsRef.current = bounds
  const dataMapsRef = useRef(dataMaps)
  dataMapsRef.current = dataMaps
  const minZoomRef = useRef(minZoom)
  minZoomRef.current = minZoom
  const maxZoomRef = useRef(maxZoom)
  maxZoomRef.current = maxZoom
  const onZoomChangeRef = useRef(onZoomChange)
  onZoomChangeRef.current = onZoomChange
  const onTimePressRef = useRef(onTimePress)
  onTimePressRef.current = onTimePress

  const gestureTypeRef = useRef<'pan' | 'pinch' | 'none'>('none')
  const lastScrollXRef = useRef(0)
  const pinchStartDistRef = useRef(0)
  const pinchStartZoomRef = useRef(0)
  const pinchMidXRef = useRef(0)
  const momentumFrameRef = useRef<number | null>(null)

  const getClampedScroll = useCallback((x: number, zoom: number) => {
    const b = boundsRef.current
    const totalWidth = ((b.end.getTime() - b.start.getTime()) / 3600000) * zoom
    return Math.max(0, Math.min(x, Math.max(0, totalWidth - containerWidthRef.current)))
  }, [])

  const cancelMomentum = useCallback(() => {
    if (momentumFrameRef.current !== null) {
      cancelAnimationFrame(momentumFrameRef.current)
      momentumFrameRef.current = null
    }
  }, [])

  const startMomentum = useCallback(
    (vx: number) => {
      let velocity = -vx * 16
      const animate = () => {
        if (Math.abs(velocity) < 0.5) {
          momentumFrameRef.current = null
          return
        }
        scrollXRef.current = getClampedScroll(scrollXRef.current + velocity, zoomRef.current)
        velocity *= 0.95
        setFrame((n) => n + 1)
        momentumFrameRef.current = requestAnimationFrame(animate)
      }
      momentumFrameRef.current = requestAnimationFrame(animate)
    },
    [getClampedScroll]
  )

  const getDistance = (touches: { pageX: number; pageY: number }[]) => {
    const [a, b] = touches
    return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY)
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          cancelMomentum()
          const touches = evt.nativeEvent.touches as unknown as { pageX: number; pageY: number; locationX: number }[]
          lastScrollXRef.current = scrollXRef.current
          if (touches.length >= 2) {
            gestureTypeRef.current = 'pinch'
            pinchStartDistRef.current = getDistance(touches)
            pinchStartZoomRef.current = zoomRef.current
            pinchMidXRef.current = (touches[0].locationX + touches[1].locationX) / 2
          } else {
            gestureTypeRef.current = 'pan'
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches as unknown as { pageX: number; pageY: number }[]
          if (gestureTypeRef.current === 'pinch' || touches.length >= 2) {
            gestureTypeRef.current = 'pinch'
            if (touches.length >= 2) {
              const dist = getDistance(touches)
              const ratio = dist / pinchStartDistRef.current
              const newZoom = clampZoom(pinchStartZoomRef.current * ratio, minZoomRef.current, maxZoomRef.current)
              const midX = pinchMidXRef.current
              const worldAtMid = (scrollXRef.current + midX) / zoomRef.current
              zoomRef.current = newZoom
              scrollXRef.current = getClampedScroll(worldAtMid * newZoom - midX, newZoom)
              onZoomChangeRef.current?.(newZoom)
              setFrame((n) => n + 1)
            }
          } else {
            scrollXRef.current = getClampedScroll(lastScrollXRef.current - gestureState.dx, zoomRef.current)
            setFrame((n) => n + 1)
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          if (gestureTypeRef.current === 'pan') {
            if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
              const nativeEvt = evt.nativeEvent as unknown as { locationX?: number }
              const touchX = nativeEvt.locationX ?? gestureState.x0 - 0
              const worldX = scrollXRef.current + touchX
              const gran = getGranularity(zoomRef.current)
              const b = boundsRef.current
              const timeMs = b.start.getTime() + (worldX / zoomRef.current) * 3600000
              const start = bucketStart(new Date(timeMs), gran)
              const end = new Date(start.getTime() + BUCKET_MS[gran])
              const value = dataMapsRef.current[gran].get(start.getTime()) ?? 0
              onTimePressRef.current?.({ startTime: start, endTime: end, granularity: gran, value })
            } else {
              startMomentum(gestureState.vx)
            }
          }
          gestureTypeRef.current = 'none'
        },
        onPanResponderTerminate: () => {
          gestureTypeRef.current = 'none'
        }
      }),
    [cancelMomentum, getClampedScroll, startMomentum]
  )

  // Read refs for current render frame
  const zoom = zoomRef.current
  const scrollX = scrollXRef.current
  const containerWidth = containerWidthRef.current

  const gran = getGranularity(zoom)
  const cellWidth = getCellWidth(gran, zoom)
  const bucketMs = BUCKET_MS[gran]
  const dataMap = dataMaps[gran]
  const dataMax = dataMaxes[gran]

  const visibleStartMs = bounds.start.getTime() + (scrollX / zoom) * 3600000
  const visibleEndMs = visibleStartMs + (containerWidth / zoom) * 3600000
  const firstBucketT = Math.floor(visibleStartMs / bucketMs) * bucketMs
  const lastBucketT = Math.ceil(visibleEndMs / bucketMs) * bucketMs
  const labelInterval = getLabelInterval(zoom, gran)

  const cells: { key: number; x: number; width: number; fill: string }[] = []
  const labels: { key: number; x: number; text: string }[] = []
  let bucketIndex = 0

  for (let t = firstBucketT; t <= lastBucketT; t += bucketMs) {
    if (t < bounds.start.getTime() || t >= bounds.end.getTime()) {
      bucketIndex++
      continue
    }
    const cellX = ((t - bounds.start.getTime()) / 3600000) * zoom - scrollX
    const value = dataMap.get(t) ?? 0
    const fill = value > 0 && dataMax > 0 ? getAutoScaleColor(value, 0, dataMax, colorScale) : (colorScale.emptyColor ?? theme.emptyColor)

    cells.push({ key: t, x: cellX, width: Math.max(cellWidth - 1, 1), fill })

    if (bucketIndex % labelInterval === 0) {
      labels.push({ key: t, x: cellX, text: formatTimeLabel(new Date(t), gran) })
    }
    bucketIndex++
  }

  return (
    <View
      style={[styles.container, { height: theme.height + theme.labelHeight, backgroundColor: theme.backgroundColor }]}
      onLayout={(e) => {
        containerWidthRef.current = e.nativeEvent.layout.width
        forceUpdate()
      }}
      {...panResponder.panHandlers}
    >
      <View style={[styles.labelRow, { height: theme.labelHeight }]}>
        {labels.map((l) => (
          <Text key={l.key} style={[styles.labelText, { left: l.x, color: theme.labelColor }]}>
            {l.text}
          </Text>
        ))}
      </View>
      {containerWidth > 0 && (
        <Svg width={containerWidth} height={theme.height}>
          {cells.map((c) => (
            <Rect key={c.key} x={c.x} y={0} width={c.width} height={theme.height} fill={c.fill} />
          ))}
        </Svg>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  },
  labelRow: {
    overflow: 'hidden'
  },
  labelText: {
    fontSize: 9,
    position: 'absolute',
    top: 4
  }
})

export type { TimeBucket, TimelineDataPoint, TimelineGranularity, TimelineProps, TimelineTheme }
