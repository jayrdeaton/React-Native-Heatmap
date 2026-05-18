import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InteractionManager, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'

import type { HeatmapProps, TooltipData } from '../types'
import { buildDataMap, computeDataRange, mergeColorScale, mergeTheme } from '../utils/colorUtils'
import { buildWeekGrid, getDefaultDateRange, getMonthLabels, getTodayString } from '../utils/dateUtils'
import { DayLabels } from './DayLabels'
import { MonthLabels } from './MonthLabels'
import { Tooltip } from './Tooltip'
import { WeekColumn } from './WeekColumn'

export function HeatmapCalendar({ data, startDate: startDateProp, endDate: endDateProp, color, colorScale: colorScaleProp, theme: themeProp, cellMode = 'solid', colorScheme, autoScale = true, showMonthLabels = true, showDayLabels = true, onDayPress, renderTooltip, renderCell, animated = false, animationDirection = 'rtl', animationDuration = 350, scrollToToday = true, scrollEnabled = true, onEndReached, onEndReachedThreshold = 0.1, tooltipLabel, tooltipEmptyLabel }: HeatmapProps) {
  const [ready, setReady] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const hasScrolledToToday = useRef(false)

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

  // Scroll to today on mount (once per startDate/endDate change)
  useEffect(() => {
    if (!scrollToToday || !scrollViewRef.current) return
    hasScrolledToToday.current = false
  }, [startDate, endDate, scrollToToday])

  const handleScrollViewLayout = useCallback(() => {
    if (!scrollToToday || hasScrolledToToday.current || !scrollViewRef.current) return
    hasScrolledToToday.current = true

    const todayStr = getTodayString()
    const todayColIndex = weeks.findIndex((week) => week.includes(todayStr))
    if (todayColIndex < 0) return

    const colWidth = theme.cellSize + theme.gutterSize
    const x = todayColIndex * colWidth
    scrollViewRef.current.scrollTo({ x: Math.max(0, x - colWidth * 3), animated: false })
  }, [scrollToToday, weeks, theme.cellSize, theme.gutterSize])

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
          <ScrollView ref={scrollViewRef} horizontal scrollEnabled={scrollEnabled} showsHorizontalScrollIndicator={false} scrollEventThrottle={16} onLayout={handleScrollViewLayout} onScroll={handleScroll}>
            <View style={{ height: gridHeight }}>
              {showMonthLabels && <MonthLabels monthLabels={monthLabels} theme={theme} />}
              <View style={styles.row}>{ready && weeks.map((week, i) => <WeekColumn key={i} week={week} dataMap={dataMap} colorScale={colorScale} theme={theme} cellMode={cellMode} autoScale={autoScale} dataRange={dataRange} onCellPress={handleCellPress} animated={animated} renderCell={renderCell} columnIndex={i} totalColumns={weeks.length} animationDirection={animationDirection} animationDuration={animationDuration} />)}</View>
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
  row: { flexDirection: 'row' }
})
