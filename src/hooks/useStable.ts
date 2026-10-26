import { useState } from 'react'

// The last value handed in, for as long as each new one is equal to it. A host building its data afresh each render
// (data={days.map(...)} reads naturally, and the React Compiler can drop a host's own memo around it) would otherwise
// rebuild everything memoized on it, and redraw every cell drawn from it, on every render. Kept in state rather than a
// ref, since a ref read during render is what the compiler can't follow: a new value sets it during render, which
// React retries at once
export function useStable<T>(value: T, equal: (a: T, b: T) => boolean): T {
  const [kept, setKept] = useState(value)
  if (value === kept || equal(kept, value)) return kept
  setKept(value)
  return value
}
