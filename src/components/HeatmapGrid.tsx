import { Fragment, memo, useCallback, useLayoutEffect, useMemo, useRef } from 'react'
import { type Insets, Pressable as NativePressable, StyleSheet, View } from 'react-native'

import { useFadeLayers } from '../hooks/useFadeLayers'
import type { GridProps, PressableComponent, TimeBucket } from '../types'
import { mergeColorScale, mergeGridTheme } from '../utils/colorUtils'
import { buildGridCells, getCellLabel, getGridLabel, type GridCell } from '../utils/gridUtils'
import { waveStep } from '../utils/layoutUtils'
import { bucketStart } from '../utils/timeUtils'
import { FadeLayerView } from './FadeLayerView'

// A single row's cells are bars this tall unless the theme says otherwise; several rows are square
const SINGLE_ROW_HEIGHT = 10

// Taller than a bar to the touch, so a thin one can still be pressed
const BAR_HIT_SLOP = { top: 8, bottom: 8 }

// Rows and columns of cells, each a local minute, hour or day ending with the one under way, as heat from the same
// color scale as .Calendar. One row is a pulse line for a list row or a card; 7 by 24 hours a week by hour; 7 rows of
// days filled down columns, .Calendar's shape; 6 rows of hours filled down columns, a day in 4 columns. Static unless
// onCellPress is given.
export function HeatmapGrid({ data, rows = 1, columns = 30, granularity = 'day', fillDirection = 'row', align, weekStartsOn = 0, endTime, color, colorScale: colorScaleProp, colorScheme, autoScale = true, theme: themeProp, marks, pendingBefore, selected, onCellPress, valueLabel = 'event', accessibilityLabel, style, pressable, animated = false, animationDirection = 'rtl', animationDuration = 350 }: GridProps) {
  const Pressable = pressable ?? NativePressable
  const colorScale = useMemo(() => mergeColorScale(colorScaleProp, colorScheme, color), [colorScaleProp, colorScheme, color])
  const theme = useMemo(() => mergeGridTheme(themeProp, colorScheme), [themeProp, colorScheme])
  const grid = buildGridCells({ data, rows, columns, granularity, fillDirection, align, weekStartsOn, end: endTime ?? new Date(), colorScale, autoScale, marks, markColor: theme.markColor, pendingBefore })

  const { backgroundColor, boundaryGap, cellHeight = rows === 1 ? SINGLE_ROW_HEIGHT : undefined, cellRadius, gap, markGap, markHeight, pendingColor = colorScale.colors[colorScale.colors.length - 1], selectedColor } = theme
  const shape = cellHeight === undefined ? styles.square : { height: cellHeight }
  const selectedStart = selected ? bucketStart(selected, granularity).getTime() : null
  const isSelected = (cell: GridCell | null) => cell !== null && cell.bucket.startTime.getTime() === selectedStart

  // A line that opens a new day among lines of a share of one stands apart by boundaryGap: a column, filled down, or a
  // row, filled across. The first line has nothing before it to stand apart from
  const apart = (line: number, first: GridCell | null | undefined) => (line > 0 && boundaryGap > 0 && first?.boundary ? boundaryGap : 0)
  const columnApart = (c: number) => (fillDirection === 'column' ? apart(c, grid[0]?.[c]) : 0)

  // The ripple runs across the columns, every column in view, from the newest by default
  const step = waveStep(animationDuration, columns)
  const delayOf = (c: number) => (animationDirection === 'rtl' ? columns - 1 - c : c) * step

  // A cell's press handler never changes, so an animated cell's memo holds: it reads the press and the buckets as they
  // are at the tap, by the cell's start
  const latestRef = useRef<{ onCellPress?: (bucket: TimeBucket) => void; buckets: Map<number, TimeBucket> }>({ onCellPress, buckets: new Map() })
  useLayoutEffect(() => {
    latestRef.current = { onCellPress, buckets: new Map(grid.flat().flatMap((cell) => (cell ? [[cell.bucket.startTime.getTime(), cell.bucket] as const] : []))) }
  })
  const handlePress = useCallback((start: number) => {
    const bucket = latestRef.current.buckets.get(start)
    if (bucket) latestRef.current.onCellPress?.(bucket)
  }, [])

  const look = (cell: GridCell | null, c: number) => [styles.cell, shape, { borderRadius: cellRadius }, columnApart(c) ? { marginLeft: columnApart(c) } : null, cell?.pending ? [styles.pending, { borderColor: pendingColor }] : { backgroundColor: cell?.fill ?? undefined }]
  const outline = <View style={[styles.fill, styles.selected, { borderRadius: cellRadius, borderColor: selectedColor }]} />

  // Cells are keyed by their time, so when the grid moves on a cell keeps its look (and its fade) as it moves over a column
  const drawCell = (cell: GridCell | null, c: number) => {
    const key = cell ? cell.bucket.startTime.getTime() : `blank-${c}`
    if (cell && animated) return <GridCellView key={key} start={cell.bucket.startTime.getTime()} fill={cell.fill} pending={cell.pending} pendingColor={pendingColor} radius={cellRadius} height={cellHeight} marginLeft={columnApart(c)} selected={isSelected(cell)} selectedColor={selectedColor} delay={delayOf(c)} duration={animationDuration} label={onCellPress ? getCellLabel(cell, valueLabel) : undefined} onPress={onCellPress ? handlePress : undefined} hitSlop={rows === 1 ? BAR_HIT_SLOP : undefined} pressable={Pressable} />
    if (cell && onCellPress)
      return (
        <Pressable key={key} onPress={() => onCellPress(cell.bucket)} hitSlop={rows === 1 ? BAR_HIT_SLOP : undefined} accessibilityRole='button' accessibilityLabel={getCellLabel(cell, valueLabel)} style={({ pressed }) => [look(cell, c), pressed && styles.pressed]}>
          {isSelected(cell) ? outline : null}
        </Pressable>
      )
    return (
      <View key={key} style={look(cell, c)}>
        {isSelected(cell) ? outline : null}
      </View>
    )
  }

  return (
    <View style={[{ backgroundColor }, style]} accessible={!onCellPress} accessibilityLabel={onCellPress ? undefined : (accessibilityLabel ?? getGridLabel(grid, granularity, valueLabel))}>
      {grid.map((row, r) => (
        <Fragment key={r}>
          <View style={[styles.row, { gap }, r > 0 && { marginTop: gap + (fillDirection === 'row' ? apart(r, row[0]) : 0) }]}>{row.map(drawCell)}</View>
          {/* The cells and their marks share one grid, so a mark sits under its cell */}
          {marks && (
            <View style={[styles.row, { gap, marginTop: markGap }]}>
              {row.map((cell, c) => (
                <View key={c} style={[styles.cell, { backgroundColor: cell?.mark ?? 'transparent', borderRadius: cellRadius, height: markHeight }, columnApart(c) ? { marginLeft: columnApart(c) } : null]} />
              ))}
            </View>
          )}
        </Fragment>
      ))}
    </View>
  )
}

