import React, { memo, useCallback } from 'react'
import { TouchableOpacity } from 'react-native'
import Svg, { Circle, ClipPath, Defs, G, RadialGradient, Rect, Stop } from 'react-native-svg'

import type { CellMode, Segment } from '../types'

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

function HeatmapCellComponent({ date, value, color, emptyColor, size, radius, gutter, cellMode, normalizedValue, segments, onPress }: HeatmapCellProps) {
  const handlePress = useCallback(() => {
    onPress?.(date, value)
  }, [date, value, onPress])

  const gradientId = `grad-${date}`
  const clipId = `clip-${date}`
  const hasData = value > 0
  const activeSegments = segments && segments.length > 0 ? segments : null
  const weightedSegments = activeSegments ? activeSegments.map((s) => ({ ...s, effectiveValue: s.value * (s.weight ?? 1) })) : null
  const effectiveTotal = weightedSegments ? weightedSegments.reduce((acc, s) => acc + s.effectiveValue, 0) : 0
  const dominantSegment = weightedSegments ? weightedSegments.reduce((prev, cur) => (cur.effectiveValue > prev.effectiveValue ? cur : prev)) : null

  return (
    <TouchableOpacity onPress={handlePress} disabled={!onPress} style={{ marginBottom: gutter }} accessibilityLabel={`${date}: ${value} ${value === 1 ? 'event' : 'events'}`} accessibilityRole='button'>
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

        {cellMode === 'priority' && (dominantSegment ? <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={dominantSegment.color} /> : <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={color} />)}
      </Svg>
    </TouchableOpacity>
  )
}

export const HeatmapCell = memo(HeatmapCellComponent)
