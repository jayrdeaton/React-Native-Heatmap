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
