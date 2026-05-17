import React from 'react'

const stub = ({ children }: { children?: React.ReactNode }) => children ?? null

const StyleSheet = {
  create: <T extends object>(styles: T): T => styles,
  flatten: (style: unknown) => style
}

module.exports = {
  View: stub,
  Text: stub,
  ScrollView: stub,
  TouchableOpacity: stub,
  TouchableWithoutFeedback: stub,
  StyleSheet,
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios ?? obj.default }
}
