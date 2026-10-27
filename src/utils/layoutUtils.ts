/** Padding around each cell's square, on every side: room for today's pulse (the square grows to 1.2x) and a touch target a
 * little bigger than the square. */
export function cellPadding(cellSize: number): number {
  return Math.ceil(cellSize * 0.12)
}

/** From one cell's square to the next, across a week or down a day: the square, its padding, and whatever of the gutter the
 * padding doesn't already make. Everything that lines up with the cells (the grid's height, the day and month labels) steps
 * by it. Each of them used cellSize + gutterSize while a cell took its padding as well, so with the default theme the grid
 * cut off most of Saturday's row, the day labels slid 2pt a row off their cells, and the month labels 4pt a week. */
export function cellPitch(cellSize: number, gutterSize: number): number {
  return cellSize + Math.max(gutterSize, 2 * cellPadding(cellSize))
}

/** How long the cells' fade waits per column from where the wave starts: a tenth of animationDuration, 35ms at the
 * default, unless that would take the wave longer than 1.2 animationDurations to cross the columns in view. A phone's 13
 * weeks keep the full step (12 steps of 35ms), and a wide window's 45 cross in the same 420ms rather than 1.5s, so the
 * ripple after a change of data is as quick at any width. Without a count of the columns in view it's the full step. */
export function waveStep(animationDuration: number, visibleColumns = 0): number {
  const step = animationDuration * 0.1
  if (visibleColumns < 2) return step
  return Math.min(step, (animationDuration * 1.2) / (visibleColumns - 1))
}
