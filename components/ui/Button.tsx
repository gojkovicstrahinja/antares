import React, { useRef } from 'react';
import {
  Animated, TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isHovered = useRef(false);

  const spring = (toValue: number, bounce = false) =>
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: bounce ? 22 : 50,
      bounciness: bounce ? 6 : 0,
    }).start();

  const timing = (toValue: number) =>
    Animated.timing(scale, {
      toValue,
      duration: 150,
      useNativeDriver: true,
    }).start();

  const webProps = Platform.OS === 'web'
    ? {
        onMouseEnter: () => { isHovered.current = true; timing(1.02); },
        onMouseLeave: () => { isHovered.current = false; timing(1); },
      }
    : {};

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      import('expo-haptics').then(({ impactAsync, ImpactFeedbackStyle }) => {
        impactAsync(ImpactFeedbackStyle.Light);
      }).catch(() => {});
    }
    onPress();
  };

  return (
    <AnimatedTouchable
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}` as keyof typeof styles],
        (disabled || loading) && styles.disabled,
        style,
        { transform: [{ scale }] },
      ]}
      onPress={handlePress}
      onPressIn={() => spring(0.96)}
      onPressOut={() => spring(isHovered.current ? 1.02 : 1, true)}
      disabled={disabled || loading}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={title}
      {...webProps}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.black : Colors.white} size="small" />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}` as keyof typeof styles], styles[`textSize_${size}` as keyof typeof styles], textStyle]}>
          {title}
        </Text>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: Colors.accent },
  secondary: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.error },
  size_sm: { paddingVertical: 8, paddingHorizontal: 16 },
  size_md: { paddingVertical: 14, paddingHorizontal: 24 },
  size_lg: { paddingVertical: 18, paddingHorizontal: 32 },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '700' },
  text_primary: { color: Colors.black },
  text_secondary: { color: Colors.white },
  text_ghost: { color: Colors.accent },
  text_danger: { color: Colors.white },
  textSize_sm: { fontSize: 13 },
  textSize_md: { fontSize: 15 },
  textSize_lg: { fontSize: 17 },
});
