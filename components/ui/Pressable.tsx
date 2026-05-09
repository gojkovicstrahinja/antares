import React, { useRef } from 'react';
import {
  Animated, TouchableOpacity, Platform,
  ViewStyle, StyleProp, GestureResponderEvent,
} from 'react-native';

interface PressableProps {
  onPress?: (e?: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  disabled?: boolean;
  pressScale?: number;
  hoverScale?: number;
  accessibilityLabel?: string;
  activeOpacity?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Pressable({
  onPress,
  style,
  children,
  disabled,
  pressScale = 0.965,
  hoverScale = 1.018,
  accessibilityLabel,
  activeOpacity = 1,
}: PressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isHovered = useRef(false);

  const spring = (toValue: number, bounce = false) =>
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: bounce ? 25 : 50,
      bounciness: bounce ? 5 : 0,
    }).start();

  const timing = (toValue: number) =>
    Animated.timing(scale, {
      toValue,
      duration: 160,
      useNativeDriver: true,
    }).start();

  const webProps = Platform.OS === 'web'
    ? {
        onMouseEnter: () => { isHovered.current = true; timing(hoverScale); },
        onMouseLeave: () => { isHovered.current = false; timing(1); },
      }
    : {};

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={() => spring(pressScale)}
      onPressOut={() => spring(isHovered.current ? hoverScale : 1, true)}
      disabled={disabled}
      activeOpacity={activeOpacity}
      accessibilityLabel={accessibilityLabel}
      style={[style, { transform: [{ scale }] }]}
      {...webProps}
    >
      {children}
    </AnimatedTouchable>
  );
}
