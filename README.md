# react-native-heatmap

GitHub-style activity heatmap for React Native. SVG cells with solid, gradient, and density visualization modes, touch tooltips, and a flexible color scale API.

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
| `cellMode` | `'solid' \| 'gradient' \| 'density'` | `'solid'` | Visual style of each cell. |
| `colorScale` | `Partial<ColorScale>` | GitHub greens | Thresholds and colors used to shade cells. |
| `theme` | `Partial<HeatmapTheme>` | See below | Size, spacing, and color overrides. |
| `showMonthLabels` | `boolean` | `true` | Show month name labels above the grid. |
| `showDayLabels` | `boolean` | `true` | Show Mon / Wed / Fri labels on the left. |
| `onDayPress` | `(point: DataPoint \| null, date: string) => void` | — | Called when a cell is tapped. |
| `renderTooltip` | `(data: TooltipData) => ReactNode` | — | Replace the default tooltip with a custom component. |
| `animated` | `boolean` | `false` | Reserved for V2 — accepted but no-op in the current release. |

## Cell modes

### `solid` (default)
Each cell is a flat colored rectangle, identical to the GitHub contribution graph.

### `gradient`
A radial gradient blooms from the center of each cell — dim at the center, full color at the edges.

### `density`
A circle grows inside a neutral background rectangle. A small dot means low activity; a filled square means high activity.

```tsx
<Heatmap.Calendar data={data} cellMode='density' />
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
