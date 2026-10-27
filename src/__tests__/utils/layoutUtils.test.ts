import { cellPadding, cellPitch, waveStep } from '../../utils/layoutUtils'

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

  it('waits a tenth of animationDuration a column, unless the wave would then take over 1.2 durations to cross the weeks in view', () => {
    expect(waveStep(350)).toBe(35)
    expect(waveStep(350, 1)).toBe(35)
    // A phone's 13 weeks: 12 steps of 35ms are exactly the 420ms
    expect(waveStep(350, 13)).toBe(35)
    // A wide window's 45 cross in the same 420ms, not 1.5s
    expect(waveStep(350, 45)).toBeCloseTo(420 / 44)
    expect(waveStep(200, 45)).toBeCloseTo(240 / 44)
  })
})
