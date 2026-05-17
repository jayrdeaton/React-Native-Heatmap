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

function parseHex(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  const full =
    c.length === 3
      ? c
          .split('')
          .map((x) => x + x)
          .join('')
      : c
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
}

function interpolateColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseHex(a)
  const [r2, g2, b2] = parseHex(b)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const bl = Math.round(b1 + (b2 - b1) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}

export function getAutoScaleColor(value: number | undefined, min: number, max: number, scale: ColorScale): string {
  if (value === undefined || value === 0) return scale.emptyColor ?? scale.colors[0]
  const nonEmptyColors = scale.colors.slice(1)
  if (nonEmptyColors.length === 0) return scale.colors[0]
  if (min === max) return nonEmptyColors[nonEmptyColors.length - 1]
  const normalized = (value - min) / (max - min)
  const position = normalized * (nonEmptyColors.length - 1)
  const lo = Math.floor(position)
  const hi = Math.min(lo + 1, nonEmptyColors.length - 1)
  return interpolateColor(nonEmptyColors[lo], nonEmptyColors[hi], position - lo)
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
