import React, { memo, useCallback } from 'react'
import { TouchableOpacity } from 'react-native'
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg'

import type { CellMode } from '../types'

interface HeatmapCellProps {
  date: string
  value: number
  color: string
  emptyColor: string
  size: number
  radius: number
  gutter: number
  cellMode: CellMode
  normalizedValue: number
  onPress?: (date: string, value: number) => void
}

function HeatmapCellComponent({ date, value, color, emptyColor, size, radius, gutter, cellMode, normalizedValue, onPress }: HeatmapCellProps) {
  const handlePress = useCallback(() => {
    onPress?.(date, value)
  }, [date, value, onPress])

  const gradientId = `grad-${date}`
  const hasData = value > 0

  return (
    <TouchableOpacity onPress={handlePress} disabled={!onPress} style={{ marginBottom: gutter }} accessibilityLabel={`${date}: ${value} ${value === 1 ? 'event' : 'events'}`} accessibilityRole='button'>
      <Svg width={size} height={size}>
        {cellMode === 'solid' && <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={color} />}

        {cellMode === 'gradient' && (
          <>
            <Defs>
              <RadialGradient id={gradientId} cx='50%' cy='50%' r='50%' fx='50%' fy='50%'>
                <Stop offset='0%' stopColor={hasData ? emptyColor : emptyColor} stopOpacity={hasData ? 0.4 : 1} />
                <Stop offset='100%' stopColor={color} stopOpacity={1} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={`url(#${gradientId})`} />
          </>
        )}

        {cellMode === 'density' && (
          <>
            <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={emptyColor} />
            {hasData && <Circle cx={size / 2} cy={size / 2} r={(size / 2 - 1) * normalizedValue} fill={color} />}
          </>
        )}
      </Svg>
    </TouchableOpacity>
  )
}

export const HeatmapCell = memo(HeatmapCellComponent)
