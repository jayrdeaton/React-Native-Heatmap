import React from 'react'

const stub = ({ children }: { children?: React.ReactNode }) => children ?? null

module.exports = {
  __esModule: true,
  default: stub,
  Svg: stub,
  Rect: () => null,
  Circle: () => null,
  Defs: stub,
  RadialGradient: stub,
  Stop: () => null
}
