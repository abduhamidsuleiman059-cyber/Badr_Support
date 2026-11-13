import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SvgIcon from './SvgIcon';
import { router, usePathname } from 'expo-router';
import useTheme from '../hooks/useTheme';

const tabs = [
  { label: 'Home', icon: 'home', path: '/' },
  { label: 'Chat', icon: 'message-circle', path: '/chat' },
  { label: 'Explore', icon: 'grid', path: '/explore' },
  { label: 'History', icon: 'clock', path: '/history' },
  { label: 'Profile', icon: 'user', path: '/profile' },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
      {tabs.map((tab) => {
        const active = pathname === tab.path;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={tab.path}
            onPress={() => router.push(tab.path)}
            style={styles.tab}
          >
            <SvgIcon name={tab.icon} size={19} color={active ? colors.primary : colors.textMuted} />
            <Text style={[styles.label, { color: active ? colors.primary : colors.textMuted }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 68,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 52 },
  label: { fontSize: 10, fontWeight: '600' },
});