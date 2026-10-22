import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import type { HeatmapTheme } from '../types'
import type { MonthLabel } from '../utils/dateUtils'
import { cellPadding, cellPitch } from '../utils/layoutUtils'

interface MonthLabelsProps {
  monthLabels: MonthLabel[]
  theme: HeatmapTheme
}

function MonthLabelsComponent({ monthLabels, theme }: MonthLabelsProps) {
  const { cellSize, gutterSize, monthLabelColor, monthLabelHeight } = theme
  const weekWidth = cellPitch(cellSize, gutterSize)
  // Over the left edge of the month's first square, past its padding.
  const inset = cellPadding(cellSize)

  return (
    <View style={[styles.view, { height: monthLabelHeight }]}>
      {monthLabels.map(({ label, weekIndex }) => (
        <Text
          key={`${label}-${weekIndex}`}
          style={[
            styles.text,
            {
              left: weekIndex * weekWidth + inset,
              color: monthLabelColor,
              lineHeight: monthLabelHeight
            }
          ]}
        >
          {label}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  view: { position: 'relative' },
  text: { fontSize: 10, position: 'absolute' }
})

export const MonthLabels = memo(MonthLabelsComponent)
