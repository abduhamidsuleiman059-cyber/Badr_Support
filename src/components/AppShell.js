import React from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../hooks/useTheme';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

export default function AppShell({ title, subtitle, children }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const desktop = width >= 980;
  const compact = width < 600;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'right', 'bottom', 'left']}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {desktop ? <Sidebar /> : null}
        <View style={styles.main}>
          <Header title={title} subtitle={subtitle} compact={!desktop && compact} />
          <View style={styles.content}>{children}</View>
          {!desktop ? <BottomNavigation /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1, flexDirection: 'row', ...(Platform.OS === 'web' ? { minHeight: '100vh' } : {}) },
  main: { flex: 1, minWidth: 0 },
  content: { flex: 1, minHeight: 0 },
});
