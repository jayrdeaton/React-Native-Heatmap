# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

# @rific/heatmap

GitHub-style activity heatmap for React Native - SVG-rendered calendar grid with six cell visual modes, tooltips, and animations, a month calendar of dates and a static grid of minute, hour or day cells (a one-row strip, a week by hour, the calendar's shape) on the same color scale, plus two experimental extras (jittered scatter plot, pan/pinch-zoomable timeline).

Part of the `@rific`/`@tastic` package ecosystem. Published at https://www.npmjs.com/package/@rific/heatmap.

## Commands

```bash
npm run lint         # ESLint check
npm run fix           # ESLint --fix
npm run typecheck     # tsc --noEmit
npm test               # Jest
npm run test:watch    # Jest watch mode
npm run build          # tsup -> dist/ (CJS + ESM + .d.ts)
npm run build:watch   # tsup --watch
npm run verify          # lint + test + typecheck + build, in that order
```

Always run `npm run lint` before finishing any task.

## Release

Tag-based, using npm trusted publishing (OIDC, no token required):

```bash
npm run release:patch   # npm version patch && npm run release (or release:minor / release:major)
```

`release` itself is `git push --follow-tags`. `preversion` runs `npm run verify` first; `prepublishOnly` runs `npm run build`. The `publish.yml` workflow fires on `v*` tags and delegates to the shared reusable workflow (`infinitetoken/Workflows/.github/workflows/npm-publish.yml@v1`) with `id-token: write` permission for OIDC trusted publishing.

## Architecture

`package.json`'s `"react-native"` export points straight at `src/index.ts`, so Metro resolves the TS source directly at dev time with no build step; `dist/` (CJS + ESM + `.d.ts`, via tsup) is what plain-npm/non-Metro consumers get.

```
src/
  index.ts                        - public exports: default `Heatmap` object (.Calendar/.Grid/.Month/.Scatter/.Timeline) + type-only exports
  types.ts                        - every prop/data type: DataPoint, Segment, ColorScale, HeatmapTheme, HeatmapProps, MonthProps, GridProps, GridTheme, ScatterProps,
                                     TimelineDataPoint, TimeBucket, TimelineTheme, TimelineProps, TooltipData, CellMode, TimelineGranularity,
                                     PressableComponent (the injected pressable's type)
  constants/
    index.ts                      - month/day label arrays, weekday initials, default light/dark accent colors, default light/dark HeatmapTheme
                                     and GridTheme objects
  components/
    HeatmapCalendar.tsx           - public .Calendar: year grid, horizontal scroll + onEndReached, month/day labels, the selected day
                                     (its own, or the host's with selectedDate, taps then only reported) and the tooltip drawn from it;
                                     draws the cells after the first idle moment (requestIdleCallback, setTimeout where it's missing);
                                     the whole calendar is a Pressable (pressable or React Native's) that clears the selection
    HeatmapCell.tsx                - one SVG cell; renders all six cellMode variants (solid/gradient/density/stacked/dots/priority),
                                     press/pulse/data-fade animations via RN's built-in Animated API
    WeekColumn.tsx                 - one 7-day week of cells; resolves each day's color/segments/today/selected state
    DayLabels.tsx                  - Mon/Wed/Fri row labels
    MonthLabels.tsx                - month-name labels positioned by week index
    Tooltip.tsx                    - floating tooltip above a pressed cell, or the caller's renderTooltip
    HeatmapMonth.tsx               - public .Month: one month of dates, only the weeks it needs or six with fixedWeeks (plain Views
                                     and Pressables, no SVG), each day on its color from .Calendar's scale, date text by contrast;
                                     controlled month, arrows bounded by minDate/maxDate, selectedDate outlined, weekStartsOn
    HeatmapGrid.tsx                - public .Grid: rows by columns of local minute, hour or day cells ending at endTime, filled across
                                     or down; flex bars in one row, square cells in several; heat scaled from zero (as .Timeline);
                                     marks as tick rows, pending cells hollow, plain Views unless onCellPress makes each a Pressable
    HeatmapScatter.tsx             - public .Scatter (experimental, see EXPERIMENTAL.md): deterministic jittered dot swarm from segments
    HeatmapTimeline.tsx            - public .Timeline (experimental, see EXPERIMENTAL.md): pan/pinch-zoomable bucketed strip,
                                     hand-rolled PanResponder built once in a run-once layout effect (see in-file comments on why)
  utils/
    colorUtils.ts                  - color scale generation/merging, threshold + auto-scale (interpolated) color lookup, theme merging,
                                     near-black/near-white text by WCAG contrast (getContrastTextColor), GridTheme merging
    dateUtils.ts                   - date string parse/format, week-grid building, month-label placement, default 1-year date range,
                                     .Month's month grid (its weeks, or six with fixedWeeks), month shifting and titles
    timeUtils.ts                   - zoom<->granularity math, time bucketing on the local clock, bucket stepping,
                                     time-label formatting for .Timeline, bucket labels for .Grid
    gridUtils.ts                   - .Grid's cells (window, alignment, blanks, fill, pending, mark) and its accessibility labels,
                                     kept pure so the tests can read the colors the mocks don't render
    layoutUtils.ts                 - cellPadding/cellPitch: the one step everything lined up with the cells uses (grid height, day
                                     rows, month labels, each cell's own margins)
  __mocks__/
    react-native.ts                - jest mock: View fires onLayout once; Pressable/ScrollView render as real clickable/scrollable divs
                                     (Pressable's accessibilityState.selected as aria-selected; a press stops at the innermost one, as React
                                     Native's responder does); Animated/Easing/StyleSheet/PanResponder/Platform stubs
    react-native-svg.ts             - jest mock: every SVG primitive stubbed to a passthrough or null
  __tests__/
    components/*.test.tsx          - HeatmapCalendar, HeatmapCell, HeatmapGrid, HeatmapMonth, HeatmapScatter, HeatmapTimeline, Tooltip,
                                     WeekColumn
    feedbackPressable.tsx          - not a suite: a stand-in for @rific/feedback-press's Pressable, for the pressable tests
    utils/*.test.ts                 - colorUtils, dateUtils, timeUtils, layoutUtils, gridUtils
```

`EXPERIMENTAL.md` documents `Scatter`/`Timeline`: exported today but intentionally left out of `README.md` and treated as unstable (no major-bump guarantee) until promoted. It isn't part of the published npm package itself - only `dist`, `src` (minus `__tests__`/`__mocks__`), `README.md`, and `LICENSE` ship (see `package.json`'s `files` array).

