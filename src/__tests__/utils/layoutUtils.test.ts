import { cellPadding, cellPitch } from '../../utils/layoutUtils'

// Every part of the calendar that lines up with its cells steps by one pitch: a cell's square, its padding, and whatever of the
// gutter the padding doesn't already make.
describe('layoutUtils', () => {
  it('pads each square by 12% of its size, rounded up', () => {
    expect(cellPadding(14)).toBe(2)
    expect(cellPadding(8)).toBe(1)
    expect(cellPadding(20)).toBe(3)
  })

  it('steps by the square and its padding when the gutter is no wider than the padding makes', () => {
    // The default theme: a 14pt square, 2pt of padding a side, a 2pt gutter. Laid out as 14 + 2 it cut most of a row off.
    expect(cellPitch(14, 2)).toBe(18)
    expect(cellPitch(14, 4)).toBe(18)
  })

  it('makes up the rest of a wider gutter', () => {
    expect(cellPitch(14, 6)).toBe(20)
  })
})
