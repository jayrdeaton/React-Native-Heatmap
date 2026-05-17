# react-native-heatmap

GitHub-style activity heatmap for React Native. SVG cells with multiple visualization modes, touch tooltips, animations, and a flexible color scale API.

## Installation

```sh
npm install @rific/react-native-heatmap
```

### Peer dependencies

```sh
npm install react-native-svg
```

Follow the [react-native-svg installation guide](https://github.com/software-mansion/react-native-svg) to link the native module.

## Usage

```tsx
import Heatmap from '@rific/react-native-heatmap'

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
| `color` | `string` | — | Single accent color. Overrides the default color scale. |
| `colorScheme` | `'light' \| 'dark'` | — | Switch between built-in light and dark palettes. |
| `autoScale` | `boolean` | `true` | Scale cell intensity relative to the max value in `data`. |
| `theme` | `Partial<HeatmapTheme>` | See below | Size, spacing, and color overrides. |
| `showMonthLabels` | `boolean` | `true` | Show month name labels above the grid. |
| `showDayLabels` | `boolean` | `true` | Show Mon / Wed / Fri labels on the left. |
| `animated` | `boolean` | `false` | Enable all animations (load ripple, today pulse, press spring). |
| `scrollToToday` | `boolean` | `true` | Scroll to the current week on mount. |
| `scrollEnabled` | `boolean` | `true` | Enable or disable horizontal scrolling. |
| `onDayPress` | `(point: DataPoint \| null, date: string) => void` | — | Called when a cell is tapped. |
| `onEndReached` | `() => void` | — | Called when the user scrolls near the right edge. Use for infinite scroll. |
| `onEndReachedThreshold` | `number` | `0.1` | Fraction of total width from the right edge that triggers `onEndReached`. |
| `renderTooltip` | `(data: TooltipData) => ReactNode` | — | Replace the default tooltip with a custom component. |
| `renderCell` | `(data: DataPoint \| null, date: string) => ReactNode` | — | Replace the default cell with a custom component. |
| `tooltipLabel` | `string` | `'event'` | Unit label in the default tooltip. Pluralized automatically (e.g. `'workout'` → `'3 workouts'`). |
| `tooltipEmptyLabel` | `string` | `'No events'` | Label shown in the tooltip for days with no data. |

## Cell modes

### `solid` (default)
Each cell is a flat colored rectangle, identical to the GitHub contribution graph.

### `gradient`
A radial gradient blooms from the center of each cell — dim at the center, full color at the edges.

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

Pass `animated` to enable all animations. No extra dependencies — uses the built-in `Animated` API.

```tsx
<Heatmap.Calendar data={data} animated />
```

- **Load ripple** — cells fade and scale in on mount, radiating outward from today's column.
- **Today pulse** — the current day cell breathes with a looping scale animation.
- **Press spring** — cells scale down on press and spring back on release.

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
    todayColor: '#4183c4',
    todayBorderColor: '#4183c4',
  }}
/>
```

## Custom tooltip

```tsx
<Heatmap.Calendar
  data={data}
  renderTooltip={({ date, value }) => (
    <View style={styles.tooltip}>
      <Text>{date} — {value} events</Text>
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

## TypeScript

All types are exported:

```ts
import Heatmap, { type CellMode, type ColorScale, type DataPoint, type HeatmapProps, type HeatmapTheme, type TooltipData } from '@rific/react-native-heatmap'
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
