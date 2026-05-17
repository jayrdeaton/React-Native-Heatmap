import type { ColorScale, HeatmapTheme } from '../types'

export const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export const defaultColorScale: ColorScale = {
  thresholds: [1, 4, 8, 16],
  colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  emptyColor: '#ebedf0'
}

export const defaultTheme: HeatmapTheme = {
  cellSize: 14,
  cellRadius: 2,
  gutterSize: 2,
  monthLabelColor: '#57606a',
  dayLabelColor: '#57606a',
  backgroundColor: 'transparent',
  tooltipBackgroundColor: '#1b1f23',
  tooltipTextColor: '#ffffff',
  monthLabelHeight: 18,
  dayLabelWidth: 28
}
