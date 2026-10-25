import { HeatmapCalendar } from './components/HeatmapCalendar'
import { HeatmapGrid } from './components/HeatmapGrid'
import { HeatmapMonth } from './components/HeatmapMonth'
import { HeatmapScatter } from './components/HeatmapScatter'
import { HeatmapTimeline } from './components/HeatmapTimeline'

const Heatmap = {
  Calendar: HeatmapCalendar,
  Grid: HeatmapGrid,
  Month: HeatmapMonth,
  Scatter: HeatmapScatter,
  Timeline: HeatmapTimeline
}

export default Heatmap
export type { CellMode, ColorScale, DataPoint, GridProps, GridTheme, HeatmapProps, HeatmapTheme, MonthProps, PressableComponent, ScatterProps, TimeBucket, TimelineDataPoint, TimelineGranularity, TimelineProps, TimelineTheme, TooltipData } from './types'
