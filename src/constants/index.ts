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
  tooltipBackgroundColor: '#f0f0f0',
  tooltipTextColor: '#0f0f0f',
  monthLabelHeight: 18,
  dayLabelWidth: 28,
  todayBorderColor: '#0f0f0f',
  selectedBorderColor: '#0f0f0f'
}

export const defaultDarkTheme: HeatmapTheme = {
  ...defaultTheme,
  monthLabelColor: '#8b949e',
  dayLabelColor: '#8b949e',
  tooltipBackgroundColor: '#0f0f0f',
  tooltipTextColor: '#f0f0f0',
  todayBorderColor: '#f0f0f0',
  selectedBorderColor: '#f0f0f0'
}
