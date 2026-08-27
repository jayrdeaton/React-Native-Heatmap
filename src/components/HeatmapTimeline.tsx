import { type MutableRefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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

function getDistance(touches: { pageX: number; pageY: number }[]) {
  const [a, b] = touches
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY)
}

// Builds the PanResponder from the mirror refs (see the "Stable refs mirroring the latest render
// values" comment below) plus the permanently-stable callbacks. Constructed exactly once, from a
// run-once layout effect below — never during render — since the ref-safety lint rule flags any
// render-phase function call (useMemo factory or useState lazy initializer alike) that receives a
// ref as an argument, and this needs several.
function buildPanResponder(params: { boundsRef: MutableRefObject<{ start: Date; end: Date }>; dataMapsRef: MutableRefObject<Record<TimelineGranularity, Map<number, number>>>; minZoomRef: MutableRefObject<number>; maxZoomRef: MutableRefObject<number>; onZoomChangeRef: MutableRefObject<((zoom: number) => void) | undefined>; onTimePressRef: MutableRefObject<((bucket: TimeBucket) => void) | undefined>; zoomRef: MutableRefObject<number>; scrollXRef: MutableRefObject<number>; gestureTypeRef: MutableRefObject<'pan' | 'pinch' | 'none'>; lastScrollXRef: MutableRefObject<number>; pinchStartDistRef: MutableRefObject<number>; pinchStartZoomRef: MutableRefObject<number>; pinchMidXRef: MutableRefObject<number>; cancelMomentum: () => void; getClampedScroll: (x: number, zoom: number) => number; startMomentum: (vx: number) => void; setZoom: (zoom: number) => void; setScrollX: (scrollX: number) => void }) {
  const { boundsRef, dataMapsRef, minZoomRef, maxZoomRef, onZoomChangeRef, onTimePressRef, zoomRef, scrollXRef, gestureTypeRef, lastScrollXRef, pinchStartDistRef, pinchStartZoomRef, pinchMidXRef, cancelMomentum, getClampedScroll, startMomentum, setZoom, setScrollX } = params

  return PanResponder.create({
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
          setZoom(zoomRef.current)
          setScrollX(scrollXRef.current)
        }
      } else {
        scrollXRef.current = getClampedScroll(lastScrollXRef.current - gestureState.dx, zoomRef.current)
        setScrollX(scrollXRef.current)
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
  })
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

  const [zoom, setZoom] = useState(zoomProp)
  const [scrollX, setScrollX] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  // zoom is an internal, gesture-adjustable value that also tracks the controlled zoomProp
  // when it changes externally (see https://react.dev/learn/you-might-not-need-an-effect
  // #adjusting-some-state-when-a-prop-changes).
  const [prevZoomProp, setPrevZoomProp] = useState(zoomProp)
  if (zoomProp !== prevZoomProp) {
    setPrevZoomProp(zoomProp)
    setZoom(zoomProp)
  }

  // Stable refs mirroring the latest render values — read (and, mid-gesture, written directly)
  // by the PanResponder callbacks below, so panResponder itself stays memoized across renders
  // instead of being recreated on every touch-move/zoom/scroll change.
  const boundsRef = useRef(bounds)
  const dataMapsRef = useRef(dataMaps)
  const minZoomRef = useRef(minZoom)
  const maxZoomRef = useRef(maxZoom)
  const onZoomChangeRef = useRef(onZoomChange)
  const onTimePressRef = useRef(onTimePress)
  const zoomRef = useRef(zoom)
  const scrollXRef = useRef(scrollX)
  const containerWidthRef = useRef(containerWidth)

  useEffect(() => {
    boundsRef.current = bounds
    dataMapsRef.current = dataMaps
    minZoomRef.current = minZoom
    maxZoomRef.current = maxZoom
    onZoomChangeRef.current = onZoomChange
    onTimePressRef.current = onTimePress
    zoomRef.current = zoom
    scrollXRef.current = scrollX
    containerWidthRef.current = containerWidth
  })

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
        setScrollX(scrollXRef.current)
        momentumFrameRef.current = requestAnimationFrame(animate)
      }
      momentumFrameRef.current = requestAnimationFrame(animate)
    },
    [getClampedScroll]
  )

  // buildPanResponder's config closes over several refs, so constructing it counts as "passing a
  // ref to a function" if done anywhere in the render phase itself (useMemo's factory and even a
  // useState lazy initializer both still run synchronously as part of rendering). An effect is the
  // one context that genuinely runs after render/commit, so — since cancelMomentum/getClampedScroll
  // /startMomentum are permanently stable (their own useCallback deps never change) and this only
  // ever needs to run once — build it in a run-once layout effect instead. panResponder is briefly
  // null on the very first render (before gesture handlers can attach), which is unobservable in
  // practice: a layout effect commits before the screen paints, well before any touch can land.
  const [panResponder, setPanResponder] = useState<ReturnType<typeof buildPanResponder> | null>(null)
  useLayoutEffect(() => {
    setPanResponder(
      (current) =>
        current ??
        buildPanResponder({
          boundsRef,
          dataMapsRef,
          minZoomRef,
          maxZoomRef,
          onZoomChangeRef,
          onTimePressRef,
          zoomRef,
          scrollXRef,
          gestureTypeRef,
          lastScrollXRef,
          pinchStartDistRef,
          pinchStartZoomRef,
          pinchMidXRef,
          cancelMomentum,
          getClampedScroll,
          startMomentum,
          setZoom,
          setScrollX
        })
    )
  }, [cancelMomentum, getClampedScroll, startMomentum])

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
        setContainerWidth(containerWidthRef.current)
      }}
      {...(panResponder?.panHandlers ?? {})}
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
