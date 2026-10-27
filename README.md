# @rific/heatmap

GitHub-style activity heatmap for React Native. SVG cells with multiple visualization modes, touch tooltips, animations, and a flexible color scale API.

**[Overview](https://rific.jaydeaton.com/packages/heatmap)**: an info page in the Expo Starter showcase, since this is an optional package with no runnable demo there.

## Installation

```sh
npm install @rific/heatmap
```

### Peer dependencies

```sh
npm install react-native-svg
```

Follow the [react-native-svg installation guide](https://github.com/software-mansion/react-native-svg) to link the native module.

## Usage

```tsx
import Heatmap from '@rific/heatmap'

const data = [
  { date: '2026-01-15', value: 3 },
  { date: '2026-03-08', value: 14 },
  { date: '2026-05-01', value: 7 },
]

export default function App() {
  return (
    <Heatmap.Calendar
      data={data}
      onDayPress={(point, date) => console.log(date, point)}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `DataPoint[]` | required | Array of `{ date, value }` objects. `date` is `YYYY-MM-DD`. Compared by what it says, so data mapped afresh each render keeps the cells already drawn (see [Props made each render](#props-made-each-render)). |
| `startDate` | `Date` | 1 year ago | First day shown on the grid. Only its day counts, not its time. |
| `endDate` | `Date` | Today | Last day shown on the grid, whatever its time. `endDate={new Date()}` is fine: a new Date on the same day doesn't rebuild the grid. |
| `cellMode` | `'solid' \| 'gradient' \| 'density' \| 'stacked' \| 'dots' \| 'priority'` | `'solid'` | Visual style of each cell. |
| `colorScale` | `Partial<ColorScale>` | GitHub greens | Thresholds and colors used to shade cells. |
| `color` | `string` | - | Single accent color. Overrides the default color scale. |
| `colorScheme` | `'light' \| 'dark'` | - | Switch between built-in light and dark palettes. |
| `autoScale` | `boolean` | `true` | Scale cell intensity relative to the max value in `data`. |
| `theme` | `Partial<HeatmapTheme>` | See below | Size, spacing, and color overrides. |
| `showMonthLabels` | `boolean` | `true` | Show month name labels above the grid. |
| `showDayLabels` | `boolean` | `true` | Show Mon / Wed / Fri labels on the left. |
| `animated` | `boolean` | `false` | Enable all animations (the ripple, today pulse, press spring). |
| `animationDirection` | `'ltr' \| 'rtl'` | `'rtl'` | Where the ripple starts: `'rtl'` from the newest week, `'ltr'` from the oldest. |
| `animationDuration` | `number` | `350` | How long one day's fade takes, in ms. The ripple's spread and today's pulse are measured in it. |
| `scrollEnabled` | `boolean` | `true` | Enable or disable horizontal scrolling. |
| `onDayPress` | `(point: DataPoint \| null, date: string) => void` | - | Called when a cell is tapped. |
| `onSelectionChange` | `(date: string \| null) => void` | - | Called when the selected day (outlined, tooltip open) changes, with `null` once a second tap or a tap elsewhere clears it. For showing something about the selected day. With `selectedDate` set, it's the day a tap asks for. |
| `selectedDate` | `string \| null` | - | The selected day, `YYYY-MM-DD`, or `null` for none. Set, the calendar follows it instead of its own taps (which only report through `onSelectionChange`), so you can clear or move the selection from outside, say with a clear button next to what you show for the day. Leave it undefined and the calendar keeps its own. |
| `onEndReached` | `() => void` | - | Called when the user scrolls near the right edge. Use for infinite scroll. |
| `onEndReachedThreshold` | `number` | `0.1` | Fraction of total width from the right edge that triggers `onEndReached`. |
| `renderTooltip` | `(data: TooltipData) => ReactNode` | - | Replace the default tooltip with a custom component. |
| `renderCell` | `(data: DataPoint \| null, date: string) => ReactNode` | - | Replace the default cell with a custom component. |
| `tooltipLabel` | `string` | `'event'` | Unit label in the default tooltip. Pluralized automatically (e.g. `'workout'` → `'3 workouts'`). |
| `tooltipEmptyLabel` | `string` | `'No events'` | Label shown in the tooltip for days with no data. |
| `pressable` | `PressableComponent` | React Native's `Pressable` | Draws every press (each day, and a tap elsewhere that clears the selection) through this instead. See [Your own Pressable](#your-own-pressable-eg-haptics-on-every-tap). |

## Cell modes

### `solid` (default)
Each cell is a flat colored rectangle, identical to the GitHub contribution graph.

### `gradient`
A radial gradient blooms from the center of each cell - dim at the center, full color at the edges.

### `density`
A circle grows inside a neutral background rectangle. A small dot means low activity; a filled square means high activity.

### `stacked`
Horizontal slices represent proportional segments from the `segments` array on each `DataPoint`.

### `dots`
Each segment in the `segments` array is drawn as a dot sized by its relative weight.

### `priority`
The dominant segment's color fills the cell at an opacity proportional to its value.

```tsx
<Heatmap.Calendar data={data} cellMode='density' />
```

## Animations

Pass `animated` to enable all animations. No extra dependencies - uses the built-in `Animated` API.

```tsx
<Heatmap.Calendar data={data} animated />
```

- **Ripple**: when a day's data arrives or changes (new data, a filter, a new busiest day rescaling every shade), its next color fades in over the one it shows, on a delay that grows with each week from where the wave starts (today's column by default), so the change ripples across the calendar and every day passes through the shades between. The wave waits a tenth of `animationDuration` a week, but crosses the weeks in view in at most 1.2 `animationDuration`s, so it's as quick across a wide screen as a phone. A change arriving mid-wave carries on from where each day is, and days the wave hasn't reached keep their old color until it does. It runs natively on iOS and Android and as a CSS animation on web. A day that has data when the calendar first draws shows it at once, and days drawn by `renderCell` change at once.
- **Today pulse**: the current day cell breathes with a looping scale animation, natively on iOS and Android and as a CSS animation on web, so it costs no JavaScript there. It's also outlined in `todayBorderColor`; set that to `'transparent'` to mark today by the pulse alone. The day whose tooltip is open is outlined in `selectedBorderColor`, today included.
- **Press spring**: cells scale down on press and spring back on release.

The current day always receives a border indicator regardless of the `animated` prop.

## Props made each render

A host can make its dates and data afresh on every render without memoizing them, so `endDate={new Date()}` or `data={rows.map(toPoint)}` stays cheap. `Heatmap.Calendar` and `Heatmap.Month` compare them by what they say rather than by identity:

- `startDate` and `endDate` by their days, so any two Dates on the same days draw the same grid.
- `data` point by point, in order: `date`, `value`, `color`, each segment's `color`, `value` and `weight`, and `metadata` one level deep. Equal data keeps what was drawn from it; metadata holding objects made afresh counts as changed.

`Heatmap.Grid` keeps nothing between renders, so it has nothing to compare.

`onDayPress` and `onSelectionChange` can be new functions each render too: a tap calls whichever is newest, and nothing redraws for them. A tap itself redraws only the days whose outline changes.

Other props (`colorScale`, `theme`, `renderCell`) are compared as React compares them, by identity. A new `colorScale` or `theme` each render only reworks each week's colors, but a new `renderCell` redraws every cell, so keep it stable.

## Infinite scroll

```tsx
<Heatmap.Calendar
  data={data}
  startDate={startDate}
  endDate={endDate}
  onEndReached={() => setEndDate(extendedDate)}
  onEndReachedThreshold={0.15}
/>
```

When the user scrolls within `onEndReachedThreshold` of the right edge, `onEndReached` fires. Update `endDate` to append more weeks.

## Segments

For multi-category data, pass a `segments` array on each `DataPoint`. Works with `stacked`, `dots`, and `priority` cell modes.

```tsx
const data = [
  {
    date: '2026-05-01',
    value: 10,
    segments: [
      { color: '#40c463', value: 6 },
      { color: '#216e39', value: 4 },
    ],
  },
]

<Heatmap.Calendar data={data} cellMode='stacked' />
```

## Color scale

```tsx
<Heatmap.Calendar
  data={data}
  colorScale={{
    thresholds: [1, 4, 8, 16],   // 4 thresholds → 5 colors
    colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    emptyColor: '#ebedf0',
  }}
/>
```

Values below the first threshold use `colors[0]`. Values at or above threshold `n` use `colors[n + 1]`. Values above the last threshold use the last color.

## Theme

```tsx
<Heatmap.Calendar
  data={data}
  theme={{
    cellSize: 14,
    cellRadius: 2,
    gutterSize: 2,
    monthLabelColor: '#57606a',
    dayLabelColor: '#57606a',
    backgroundColor: 'transparent',
    tooltipBackgroundColor: '#1b1f23',
    tooltipTextColor: '#ffffff',
    todayBorderColor: '#4183c4',
    selectedBorderColor: '#4183c4',
  }}
/>
```

## Custom tooltip

```tsx
<Heatmap.Calendar
  data={data}
  renderTooltip={({ date, value }) => (
    <View style={styles.tooltip}>
      <Text>{date} - {value} events</Text>
    </View>
  )}
/>
```

## Custom cell

```tsx
<Heatmap.Calendar
  data={data}
  renderCell={(point, date) => (
    <View style={{ width: 14, height: 14, backgroundColor: point ? 'tomato' : '#eee', borderRadius: 2 }} />
  )}
/>
```

## Your own Pressable (e.g. haptics on every tap)

Every tap the package draws goes through React Native's `Pressable`. Pass a drop-in for it as `pressable` on `Heatmap.Calendar`, `Heatmap.Month` or `Heatmap.Grid` and those taps go through yours instead. `@rific/feedback-press`'s `Pressable` gives each one a `selection` haptic on touch-down, honoring its provider's haptics toggle, like every other tap in an app built on it:

```tsx
import { Pressable } from '@rific/feedback-press'

<Heatmap.Calendar data={data} onSelectionChange={setDay} pressable={Pressable} />
<Heatmap.Month data={data} month={month} onMonthChange={setMonth} onDayPress={pickDay} pressable={Pressable} />
```

- **It's handed `Pressable`'s own props** (`onPress`, `onPressIn` and `onPressOut`, a `style` callback for the pressed look, `disabled`, the accessibility props), so it must pass them all on. The package doesn't depend on feedback-press: any component with `Pressable`'s props works.
- **The calendar's press spring still runs:** a day hands its own `onPressIn` and `onPressOut` to your pressable, which calls them after its own work (feedback-press does).
- **What goes through it:** on `Heatmap.Calendar`, each day and the tap elsewhere on the calendar that clears the selection (only a press while a day is selected, so a tap that would do nothing gives no feedback); on `Heatmap.Month`, each day and both arrows; on `Heatmap.Grid`, each cell when `onCellPress` is set. A day or arrow that can't be pressed (outside `minDate`/`maxDate`, or with no handler) is `disabled`, so it gets no press either.
- **A touch that starts a scroll** on the calendar still gets touch-down feedback, as a list row in a scroll view does.

## Month

`Heatmap.Month` draws one month as a calendar of dates, each day on its color from the same scale as `Heatmap.Calendar`. Use it where someone needs a particular date ("last Tuesday") rather than the shape of a whole year, such as a day picker. A month draws only the weeks it needs, five for most and four or six now and then; pass `fixedWeeks` for six every month, so the height never changes as the arrows page through. Days stretch to share the width, so give it a width (a dialog, a column) rather than letting it span a wide screen.

```tsx
import Heatmap from '@rific/heatmap'
import { useState } from 'react'

export default function DayPicker({ data, firstDate, today }) {
  const [month, setMonth] = useState(today.slice(0, 7))
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <Heatmap.Month
      data={data}
      month={month}
      onMonthChange={setMonth}
      minDate={firstDate}
      maxDate={today}
      selectedDate={selected}
      onDayPress={(_, date) => setSelected(date)}
    />
  )
}
```

The month is controlled: `onMonthChange` gets the month an arrow moves to, and the arrows stop at the months of `minDate` and `maxDate`. Days outside those bounds are dimmed and can't be pressed. The selected day is outlined in the theme's `selectedBorderColor` and today in `todayBorderColor` (set it to `'transparent'` to mark today by its bold date alone). Each date is near-black or near-white, whichever reads better on its fill.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `DataPoint[]` | required | Same shape as `Heatmap.Calendar`. A point's `color` replaces its scale color. |
| `month` | `string` | required | The month shown, `YYYY-MM`. |
| `onMonthChange` | `(month: string) => void` | - | Called with the month an arrow moves to. Without it the header has no arrows. |
| `minDate` | `string` | - | First day that can be pressed, `YYYY-MM-DD`. The previous arrow stops at its month. |
| `maxDate` | `string` | - | Last day that can be pressed, `YYYY-MM-DD`. The next arrow stops at its month. |
| `selectedDate` | `string \| null` | - | The day outlined, `YYYY-MM-DD`. |
| `onDayPress` | `(point: DataPoint \| null, date: string) => void` | - | Called when a day is tapped, the same as `Heatmap.Calendar`'s. Without it days can't be pressed. |
| `weekStartsOn` | `0`-`6` | `0` | The weekday each row starts on, `0` for Sunday, `1` for Monday. |
| `fixedWeeks` | `boolean` | `false` | Six weeks for every month, so the height never changes. Otherwise only the weeks the month needs. |
| `color` | `string` | - | Single accent color, as on `Heatmap.Calendar`. |
| `colorScale` | `Partial<ColorScale>` | auto | As on `Heatmap.Calendar`. Its `emptyColor` fills days with no data; `'transparent'` leaves them plain. |
| `colorScheme` | `'light' \| 'dark'` | - | Built-in light or dark palette and theme. |
| `autoScale` | `boolean` | `true` | Scale each day relative to the max value in `data`. Pass only the month's points to scale to the month's busiest day. |
| `theme` | `Partial<HeatmapTheme>` | See [Theme](#theme) | The month uses `cellRadius`, `gutterSize` (the gap between days), `monthLabelColor` (title and arrows), `dayLabelColor` (weekday initials), `backgroundColor`, `selectedBorderColor` and `todayBorderColor`. |
| `valueLabel` | `string` | `'event'` | Unit in each day's accessibility label, pluralized automatically (`'October 12, 2026: 8 logs'`). |
| `textStyle` | `StyleProp<TextStyle>` | - | Applied to the title, weekdays and dates under the month's own colors, for a font family or size. |
| `pressable` | `PressableComponent` | React Native's `Pressable` | Draws each day's and arrow's press through this instead. See [Your own Pressable](#your-own-pressable-eg-haptics-on-every-tap). |

## Grid

`Heatmap.Grid` lays out rows and columns of cells, each covering a minute, hour or day of local time up to now, as heat on the same color scale. You pick the shape and the cell's length:

- **A pulse line**: 1 row of 48 hours (or 60 minutes) for a list row or a card.
- **A week by hour**: 7 rows of 24 hours, each row one day from local midnight.
- **The calendar's shape**: 7 rows of days filled down columns, a column per week.

It's static, so it can sit inside something pressable; give it `onCellPress` to make each cell a button.

```tsx
import Heatmap from '@rific/heatmap'

const data = [
  { timestamp: '2026-10-24T02:00:00.000Z', value: 12 },
  { timestamp: '2026-10-24T03:00:00.000Z', value: 40 },
]

// The last 48 hours, a bar each, with a tick under the hours that crashed
<Heatmap.Grid data={data} columns={48} granularity='hour' color='#3b82f6' marks={crashes} pendingBefore={syncedBackTo} />

// A week by hour
<Heatmap.Grid data={data} rows={7} columns={24} granularity='hour' />

// Twelve weeks of days, filled down columns like Heatmap.Calendar
<Heatmap.Grid data={data} rows={7} columns={12} granularity='day' fillDirection='column' weekStartsOn={1} />
```

Cells are on the device's clock: a day starts at local midnight and an hour at :00. Each point counts toward the cell its `timestamp` falls in, so counts already one per cell map 1:1. The last cell in time is the one under way at `endTime` (now by default); the grid doesn't move on its own, so render it again to move it on.

When each row (or column, filling down) spans exactly an hour of minutes, a day of hours or a week of days, and there's more than one, they're aligned: each starts at :00, local midnight or `weekStartsOn`, and the cells after the one under way stay blank. A single row is never aligned unless you pass `align`, so a 60-minute strip is the last 60 minutes rather than the clock hour; `align={false}` slides a multi-row grid instead.

A single row draws bars `theme.cellHeight` tall (10 by default); several rows draw square cells sharing the width, as `Heatmap.Calendar` fits its cells. With `autoScale` each cell is scaled against the busiest one in view from zero, as `Heatmap.Timeline` does, so a steady stream reads steady.

`marks` puts a tick under each cell holding a point above 0, for the rare thing worth spotting (a crash, a deploy), in the point's `color` or the theme's `markColor`. While `marks` is set, a tick row sits under every row of cells, so the grid keeps its height whether or not anything is marked. `pendingBefore` draws the cells before it hollow, for data still loading: a sync that pages newest first shows its outlines receding into the past.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `TimelineDataPoint[]` | required | Array of `{ timestamp, value }`. `timestamp` is an ISO date string. |
| `rows` | `number` | `1` | Rows of cells. |
| `columns` | `number` | `30` | Columns of cells. |
| `granularity` | `'minute' \| 'hour' \| 'day'` | `'day'` | The time each cell covers. |
| `fillDirection` | `'row' \| 'column'` | `'row'` | Time runs across each row, or down each column. |
| `align` | `boolean` | On for several rows (or columns) | Start each row (or column) on its hour, local midnight or week, when it spans exactly one. |
| `weekStartsOn` | `0`-`6` | `0` | The first day of an aligned week of days, `0` for Sunday. |
| `endTime` | `Date` | Now | The last cell in time is the one under way at this moment. |
| `color` | `string` | - | Single accent color, as on `Heatmap.Calendar`. |
| `colorScale` | `Partial<ColorScale>` | auto | As on `Heatmap.Calendar`. Its `emptyColor` fills cells with nothing in them. |
| `colorScheme` | `'light' \| 'dark'` | - | Built-in light or dark palette and theme. |
| `autoScale` | `boolean` | `true` | Scale against the busiest cell in view, from zero. Otherwise by the scale's thresholds. |
| `theme` | `Partial<GridTheme>` | `{ cellRadius: 2, gap: 2, markHeight: 3, markGap: 2, markColor: '#cf222e', backgroundColor: 'transparent' }` | Sizes and colors. `cellHeight` fixes each cell's height (10 in one row, square in several by default); `pendingColor` outlines pending cells (the scale's top color by default); dark `colorScheme` makes `markColor` `'#f85149'`. |
| `marks` | `TimelineDataPoint[]` | - | A tick under each cell holding a point above 0. Set it (even to `[]`) to reserve the tick rows. |
| `pendingBefore` | `Date` | - | Cells before the one holding this moment are hollow. |
| `onCellPress` | `(bucket: TimeBucket) => void` | - | Makes each cell a button, called with `{ startTime, endTime, granularity, value }`. Without it the grid takes no touches. |
| `valueLabel` | `string` | `'event'` | Unit in the default labels, pluralized automatically (`'Logs in 12 of the last 48 hours'`). |
| `accessibilityLabel` | `string` | Counted from the cells | The grid read as one element. With `onCellPress` each cell is labeled instead (`'October 24, 2026, 09:00: 12 logs'`). |
| `style` | `StyleProp<ViewStyle>` | - | The grid's outer view. |
| `pressable` | `PressableComponent` | React Native's `Pressable` | Draws each cell's press (with `onCellPress`) through this instead. See [Your own Pressable](#your-own-pressable-eg-haptics-on-every-tap). |

## TypeScript

Types for the documented API are exported:

```ts
import Heatmap, {
  type CellMode,
  type ColorScale,
  type DataPoint,
  type GridProps,
  type GridTheme,
  type HeatmapProps,
  type HeatmapTheme,
  type MonthProps,
  type PressableComponent,
  type TimeBucket,
  type TimelineDataPoint,
  type TimelineGranularity,
  type TooltipData,
} from '@rific/heatmap'
```

## Development

```sh
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run fix         # ESLint --fix
npm test            # Jest
npm run test:watch  # Jest watch mode
```

## License

MIT © [Jay Deaton](https://github.com/jayrdeaton)
