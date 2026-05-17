import React from 'react'

const stub = ({ children }: { children?: React.ReactNode }) => children ?? null

export default stub
export const Svg = stub
export const Defs = stub
export const RadialGradient = stub
export const Rect = () => null
export const Circle = () => null
export const Stop = () => null
