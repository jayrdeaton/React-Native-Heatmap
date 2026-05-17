import type React from 'react'

export interface Segment {
  color: string
  value: number
  weight?: number
}

export interface DataPoint {
  date: string
  value: number
  color?: string
  segments?: Segment[]
  metadata?: Record<string, unknown>
}

export interface ColorScale {
  thresholds: number[]
  colors: string[]
  emptyColor?: string
}

export interface HeatmapTheme {
  cellSize: number
  cellRadius: number
  gutterSize: number
  monthLabelColor: string
  dayLabelColor: string
  backgroundColor: string
  tooltipBackgroundColor: string
  tooltipTextColor: string
  monthLabelHeight: number
  dayLabelWidth: number
  todayColor: string
  todayBorderColor: string
}

export interface TooltipData {
  date: string
  value: number
  metadata?: Record<string, unknown>
}

export type CellMode = 'solid' | 'gradient' | 'density' | 'stacked' | 'dots' | 'priority'

export interface HeatmapProps {
  data: DataPoint[]
  startDate?: Date
  endDate?: Date
  color?: string
  colorScale?: Partial<ColorScale>
  theme?: Partial<HeatmapTheme>
  cellMode?: CellMode
  colorScheme?: 'light' | 'dark'
  autoScale?: boolean
  showMonthLabels?: boolean
  showDayLabels?: boolean
  onDayPress?: (day: DataPoint | null, date: string) => void
  renderTooltip?: (data: TooltipData) => React.ReactNode
  renderCell?: (data: DataPoint | null, date: string) => React.ReactNode
  animated?: boolean
  animationDirection?: 'ltr' | 'rtl'
  animationDuration?: number
  scrollToToday?: boolean
  onEndReached?: () => void
  onEndReachedThreshold?: number
  tooltipLabel?: string
  tooltipEmptyLabel?: string
}