interface CellLook {
  fill: string | null
  pending: boolean
}

const sameCellLook = (a: CellLook, b: CellLook) => a.fill === b.fill && a.pending === b.pending
// A hollow pending cell has nothing to blend with, so going to or from one changes at once
const neitherPending = (a: CellLook, b: CellLook) => !a.pending && !b.pending

interface GridCellViewProps {
  start: number
  fill: string | null
  pending: boolean
  pendingColor: string
  radius: number
  /** Undefined for a square cell. */
  height?: number
  marginLeft: number
  selected: boolean
  selectedColor: string
  delay: number
  duration: number
  label?: string
  onPress?: (start: number) => void
  hitSlop?: Insets
  pressable: PressableComponent
}

// An animated grid's cell: its looks stacked as .Calendar's days are (see useFadeLayers), each a fill or a hollow pending
// outline, under the selection's outline, which never fades. Its props are all values, so a grid redrawn with the same
// data redraws none of them
const GridCellView = memo(function GridCellView({ start, fill, pending, pendingColor, radius, height, marginLeft, selected, selectedColor, delay, duration, label, onPress, hitSlop, pressable: Pressable }: GridCellViewProps) {
  const { layers, top } = useFadeLayers<CellLook>({ fill, pending }, { same: sameCellLook, fades: true, delay, duration, canFade: neitherPending })
  const box = [styles.cell, height === undefined ? styles.square : { height }, marginLeft ? { marginLeft } : null]
  const content = (
    <>
      {layers.map((layer) => (
        <FadeLayerView key={layer.id} layer={layer} top={top} style={[styles.fill, { borderRadius: radius }, layer.look.pending ? [styles.pending, { borderColor: pendingColor }] : { backgroundColor: layer.look.fill ?? undefined }]} />
      ))}
      {selected ? <View style={[styles.fill, styles.selected, { borderRadius: radius, borderColor: selectedColor }]} /> : null}
    </>
  )
  if (!onPress) return <View style={box}>{content}</View>
  return (
    <Pressable onPress={() => onPress(start)} hitSlop={hitSlop} accessibilityRole='button' accessibilityLabel={label} style={({ pressed }) => [box, pressed && styles.pressed]}>
      {content}
    </Pressable>
  )
})

const styles = StyleSheet.create({
  cell: { flex: 1 },
  fill: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  pending: { borderWidth: 1 },
  pressed: { opacity: 0.6 },
  row: { flexDirection: 'row' },
  selected: { borderWidth: 1.5 },
  square: { aspectRatio: 1 }
})
