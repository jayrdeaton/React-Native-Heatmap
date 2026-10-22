import { memo, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { dayLabels } from '../constants'
import type { HeatmapTheme } from '../types'
import { cellPadding, cellPitch } from '../utils/layoutUtils'

interface DayLabelsProps {
  theme: HeatmapTheme
  showMonthLabels: boolean
}

function DayLabelsComponent({ theme, showMonthLabels }: DayLabelsProps) {
  const { cellSize, gutterSize, dayLabelColor, monthLabelHeight, dayLabelWidth } = theme
  // Centred on its row's square: the square and its padding, then the rest of the pitch below.
  const squareRow = cellSize + 2 * cellPadding(cellSize)
  const rowGap = cellPitch(cellSize, gutterSize) - squareRow
  const paddingTop = useMemo(() => (showMonthLabels ? monthLabelHeight : 0), [showMonthLabels, monthLabelHeight])
  return (
    <View style={[styles.column, { width: dayLabelWidth, paddingTop }]}>
      {dayLabels.map((label, i) => (
        <View key={i} style={[styles.center, { height: squareRow, marginBottom: rowGap }]}>
          {label ? <Text style={[styles.text, { color: dayLabelColor, lineHeight: cellSize }]}>{label}</Text> : null}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  column: { flexDirection: 'column' },
  text: { fontSize: 9 },
  center: { justifyContent: 'center' }
})

export const DayLabels = memo(DayLabelsComponent)
