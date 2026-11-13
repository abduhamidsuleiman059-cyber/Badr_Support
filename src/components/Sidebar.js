import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SvgIcon from './SvgIcon';
import { router, usePathname } from 'expo-router';
import useTheme from '../hooks/useTheme';
import useChat from '../hooks/useChat';
import { BrandMark } from './Header';
import { formatRelativeDate } from '../utils/formatDate';

const items = [
  { label: 'Overview', icon: 'grid', path: '/' },
  { label: 'New chat', icon: 'edit-3', path: '/chat' },
  { label: 'Explore', icon: 'compass', path: '/explore' },
  { label: 'History', icon: 'clock', path: '/history' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { colors } = useTheme();
  const { threads, openThread, startChat } = useChat();

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.background, borderRightColor: colors.borderSubtle }]}>
      <View style={styles.brandWrap}><BrandMark /></View>
      <Pressable
        accessibilityRole="button"
        onPress={() => { startChat(); router.push('/chat'); }}
        style={({ pressed }) => [styles.newChat, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '48', opacity: pressed ? 0.8 : 1 }]}
      >
        <SvgIcon name="plus" size={17} color={colors.primary} />
        <Text style={[styles.newChatText, { color: colors.primary }]}>New conversation</Text>
      </Pressable>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>WORKSPACE</Text>
      <View style={styles.nav}>
        {items.map((item) => {
          const active = pathname === item.path || (item.path === '/chat' && pathname.startsWith('/chat'));
          return (
            <Pressable
              key={item.path}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              onPress={() => router.push(item.path)}
              style={({ pressed }) => [styles.navItem, active && { backgroundColor: colors.surfaceRaised }, pressed && { opacity: 0.72 }]}
            >
              <SvgIcon name={item.icon} size={17} color={active ? colors.primary : colors.textMuted} />
              <Text style={[styles.navText, { color: active ? colors.text : colors.textSecondary }]}>{item.label}</Text>
              {active ? <View style={[styles.activeMark, { backgroundColor: colors.primary }]} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 28 }]}>RECENT</Text>
      <ScrollView style={styles.recentList} contentContainerStyle={{ gap: 4 }}>
        {threads.length === 0 ? (
          <Text style={[styles.emptyRecent, { color: colors.textMuted }]}>Your conversations will appear here.</Text>
        ) : threads.slice(0, 6).map((thread) => (
          <Pressable
            key={thread.id}
            onPress={() => { openThread(thread.id); router.push('/chat'); }}
            style={({ pressed }) => [styles.recentItem, { opacity: pressed ? 0.65 : 1 }]}
          >
            <SvgIcon name="message-square" size={14} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={[styles.recentTitle, { color: colors.textSecondary }]}>{thread.title}</Text>
              <Text style={[styles.recentDate, { color: colors.textMuted }]}>{formatRelativeDate(thread.updatedAt)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.profileCard, { borderTopColor: colors.borderSubtle, opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={[styles.profileAvatar, { backgroundColor: colors.primaryDim }]}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>G</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: colors.text }]}>Guest</Text>
          <Text style={[styles.profilePlan, { color: colors.textMuted }]}>Preview workspace</Text>
        </View>
        <SvgIcon name="more-horizontal" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: 248, height: '100%', borderRightWidth: 1, paddingTop: 24 },
  brandWrap: { marginBottom: 26 },
  newChat: { height: 44, marginHorizontal: 18, marginBottom: 28, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, alignItems: 'center', flexDirection: 'row', gap: 10 },
  newChatText: { fontSize: 12, fontWeight: '700' },
  sectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, paddingHorizontal: 23, marginBottom: 10 },
  nav: { paddingHorizontal: 11, gap: 4 },
  navItem: { height: 42, borderRadius: 11, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  navText: { fontSize: 12, fontWeight: '600' },
  activeMark: { marginLeft: 'auto', width: 5, height: 5, borderRadius: 3 },
  recentList: { flex: 1, paddingHorizontal: 12 },
  emptyRecent: { fontSize: 11, lineHeight: 17, paddingHorizontal: 10, paddingTop: 5 },
  recentItem: { minHeight: 44, borderRadius: 9, paddingHorizontal: 10, alignItems: 'center', flexDirection: 'row', gap: 9 },
  recentTitle: { fontSize: 10, fontWeight: '600' },
  recentDate: { fontSize: 9, marginTop: 3 },
  profileCard: { height: 68, borderTopWidth: 1, paddingHorizontal: 18, alignItems: 'center', flexDirection: 'row', gap: 10 },
  profileAvatar: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 11, fontWeight: '700' },
  profilePlan: { fontSize: 9, marginTop: 3 },
});
