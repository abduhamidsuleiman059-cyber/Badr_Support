import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import SvgIcon from './SvgIcon';
import useTheme from '../hooks/useTheme';

export default function AppButton({ title, onPress, variant = 'primary', icon, disabled = false, loading = false, style, textStyle, accessibilityLabel }) {
  const { colors } = useTheme();
  const primary = variant === 'primary';
  const outline = variant === 'outline';
  const backgroundColor = primary ? colors.primary : outline ? 'transparent' : colors.surfaceRaised;
  const foregroundColor = primary ? '#062017' : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor: outline ? colors.border : 'transparent', opacity: disabled ? 0.48 : pressed ? 0.82 : 1 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={foregroundColor} />
        : icon ? <SvgIcon name={icon} size={16} color={foregroundColor} /> : null}
      <Text style={[styles.text, { color: foregroundColor }, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 44, borderRadius: 13, borderWidth: 1, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  text: { fontSize: 12, fontWeight: '800', letterSpacing: 0.15 },
});
