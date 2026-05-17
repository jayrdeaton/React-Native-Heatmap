import React, { memo } from 'react'
import { Text, View } from 'react-native'

import type { HeatmapTheme } from '../types'

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

interface DayLabelsProps {
  theme: HeatmapTheme
  showMonthLabels: boolean
}

function DayLabelsComponent({ theme, showMonthLabels }: DayLabelsProps) {
  const { cellSize, gutterSize, dayLabelColor, monthLabelHeight, dayLabelWidth } = theme

  return (
    <View
      style={{
        width: dayLabelWidth,
        paddingTop: showMonthLabels ? monthLabelHeight : 0,
        flexDirection: 'column'
      }}
    >
      {DAY_LABELS.map((label, i) => (
        <View
          key={i}
          style={{
            height: cellSize,
            marginBottom: gutterSize,
            justifyContent: 'center'
          }}
        >
          {label ? (
            <Text
              style={{
                fontSize: 9,
                color: dayLabelColor,
                lineHeight: cellSize
              }}
            >
              {label}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  )
}

export const DayLabels = memo(DayLabelsComponent)
