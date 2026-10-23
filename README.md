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
| `data` | `DataPoint[]` | required | Array of `{ date, value }` objects. `date` is `YYYY-MM-DD`. |
| `startDate` | `Date` | 1 year ago | First day shown on the grid. |
| `endDate` | `Date` | Today | Last day shown on the grid. |
| `cellMode` | `'solid' \| 'gradient' \| 'density' \| 'stacked' \| 'dots' \| 'priority'` | `'solid'` | Visual style of each cell. |
| `colorScale` | `Partial<ColorScale>` | GitHub greens | Thresholds and colors used to shade cells. |
| `color` | `string` | - | Single accent color. Overrides the default color scale. |
| `colorScheme` | `'light' \| 'dark'` | - | Switch between built-in light and dark palettes. |
| `autoScale` | `boolean` | `true` | Scale cell intensity relative to the max value in `data`. |
| `theme` | `Partial<HeatmapTheme>` | See below | Size, spacing, and color overrides. |
| `showMonthLabels` | `boolean` | `true` | Show month name labels above the grid. |
| `showDayLabels` | `boolean` | `true` | Show Mon / Wed / Fri labels on the left. |
| `animated` | `boolean` | `false` | Enable all animations (load ripple, today pulse, press spring). |
| `scrollEnabled` | `boolean` | `true` | Enable or disable horizontal scrolling. |
| `onDayPress` | `(point: DataPoint \| null, date: string) => void` | - | Called when a cell is tapped. |
| `onSelectionChange` | `(date: string \| null) => void` | - | Called when the selected day (outlined, tooltip open) changes, with `null` once a second tap or a tap elsewhere clears it. For showing something about the selected day. |
| `onEndReached` | `() => void` | - | Called when the user scrolls near the right edge. Use for infinite scroll. |
| `onEndReachedThreshold` | `number` | `0.1` | Fraction of total width from the right edge that triggers `onEndReached`. |
| `renderTooltip` | `(data: TooltipData) => ReactNode` | - | Replace the default tooltip with a custom component. |
| `renderCell` | `(data: DataPoint \| null, date: string) => ReactNode` | - | Replace the default cell with a custom component. |
| `tooltipLabel` | `string` | `'event'` | Unit label in the default tooltip. Pluralized automatically (e.g. `'workout'` → `'3 workouts'`). |
| `tooltipEmptyLabel` | `string` | `'No events'` | Label shown in the tooltip for days with no data. |

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

- **Load ripple**: cells fade and scale in on mount, radiating outward from today's column.
- **Today pulse**: the current day cell breathes with a looping scale animation. It's also outlined in `todayBorderColor`; set that to `'transparent'` to mark today by the pulse alone. The day whose tooltip is open is outlined in `selectedBorderColor`, today included.
- **Press spring**: cells scale down on press and spring back on release.

The current day always receives a border indicator regardless of the `animated` prop.

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

## TypeScript

Types for the documented API are exported:

```ts
import Heatmap, {
  type CellMode,
  type ColorScale,
  type DataPoint,
  type HeatmapProps,
  type HeatmapTheme,
  type MonthProps,
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
