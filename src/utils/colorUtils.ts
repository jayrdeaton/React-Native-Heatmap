import type { ColorScale, DataPoint, HeatmapTheme } from '../types'

export const DEFAULT_COLOR_SCALE: ColorScale = {
  thresholds: [1, 4, 8, 16],
  colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  emptyColor: '#ebedf0'
}

export const DEFAULT_THEME: HeatmapTheme = {
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

export function mergeColorScale(partial?: Partial<ColorScale>): ColorScale {
  return { ...DEFAULT_COLOR_SCALE, ...partial }
}

export function mergeTheme(partial?: Partial<HeatmapTheme>): HeatmapTheme {
  return { ...DEFAULT_THEME, ...partial }
}

export function getColorForValue(value: number | undefined, scale: ColorScale): string {
  if (value === undefined || value === 0) {
    return scale.emptyColor ?? scale.colors[0]
  }
  for (let i = scale.thresholds.length - 1; i >= 0; i--) {
    if (value >= scale.thresholds[i]) {
      return scale.colors[i + 1] ?? scale.colors[scale.colors.length - 1]
    }
  }
  return scale.colors[0]
}

/**
 * Returns a 0-1 normalized intensity for the density cell mode.
 * 0 = no data, 1 = at or above the highest threshold.
 */
export function getNormalizedValue(value: number | undefined, scale: ColorScale): number {
  if (value === undefined || value === 0) return 0
  const max = scale.thresholds[scale.thresholds.length - 1]
  return Math.min(value / max, 1)
}

export function buildDataMap(data: DataPoint[]): Map<string, DataPoint> {
  const map = new Map<string, DataPoint>()
  for (const point of data) {
    map.set(point.date, point)
  }
  return map
}
