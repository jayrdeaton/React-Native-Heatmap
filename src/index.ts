import { HeatmapCalendar } from './components/HeatmapCalendar'
import { HeatmapScatter } from './components/HeatmapScatter'
import { HeatmapTimeline } from './components/HeatmapTimeline'

const Heatmap = {
  Calendar: HeatmapCalendar,
  Scatter: HeatmapScatter,
  Timeline: HeatmapTimeline
}

export default Heatmap
export type { CellMode, ColorScale, DataPoint, HeatmapProps, HeatmapTheme, ScatterProps, TimeBucket, TimelineDataPoint, TimelineGranularity, TimelineProps, TimelineTheme, TooltipData } from './types'
