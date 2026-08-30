# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

# @rific/heatmap

GitHub-style activity heatmap for React Native — SVG-rendered calendar grid with six cell visual modes, tooltips, and animations, plus two experimental extras (jittered scatter plot, pan/pinch-zoomable timeline).

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
  index.ts                        - public exports: default `Heatmap` object (.Calendar/.Scatter/.Timeline) + type-only exports
  types.ts                        - every prop/data type: DataPoint, Segment, ColorScale, HeatmapTheme, HeatmapProps, ScatterProps,
                                     TimelineDataPoint, TimeBucket, TimelineTheme, TimelineProps, TooltipData, CellMode, TimelineGranularity
  constants/
    index.ts                      - month/day label arrays, default light/dark accent colors, default light/dark HeatmapTheme objects
  components/
    HeatmapCalendar.tsx           - public .Calendar: year grid, horizontal scroll + onEndReached, tooltip state, month/day labels
    HeatmapCell.tsx                - one SVG cell; renders all six cellMode variants (solid/gradient/density/stacked/dots/priority),
                                     press/pulse/data-fade animations via RN's built-in Animated API
    WeekColumn.tsx                 - one 7-day week of cells; resolves each day's color/segments/today/selected state
    DayLabels.tsx                  - Mon/Wed/Fri row labels
    MonthLabels.tsx                - month-name labels positioned by week index
    Tooltip.tsx                    - floating tooltip above a pressed cell, or the caller's renderTooltip
    HeatmapScatter.tsx             - public .Scatter (experimental, see EXPERIMENTAL.md): deterministic jittered dot swarm from segments
    HeatmapTimeline.tsx            - public .Timeline (experimental, see EXPERIMENTAL.md): pan/pinch-zoomable bucketed strip,
                                     hand-rolled PanResponder built once in a run-once layout effect (see in-file comments on why)
  utils/
    colorUtils.ts                  - color scale generation/merging, threshold + auto-scale (interpolated) color lookup, theme merging
    dateUtils.ts                   - date string parse/format, week-grid building, month-label placement, default 1-year date range
    timeUtils.ts                   - zoom<->granularity math, time bucketing, time-label formatting for .Timeline
  __mocks__/
    react-native.ts                - jest mock: View fires onLayout once; Pressable/TouchableWithoutFeedback/ScrollView render as real
                                     clickable/scrollable divs; Animated/Easing/StyleSheet/PanResponder/InteractionManager/Platform stubs
    react-native-svg.ts             - jest mock: every SVG primitive stubbed to a passthrough or null
  __tests__/
    components/*.test.tsx          - HeatmapCalendar, HeatmapCell, HeatmapScatter, HeatmapTimeline, Tooltip, WeekColumn
    utils/*.test.ts                 - colorUtils, dateUtils, timeUtils
```

`EXPERIMENTAL.md` documents `Scatter`/`Timeline`: exported today but intentionally left out of `README.md` and treated as unstable (no major-bump guarantee) until promoted. It isn't part of the published npm package itself — only `dist`, `src` (minus `__tests__`/`__mocks__`), `README.md`, and `LICENSE` ship (see `package.json`'s `files` array).

## Public API

From `src/index.ts` — a single default export, no named value exports:

```ts
import Heatmap, {
  type CellMode,
  type ColorScale,
  type DataPoint,
  type HeatmapProps,
  type HeatmapTheme,
  type ScatterProps,
  type TimeBucket,
  type TimelineDataPoint,
  type TimelineGranularity,
  type TimelineProps,
  type TimelineTheme,
  type TooltipData
} from '@rific/heatmap'
```

`Heatmap` is `{ Calendar: HeatmapCalendar, Scatter: HeatmapScatter, Timeline: HeatmapTimeline }`.

## Peer Dependencies

- `react` >=19.0.0 — required
- `react-native` >=0.76.0 — required
- `react-native-svg` >=15.0.0 — required (all three cell-rendering components draw with it)

No optional peer dependencies.

## Testing

- Framework: Jest via `@infinitetoken/jest-config/react-native` (jsdom `testEnvironment`), `@testing-library/react`
- Mocks: `src/__mocks__/react-native.ts`, `src/__mocks__/react-native-svg.ts` — wired in `jest.config.cjs`'s `moduleNameMapper`
- 182 tests across 9 suites (6 component suites + 3 util suites), all passing as of this writing
- `jest.config.cjs` overrides `coverageThreshold` below the fleet's 70% global default (branches 55 / functions 50 / lines 53 / statements 53) — the in-file comment records the real measured coverage this was set from (2026-08-30) and why; re-measure with `npx jest --coverage` before assuming a bump is safe, since a threshold edit alone can't distinguish "genuinely relaxed" from "silently disabled"
- When adding new component or util behavior, add a corresponding test case

## Code Style

Enforced by ESLint + Prettier — run `npm run lint` before finishing any task. `eslint.config.cjs` is a bare `require('@infinitetoken/eslint-config/react-native')` — no local overrides; `tsconfig.json` only adds `include`/`exclude` on top of `@infinitetoken/tsconfig/react-native`.

**Prettier config** (`@infinitetoken/eslint-config/prettier`):
- Single quotes, JSX single quotes
- No semicolons
- No trailing commas
- Print width: 1000 (effectively disabled)

**ESLint rules (warnings unless noted):**
- `simple-import-sort` — imports and exports must be sorted
- `react-native/no-inline-styles`, `react-native/no-unused-styles`
- `no-console` — no console statements
- `@typescript-eslint/no-unused-vars` — `varsIgnorePattern`/`argsIgnorePattern`/`caughtErrorsIgnorePattern` all `^_` (unused bindings prefixed `_` are allowed)
- `@typescript-eslint/no-explicit-any` — off inside `__tests__/`/`__mocks__/` (still linted otherwise, just permitted `any` for fixtures/mocking)
- `react-hooks/rules-of-hooks` — error, not a warning
- `react-hooks/exhaustive-deps`, `react-hooks/refs`, `react-hooks/immutability`, `react-hooks/preserve-manual-memoization`, `react-hooks/set-state-in-effect`
- `package-json/order-properties`, `package-json/sort-collections` — on `package.json` itself
