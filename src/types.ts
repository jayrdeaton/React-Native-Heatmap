import type React from 'react'

export interface DataPoint {
  date: string
  value: number
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
}

export interface TooltipData {
  date: string
  value: number
  metadata?: Record<string, unknown>
}

export type CellMode = 'solid' | 'gradient' | 'density'

export interface HeatmapCalendarProps {
  data: DataPoint[]
  startDate?: Date
  endDate?: Date
  colorScale?: Partial<ColorScale>
  theme?: Partial<HeatmapTheme>
  cellMode?: CellMode
  showMonthLabels?: boolean
  showDayLabels?: boolean
  onDayPress?: (day: DataPoint | null, date: string) => void
  renderTooltip?: (data: TooltipData) => React.ReactNode
  animated?: boolean
}
