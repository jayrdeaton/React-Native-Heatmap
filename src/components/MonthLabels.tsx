import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import type { HeatmapTheme } from '../types'
import type { MonthLabel } from '../utils/dateUtils'

interface MonthLabelsProps {
  monthLabels: MonthLabel[]
  theme: HeatmapTheme
}

function MonthLabelsComponent({ monthLabels, theme }: MonthLabelsProps) {
  const { cellSize, gutterSize, monthLabelColor, monthLabelHeight } = theme
  const weekWidth = cellSize + gutterSize

  return (
    <View style={[styles.view, { height: monthLabelHeight }]}>
      {monthLabels.map(({ label, weekIndex }) => (
        <Text
          key={`${label}-${weekIndex}`}
          style={[
            styles.text,
            {
              left: weekIndex * weekWidth,
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
