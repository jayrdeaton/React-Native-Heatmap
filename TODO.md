# TODO

## Check the calendar on a device under React Native 0.88

Prepared 2026-10-18: `Heatmap.Calendar` now waits for `requestIdleCallback` (falling back to a zero-delay `setTimeout` where it's missing) instead of `InteractionManager`, which React Native 0.88 removed and which crashed the calendar on iOS and Android. The tests mock `react-native` and run in jsdom, so they never touched 0.88's native idle callbacks. Before relying on it, open an app's detail screen in Lumber (the log heatmap, `src/components/LogHeatmap.tsx`) on iOS in an SDK 58 dev build: the grid should draw right after mount with the load ripple, and tapping a cell should show its tooltip. Check the layout too (2026-10-22, utils/layoutUtils.ts): all seven rows show, the Mon/Wed/Fri labels sit beside their rows, and the month labels over their first week. Solitaire's Stats screen (its `PlayCalendar`) uses the calendar as well.

## React Native 0.88 strict types

Checked 2026-10-18 with only the `react-native` condition (the fleet defers strict types through `@infinitetoken/tsconfig` 0.6): this package's own source has no strict-type errors. Nothing to do here beyond dropping the deferral when `@infinitetoken/tsconfig` does.

## Today is fixed when WeekColumn loads

Noticed 2026-10-26: `WeekColumn.tsx` reads `const todayString = getTodayString()` once, at module load, so after midnight the calendar keeps outlining and pulsing the day the app started on until the JavaScript reloads. A desktop window or a phone app left open overnight shows yesterday as today. `.Month` reads today on every render and doesn't have this. Reading it per render (or passing today down from `.Calendar`, which a host re-rendering after midnight would then move on) would fix it.
