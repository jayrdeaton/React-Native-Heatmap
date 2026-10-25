import { Pressable, type PressableProps } from 'react-native'

// Stands in for @rific/feedback-press's Pressable, which the package never imports: each touch-down that does something
// (onPress or onLongPress set) is noted in `feedback`, as its haptic, before the host's own onPressIn runs, and every other
// prop goes on to React Native's (mocked) Pressable unchanged. Not a suite itself (Jest runs only *.test.ts(x))
export const feedback = jest.fn()

export const FeedbackPressable = ({ onPressIn, ...props }: PressableProps) => (
  <Pressable
    {...props}
    onPressIn={(event) => {
      if (props.onPress || props.onLongPress) feedback()
      onPressIn?.(event)
    }}
  />
)
