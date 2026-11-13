import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SvgIcon from '../components/SvgIcon';
import AppShell from '../components/AppShell';
import AIAvatar from '../components/AIAvatar';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import PageContainer from '../components/PageContainer';
import TypingIndicator from '../components/TypingIndicator';
import useTheme from '../hooks/useTheme';
import useChat from '../hooks/useChat';

const starterPrompts = [
  { icon: 'edit-3', title: 'Help me write', prompt: 'Help me get started with a piece of writing.' },
  { icon: 'compass', title: 'Explore a topic', prompt: 'Help me explore a topic step by step.' },
  { icon: 'layers', title: 'Break it down', prompt: 'Help me break a challenging task into smaller steps.' },
];

export default function ChatScreen() {
  const { colors } = useTheme();
  const { activeThread, addUserMessage, startChat } = useChat();
  const [notice, setNotice] = useState('');
  const [previewTyping, setPreviewTyping] = useState(false);
  const scrollRef = useRef(null);
  const messages = activeThread ? activeThread.messages : [];

  useEffect(() => {
    if (messages.length) scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  function send(text, attachment) {
    const content = text || `Attached “${attachment.name}” (local preview only).`;
    addUserMessage(content, attachment && attachment.name);
    setNotice('Your message is shown in this local preview only. AI responses are not connected.');
  }

  function choosePrompt(prompt) {
    startChat(prompt);
    setNotice('This prompt is displayed locally. Connect an AI service to receive responses.');
  }

  return (
    <AppShell title={activeThread ? activeThread.title : 'New conversation'} subtitle="Your private space to think out loud">
      <PageContainer scroll={false} contentStyle={styles.containerPadding} style={styles.chatFrame}>
        <View style={styles.chatFrame}>
          <View style={styles.messageList}>
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.orbit, { borderColor: colors.primary + '24' }]}>
                  <View style={[styles.orbitInner, { borderColor: colors.primary + '36' }]} />
                  <AIAvatar size={66} />
                </View>
                <Text style={[styles.welcome, { color: colors.text }]}>What’s on your mind?</Text>
                <Text style={[styles.intro, { color: colors.textMuted }]}>Start with a question, a small idea, or anything you’d like to untangle.</Text>
                <View style={styles.starters}>
                  {starterPrompts.map((item) => (
                    <Pressable
                      key={item.title}
                      accessibilityRole="button"
                      onPress={() => choosePrompt(item.prompt)}
                      style={({ pressed }) => [styles.starter, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}
                    >
                      <SvgIcon name={item.icon} size={15} color={colors.primary} />
                      <Text style={[styles.starterText, { color: colors.textSecondary }]}>{item.title}</Text>
                      <SvgIcon name="arrow-up-right" size={13} color={colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
                <View style={[styles.offlineNotice, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                  <SvgIcon name="info" size={14} color={colors.cyan} />
                  <Text style={[styles.offlineText, { color: colors.textMuted }]}>Frontend preview. Your messages stay in this session; no AI request is sent.</Text>
                </View>
                <View style={styles.animationPreview}>
                  <Pressable accessibilityRole="button" onPress={() => setPreviewTyping((visible) => !visible)} style={styles.previewToggle}>
                    <Text style={[styles.previewToggleText, { color: colors.primary }]}>{previewTyping ? 'Hide' : 'Preview'} typing animation</Text>
                    <SvgIcon name={previewTyping ? 'minus' : 'play'} size={12} color={colors.primary} />
                  </Pressable>
                  {previewTyping ? (
                    <View style={styles.previewRow}>
                      <TypingIndicator label="Typing animation preview" />
                      <Text style={[styles.animationLabel, { color: colors.textMuted }]}>Animation preview only · no response is being generated.</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : (
              <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                contentContainerStyle={styles.messages}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {messages.map((message) => <ChatBubble key={message.id} message={message} />)}
                <View style={[styles.localNote, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                  <SvgIcon name="info" size={13} color={colors.cyan} />
                  <Text style={[styles.localNoteText, { color: colors.textMuted }]}>{notice || 'Local preview only · No AI response has been generated.'}</Text>
                </View>
              </ScrollView>
            )}
          </View>
          <View style={styles.composerArea}>
            {messages.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => { startChat(); setNotice(''); }} style={styles.newChat}>
                <SvgIcon name="plus" size={14} color={colors.primary} />
                <Text style={[styles.newChatLabel, { color: colors.primary }]}>Start a new chat</Text>
              </Pressable>
            ) : null}
            <MessageInput onSend={send} />
          </View>
        </View>
      </PageContainer>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  containerPadding: { flex: 1, paddingTop: 16, paddingBottom: 14 },
  chatFrame: { flex: 1, width: '100%', minHeight: 0, justifyContent: 'space-between' },
  messageList: { flex: 1, minHeight: 0 },
  scroll: { flex: 1 },
  messages: { flexGrow: 1, gap: 16, paddingVertical: 8, justifyContent: 'flex-end' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 18 },
  orbit: { width: 108, height: 108, borderWidth: 1, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  orbitInner: { position: 'absolute', width: 88, height: 88, borderWidth: 1, borderRadius: 48 },
  welcome: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  intro: { maxWidth: 360, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  starters: { width: '100%', maxWidth: 510, gap: 8, marginTop: 22 },
  starter: { height: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  starterText: { flex: 1, fontSize: 11, fontWeight: '600' },
  offlineNotice: { maxWidth: 500, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 11, marginTop: 20 },
  offlineText: { flex: 1, fontSize: 9, lineHeight: 14 },
  animationPreview: { alignItems: 'center', marginTop: 7 },
  previewToggle: { minHeight: 32, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewToggleText: { fontSize: 9, fontWeight: '700' },
  previewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 3 },
  animationLabel: { fontSize: 8 },
  localNote: { maxWidth: 520, borderWidth: 1, borderRadius: 10, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  localNoteText: { flex: 1, fontSize: 9, lineHeight: 14 },
  composerArea: { width: '100%', maxWidth: 780, alignSelf: 'center', paddingTop: 12 },
  newChat: { alignSelf: 'center', flexDirection: 'row', gap: 6, alignItems: 'center', padding: 8 },
  newChatLabel: { fontSize: 10, fontWeight: '700' },
});