# Experimental components

These are exported from `@rific/heatmap` today, but intentionally left out of `README.md` — they aren't fully flushed out yet. Not part of the published/announced public API; treat as unstable and subject to change without a major version bump until they're promoted into the README.

This file isn't included in the published npm package (only files listed in `package.json`'s `files` array — plus `README.md`/`LICENSE`, which npm always includes — actually ship).

## Scatter

`Heatmap.Scatter` plots a jittered dot swarm from each `DataPoint`'s `segments`, instead of a day grid. It's a lightweight way to visualize the composition of multi-category data over time in a small space.

```tsx
import Heatmap from '@rific/heatmap'

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

<Heatmap.Scatter data={data} width={320} height={160} />
```

Each segment's `value` becomes that many dots (capped at 50 per segment), colored with the segment's `color`. Dots are placed along the x-axis by date and jittered on the y-axis — deterministically, so the layout is stable across re-renders, not a precise chart. **Points with no `segments` (or an empty array) are skipped entirely** — `Heatmap.Scatter` has nothing to plot for a bare `{ date, value }` point.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `DataPoint[]` | required | Same shape as `Heatmap.Calendar`. Only points with a non-empty `segments` array are plotted. |
| `startDate` | `Date` | 1 year ago | First day included in the plot. |
| `endDate` | `Date` | Today | Last day included in the plot. |
| `width` | `number` | `300` | SVG canvas width, in pixels. |
| `height` | `number` | `150` | SVG canvas height, in pixels. |
| `dotRadius` | `number` | `2` | Radius of each dot, in pixels. |

## Timeline

`Heatmap.Timeline` is a horizontally pannable, pinch-to-zoomable strip of colored cells bucketed by day, hour, or minute — the bucket granularity switches automatically based on zoom level, so zooming in on a day reveals its hours, and zooming into an hour reveals its minutes.

```tsx
import Heatmap from '@rific/heatmap'

const data = [
  { timestamp: '2026-05-01T09:00:00Z', value: 4 },
  { timestamp: '2026-05-01T14:30:00Z', value: 12 },
  { timestamp: '2026-05-02T08:15:00Z', value: 2 },
]

<Heatmap.Timeline
  data={data}
  onTimePress={(bucket) => console.log(bucket.startTime, bucket.granularity, bucket.value)}
/>
```

Pan (drag) and pinch-to-zoom are built in, with momentum scrolling on release. Tapping a cell without dragging fires `onTimePress` with the tapped bucket.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `TimelineDataPoint[]` | required | Array of `{ timestamp, value, color?, metadata? }`. `timestamp` is an ISO date string. |
| `startTime` | `Date` | inferred from `data` | First moment shown. |
| `endTime` | `Date` | inferred from `data` | Last moment shown. |
| `zoom` | `number` | `20` | Pixels per hour. Higher zooms in. Clamped between `minZoom` and `maxZoom`, and adjustable by the user via pinch. |
| `minZoom` | `number` | `0.5` | Minimum zoom reachable by pinch-out. |
| `maxZoom` | `number` | `2000` | Maximum zoom reachable by pinch-in. |
| `color` | `string` | — | Single accent color. Overrides the default color scale, same as `Heatmap.Calendar`. |
| `colorScale` | `Partial<ColorScale>` | auto | Thresholds and colors used to shade cells. |
| `colorScheme` | `'light' \| 'dark'` | — | Switch between built-in light and dark palettes. |
| `theme` | `Partial<TimelineTheme>` | `{ height: 60, labelHeight: 20, backgroundColor: 'transparent', labelColor: '#57606a', emptyColor: '#ebedf0' }` | Overrides merge onto the default (dark `colorScheme` swaps `labelColor`/`emptyColor` defaults). |
| `onZoomChange` | `(zoom: number) => void` | — | Called after a pinch gesture changes the zoom level. |
| `onTimePress` | `(bucket: TimeBucket) => void` | — | Called on tap (not drag) with `{ startTime, endTime, granularity, value }` for the tapped bucket. |

## TypeScript

```ts
import Heatmap, {
  type ScatterProps,
  type TimeBucket,
  type TimelineDataPoint,
  type TimelineGranularity,
  type TimelineProps,
  type TimelineTheme,
} from '@rific/heatmap'
```
