import { Fragment, useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import type { GridProps } from '../types'
import { mergeColorScale, mergeGridTheme } from '../utils/colorUtils'
import { buildGridCells, getCellLabel, getGridLabel, type GridCell } from '../utils/gridUtils'

// A single row's cells are bars this tall unless the theme says otherwise; several rows are square
const SINGLE_ROW_HEIGHT = 10

// Taller than a bar to the touch, so a thin one can still be pressed
const BAR_HIT_SLOP = { top: 8, bottom: 8 }

// Rows and columns of cells, each a local minute, hour or day ending with the one under way, as heat from the same
// color scale as .Calendar. One row is a pulse line for a list row or a card; 7 by 24 hours a week by hour; 7 rows of
// days filled down columns, .Calendar's shape. Static unless onCellPress is given.
export function HeatmapGrid({ data, rows = 1, columns = 30, granularity = 'day', fillDirection = 'row', align, weekStartsOn = 0, endTime, color, colorScale: colorScaleProp, colorScheme, autoScale = true, theme: themeProp, marks, pendingBefore, onCellPress, valueLabel = 'event', accessibilityLabel, style }: GridProps) {
  const colorScale = useMemo(() => mergeColorScale(colorScaleProp, colorScheme, color), [colorScaleProp, colorScheme, color])
  const theme = useMemo(() => mergeGridTheme(themeProp, colorScheme), [themeProp, colorScheme])
  const grid = buildGridCells({ data, rows, columns, granularity, fillDirection, align, weekStartsOn, end: endTime ?? new Date(), colorScale, autoScale, marks, markColor: theme.markColor, pendingBefore })

  const { backgroundColor, cellHeight = rows === 1 ? SINGLE_ROW_HEIGHT : undefined, cellRadius, gap, markGap, markHeight, pendingColor = colorScale.colors[colorScale.colors.length - 1] } = theme
  const shape = cellHeight === undefined ? styles.square : { height: cellHeight }
  const look = (cell: GridCell | null) => [styles.cell, shape, { borderRadius: cellRadius }, cell?.pending ? [styles.pending, { borderColor: pendingColor }] : { backgroundColor: cell?.fill ?? undefined }]

  return (
    <View style={[{ backgroundColor }, style]} accessible={!onCellPress} accessibilityLabel={onCellPress ? undefined : (accessibilityLabel ?? getGridLabel(grid, granularity, valueLabel))}>
      {grid.map((row, r) => (
        <Fragment key={r}>
          <View style={[styles.row, { gap }, r > 0 && { marginTop: gap }]}>{row.map((cell, c) => (cell && onCellPress ? <Pressable key={c} onPress={() => onCellPress(cell.bucket)} hitSlop={rows === 1 ? BAR_HIT_SLOP : undefined} accessibilityRole='button' accessibilityLabel={getCellLabel(cell, valueLabel)} style={({ pressed }) => [look(cell), pressed && styles.pressed]} /> : <View key={c} style={look(cell)} />))}</View>
          {/* The cells and their marks share one grid, so a mark sits under its cell */}
          {marks && (
            <View style={[styles.row, { gap, marginTop: markGap }]}>
              {row.map((cell, c) => (
                <View key={c} style={[styles.cell, { backgroundColor: cell?.mark ?? 'transparent', borderRadius: cellRadius, height: markHeight }]} />
              ))}
            </View>
          )}
        </Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  cell: { flex: 1 },
  pending: { borderWidth: 1 },
  pressed: { opacity: 0.6 },
  row: { flexDirection: 'row' },
  square: { aspectRatio: 1 }
})
