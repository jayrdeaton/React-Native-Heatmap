import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'

import type { HeatmapProps, TooltipData } from '../types'
import { buildDataMap, computeDataRange, mergeColorScale, mergeTheme } from '../utils/colorUtils'
import { buildWeekGrid, getDefaultDateRange, getMonthLabels } from '../utils/dateUtils'
import { cellPitch } from '../utils/layoutUtils'
import { DayLabels } from './DayLabels'
import { MonthLabels } from './MonthLabels'
import { Tooltip } from './Tooltip'
import { WeekColumn } from './WeekColumn'

export function HeatmapCalendar({ data, startDate: startDateProp, endDate: endDateProp, color, colorScale: colorScaleProp, theme: themeProp, cellMode = 'solid', colorScheme, autoScale = true, showMonthLabels = true, showDayLabels = true, onDayPress, onSelectionChange, selectedDate: selectedDateProp, renderTooltip, renderCell, animated = false, animationDirection = 'rtl', animationDuration = 350, scrollEnabled = true, onEndReached, onEndReachedThreshold = 0.1, tooltipLabel, tooltipEmptyLabel }: HeatmapProps) {
  const [ready, setReady] = useState(false)
  const [ownSelectedDate, setOwnSelectedDate] = useState<string | null>(null)
  // A host passing selectedDate owns the selection; otherwise the calendar keeps its own
  const controlled = selectedDateProp !== undefined
  const selectedDate = controlled ? selectedDateProp : ownSelectedDate

  // Draws the grid after the first idle moment so mounting stays cheap. requestIdleCallback
  // replaces InteractionManager (removed from React Native 0.88); Safari on web doesn't ship
  // it, so a zero-delay timeout stands in there.
  useEffect(() => {
    if (typeof requestIdleCallback === 'function') {
      const handle = requestIdleCallback(() => setReady(true))
      return () => cancelIdleCallback(handle)
    }
    const handle = setTimeout(() => setReady(true), 0)
    return () => clearTimeout(handle)
  }, [])

  const { startDate, endDate } = useMemo(() => {
    const defaults = getDefaultDateRange()
    return {
      startDate: startDateProp ?? defaults.startDate,
      endDate: endDateProp ?? defaults.endDate
    }
  }, [startDateProp, endDateProp])

  const colorScale = useMemo(() => mergeColorScale(colorScaleProp, colorScheme, color), [colorScaleProp, colorScheme, color])
  const theme = useMemo(() => mergeTheme(themeProp, colorScheme), [themeProp, colorScheme])
  const dataMap = useMemo(() => buildDataMap(data), [data])
  const dataRange = useMemo(() => (autoScale ? computeDataRange(data) : undefined), [autoScale, data])
  const weeks = useMemo(() => buildWeekGrid(startDate, endDate), [startDate, endDate])
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks])

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number }; contentSize: { width: number }; layoutMeasurement: { width: number } } }) => {
      if (!onEndReached) return
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
      const distanceFromEnd = contentSize.width - layoutMeasurement.width - contentOffset.x
      const threshold = contentSize.width * onEndReachedThreshold
      if (distanceFromEnd <= threshold) onEndReached()
    },
    [onEndReached, onEndReachedThreshold]
  )

  // The tooltip shows the selected day as the data has it now, so it follows new data and a host's selection alike
  const tooltip = useMemo<TooltipData | null>(() => {
    if (!selectedDate) return null
    const point = dataMap.get(selectedDate)
    return { date: selectedDate, value: point?.value ?? 0, metadata: point?.metadata }
  }, [selectedDate, dataMap])

  // A tap asks for a day (or null). Controlled, the host hears it and decides; otherwise the calendar takes it
  const select = useCallback(
    (date: string | null) => {
      if (date === selectedDate) return
      if (controlled) onSelectionChange?.(date)
      else setOwnSelectedDate(date)
    },
    [controlled, selectedDate, onSelectionChange]
  )

  const handleCellPress = useCallback(
    (date: string) => {
      select(selectedDate === date ? null : date)
      onDayPress?.(dataMap.get(date) ?? null, date)
    },
    [select, selectedDate, dataMap, onDayPress]
  )

  const dismissTooltip = useCallback(() => select(null), [select])

  // Uncontrolled, the selection is reported from the state itself, so every way it changes (a tap, a second tap, a tap
  // elsewhere) is told once, and a host passing a new callback each render isn't told again
  const reportedDateRef = useRef<string | null>(null)
  useEffect(() => {
    if (controlled || ownSelectedDate === reportedDateRef.current) return
    reportedDateRef.current = ownSelectedDate
    onSelectionChange?.(ownSelectedDate)
  }, [controlled, ownSelectedDate, onSelectionChange])

  const gridHeight = 7 * cellPitch(theme.cellSize, theme.gutterSize) + (showMonthLabels ? theme.monthLabelHeight : 0)

  return (
    <TouchableWithoutFeedback onPress={dismissTooltip}>
      <View style={[styles.row, { backgroundColor: theme.backgroundColor }]}>
        {showDayLabels && <DayLabels theme={theme} showMonthLabels={showMonthLabels} />}

        <View style={styles.container}>
          <ScrollView horizontal scrollEnabled={scrollEnabled} showsHorizontalScrollIndicator={false} scrollEventThrottle={16} onScroll={handleScroll} style={styles.scrollView}>
            <View style={{ height: gridHeight, transform: [{ scaleX: -1 }] }}>
              {showMonthLabels && <MonthLabels monthLabels={monthLabels} theme={theme} />}
              <View style={styles.row}>{ready && weeks.map((week, i) => <WeekColumn key={i} week={week} dataMap={dataMap} colorScale={colorScale} theme={theme} cellMode={cellMode} autoScale={autoScale} dataRange={dataRange} onCellPress={handleCellPress} animated={animated} renderCell={renderCell} columnIndex={i} totalColumns={weeks.length} animationDirection={animationDirection} animationDuration={animationDuration} selectedDate={selectedDate} />)}</View>
            </View>
          </ScrollView>

          <Tooltip visible={tooltip !== null} data={tooltip} theme={theme} renderTooltip={renderTooltip} tooltipLabel={tooltipLabel} tooltipEmptyLabel={tooltipEmptyLabel} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  row: { flexDirection: 'row' },
  scrollView: { transform: [{ scaleX: -1 }] }
})
