import type { HeatmapTheme } from '../types'

export const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export const defaultLightColor = '#4183c4'
export const defaultDarkColor = '#58a6ff'

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
  dayLabelWidth: 28,
  todayColor: '#4183c4',
  todayBorderColor: '#4183c4'
}

export const defaultDarkTheme: HeatmapTheme = {
  ...defaultTheme,
  monthLabelColor: '#8b949e',
  dayLabelColor: '#8b949e',
  tooltipBackgroundColor: '#30363d',
  todayColor: '#58a6ff',
  todayBorderColor: '#58a6ff'
}
