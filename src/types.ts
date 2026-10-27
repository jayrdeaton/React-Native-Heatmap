import type React from 'react'
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native'

/** A drop-in for React Native's Pressable, handed its props unchanged (onPress, onPressIn and onPressOut, a style callback,
 * accessibility props), e.g. @rific/feedback-press's, which adds a haptic on touch-down. */
export type PressableComponent = React.ComponentType<PressableProps>

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
   * tap elsewhere on the calendar. onDayPress only reports taps, so a host showing something for the selected day needs this.
   * With selectedDate set, it's the day a tap asks for, and the host decides. */
  onSelectionChange?: (date: string | null) => void
  /** The selected day (YYYY-MM-DD), or null for none. Set, the calendar follows it rather than its own taps, so a host can
   * clear or move the selection from outside (a clear button beside what it shows for the day); taps only report through
   * onSelectionChange. Left undefined, the calendar keeps its own selection. */
  selectedDate?: string | null
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
  /** Draws every press (each day, and a tap elsewhere that clears the selection) through this in place of React Native's
   * Pressable, e.g. @rific/feedback-press's for a haptic on touch-down. A day's own press-in animation still runs. */
  pressable?: PressableComponent
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
  /** Draws every press (each day and the arrows) through this in place of React Native's Pressable, e.g. @rific/feedback-press's
   * for a haptic on touch-down. */
  pressable?: PressableComponent
}

export interface GridTheme {
  /** Each cell's height. By default 10 in a single row, and square cells filling the width in several. */
  cellHeight?: number
  cellRadius: number
  /** Between cells, across and down. */
  gap: number
  markHeight: number
  /** Between a row of cells and the marks under it. */
  markGap: number
  /** A mark's color when its point has none of its own. */
  markColor: string
  /** The outline of pending cells. Without one, the scale's top color. */
  pendingColor?: string
  /** Added to gap before an aligned line that starts a new day among lines of a share of one (6 or 12 hours), or a new
   * hour among lines of minutes, so the days stand apart. */
  boundaryGap: number
  /** The outline of the selected cell. */
  selectedColor: string
  backgroundColor: string
}

export interface GridProps {
  /** Values by time. Each point counts toward the cell its timestamp falls in, so points already one per cell map 1:1. */
  data: TimelineDataPoint[]
  rows?: number
  columns?: number
  /** The length of time each cell covers, on the device's clock. */
  granularity?: TimelineGranularity
  /** Time runs across each row ('row', like reading) or down each column ('column', like .Calendar's weeks). */
  fillDirection?: 'row' | 'column'
  /** Start each row (or column) on its own boundary when it spans exactly an hour of minutes, a day of hours or a week
   * of days: :00, local midnight, or weekStartsOn. Defaults to on when there's more than one, so a 7 by 24 grid of
   * hours is a week of days, and off for a single strip, which ends at the cell under way. */
  align?: boolean
  /** The weekday a week of days starts on when aligned, 0 for Sunday through 6 for Saturday. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Defaults to now. The cell under way is the last one; aligned, the rest of its row stays blank. The grid doesn't move
   * on its own; render it again to move it on. */
  endTime?: Date
  color?: string
  colorScale?: Partial<ColorScale>
  colorScheme?: 'light' | 'dark'
  /** Scale each cell against the busiest one in view, from zero. Otherwise by the color scale's thresholds. */
  autoScale?: boolean
  theme?: Partial<GridTheme>
  /** A tick under each cell holding a point with a value above 0, in the point's color or the theme's markColor. While
   * this is set, a tick row sits under every row of cells, so the grid keeps its height whether or not anything is marked. */
  marks?: TimelineDataPoint[]
  /** Cells before the one holding this moment are drawn hollow, for data still loading (a first sync paging newest first). */
  pendingBefore?: Date
  /** The cell holding this moment is outlined in the theme's selectedColor. The host keeps it, from onCellPress, as
   * .Calendar's selectedDate. */
  selected?: Date | null
  /** When a cell's value or color changes, its next look fades in over the one it shows on its column's delay, so a change
   * to the whole grid ripples across it as .Calendar's days do, crossing the columns in at most 1.2 animationDurations.
   * Hollow pending cells change at once. Meant for opaque colors: a translucent one shows the look under it until its
   * fade ends. */
  animated?: boolean
  /** Where the ripple starts: 'rtl' (the default) from the newest column, 'ltr' from the oldest. */
  animationDirection?: 'ltr' | 'rtl'
  /** One cell's fade, in ms. */
  animationDuration?: number
  /** Makes each cell a button. Without it the grid takes no touches, so it can sit inside something pressable. */
  onCellPress?: (bucket: TimeBucket) => void
  /** The unit in the default labels, pluralized with an s: 'log' reads 'Logs in 12 of the last 48 hours'. */
  valueLabel?: string
  /** Read for the whole grid, in place of the default. With onCellPress each cell is labeled instead. */
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
  /** Draws each cell's press (with onCellPress) through this in place of React Native's Pressable, e.g. @rific/feedback-press's
   * for a haptic on touch-down. */
  pressable?: PressableComponent
}
