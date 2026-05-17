import React, { useCallback, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'

import type { HeatmapCalendarProps, TooltipData } from '../types'
import { buildDataMap, mergeColorScale, mergeTheme } from '../utils/colorUtils'
import { buildWeekGrid, getDefaultDateRange, getMonthLabels } from '../utils/dateUtils'
import { DayLabels } from './DayLabels'
import { MonthLabels } from './MonthLabels'
import { Tooltip } from './Tooltip'
import { WeekColumn } from './WeekColumn'

export function HeatmapCalendar({ data, startDate: startDateProp, endDate: endDateProp, colorScale: colorScaleProp, theme: themeProp, cellMode = 'solid', showMonthLabels = true, showDayLabels = true, onDayPress, renderTooltip }: HeatmapCalendarProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const { startDate, endDate } = useMemo(() => {
    const defaults = getDefaultDateRange()
    return {
      startDate: startDateProp ?? defaults.startDate,
      endDate: endDateProp ?? defaults.endDate
    }
  }, [startDateProp, endDateProp])

  const colorScale = useMemo(() => mergeColorScale(colorScaleProp), [colorScaleProp])
  const theme = useMemo(() => mergeTheme(themeProp), [themeProp])
  const dataMap = useMemo(() => buildDataMap(data), [data])
  const weeks = useMemo(() => buildWeekGrid(startDate, endDate), [startDate, endDate])
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks])

  const handleCellPress = useCallback(
    (date: string, value: number) => {
      const point = dataMap.get(date) ?? null
      const tooltipData: TooltipData = {
        date,
        value,
        metadata: point?.metadata
      }
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
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.backgroundColor
          }
        ]}
      >
        {showDayLabels && <DayLabels theme={theme} showMonthLabels={showMonthLabels} />}

        <View style={styles.container}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEventThrottle={16}>
            <View style={{ height: gridHeight }}>
              {showMonthLabels && <MonthLabels monthLabels={monthLabels} theme={theme} />}
              <View style={styles.row}>
                {weeks.map((week, i) => (
                  <WeekColumn key={i} week={week} dataMap={dataMap} colorScale={colorScale} theme={theme} cellMode={cellMode} onCellPress={handleCellPress} />
                ))}
              </View>
            </View>
          </ScrollView>

          <Tooltip visible={tooltip !== null} data={tooltip} theme={theme} renderTooltip={renderTooltip} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  row: { flexDirection: 'row' }
})
