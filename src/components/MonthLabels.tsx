import React, { memo } from 'react'
import { Text, View } from 'react-native'

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
    <View style={{ height: monthLabelHeight, position: 'relative' }}>
      {monthLabels.map(({ label, weekIndex }) => (
        <Text
          key={`${label}-${weekIndex}`}
          style={{
            position: 'absolute',
            left: weekIndex * weekWidth,
            fontSize: 10,
            color: monthLabelColor,
            lineHeight: monthLabelHeight
          }}
        >
          {label}
        </Text>
      ))}
    </View>
  )
}

export const MonthLabels = memo(MonthLabelsComponent)
