import type { ColorScale, DataPoint } from '../../types'
import { buildDataMap, defaultColorScale, defaultTheme, getColorForValue, getContrastTextColor, getNormalizedValue, mergeColorScale, mergeTheme } from '../../utils/colorUtils'

describe('defaultColorScale', () => {
  it('has 4 thresholds and 5 colors', () => {
    expect(defaultColorScale.thresholds).toHaveLength(4)
    expect(defaultColorScale.colors).toHaveLength(5)
  })

  it('thresholds are in ascending order', () => {
    const { thresholds } = defaultColorScale
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1])
    }
  })
})

describe('getColorForValue', () => {
  const scale: ColorScale = {
    thresholds: [1, 4, 8, 16],
    colors: ['#empty', '#low', '#mid', '#high', '#max'],
    emptyColor: '#empty'
  }

  it('returns emptyColor for undefined', () => {
    expect(getColorForValue(undefined, scale)).toBe('#empty')
  })

  it('returns emptyColor for 0', () => {
    expect(getColorForValue(0, scale)).toBe('#empty')
  })

  it('returns first color for value below first threshold (< 1)', () => {
    // value 0 returns empty; any positive value >= 1 returns low
    expect(getColorForValue(1, scale)).toBe('#low')
  })

  it('maps values to correct threshold buckets', () => {
    expect(getColorForValue(1, scale)).toBe('#low')
    expect(getColorForValue(3, scale)).toBe('#low')
    expect(getColorForValue(4, scale)).toBe('#mid')
    expect(getColorForValue(7, scale)).toBe('#mid')
    expect(getColorForValue(8, scale)).toBe('#high')
    expect(getColorForValue(15, scale)).toBe('#high')
    expect(getColorForValue(16, scale)).toBe('#max')
    expect(getColorForValue(100, scale)).toBe('#max')
  })

  it('returns colors[0] for a positive value below every threshold', () => {
    const customScale: ColorScale = {
      thresholds: [5, 10],
      colors: ['#empty', '#low', '#high']
    }
    expect(getColorForValue(2, customScale)).toBe('#empty')
  })

  it('works with the default color scale', () => {
    expect(getColorForValue(0, defaultColorScale)).toBe(defaultColorScale.emptyColor)
    expect(getColorForValue(1, defaultColorScale)).toBe(defaultColorScale.colors[1])
    expect(getColorForValue(16, defaultColorScale)).toBe(defaultColorScale.colors[4])
  })
})

describe('getNormalizedValue', () => {
  const scale: ColorScale = {
    thresholds: [1, 4, 8, 16],
    colors: ['#a', '#b', '#c', '#d', '#e'],
    emptyColor: '#a'
  }

  it('returns 0 for undefined', () => {
    expect(getNormalizedValue(undefined, scale)).toBe(0)
  })

  it('returns 0 for 0', () => {
    expect(getNormalizedValue(0, scale)).toBe(0)
  })

  it('returns 1 for max threshold value', () => {
    expect(getNormalizedValue(16, scale)).toBe(1)
  })

  it('clamps to 1 for values above max threshold', () => {
    expect(getNormalizedValue(100, scale)).toBe(1)
  })

  it('returns fractional value between 0 and 1 for mid-range values', () => {
    const n = getNormalizedValue(8, scale)
    expect(n).toBeGreaterThan(0)
    expect(n).toBeLessThan(1)
    expect(n).toBeCloseTo(0.5)
  })
})

describe('buildDataMap', () => {
  const data: DataPoint[] = [
    { date: '2026-01-01', value: 5 },
    { date: '2026-01-02', value: 10 },
    { date: '2026-01-03', value: 0 }
  ]

  it('returns a Map with the correct size', () => {
    const map = buildDataMap(data)
    expect(map.size).toBe(3)
  })

  it('keys are date strings', () => {
    const map = buildDataMap(data)
    expect(map.has('2026-01-01')).toBe(true)
    expect(map.has('2026-01-02')).toBe(true)
    expect(map.has('2026-01-03')).toBe(true)
  })

  it('values match the original data points', () => {
    const map = buildDataMap(data)
    expect(map.get('2026-01-01')).toEqual({ date: '2026-01-01', value: 5 })
    expect(map.get('2026-01-02')).toEqual({ date: '2026-01-02', value: 10 })
  })

  it('returns undefined for dates not in data', () => {
    const map = buildDataMap(data)
    expect(map.get('2026-12-31')).toBeUndefined()
  })

  it('returns an empty Map for empty input', () => {
    expect(buildDataMap([]).size).toBe(0)
  })

  it('last entry wins for duplicate dates', () => {
    const dupes: DataPoint[] = [
      { date: '2026-01-01', value: 1 },
      { date: '2026-01-01', value: 99 }
    ]
    const map = buildDataMap(dupes)
    expect(map.get('2026-01-01')?.value).toBe(99)
  })
})

describe('mergeColorScale', () => {
  it('returns defaults when called with no args', () => {
    const merged = mergeColorScale()
    expect(merged).toEqual(defaultColorScale)
  })

  it('overrides only the provided fields', () => {
    const merged = mergeColorScale({ emptyColor: '#fff' })
    expect(merged.emptyColor).toBe('#fff')
    expect(merged.thresholds).toEqual(defaultColorScale.thresholds)
    expect(merged.colors).toEqual(defaultColorScale.colors)
  })
})

describe('mergeTheme', () => {
  it('returns defaults when called with no args', () => {
    expect(mergeTheme()).toEqual(defaultTheme)
  })

  it('overrides only the provided fields', () => {
    const merged = mergeTheme({ cellSize: 20 })
    expect(merged.cellSize).toBe(20)
    expect(merged.gutterSize).toBe(defaultTheme.gutterSize)
  })
})

describe('getContrastTextColor', () => {
  it('picks near-black on light backgrounds and near-white on dark ones', () => {
    expect(getContrastTextColor('#ffffff')).toBe('#0f0f0f')
    expect(getContrastTextColor('#ebedf0')).toBe('#0f0f0f')
    expect(getContrastTextColor('#000000')).toBe('#f0f0f0')
    expect(getContrastTextColor('#0d1117')).toBe('#f0f0f0')
  })

  it('weighs channels by how bright they look, not by their sum', () => {
    // Tailwind blue-500 and green-500 read better with dark text, blue-900 and red-700 with light
    expect(getContrastTextColor('#3b82f6')).toBe('#0f0f0f')
    expect(getContrastTextColor('#22c55e')).toBe('#0f0f0f')
    expect(getContrastTextColor('#1e3a8a')).toBe('#f0f0f0')
    expect(getContrastTextColor('#b91c1c')).toBe('#f0f0f0')
  })

  it('reads 3 digit hex', () => {
    expect(getContrastTextColor('#fff')).toBe('#0f0f0f')
    expect(getContrastTextColor('#000')).toBe('#f0f0f0')
  })

  it("falls back to the colorScheme's text for a background it can't read", () => {
    expect(getContrastTextColor('transparent')).toBe('#0f0f0f')
    expect(getContrastTextColor('transparent', 'light')).toBe('#0f0f0f')
    expect(getContrastTextColor('transparent', 'dark')).toBe('#f0f0f0')
    expect(getContrastTextColor('rgba(0, 0, 0, 0.5)', 'dark')).toBe('#f0f0f0')
  })
})
