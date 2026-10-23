import { defaultDarkColor, defaultDarkTheme, defaultLightColor, defaultTheme } from '../constants'
import type { ColorScale, DataPoint, HeatmapTheme } from '../types'

export { defaultDarkTheme, defaultTheme }

export function generateColorScale(baseColor: string, colorScheme: 'light' | 'dark' = 'light'): ColorScale {
  const anchor = colorScheme === 'dark' ? '#0d1117' : '#ffffff'
  const emptyColor = interpolateColor(anchor, baseColor, 0.07)
  const colors = [emptyColor, interpolateColor(anchor, baseColor, 0.25), interpolateColor(anchor, baseColor, 0.5), interpolateColor(anchor, baseColor, 0.75), baseColor]
  return { thresholds: [1, 4, 8, 16], colors, emptyColor }
}

export function mergeColorScale(partial?: Partial<ColorScale>, colorScheme?: 'light' | 'dark', color?: string): ColorScale {
  const baseColor = color || (colorScheme === 'dark' ? defaultDarkColor : defaultLightColor)
  const base = generateColorScale(baseColor, colorScheme ?? 'light')
  return { ...base, ...partial }
}

export const defaultColorScale = generateColorScale(defaultLightColor, 'light')

export function mergeTheme(partial?: Partial<HeatmapTheme>, colorScheme?: 'light' | 'dark'): HeatmapTheme {
  const base = colorScheme === 'dark' ? defaultDarkTheme : defaultTheme
  return { ...base, ...partial }
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
  if (!hex) return [0, 0, 0]
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

const nearBlack = '#0f0f0f'
const nearWhite = '#f0f0f0'
const readableHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

// WCAG relative luminance
function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Near-black or near-white, whichever has more WCAG contrast on the background. A background that isn't 3 or 6 digit
 * hex (such as 'transparent') can't be read, so it gets the one that reads on the colorScheme's own background. */
export function getContrastTextColor(background: string, colorScheme?: 'light' | 'dark'): string {
  if (!readableHex.test(background)) return colorScheme === 'dark' ? nearWhite : nearBlack
  const l = luminance(background)
  const lightContrast = (luminance(nearWhite) + 0.05) / (l + 0.05)
  const darkContrast = (l + 0.05) / (luminance(nearBlack) + 0.05)
  return lightContrast >= darkContrast ? nearWhite : nearBlack
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