## Public API

From `src/index.ts` - a single default export, no named value exports:

```ts
import Heatmap, {
  type CellMode,
  type ColorScale,
  type DataPoint,
  type HeatmapProps,
  type HeatmapTheme,
  type GridProps,
  type GridTheme,
  type MonthProps,
  type ScatterProps,
  type TimeBucket,
  type TimelineDataPoint,
  type TimelineGranularity,
  type TimelineProps,
  type TimelineTheme,
  type TooltipData
} from '@rific/heatmap'
```

`Heatmap` is `{ Calendar: HeatmapCalendar, Grid: HeatmapGrid, Month: HeatmapMonth, Scatter: HeatmapScatter, Timeline: HeatmapTimeline }`.

## Peer Dependencies

- `react` >=19.0.0 - required
- `react-native` >=0.76.0 - required
- `react-native-svg` >=15.0.0 - required (`.Calendar`, `.Scatter` and `.Timeline` draw with it; `.Month` and `.Grid` are plain views)

No optional peer dependencies.

## Injected pressable (2026-10-25)

`pressable` on `.Calendar`, `.Month` and `.Grid` (a `PressableComponent`, `React.ComponentType<PressableProps>`) replaces React Native's `Pressable` for every press they draw, so a host can tap through `@rific/feedback-press`'s `Pressable` (a `selection` haptic on touch-down, honoring its provider's toggle), as every other tap in Jay's apps does. Lumber had been calling `useVibration().selection()` in `onDayPress`/`onMonthChange` instead, which fires on release, and gave a tap elsewhere on the calendar nothing. Nothing depends on feedback-press; it's injected, as `@rific/toaster` injects Paper.

- **Per component, not a provider:** the package has no provider, and a host passes it where it presses. Each component resolves `pressable ?? NativePressable` into a local `Pressable`; `.Calendar` hands it down through `WeekColumn` to `HeatmapCell`, and `.Month` to its `Arrow`.
- **The cell's press spring composes:** `HeatmapCell` hands its own `onPressIn`/`onPressOut` to the injected component, which calls them after its own work, so the animation and the haptic both run. Its test checks both.
- **The tap elsewhere:** `.Calendar`'s outer `TouchableWithoutFeedback` became a `Pressable` (the injected one or React Native's) laid out as the row it wrapped, with `onPress` only while a day is selected. A tap with nothing selected did nothing before either, and with feedback-press a press with no `onPress` stays silent, so that tap gives no haptic. Both are accessible by default, as the wrapper was; the calendar's tests find it as the container's first element (`outside`).
- **The mock's Pressable stops a press at the innermost one** (`claim`, on click, mouse down and mouse up), as React Native's responder hands a touch to the deepest Pressable, so a day's press-in doesn't also reach the calendar's.
- Tests: one per component (`pressable` blocks and cases in the Calendar, Cell, Month and Grid suites), through `src/__tests__/feedbackPressable.tsx`, which notes a press-in when the press has `onPress` or `onLongPress`, as feedback-press's gate does, then calls through.

