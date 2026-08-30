import { render } from '@testing-library/react'

import { Tooltip } from '../../components/Tooltip'
import type { TooltipData } from '../../types'
import { defaultTheme } from '../../utils/colorUtils'
import { formatDisplayDate } from '../../utils/dateUtils'

const SAMPLE_DATA: TooltipData = { date: '2026-03-15', value: 3 }

describe('Tooltip', () => {
  it('renders nothing when visible is false', () => {
    const { container } = render(<Tooltip visible={false} data={SAMPLE_DATA} theme={defaultTheme} />)
    expect(container.textContent).toBe('')
  })

  it('renders nothing when data is null', () => {
    const { container } = render(<Tooltip visible={true} data={null} theme={defaultTheme} />)
    expect(container.textContent).toBe('')
  })

  it('renders nothing when visible is false even with data present', () => {
    const { container } = render(<Tooltip visible={false} data={null} theme={defaultTheme} />)
    expect(container.textContent).toBe('')
  })

  it('renders the default markup with formatted date and count when visible with data', () => {
    const { container } = render(<Tooltip visible={true} data={SAMPLE_DATA} theme={defaultTheme} />)
    expect(container.textContent).toContain(formatDisplayDate(SAMPLE_DATA.date))
    expect(container.textContent).toContain('3 events')
  })

  it('uses the singular tooltipLabel when value is 1', () => {
    const singularData: TooltipData = { date: '2026-03-15', value: 1 }
    const { container } = render(<Tooltip visible={true} data={singularData} theme={defaultTheme} />)
    expect(container.textContent).toContain('1 event')
    expect(container.textContent).not.toContain('1 events')
  })

  it('uses the pluralized tooltipLabel when value is greater than 1', () => {
    const pluralData: TooltipData = { date: '2026-03-15', value: 3 }
    const { container } = render(<Tooltip visible={true} data={pluralData} theme={defaultTheme} />)
    expect(container.textContent).toContain('3 events')
  })

  it('uses tooltipEmptyLabel instead of a count when value is 0', () => {
    const emptyData: TooltipData = { date: '2026-03-15', value: 0 }
    const { container } = render(<Tooltip visible={true} data={emptyData} theme={defaultTheme} />)
    expect(container.textContent).toContain('No events')
    expect(container.textContent).not.toContain('0 event')
  })

  it('applies a custom tooltipLabel', () => {
    const { container } = render(<Tooltip visible={true} data={SAMPLE_DATA} theme={defaultTheme} tooltipLabel='workout' />)
    expect(container.textContent).toContain('3 workouts')
  })

  it('applies a custom singular tooltipLabel without pluralizing', () => {
    const singularData: TooltipData = { date: '2026-03-15', value: 1 }
    const { container } = render(<Tooltip visible={true} data={singularData} theme={defaultTheme} tooltipLabel='workout' />)
    expect(container.textContent).toContain('1 workout')
    expect(container.textContent).not.toContain('1 workouts')
  })

  it('applies a custom tooltipEmptyLabel', () => {
    const emptyData: TooltipData = { date: '2026-03-15', value: 0 }
    const { container } = render(<Tooltip visible={true} data={emptyData} theme={defaultTheme} tooltipEmptyLabel='Rest day' />)
    expect(container.textContent).toContain('Rest day')
  })

  it('calls renderTooltip with data and renders its return value instead of the default markup', () => {
    const renderTooltip = jest.fn(() => <>custom marker text</>)
    const { container } = render(<Tooltip visible={true} data={SAMPLE_DATA} theme={defaultTheme} renderTooltip={renderTooltip} />)
    expect(renderTooltip).toHaveBeenCalledWith(SAMPLE_DATA)
    expect(container.textContent).toBe('custom marker text')
    expect(container.textContent).not.toContain(formatDisplayDate(SAMPLE_DATA.date))
  })

  it('does not call renderTooltip when visible is false', () => {
    const renderTooltip = jest.fn(() => <>custom marker text</>)
    render(<Tooltip visible={false} data={SAMPLE_DATA} theme={defaultTheme} renderTooltip={renderTooltip} />)
    expect(renderTooltip).not.toHaveBeenCalled()
  })
})
