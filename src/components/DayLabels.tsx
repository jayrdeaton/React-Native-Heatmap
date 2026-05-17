import React, { memo, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import type { HeatmapTheme } from '../types'

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

interface DayLabelsProps {
  theme: HeatmapTheme
  showMonthLabels: boolean
}

function DayLabelsComponent({ theme, showMonthLabels }: DayLabelsProps) {
  const { cellSize, gutterSize, dayLabelColor, monthLabelHeight, dayLabelWidth } = theme
  const paddingTop = useMemo(() => (showMonthLabels ? monthLabelHeight : 0), [showMonthLabels, monthLabelHeight])
  return (
    <View style={[styles.column, { width: dayLabelWidth, paddingTop }]}>
      {DAY_LABELS.map((label, i) => (
        <View key={i} style={[styles.center, { height: cellSize, marginBottom: gutterSize }]}>
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
