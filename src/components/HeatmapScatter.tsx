import React, { useMemo } from 'react'
import Svg, { Circle } from 'react-native-svg'
import { computeDataRange, getAutoScaleColor, getColorForValue, mergeColorScale } from '../utils/colorUtils'
import { getDefaultDateRange, parseDate } from '../utils/dateUtils'
import type { ScatterProps } from '../types'

export function HeatmapScatter({
  data,
  startDate,
  endDate,
  color,
  colorScale,
  colorScheme = 'light',
  autoScale = false,
  width = 300,
  height = 150,
  dotRadius = 3,
}: ScatterProps) {
  const effectiveStart = useMemo(() => startDate ?? getDefaultDateRange().startDate, [startDate])
  const effectiveEnd = useMemo(() => endDate ?? getDefaultDateRange().endDate, [endDate])

  const scale = useMemo(() => mergeColorScale(colorScale, colorScheme, color), [colorScale, colorScheme, color])
  const dataRange = useMemo(() => computeDataRange(data), [data])

  const dots = useMemo(() => {
    const padding = dotRadius + 2
    const startTime = effectiveStart.getTime()
    const endTime = effectiveEnd.getTime()
    const timeSpan = endTime - startTime
    const valueSpan = dataRange.max - dataRange.min
    const plotW = width - padding * 2
    const plotH = height - padding * 2

    return data.flatMap((p) => {
      if (p.value <= 0) return []
      const t = parseDate(p.date).getTime()
      if (t < startTime || t > endTime) return []
      const cx = padding + (timeSpan === 0 ? plotW / 2 : ((t - startTime) / timeSpan) * plotW)
      const cy = padding + (valueSpan === 0 ? plotH / 2 : (1 - (p.value - dataRange.min) / valueSpan) * plotH)
      const fill = p.color ?? (autoScale ? getAutoScaleColor(p.value, dataRange.min, dataRange.max, scale) : getColorForValue(p.value, scale))
      return [{ key: p.date, cx, cy, fill }]
    })
  }, [data, effectiveStart, effectiveEnd, dataRange, scale, autoScale, width, height, dotRadius])

  return (
    <Svg width={width} height={height}>
      {dots.map((d) => (
        <Circle key={d.key} cx={d.cx} cy={d.cy} r={dotRadius} fill={d.fill} />
      ))}
    </Svg>
  )
}
