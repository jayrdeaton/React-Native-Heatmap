import { HeatmapCalendar } from './components/HeatmapCalendar'
import { HeatmapMonth } from './components/HeatmapMonth'
import { HeatmapScatter } from './components/HeatmapScatter'
import { HeatmapTimeline } from './components/HeatmapTimeline'

const Heatmap = {
  Calendar: HeatmapCalendar,
  Month: HeatmapMonth,
  Scatter: HeatmapScatter,
  Timeline: HeatmapTimeline
}

export default Heatmap
export type { CellMode, ColorScale, DataPoint, HeatmapProps, HeatmapTheme, MonthProps, ScatterProps, TimeBucket, TimelineDataPoint, TimelineGranularity, TimelineProps, TimelineTheme, TooltipData } from './types'
