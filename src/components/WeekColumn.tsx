import React, { memo } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

import type { CellMode, ColorScale, DataPoint, HeatmapTheme } from '../types'
import { getAutoScaleColor, getColorForValue, getNormalizedValue } from '../utils/colorUtils'
import { getTodayString } from '../utils/dateUtils'
import { HeatmapCell } from './HeatmapCell'

interface WeekColumnProps {
  week: string[]
  dataMap: Map<string, DataPoint>
  colorScale: ColorScale
  theme: HeatmapTheme
  cellMode: CellMode
  autoScale?: boolean
  dataRange?: { min: number; max: number }
  onCellPress?: (date: string, value: number) => void
  animated?: boolean
  loadAnimValue?: Animated.Value
  renderCell?: (data: DataPoint | null, date: string) => React.ReactNode
  columnIndex: number
  totalColumns: number
  animationDirection: 'ltr' | 'rtl'
  animationDuration: number
}

const todayString = getTodayString()

function WeekColumnComponent({ week, dataMap, colorScale, theme, cellMode, autoScale, dataRange, onCellPress, animated, loadAnimValue, renderCell, columnIndex, totalColumns, animationDirection, animationDuration }: WeekColumnProps) {
  const { cellSize, cellRadius, gutterSize, todayBorderColor } = theme
  const emptyColor = colorScale.emptyColor ?? colorScale.colors[0]
  const dataFadeDelay = animationDirection === 'rtl' ? (totalColumns - 1 - columnIndex) * 30 : columnIndex * 30

  return (
    <View style={[styles.column, { marginRight: gutterSize }]}>
      {week.map((date, i) => {
        if (!date) {
          return <View key={i} style={{ width: cellSize, height: cellSize, marginBottom: gutterSize }} />
        }

        const point = dataMap.get(date)
        const value = point?.value ?? 0
        const segments = point?.segments
        const effectiveValue = segments && segments.length > 0 ? segments.reduce((acc, s) => acc + s.value * (s.weight ?? 1), 0) : value
        const color = point?.color ?? (autoScale && dataRange ? getAutoScaleColor(effectiveValue, dataRange.min, dataRange.max, colorScale) : getColorForValue(effectiveValue, colorScale))
        const normalizedValue = getNormalizedValue(effectiveValue, colorScale, dataRange?.max)

        return <HeatmapCell key={date} date={date} value={value} color={color} emptyColor={emptyColor} size={cellSize} radius={cellRadius} gutter={gutterSize} cellMode={cellMode} normalizedValue={normalizedValue} segments={segments} onPress={onCellPress} isToday={date === todayString} animated={animated} loadAnimValue={loadAnimValue} renderCell={renderCell} dataPoint={point} todayBorderColor={todayBorderColor} dataFadeDelay={dataFadeDelay} animationDuration={animationDuration} />
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  column: { flexDirection: 'column' }
})

export const WeekColumn = memo(WeekColumnComponent)
