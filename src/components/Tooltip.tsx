import React, { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import type { HeatmapTheme, TooltipData } from '../types'
import { formatDisplayDate } from '../utils/dateUtils'

interface TooltipProps {
  visible: boolean
  data: TooltipData | null
  theme: HeatmapTheme
  renderTooltip?: (data: TooltipData) => React.ReactNode
  tooltipLabel?: string
  tooltipEmptyLabel?: string
}

function TooltipComponent({ visible, data, theme, renderTooltip, tooltipLabel = 'event', tooltipEmptyLabel = 'No events' }: TooltipProps) {
  if (!visible || !data) return null

  const { tooltipBackgroundColor, tooltipTextColor } = theme

  if (renderTooltip) {
    return <>{renderTooltip(data)}</>
  }

  const unit = data.value === 1 ? tooltipLabel : `${tooltipLabel}s`
  const countLabel = data.value === 0 ? tooltipEmptyLabel : `${data.value} ${unit}`

  return (
    <View style={[styles.container, { backgroundColor: tooltipBackgroundColor }]}>
      <Text style={[styles.count, { color: tooltipTextColor }]}>{countLabel}</Text>
      <Text style={[styles.date, { color: tooltipTextColor }]}>{formatDisplayDate(data.date)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    alignSelf: 'center',
    width: 160,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100
  },
  count: {
    fontSize: 12,
    fontWeight: '600'
  },
  date: {
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2
  }
})

export const Tooltip = memo(TooltipComponent)
