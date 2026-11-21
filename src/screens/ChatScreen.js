import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import SvgIcon from '../components/SvgIcon';
import AppShell from '../components/AppShell';
import AIAvatar from '../components/AIAvatar';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import PageContainer from '../components/PageContainer';
import TypingIndicator from '../components/TypingIndicator';
import useTheme from '../hooks/useTheme';
import useChat from '../hooks/useChat';
import { sendPrompt } from '../services/aiService';
import { canApplyAuthResult } from '../context/chatIdentityState';
import {
  canRetryIncompleteExchange,
  getChatPersistenceNotice,
  getGenerationFailurePersistenceNotice,
} from '../services/chatPersistenceStatus';
import { createChatRetry, createChatSubmission } from '../services/chatSubmission';

const starterPrompts = [
  { icon: 'edit-3', title: 'Help me write', prompt: 'Help me get started with a piece of writing.' },
  { icon: 'compass', title: 'Explore a topic', prompt: 'Help me explore a topic step by step.' },
  { icon: 'layers', title: 'Break it down', prompt: 'Help me break a challenging task into smaller steps.' },
];

export default function ChatScreen() {
  const { colors } = useTheme();
  const { prompt: routedPrompt, promptKey } = useLocalSearchParams();
  const {
    activeThread,
    addUserMessage,
    addAssistantMessage,
    updateConversationId,
    startChat,
    isAuthenticated,
    authenticatedUserId,
    authGeneration,
    authLoading,
    historyLoading,
    loadingConversationId,
    historyError,
    refreshHistory,
    retryLoadConversation,
    openThread,
  } = useChat();
  const [notice, setNotice] = useState('');
  const [requestError, setRequestError] = useState('');
  const [retryRequest, setRetryRequest] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [previewTyping, setPreviewTyping] = useState(false);
  const scrollRef = useRef(null);
  const handledPromptKey = useRef(null);
  const priorAuthGeneration = useRef(authGeneration);
  const messages = activeThread ? activeThread.messages : [];

  useEffect(() => {
    if (priorAuthGeneration.current === authGeneration) return;
    priorAuthGeneration.current = authGeneration;
    setNotice('');
    setRequestError('');
    setRetryRequest(null);
  }, [authGeneration]);

  useEffect(() => {
    if (messages.length) scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isSending]);

  useEffect(() => {
    const prompt = Array.isArray(routedPrompt) ? routedPrompt[0] : routedPrompt;
    const key = Array.isArray(promptKey) ? promptKey[0] : promptKey;

    if (!prompt || handledPromptKey.current === key) return;
    handledPromptKey.current = key;
    router.setParams({ prompt: undefined, promptKey: undefined });
    send(prompt, null);
  }, [routedPrompt, promptKey]);

  useEffect(() => {
    if (activeThread?.conversationId && !activeThread.messagesLoaded
      && loadingConversationId !== activeThread.id) {
      openThread(activeThread.id);
    }
  }, [activeThread, loadingConversationId, openThread]);

  async function submitMessage(request) {
    setIsSending(true);
    setRequestError('');

    try {
      const response = await sendPrompt(
        request.content,
        request.conversationId,
        request.submissionId,
      );
      if (!canApplyAuthResult(
        request.ownerUserId,
        request.authGeneration,
        authenticatedUserId,
        authGeneration,
      )) return false;

      if (response.conversationId) {
        updateConversationId(request.threadId, response.conversationId);
      }
      addAssistantMessage(request.threadId, response.reply, request.submissionId);

      const persistenceNotice = getChatPersistenceNotice(response.persistence, isAuthenticated);
      setNotice(request.attachmentNotice
        ? `Only text was sent; the attachment was not uploaded. ${persistenceNotice}`
        : persistenceNotice);
      if (canRetryIncompleteExchange(response.persistence, isAuthenticated)) {
        setRequestError('This exchange is not fully saved. Retry the exchange to try again.');
        setRetryRequest(request);
      } else {
        setRequestError('');
        setRetryRequest(null);
      }
      return true;
    } catch (error) {
      if (!canApplyAuthResult(
        request.ownerUserId,
        request.authGeneration,
        authenticatedUserId,
        authGeneration,
      )) return false;

      if (error.conversationId) {
        updateConversationId(request.threadId, error.conversationId);
      }
      setNotice(getGenerationFailurePersistenceNotice(error.persistence));
      setRequestError(error.message || 'Unable to send your message.');
      setRetryRequest(createChatRetry(request, error));
      return true;
    } finally {
      setIsSending(false);
    }
  }

  async function send(text, attachment) {
    const content = text.trim();
    if (!content) {
      setRequestError(attachment
        ? 'Attachments are not uploaded. Add a text message to send.'
        : 'Enter a message to send.');
      return false;
    }

    const threadId = addUserMessage(content);
    if (!threadId) return false;

    if (attachment) {
      setNotice('The selected attachment was not uploaded; only your text was sent.');
    } else {
      setNotice('');
    }

    setRetryRequest(null);
    return submitMessage(createChatSubmission({
      threadId,
      conversationId: activeThread?.conversationId || null,
      content,
      ownerUserId: authenticatedUserId,
      authGeneration,
      attachmentNotice: Boolean(attachment),
    }));
  }

  function choosePrompt(prompt) {
    send(prompt, null);
  }

  const loadingCurrentConversation = Boolean(
    activeThread && loadingConversationId === activeThread.id,
  );
  const loadingHistoryWithoutThread = (authLoading || historyLoading) && !activeThread;

  return (
    <AppShell title={activeThread ? activeThread.title : 'New conversation'} subtitle="Your private space to think out loud">
      <PageContainer scroll={false} contentStyle={styles.containerPadding} style={styles.chatFrame}>
        <View style={styles.chatFrame}>
          <View style={styles.messageList}>
            {loadingHistoryWithoutThread || loadingCurrentConversation ? (
              <View style={styles.statusState}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.statusText, { color: colors.textMuted }]}>Loading your conversation…</Text>
              </View>
            ) : historyError && (!activeThread || !activeThread.messagesLoaded) ? (
              <View style={styles.statusState}>
                <Text accessibilityRole="alert" style={[styles.statusText, { color: colors.danger }]}>{historyError}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => (activeThread ? retryLoadConversation() : refreshHistory())}
                  style={styles.statusAction}
                >
                  <Text style={[styles.statusActionText, { color: colors.primary }]}>Retry</Text>
                </Pressable>
              </View>
            ) : messages.length === 0 ? (
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
                  <Text style={[styles.offlineText, { color: colors.textMuted }]}>
                    {isAuthenticated
                      ? 'Your signed-in conversations are saved to your account.'
                      : 'Guest chats are not saved. Sign in to keep conversation history.'}
                  </Text>
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
                {isSending ? <TypingIndicator label="BADR AI is responding" /> : null}
                <View style={[styles.localNote, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                  <SvgIcon name="info" size={13} color={colors.cyan} />
                  <Text style={[styles.localNoteText, { color: colors.textMuted }]}>
                    {notice || (isAuthenticated
                      ? 'Messages in this conversation are synced to your account.'
                      : 'Guest conversations are temporary and are not saved.')}
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
          <View style={styles.composerArea}>
            {requestError ? (
              <View style={[styles.requestError, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                <Text accessibilityRole="alert" style={[styles.requestErrorText, { color: colors.danger }]}>{requestError}</Text>
                {retryRequest ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={isSending}
                    onPress={() => submitMessage(retryRequest)}
                    style={({ pressed }) => [styles.retryButton, { opacity: isSending || pressed ? 0.6 : 1 }]}
                  >
                    <Text style={[styles.statusActionText, { color: colors.primary }]}>Retry exchange</Text>
                  </Pressable>
                ) : null}
                {!isAuthenticated ? (
                  <Pressable accessibilityRole="link" onPress={() => router.push('/auth')} style={styles.retryButton}>
                    <Text style={[styles.statusActionText, { color: colors.primary }]}>Sign in to save history</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {messages.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                disabled={isSending}
                onPress={() => {
                  startChat();
                  setNotice('');
                  setRequestError('');
                  setRetryRequest(null);
                }}
                style={styles.newChat}
              >
                <SvgIcon name="plus" size={14} color={colors.primary} />
                <Text style={[styles.newChatLabel, { color: colors.primary }]}>Start a new chat</Text>
              </Pressable>
            ) : null}
            <MessageInput
              onSend={send}
              disabled={isSending
                || loadingCurrentConversation
                || loadingHistoryWithoutThread
                || Boolean(historyError && activeThread?.conversationId && !activeThread.messagesLoaded)}
            />
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
  statusState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  statusText: { maxWidth: 420, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  statusAction: { padding: 8 },
  statusActionText: { fontSize: 10, fontWeight: '800' },
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
  requestError: { borderWidth: 1, borderRadius: 11, padding: 10, gap: 6 },
  requestErrorText: { fontSize: 10, lineHeight: 15 },
  retryButton: { alignSelf: 'flex-start', paddingVertical: 5, paddingRight: 8 },
  newChat: { alignSelf: 'center', flexDirection: 'row', gap: 6, alignItems: 'center', padding: 8 },
  newChatLabel: { fontSize: 10, fontWeight: '700' },
});