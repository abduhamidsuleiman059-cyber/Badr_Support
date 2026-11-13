import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SvgIcon from '../components/SvgIcon';
import { router } from 'expo-router';
import useTheme from '../hooks/useTheme';
import useChat from '../hooks/useChat';
import { formatRelativeDate } from '../utils/formatDate';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { threads, openThread, togglePinThread, deleteThread } = useChat();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [feedback, setFeedback] = useState('');
  const filtered = useMemo(() => threads.filter((thread) => thread.title.toLowerCase().includes(query.trim().toLowerCase())), [threads, query]);
  const pinnedThreads = filtered.filter((thread) => thread.pinned);
  const otherThreads = filtered.filter((thread) => !thread.pinned);
  const closeHistory = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (pendingDelete) setPendingDelete(null);
      else closeHistory();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeHistory, pendingDelete]);

  function selectThread(threadId) {
    openThread(threadId);
    if (router.canGoBack()) router.back();
    else router.replace('/chat');
  }

  function handleTogglePin(thread) {
    togglePinThread(thread.id);
    setFeedback(thread.pinned ? 'Conversation unpinned.' : 'Conversation pinned.');
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteThread(pendingDelete.id);
    setFeedback('Conversation deleted.');
    setPendingDelete(null);
  }

  function renderThread(thread) {
    return (
      <View key={thread.id} style={[styles.thread, { borderTopColor: colors.borderSubtle }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open conversation ${thread.title}`}
          onPress={() => selectThread(thread.id)}
          style={({ pressed }) => [styles.threadOpen, { opacity: pressed ? 0.72 : 1 }]}
        >
          <View style={[styles.threadIcon, { backgroundColor: colors.primaryDim }]}>
            <SvgIcon name="message-circle" size={15} color={colors.primary} />
          </View>
          <View style={styles.threadCopy}>
            <View style={styles.threadTitleRow}>
              <Text numberOfLines={1} style={[styles.threadTitle, { color: colors.text }]}>{thread.title}</Text>
              {thread.pinned ? (
                <View style={[styles.pinnedBadge, { backgroundColor: colors.primaryDim }]}>
                  <SvgIcon name="pin" size={10} color={colors.primary} />
                  <Text style={[styles.pinnedText, { color: colors.primary }]}>PINNED</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.threadMeta, { color: colors.textMuted }]}>
              {thread.messages.length} {thread.messages.length === 1 ? 'message' : 'messages'} · {formatRelativeDate(thread.updatedAt)}
            </Text>
          </View>
        </Pressable>
        <View style={styles.threadActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${thread.pinned ? 'Unpin' : 'Pin'} conversation ${thread.title}`}
            accessibilityState={{ selected: Boolean(thread.pinned) }}
            onPress={() => handleTogglePin(thread)}
            style={({ pressed }) => [styles.actionLabel, { color: thread.pinned ? colors.primary : colors.textSecondary, opacity: pressed ? 0.65 : 1 }]}
          >
            <Text style={[styles.actionText, { color: thread.pinned ? colors.primary : colors.textSecondary }]}>{thread.pinned ? 'Unpin' : 'Pin'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete conversation ${thread.title}`}
            onPress={() => { setFeedback(''); setPendingDelete(thread); }}
            style={({ pressed }) => [styles.actionLabel, { opacity: pressed ? 0.65 : 1 }]}
          >
            <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close conversation history"
        onPress={closeHistory}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      />
      <View
        accessibilityRole="dialog"
        accessibilityLabel="Conversation history"
        accessibilityViewIsModal
        style={[styles.drawer, { width: width < 600 ? Math.max(0, width - 40) : Math.min(width, 560), backgroundColor: colors.background, borderLeftColor: colors.border }]}
      >
        <SafeAreaView style={styles.safeDrawer} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.panel}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={[styles.title, { color: colors.text }]}>Conversation history</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Pinned conversations stay at the top.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close history"
                onPress={closeHistory}
                style={({ pressed }) => [styles.closeButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
              >
                <SvgIcon name="x" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={[styles.search, { backgroundColor: colors.surface, borderColor: searchFocused ? colors.primary : colors.border }]}>
              <SvgIcon name="search" size={16} color={colors.textMuted} />
              <TextInput
                accessibilityLabel="Search conversations"
                value={query}
                onChangeText={(value) => { setQuery(value); setFeedback(''); }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search conversations"
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, Platform.OS === 'web' && styles.webInput, { color: colors.text }]}
              />
              {query ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')}>
                  <SvgIcon name="x" size={15} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
            {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: colors.primary }]}>{feedback}</Text> : null}
            {threads.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.primaryDim }]}><SvgIcon name="clock" size={22} color={colors.primary} /></View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>A clean slate</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Conversations you start will appear here. Your history stays in this app session.</Text>
              </View>
            ) : filtered.length === 0 ? (
              <View style={styles.noResults}>
                <SvgIcon name="search" size={20} color={colors.textMuted} />
                <Text style={[styles.noResultsText, { color: colors.textMuted }]}>No conversations match “{query}”.</Text>
              </View>
            ) : (
              <ScrollView style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {pinnedThreads.length ? (
                  <>
                    <Text style={[styles.listHeading, { color: colors.textMuted }]}>PINNED · {pinnedThreads.length}</Text>
                    {pinnedThreads.map(renderThread)}
                  </>
                ) : null}
                {otherThreads.length ? (
                  <>
                    <Text style={[styles.listHeading, { color: colors.textMuted }]}>{pinnedThreads.length ? 'UNPINNED CONVERSATIONS' : 'CONVERSATIONS'} · {otherThreads.length}</Text>
                    {otherThreads.map(renderThread)}
                  </>
                ) : null}
              </ScrollView>
            )}
            <Text style={[styles.note, { color: colors.textMuted }]}>Local preview only · Conversations aren't synced or sent to a service.</Text>
          </View>
        </SafeAreaView>
      </View>
      <Modal visible={Boolean(pendingDelete)} transparent animationType="fade" onRequestClose={() => setPendingDelete(null)}>
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel conversation deletion"
            onPress={() => setPendingDelete(null)}
            style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          />
          <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.dialogIcon, { backgroundColor: colors.danger + '18' }]}><SvgIcon name="trash" size={19} color={colors.danger} /></View>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Delete conversation?</Text>
            <Text style={[styles.dialogBody, { color: colors.textSecondary }]}>
              “{pendingDelete ? pendingDelete.title : ''}” will be removed from this session. This can't be undone.
            </Text>
            <View style={styles.dialogActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setPendingDelete(null)}
                style={({ pressed }) => [styles.dialogButton, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
              >
                <Text style={[styles.dialogButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={confirmDelete}
                style={({ pressed }) => [styles.dialogButton, { backgroundColor: colors.danger, borderColor: colors.danger, opacity: pressed ? 0.78 : 1 }]}
              >
                <Text style={[styles.dialogButtonText, styles.deleteText]}>Delete conversation</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  drawer: { height: '100%', maxWidth: 560, borderLeftWidth: 1, elevation: 18, shadowColor: '#000', shadowOffset: { width: -8, height: 0 }, shadowOpacity: 0.24, shadowRadius: 24 },
  safeDrawer: { flex: 1 },
  panel: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22 },
  headerCopy: { flex: 1 },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { marginTop: 5, fontSize: 10 },
  closeButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  search: { height: 46, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 12 },
  webInput: { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent', borderWidth: 0, backgroundColor: 'transparent', boxShadow: 'none' },
  feedback: { fontSize: 10, fontWeight: '700', marginTop: 11 },
  empty: { flex: 1, minHeight: 250, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 26, marginTop: 18 },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 16 },
  emptyText: { maxWidth: 360, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  noResults: { flex: 1, minHeight: 170, alignItems: 'center', justifyContent: 'center', gap: 12 },
  noResultsText: { fontSize: 11 },
  list: { flex: 1, marginTop: 18 },
  listContent: { paddingBottom: 12 },
  listHeading: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginTop: 16, marginBottom: 8 },
  thread: { minHeight: 68, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9 },
  threadOpen: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  threadIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  threadCopy: { flex: 1, minWidth: 0 },
  threadTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  threadTitle: { flexShrink: 1, fontSize: 12, fontWeight: '700' },
  threadMeta: { fontSize: 9, marginTop: 5 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 6 },
  pinnedText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.4 },
  threadActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionLabel: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 6 },
  actionText: { fontSize: 10, fontWeight: '700' },
  note: { textAlign: 'center', fontSize: 9, marginTop: 12 },
  modalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 22 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  dialog: { width: '100%', maxWidth: 400, borderWidth: 1, borderRadius: 20, padding: 22, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.28, shadowRadius: 24 },
  dialogIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dialogTitle: { fontSize: 16, fontWeight: '800', marginTop: 15 },
  dialogBody: { fontSize: 11, lineHeight: 18, marginTop: 8 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 20 },
  dialogButton: { minHeight: 40, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  dialogButtonText: { fontSize: 10, fontWeight: '800' },
  deleteText: { color: '#FFFFFF' },
});