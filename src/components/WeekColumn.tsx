import React, { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import type { CellMode, ColorScale, DataPoint, HeatmapTheme } from '../types'
import { getAutoScaleColor, getColorForValue, getNormalizedValue } from '../utils/colorUtils'
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
}

function WeekColumnComponent({ week, dataMap, colorScale, theme, cellMode, autoScale, dataRange, onCellPress }: WeekColumnProps) {
  const { cellSize, cellRadius, gutterSize } = theme
  const emptyColor = colorScale.emptyColor ?? colorScale.colors[0]

  return (
    <View style={[styles.column, { marginRight: gutterSize }]}>
      {week.map((date, i) => {
        if (!date) {
          return (
            <View
              key={i}
              style={{
                width: cellSize,
                height: cellSize,
                marginBottom: gutterSize
              }}
            />
          )
        }

        const point = dataMap.get(date)
        const value = point?.value ?? 0
        const segments = point?.segments
        const color = point?.color ?? (autoScale && dataRange ? getAutoScaleColor(value, dataRange.min, dataRange.max, colorScale) : getColorForValue(value, colorScale))
        const normalizedValue = getNormalizedValue(value, colorScale, dataRange?.max)

        return <HeatmapCell key={date} date={date} value={value} color={color} emptyColor={emptyColor} size={cellSize} radius={cellRadius} gutter={gutterSize} cellMode={cellMode} normalizedValue={normalizedValue} segments={segments} onPress={onCellPress} />
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  column: { flexDirection: 'column' }
})

export const WeekColumn = memo(WeekColumnComponent)
