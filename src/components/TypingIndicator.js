import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import useTheme from '../hooks/useTheme';

export default function TypingIndicator({ size = 6, label = 'Loading' }) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 850, useNativeDriver }),
      Animated.timing(progress, { toValue: 0, duration: 850, useNativeDriver }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [progress, useNativeDriver]);

  return (
    <View accessibilityLabel={label} accessibilityRole="progressbar" style={styles.row}>
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primary,
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, index === 1 ? -3 : -1] }) }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, alignItems: 'center', minHeight: 16 },
});
