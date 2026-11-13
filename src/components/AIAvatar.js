import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SvgIcon from './SvgIcon';
import useTheme from '../hooks/useTheme';

export default function AIAvatar({ size = 48 }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel="BADR AI"
      style={[
        styles.glow,
        { width: size, height: size, borderRadius: size / 2, shadowColor: colors.primary },
      ]}
    >
      <LinearGradient
        colors={['#184D3B', '#0C2420', '#132126']}
        style={[styles.avatar, { borderRadius: size / 2 }]}
      >
        <SvgIcon name="orbit" size={size * 0.51} color={colors.primaryBright} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 5,
  },
  avatar: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(96, 238, 180, 0.28)',
  },
});