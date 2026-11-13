import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SvgIcon from './SvgIcon';
import useTheme from '../hooks/useTheme';

export default function SuggestionCard({ icon = 'sparkles', title, description, color, onPress, compact = false }) {
  const { colors } = useTheme();
  const accent = color || colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
        compact && styles.compact,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: accent + '18' }]}>
        <SvgIcon name={icon} size={17} color={accent} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text numberOfLines={compact ? 2 : 3} style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <SvgIcon name="arrow-up-right" size={15} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 126, borderWidth: 1, borderRadius: 17, padding: 17, gap: 12 },
  compact: { minHeight: 98, padding: 13, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 12, fontWeight: '700' },
  description: { marginTop: 6, fontSize: 10, lineHeight: 16 },
});