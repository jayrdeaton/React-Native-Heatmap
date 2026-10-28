import React, { memo } from 'react'
import { StyleSheet, View } from 'react-native'

import type { CellMode, ColorScale, DataPoint, HeatmapTheme, PressableComponent } from '../types'
import { getAutoScaleColor, getColorForValue, getNormalizedValue } from '../utils/colorUtils'
import { getTodayString } from '../utils/dateUtils'
import { cellPitch, waveStep as fullWaveStep } from '../utils/layoutUtils'
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
  renderCell?: (data: DataPoint | null, date: string) => React.ReactNode
  columnIndex: number
  totalColumns: number
  animationDirection: 'ltr' | 'rtl'
  animationDuration: number
  /** How long the fade waits per column from where the wave starts (see waveStep); the full step when left out */
  waveStep?: number
  selectedDate?: string | null
  /** Days before it are dimmed and can't be pressed (see .Calendar's minDate) */
  minDate?: string
  pressable?: PressableComponent
}

const todayString = getTodayString()

function WeekColumnComponent({ week, dataMap, colorScale, theme, cellMode, autoScale, dataRange, onCellPress, animated, renderCell, columnIndex, totalColumns, animationDirection, animationDuration, waveStep, selectedDate, minDate, pressable }: WeekColumnProps) {
  const { cellSize, cellRadius, gutterSize, todayBorderColor, selectedBorderColor } = theme
  const pitch = cellPitch(cellSize, gutterSize)
  const emptyColor = colorScale.emptyColor ?? colorScale.colors[0]
  const step = waveStep ?? fullWaveStep(animationDuration)
  const dataFadeDelay = animationDirection === 'rtl' ? (totalColumns - 1 - columnIndex) * step : columnIndex * step

  return (
    <View style={styles.column}>
      {week.map((date, i) => {
        if (!date) {
          return <View key={i} style={{ width: pitch, height: pitch }} />
        }

        const point = dataMap.get(date)
        const value = point?.value ?? 0
        const segments = point?.segments
        const effectiveValue = segments && segments.length > 0 ? segments.reduce((acc, s) => acc + s.value * (s.weight ?? 1), 0) : value
        const color = point?.color ?? (autoScale && dataRange ? getAutoScaleColor(effectiveValue, dataRange.min, dataRange.max, colorScale) : getColorForValue(effectiveValue, colorScale))
        const normalizedValue = getNormalizedValue(effectiveValue, colorScale, dataRange?.max)

        return <HeatmapCell key={date} date={date} value={value} color={color} emptyColor={emptyColor} size={cellSize} radius={cellRadius} gutter={gutterSize} cellMode={cellMode} normalizedValue={normalizedValue} segments={segments} onPress={onCellPress} isToday={date === todayString} isSelected={date === selectedDate} animated={animated} renderCell={renderCell} dataPoint={point} todayBorderColor={todayBorderColor} selectedBorderColor={selectedBorderColor} dataFadeDelay={dataFadeDelay} animationDuration={animationDuration} unavailable={!!minDate && date < minDate} pressable={pressable} />
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  column: { flexDirection: 'column' }
})

export const WeekColumn = memo(WeekColumnComponent)
