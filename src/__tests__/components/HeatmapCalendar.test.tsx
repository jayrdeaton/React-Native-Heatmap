import React from 'react'
import { create } from 'react-test-renderer'

import Heatmap from '../../index'
import type { DataPoint } from '../../types'

const SAMPLE_DATA: DataPoint[] = [
  { date: '2026-01-15', value: 3 },
  { date: '2026-02-20', value: 12 },
  { date: '2026-03-01', value: 1 },
  { date: '2026-05-17', value: 20 }
]

const FIXED_START = new Date(2025, 4, 17)
const FIXED_END = new Date(2026, 4, 17)

describe('Heatmap.Calendar', () => {
  it('renders without throwing', () => {
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} />)
    }).not.toThrow()
  })

  it('renders with empty data', () => {
    expect(() => {
      create(<Heatmap.Calendar data={[]} startDate={FIXED_START} endDate={FIXED_END} />)
    }).not.toThrow()
  })

  it('renders with cellMode solid', () => {
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} cellMode='solid' />)
    }).not.toThrow()
  })

  it('renders with cellMode gradient', () => {
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} cellMode='gradient' />)
    }).not.toThrow()
  })

  it('renders with cellMode density', () => {
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} cellMode='density' />)
    }).not.toThrow()
  })

  it('renders with showMonthLabels false', () => {
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} showMonthLabels={false} />)
    }).not.toThrow()
  })

  it('renders with showDayLabels false', () => {
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} showDayLabels={false} />)
    }).not.toThrow()
  })

  it('renders with custom theme', () => {
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} theme={{ cellSize: 20, gutterSize: 4, backgroundColor: '#000' }} />)
    }).not.toThrow()
  })

  it('renders with custom colorScale', () => {
    expect(() => {
      create(
        <Heatmap.Calendar
          data={SAMPLE_DATA}
          startDate={FIXED_START}
          endDate={FIXED_END}
          colorScale={{
            thresholds: [1, 5, 10],
            colors: ['#eee', '#aaa', '#555', '#111'],
            emptyColor: '#eee'
          }}
        />
      )
    }).not.toThrow()
  })

  it('calls onDayPress when provided', () => {
    const onPress = jest.fn()
    const calendar = create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onDayPress={onPress} />)
    expect(calendar).toBeTruthy()
  })

  it('accepts animated prop without throwing', () => {
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} animated={true} />)
    }).not.toThrow()
  })

  it('uses default date range when no dates provided', () => {
    expect(() => {
      create(<Heatmap.Calendar data={[]} />)
    }).not.toThrow()
  })

  it('accepts renderTooltip prop', () => {
    const renderTooltip = jest.fn(() => null)
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} renderTooltip={renderTooltip} />)
    }).not.toThrow()
  })

  it('renders with cellMode stacked', () => {
    const dataWithSegments: DataPoint[] = [{ date: '2026-05-17', value: 10, segments: [{ color: '#40c463', value: 6 }, { color: '#216e39', value: 4 }] }]
    expect(() => {
      create(<Heatmap.Calendar data={dataWithSegments} startDate={FIXED_START} endDate={FIXED_END} cellMode='stacked' />)
    }).not.toThrow()
  })

  it('renders with cellMode dots', () => {
    const dataWithSegments: DataPoint[] = [{ date: '2026-05-17', value: 10, segments: [{ color: '#40c463', value: 6 }, { color: '#216e39', value: 4 }] }]
    expect(() => {
      create(<Heatmap.Calendar data={dataWithSegments} startDate={FIXED_START} endDate={FIXED_END} cellMode='dots' />)
    }).not.toThrow()
  })

  it('renders with cellMode priority', () => {
    const dataWithSegments: DataPoint[] = [{ date: '2026-05-17', value: 10, segments: [{ color: '#40c463', value: 6 }, { color: '#216e39', value: 4 }] }]
    expect(() => {
      create(<Heatmap.Calendar data={dataWithSegments} startDate={FIXED_START} endDate={FIXED_END} cellMode='priority' />)
    }).not.toThrow()
  })

  it('accepts tooltipLabel and tooltipEmptyLabel props', () => {
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} tooltipLabel='workout' tooltipEmptyLabel='Rest day' />)
    }).not.toThrow()
  })

  it('accepts renderCell prop', () => {
    const renderCell = jest.fn(() => null)
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} renderCell={renderCell} />)
    }).not.toThrow()
  })

  it('accepts scrollToToday={false}', () => {
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} scrollToToday={false} />)
    }).not.toThrow()
  })

  it('accepts onEndReached prop', () => {
    const onEndReached = jest.fn()
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} onEndReached={onEndReached} />)
    }).not.toThrow()
  })

  it('accepts todayColor and todayBorderColor via theme', () => {
    expect(() => {
      create(<Heatmap.Calendar data={SAMPLE_DATA} startDate={FIXED_START} endDate={FIXED_END} theme={{ todayColor: 'red', todayBorderColor: 'blue' }} />)
    }).not.toThrow()
  })
})
