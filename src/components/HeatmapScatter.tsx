import React, { useMemo } from 'react'
import Svg, { Circle } from 'react-native-svg'
import { getDefaultDateRange, parseDate } from '../utils/dateUtils'
import type { ScatterProps } from '../types'

const MAX_DOTS = 50

function rand(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function HeatmapScatter({
  data,
  startDate,
  endDate,
  width = 300,
  height = 150,
  dotRadius = 2,
}: ScatterProps) {
  const effectiveStart = useMemo(() => startDate ?? getDefaultDateRange().startDate, [startDate])
  const effectiveEnd = useMemo(() => endDate ?? getDefaultDateRange().endDate, [endDate])

  const dots = useMemo(() => {
    const padding = dotRadius + 2
    const startTime = effectiveStart.getTime()
    const endTime = effectiveEnd.getTime()
    const timeSpan = endTime - startTime
    const plotW = width - padding * 2
    const plotH = height - padding * 2
    const xJitter = dotRadius * 4

    const result: { key: string; cx: number; cy: number; fill: string }[] = []

    for (const point of data) {
      if (!point.segments?.length) continue
      const t = parseDate(point.date).getTime()
      if (t < startTime || t > endTime) continue

      const baseX = padding + (timeSpan === 0 ? plotW / 2 : ((t - startTime) / timeSpan) * plotW)
      const dayOrdinal = Math.round((t - startTime) / 86400000)

      for (let si = 0; si < point.segments.length; si++) {
        const seg = point.segments[si]
        const count = Math.min(seg.value, MAX_DOTS)

        for (let di = 0; di < count; di++) {
          const seed = dayOrdinal * 10000 + si * 1000 + di
          const cx = Math.max(padding, Math.min(width - padding, baseX + (rand(seed * 1.7) - 0.5) * xJitter))
          const cy = padding + rand(seed * 2.3) * plotH
          result.push({ key: `${point.date}-${si}-${di}`, cx, cy, fill: seg.color })
        }
      }
    }

    return result
  }, [data, effectiveStart, effectiveEnd, width, height, dotRadius])

  return (
    <Svg width={width} height={height}>
      {dots.map((d) => (
        <Circle key={d.key} cx={d.cx} cy={d.cy} r={dotRadius} fill={d.fill} />
      ))}
    </Svg>
  )
}
