import type React from 'react'
import type { StyleProp, TextStyle } from 'react-native'

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
  /** The selected day (outlined, its tooltip open) whenever it changes, or null once it clears: a second tap on it, or a
   * tap elsewhere on the calendar. onDayPress only reports taps, so a host showing something for the selected day needs this. */
  onSelectionChange?: (date: string | null) => void
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

export interface MonthProps {
  data: DataPoint[]
  /** The month shown, YYYY-MM. */
  month: string
  /** Called with the month an arrow moves to (YYYY-MM). Without it the header has no arrows. */
  onMonthChange?: (month: string) => void
  /** The first day that can be pressed (YYYY-MM-DD). Days before it are dimmed, and the previous arrow stops at its month. */
  minDate?: string
  /** The last day that can be pressed (YYYY-MM-DD). Days after it are dimmed, and the next arrow stops at its month. */
  maxDate?: string
  /** The day outlined in the theme's selectedBorderColor (YYYY-MM-DD). */
  selectedDate?: string | null
  onDayPress?: (day: DataPoint | null, date: string) => void
  /** The weekday each row starts on, 0 for Sunday through 6 for Saturday. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Six weeks for every month, so the height never changes between months. Otherwise only the weeks the month needs. */
  fixedWeeks?: boolean
  color?: string
  colorScale?: Partial<ColorScale>
  colorScheme?: 'light' | 'dark'
  theme?: Partial<HeatmapTheme>
  autoScale?: boolean
  /** The unit in each day's accessibility label, pluralized with an s: 'log' reads '3 logs'. */
  valueLabel?: string
  /** Applied to every text (title, weekdays, dates) under the month's own colors, for a font family or size. */
  textStyle?: StyleProp<TextStyle>
}
