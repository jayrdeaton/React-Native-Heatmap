import { useMemo } from 'react'
import { Pressable as NativePressable, StyleSheet, Text, View } from 'react-native'

import { weekdayInitials } from '../constants'
import type { MonthProps, PressableComponent } from '../types'
import { buildDataMap, computeDataRange, getAutoScaleColor, getColorForValue, getContrastTextColor, mergeColorScale, mergeTheme } from '../utils/colorUtils'
import { buildMonthGrid, formatDisplayDate, formatMonthTitle, getTodayString, shiftMonth } from '../utils/dateUtils'

const ARROW_SIZE = 36

interface ArrowProps {
  direction: 'previous' | 'next'
  disabled: boolean
  color: string
  onPress: () => void
  Pressable: PressableComponent
}

function Arrow({ direction, disabled, color, onPress, Pressable }: ArrowProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole='button' accessibilityLabel={direction === 'previous' ? 'Previous month' : 'Next month'} accessibilityState={{ disabled }} style={[styles.arrow, disabled && styles.dimmed]}>
      <View style={[styles.chevron, { borderColor: color }, direction === 'previous' ? styles.chevronPrevious : styles.chevronNext]} />
    </Pressable>
  )
}

// A month of dates, each on its day's color from the same scale as .Calendar, so a particular date is easy to find
// and the busy days still show. Only the weeks the month needs (five for most), or six with fixedWeeks.
export function HeatmapMonth({ data, month, onMonthChange, minDate, maxDate, selectedDate, onDayPress, weekStartsOn = 0, fixedWeeks = false, color, colorScale: colorScaleProp, colorScheme, theme: themeProp, autoScale = true, valueLabel = 'event', textStyle, pressable }: MonthProps) {
  const Pressable = pressable ?? NativePressable
  const colorScale = useMemo(() => mergeColorScale(colorScaleProp, colorScheme, color), [colorScaleProp, colorScheme, color])
  const theme = useMemo(() => mergeTheme(themeProp, colorScheme), [themeProp, colorScheme])
  const dataMap = useMemo(() => buildDataMap(data), [data])
  const dataRange = useMemo(() => (autoScale ? computeDataRange(data) : undefined), [autoScale, data])
  const weeks = useMemo(() => buildMonthGrid(month, weekStartsOn, fixedWeeks), [month, weekStartsOn, fixedWeeks])
  const weekdays = Array.from({ length: 7 }, (_, i) => weekdayInitials[(weekStartsOn + i) % 7])
  const today = getTodayString()

  const { backgroundColor, cellRadius, dayLabelColor, gutterSize, monthLabelColor, selectedBorderColor, todayBorderColor } = theme
  const gap = gutterSize / 2

  const renderDay = (date: string, i: number) => {
    if (!date) return <View key={i} style={[styles.cell, { margin: gap }]} />

    const point = dataMap.get(date)
    const value = point?.value ?? 0
    const segments = point?.segments
    const effectiveValue = segments && segments.length > 0 ? segments.reduce((acc, s) => acc + s.value * (s.weight ?? 1), 0) : value
    const fill = point?.color ?? (dataRange ? getAutoScaleColor(effectiveValue, dataRange.min, dataRange.max, colorScale) : getColorForValue(effectiveValue, colorScale))
    const inRange = (!minDate || date >= minDate) && (!maxDate || date <= maxDate)
    const isSelected = date === selectedDate
    const isToday = date === today
    // A selection outranks today, as on .Calendar
    const borderColor = isSelected ? selectedBorderColor : isToday ? todayBorderColor : 'transparent'
    const count = value === 0 ? `no ${valueLabel}s` : `${value} ${value === 1 ? valueLabel : `${valueLabel}s`}`

    return (
      <Pressable key={date} onPress={() => onDayPress?.(point ?? null, date)} disabled={!inRange || !onDayPress} accessibilityRole='button' accessibilityLabel={`${formatDisplayDate(date)}: ${count}${isToday ? ', today' : ''}`} accessibilityState={{ disabled: !inRange || !onDayPress, selected: isSelected }} style={({ pressed }) => [styles.cell, styles.day, { backgroundColor: fill, borderColor, borderRadius: cellRadius, margin: gap }, !inRange && styles.dimmed, pressed && styles.pressed]}>
        <Text style={[styles.date, textStyle, { color: getContrastTextColor(fill, colorScheme) }, isToday && styles.today]}>{Number(date.slice(8))}</Text>
      </Pressable>
    )
  }

  return (
    <View style={{ backgroundColor }}>
      <View style={styles.header}>
        {onMonthChange && <Arrow direction='previous' disabled={!!minDate && month <= minDate.slice(0, 7)} color={monthLabelColor} onPress={() => onMonthChange(shiftMonth(month, -1))} Pressable={Pressable} />}
        <Text style={[styles.title, textStyle, { color: monthLabelColor }]}>{formatMonthTitle(month)}</Text>
        {onMonthChange && <Arrow direction='next' disabled={!!maxDate && month >= maxDate.slice(0, 7)} color={monthLabelColor} onPress={() => onMonthChange(shiftMonth(month, 1))} Pressable={Pressable} />}
      </View>
      <View style={styles.week}>
        {weekdays.map((weekday, i) => (
          <Text key={i} style={[styles.weekday, textStyle, { color: dayLabelColor, marginHorizontal: gap }]}>
            {weekday}
          </Text>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((date, i) => renderDay(date, w * 7 + i))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  arrow: { alignItems: 'center', height: ARROW_SIZE, justifyContent: 'center', width: ARROW_SIZE },
  cell: { aspectRatio: 1, flex: 1 },
  // Two sides of a square, turned to point; nudged toward the open side, since the point carries the weight
  chevron: { borderBottomWidth: 2, borderLeftWidth: 2, height: 9, width: 9 },
  chevronNext: { marginRight: 3, transform: [{ rotate: '-135deg' }] },
  chevronPrevious: { marginLeft: 3, transform: [{ rotate: '45deg' }] },
  date: { fontSize: 13, lineHeight: 18 },
  // Every day carries an outline's width of border, so outlining the selected day doesn't shift its date
  day: { alignItems: 'center', borderWidth: 1.5, justifyContent: 'center' },
  dimmed: { opacity: 0.3 },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 4 },
  pressed: { opacity: 0.6 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20, textAlign: 'center' },
  today: { fontWeight: '700' },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, fontSize: 11, lineHeight: 16, marginBottom: 2, textAlign: 'center' }
})
