import type { ColorScale, HeatmapTheme } from '../types'

export const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export const defaultColorScale: ColorScale = {
  thresholds: [1, 4, 8, 16],
  colors: ['#d0d7de', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  emptyColor: '#d0d7de'
}

export const defaultDarkColorScale: ColorScale = {
  thresholds: [1, 4, 8, 16],
  colors: ['#21262d', '#0e4429', '#006d32', '#26a641', '#39d353'],
  emptyColor: '#21262d'
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

export const defaultDarkTheme: HeatmapTheme = {
  ...defaultTheme,
  monthLabelColor: '#8b949e',
  dayLabelColor: '#8b949e',
  tooltipBackgroundColor: '#30363d',
}
