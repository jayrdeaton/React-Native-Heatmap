import type { ColorScale, DataPoint, HeatmapTheme } from '../types'
import { defaultColorScale, defaultTheme } from '../constants'

export { defaultColorScale, defaultTheme }

export function mergeColorScale(partial?: Partial<ColorScale>): ColorScale {
  return { ...defaultColorScale, ...partial }
}

export function mergeTheme(partial?: Partial<HeatmapTheme>): HeatmapTheme {
  return { ...defaultTheme, ...partial }
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
