import { defaultColorScale, defaultTheme } from '../constants'
import type { ColorScale, DataPoint, HeatmapTheme } from '../types'

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

export function computeDataRange(data: DataPoint[]): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const point of data) {
    if (point.value > 0) {
      if (point.value < min) min = point.value
      if (point.value > max) max = point.value
    }
  }
  if (min === Infinity) return { min: 0, max: 0 }
  return { min, max }
}

export function getAutoScaleColor(value: number | undefined, min: number, max: number, scale: ColorScale): string {
  if (value === undefined || value === 0) return scale.emptyColor ?? scale.colors[0]
  const nonEmptyColors = scale.colors.slice(1)
  if (nonEmptyColors.length === 0) return scale.colors[0]
  if (min === max) return nonEmptyColors[nonEmptyColors.length - 1]
  const normalized = (value - min) / (max - min)
  const idx = Math.min(Math.floor(normalized * nonEmptyColors.length), nonEmptyColors.length - 1)
  return nonEmptyColors[idx]
}

export function getNormalizedValue(value: number | undefined, scale: ColorScale, dataMax?: number): number {
  if (value === undefined || value === 0) return 0
  const max = dataMax ?? scale.thresholds[scale.thresholds.length - 1]
  return Math.min(value / max, 1)
}

export function buildDataMap(data: DataPoint[]): Map<string, DataPoint> {
  const map = new Map<string, DataPoint>()
  for (const point of data) {
    map.set(point.date, point)
  }
  return map
}
