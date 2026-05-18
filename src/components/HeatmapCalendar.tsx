import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { InteractionManager, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'

import type { HeatmapProps, TooltipData } from '../types'
import { buildDataMap, computeDataRange, mergeColorScale, mergeTheme } from '../utils/colorUtils'
import { buildWeekGrid, getDefaultDateRange, getMonthLabels } from '../utils/dateUtils'
import { DayLabels } from './DayLabels'
import { MonthLabels } from './MonthLabels'
import { Tooltip } from './Tooltip'
import { WeekColumn } from './WeekColumn'

export function HeatmapCalendar({ data, startDate: startDateProp, endDate: endDateProp, color, colorScale: colorScaleProp, theme: themeProp, cellMode = 'solid', colorScheme, autoScale = true, showMonthLabels = true, showDayLabels = true, onDayPress, renderTooltip, renderCell, animated = false, animationDirection = 'rtl', animationDuration = 350, scrollEnabled = true, onEndReached, onEndReachedThreshold = 0.1, tooltipLabel, tooltipEmptyLabel }: HeatmapProps) {
  const [ready, setReady] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => setReady(true))
    return () => handle.cancel()
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

  const handleCellPress = useCallback(
    (date: string, value: number) => {
      const point = dataMap.get(date) ?? null
      const tooltipData: TooltipData = { date, value, metadata: point?.metadata }
      setTooltip((prev) => (prev?.date === date ? null : tooltipData))
      onDayPress?.(point, date)
    },
    [dataMap, onDayPress]
  )

  const dismissTooltip = useCallback(() => {
    setTooltip(null)
  }, [])

  const gridHeight = 7 * theme.cellSize + 6 * theme.gutterSize + (showMonthLabels ? theme.monthLabelHeight : 0)

  return (
    <TouchableWithoutFeedback onPress={dismissTooltip}>
      <View style={[styles.row, { backgroundColor: theme.backgroundColor }]}>
        {showDayLabels && <DayLabels theme={theme} showMonthLabels={showMonthLabels} />}

        <View style={styles.container}>
          <ScrollView horizontal scrollEnabled={scrollEnabled} showsHorizontalScrollIndicator={false} scrollEventThrottle={16} onScroll={handleScroll} style={styles.scrollView}>
            <View style={{ height: gridHeight, transform: [{ scaleX: -1 }] }}>
              {showMonthLabels && <MonthLabels monthLabels={monthLabels} theme={theme} />}
              <View style={styles.row}>{ready && weeks.map((week, i) => <WeekColumn key={i} week={week} dataMap={dataMap} colorScale={colorScale} theme={theme} cellMode={cellMode} autoScale={autoScale} dataRange={dataRange} onCellPress={handleCellPress} animated={animated} renderCell={renderCell} columnIndex={i} totalColumns={weeks.length} animationDirection={animationDirection} animationDuration={animationDuration} selectedDate={tooltip?.date ?? null} />)}</View>
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
