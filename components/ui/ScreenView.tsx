import React, { useRef, useCallback } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

interface ScreenViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: StyleProp<ViewStyle>;
}

export function ScreenView({ children, style, edges = ['top'], contentStyle }: ScreenViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useFocusEffect(useCallback(() => {
    opacity.setValue(0);
    translateY.setValue(10);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.spring(translateY, {
        toValue: 0, useNativeDriver: true,
        speed: 28, bounciness: 3,
      }),
    ]).start();
  }, []));

  return (
    <SafeAreaView style={[{ flex: 1 }, style]} edges={edges}>
      <Animated.View style={[{ flex: 1 }, contentStyle, { opacity, transform: [{ translateY }] }]}>
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}
