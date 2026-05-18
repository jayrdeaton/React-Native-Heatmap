import { HeatmapCalendar } from './components/HeatmapCalendar'
import { HeatmapScatter } from './components/HeatmapScatter'

const Heatmap = {
  Calendar: HeatmapCalendar,
  Scatter: HeatmapScatter
}

export default Heatmap
export type { CellMode, ColorScale, DataPoint, HeatmapProps, HeatmapTheme, ScatterProps, TooltipData } from './types'