## Testing

- Framework: Jest via `@infinitetoken/jest-config/react-native` (jsdom `testEnvironment`), `@testing-library/react`
- Mocks: `src/__mocks__/react-native.ts`, `src/__mocks__/react-native-svg.ts` - wired in `jest.config.cjs`'s `moduleNameMapper`
- 270 tests across 13 suites (8 component suites + 5 util suites), all passing as of this writing
- `.Month`'s colors can't be read in its component tests (the mock renders no styles), so its fill and text color are pinned through the utils they come from: `getAutoScaleColor`/`getColorForValue` and `getContrastTextColor` in colorUtils.test.ts, the grid in dateUtils.test.ts. Its tests pin today with `jest.useFakeTimers({ now })`
- `.Grid` is the same: without `onCellPress` it's only Views, which the mock renders as nothing, so its windows, alignment, colors, pending cells, marks and labels are pinned in gridUtils.test.ts and the component tests press cells made buttons. The tests build times with local `Date`s (`new Date(2026, 9, 24, 9)`), so they pass in any time zone; checked on 2026-10-24 under `TZ=` Asia/Bangkok, Asia/Kolkata (half hour), America/New_York, Australia/Lord_Howe (half-hour daylight saving) and UTC
- One bucketing, on the device's clock: `bucketStart`/`buildTimeDataMap` start a day at local midnight and an hour at :00 (`setHours`/`setMinutes`), and `shiftBucket` steps days on the calendar, so `.Grid` and `.Timeline` agree with an app that counts local days (Lumber's heatmap once lit Thursday for Friday's 01:22 logs from UTC days). Until 2026-10-24 `.Timeline` floored epoch milliseconds and labeled with `getUTC*`, so on a UTC+7 device its days started at 07:00 and its labels read UTC times; it now steps by `shiftBucket` too, each cell as wide as its real span (a 23 or 25 hour day across a daylight saving change). Its tests pin a tapped hour and a tapped day to local boundaries, and pass under every `TZ=` above
- Every part of `.Calendar` that lines up with the cells steps by `cellPitch` (utils/layoutUtils.ts). Until 2026-10-22 each used `cellSize + gutterSize` while a cell also took `cellPadding` on every side, so with the default theme the grid cut most of Saturday's row off, the day labels slid 2pt a row off their cells and the month labels 4pt a week. The component tests' `react-native` mock renders no styles, so this is pinned by layoutUtils.test.ts; it was checked by eye in Solitaire's web build
- Coverage is collected on every run and held to the fleet's 70% global `coverageThreshold` from `@infinitetoken/jest-config` (no local override in `jest.config.cjs`); real coverage sits far above it (about 99% statements, 96% branches)
- Don't use React Native APIs that 0.88 removed: `InteractionManager` throws an invariant on access in dev and is undefined in production (react-native-web still exports it, so web alone won't catch it). Defer work with the `requestIdleCallback` global instead; jsdom has none, so tests stub it on `globalThis` to cover that path
- When adding new component or util behavior, add a corresponding test case

## Code Style

Enforced by ESLint + Prettier - run `npm run lint` before finishing any task. `eslint.config.cjs` is a bare `require('@infinitetoken/eslint-config/react-native')` - no local overrides; `tsconfig.json` only adds `include`/`exclude` on top of `@infinitetoken/tsconfig/react-native`.

**Prettier config** (`@infinitetoken/eslint-config/prettier`):
- Single quotes, JSX single quotes
- No semicolons
- No trailing commas
- Print width: 1000 (effectively disabled)

**ESLint rules (warnings unless noted):**
- `simple-import-sort` - imports and exports must be sorted
- `react-native/no-inline-styles`, `react-native/no-unused-styles`
- `no-console` - no console statements
- `@typescript-eslint/no-unused-vars` - `varsIgnorePattern`/`argsIgnorePattern`/`caughtErrorsIgnorePattern` all `^_` (unused bindings prefixed `_` are allowed)
- `@typescript-eslint/no-explicit-any` - off inside `__tests__/`/`__mocks__/` (still linted otherwise, just permitted `any` for fixtures/mocking)
- `react-hooks/rules-of-hooks` - error, not a warning
- `react-hooks/exhaustive-deps`, `react-hooks/refs`, `react-hooks/immutability`, `react-hooks/preserve-manual-memoization`, `react-hooks/set-state-in-effect`
- `package-json/order-properties`, `package-json/sort-collections` - on `package.json` itself
