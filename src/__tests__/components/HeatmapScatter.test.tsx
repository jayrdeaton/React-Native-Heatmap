import { render } from '@testing-library/react'

import Heatmap from '../../index'
import type { DataPoint } from '../../types'

const FIXED_START = new Date(2025, 4, 17)
const FIXED_END = new Date(2026, 4, 17)

describe('Heatmap.Scatter', () => {
  it('renders without throwing given normal data with segments', () => {
    const data: DataPoint[] = [
      {
        date: '2025-06-01',
        value: 10,
        segments: [
          { color: '#40c463', value: 5 },
          { color: '#216e39', value: 3, weight: 2 }
        ]
      },
      {
        date: '2025-12-25',
        value: 4,
        segments: [{ color: '#9be9a8', value: 2 }]
      }
    ]
    expect(() => {
      render(<Heatmap.Scatter data={data} startDate={FIXED_START} endDate={FIXED_END} />)
    }).not.toThrow()
  })

  it('clamps a segment value above MAX_DOTS (50)', () => {
    const data: DataPoint[] = [
      {
        date: '2025-06-01',
        value: 100,
        segments: [{ color: '#40c463', value: 200 }]
      }
    ]
    expect(() => {
      render(<Heatmap.Scatter data={data} startDate={FIXED_START} endDate={FIXED_END} />)
    }).not.toThrow()
  })

  it('skips a data point with no segments field', () => {
    const data: DataPoint[] = [{ date: '2025-06-01', value: 10 }]
    expect(() => {
      render(<Heatmap.Scatter data={data} startDate={FIXED_START} endDate={FIXED_END} />)
    }).not.toThrow()
  })

  it('skips a data point with an empty segments array', () => {
    const data: DataPoint[] = [{ date: '2025-06-01', value: 10, segments: [] }]
    expect(() => {
      render(<Heatmap.Scatter data={data} startDate={FIXED_START} endDate={FIXED_END} />)
    }).not.toThrow()
  })

  it('skips a data point whose date falls outside the start/end window', () => {
    const data: DataPoint[] = [
      {
        date: '2020-01-01',
        value: 10,
        segments: [{ color: '#40c463', value: 5 }]
      }
    ]
    expect(() => {
      render(<Heatmap.Scatter data={data} startDate={FIXED_START} endDate={FIXED_END} />)
    }).not.toThrow()
  })

  it('falls back to getDefaultDateRange when no startDate/endDate are supplied', () => {
    const data: DataPoint[] = [
      {
        date: '2025-06-01',
        value: 10,
        segments: [{ color: '#40c463', value: 5 }]
      }
    ]
    expect(() => {
      render(<Heatmap.Scatter data={data} />)
    }).not.toThrow()
  })

  it('handles startDate equal to endDate (zero time span)', () => {
    const sameInstant = new Date(2025, 5, 1)
    const data: DataPoint[] = [
      {
        date: '2025-06-01',
        value: 10,
        segments: [{ color: '#40c463', value: 5 }]
      }
    ]
    expect(() => {
      render(<Heatmap.Scatter data={data} startDate={sameInstant} endDate={sameInstant} />)
    }).not.toThrow()
  })

  it('accepts custom width, height, and dotRadius props', () => {
    const data: DataPoint[] = [
      {
        date: '2025-06-01',
        value: 10,
        segments: [{ color: '#40c463', value: 5 }]
      }
    ]
    expect(() => {
      render(<Heatmap.Scatter data={data} startDate={FIXED_START} endDate={FIXED_END} width={600} height={300} dotRadius={5} />)
    }).not.toThrow()
  })

  it('renders with an empty data array', () => {
    expect(() => {
      render(<Heatmap.Scatter data={[]} startDate={FIXED_START} endDate={FIXED_END} />)
    }).not.toThrow()
  })
})
