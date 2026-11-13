import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { maxContentWidth } from '../constants/theme';

export default function PageContainer({ children, scroll = true, style, contentStyle }) {
  const { width } = useWindowDimensions();
  const padding = width < 600 ? 18 : width < 980 ? 28 : 38;
  const inner = (
    <View style={[styles.inner, { paddingHorizontal: padding }, contentStyle]}>
      <View style={[styles.content, { maxWidth: maxContentWidth }, style]}>{children}</View>
    </View>
  );
  if (!scroll) return <View style={styles.flex}>{inner}</View>;
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {inner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1 },
  inner: { width: '100%', alignItems: 'center', paddingTop: 30, paddingBottom: 42 },
  content: { width: '100%' },
});
