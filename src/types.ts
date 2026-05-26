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
  todayBorderColor: string
  selectedBorderColor: string
}

export interface TooltipData {
  date: string
  value: number
  metadata?: Record<string, unknown>
}

export type CellMode = 'solid' | 'gradient' | 'density' | 'stacked' | 'dots' | 'priority'

export interface ScatterProps {
  data: DataPoint[]
  startDate?: Date
  endDate?: Date
  width?: number
  height?: number
  dotRadius?: number
}

export interface TimelineDataPoint {
  timestamp: string
  value: number
  color?: string
  metadata?: Record<string, unknown>
}

export type TimelineGranularity = 'minute' | 'hour' | 'day'

export interface TimeBucket {
  startTime: Date
  endTime: Date
  granularity: TimelineGranularity
  value: number
  color?: string
}

export interface TimelineTheme {
  height: number
  labelHeight: number
  backgroundColor: string
  labelColor: string
  emptyColor: string
}

export interface TimelineProps {
  data: TimelineDataPoint[]
  startTime?: Date
  endTime?: Date
  zoom?: number
  minZoom?: number
  maxZoom?: number
  color?: string
  colorScale?: Partial<ColorScale>
  colorScheme?: 'light' | 'dark'
  theme?: Partial<TimelineTheme>
  onZoomChange?: (zoom: number) => void
  onTimePress?: (bucket: TimeBucket) => void
}

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
  onEndReached?: () => void
  onEndReachedThreshold?: number
  tooltipLabel?: string
  tooltipEmptyLabel?: string
  scrollEnabled?: boolean
}
