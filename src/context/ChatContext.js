import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import { deleteConversation, listConversations, loadConversation } from '../services/chatService';
import {
  completeSupabaseAuthRedirect,
  isOAuthBrowserActive,
} from '../services/storageService';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient';
import {
  canApplyAuthResult,
  canApplyInitialSession,
  getActiveThreadIdForIdentity,
  getThreadsForIdentity,
} from './chatIdentityState';

export const ChatContext = createContext(null);

function sortThreads(threads) {
  return [...threads].sort((left, right) => {
    const pinnedOrder = Number(Boolean(right.pinned)) - Number(Boolean(left.pinned));
    if (pinnedOrder) return pinnedOrder;

    const leftDate = Date.parse(left.pinned ? left.pinnedAt : left.updatedAt) || 0;
    const rightDate = Date.parse(right.pinned ? right.pinnedAt : right.updatedAt) || 0;
    return rightDate - leftDate;
  });
}

function createMessage(role, content, attachmentName, submissionId) {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    attachment: attachmentName || null,
    submissionId: submissionId || null,
    createdAt: now,
  };
}

function createLocalThread(firstMessage, attachmentName, ownerUserId) {
  const now = new Date().toISOString();
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const content = firstMessage?.trim() || '';

  return {
    id,
    conversationId: null,
    ownerUserId: ownerUserId || null,
    title: content ? content.slice(0, 52) : 'New conversation',
    updatedAt: now,
    messages: content ? [createMessage('user', content, attachmentName)] : [],
    messagesLoaded: true,
    pinned: false,
  };
}

export function ChatProvider({ children }) {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [authGeneration, setAuthGeneration] = useState(0);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(() => isSupabaseConfigured());
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState(null);
  const [historyError, setHistoryError] = useState('');
  const authenticatedUserId = authenticatedUser?.id || null;
  const authenticatedUserIdRef = useRef(authenticatedUserId);
  const authGenerationRef = useRef(authGeneration);
  const threadsRef = useRef(threads);
  const historyRequestId = useRef(0);
  threadsRef.current = threads;

  useEffect(() => {
    if (!isSupabaseConfigured()) return undefined;

    let active = true;
    let client;
    let authEventVersion = 0;

    function applySession(session) {
      const user = session?.user || null;
      const nextUserId = user?.id || null;
      if (authenticatedUserIdRef.current !== nextUserId) {
        authenticatedUserIdRef.current = nextUserId;
        authGenerationRef.current += 1;
        setAuthGeneration(authGenerationRef.current);
      }
      setAuthenticatedUser(user);
      setAuthError('');
      setAuthLoading(false);
    }

    async function applyAuthRedirect(url) {
      if (!active || isOAuthBrowserActive()) return;
      try {
        const session = await completeSupabaseAuthRedirect(url);
        if (active && session) applySession(session);
      } catch {
        if (active) setAuthError('Unable to complete the authentication redirect.');
      }
    }

    try {
      client = getSupabaseClient();
    } catch (error) {
      setHistoryError(error.message || 'Authentication is not configured correctly.');
      setAuthError('Authentication is not configured correctly.');
      setAuthLoading(false);
      return undefined;
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (active) {
        authEventVersion += 1;
        applySession(session);
      }
    });
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      applyAuthRedirect(url);
    });
    const initialAuthEventVersion = authEventVersion;

    client.auth.getSession().then(({ data, error }) => {
      if (!active || !canApplyInitialSession(initialAuthEventVersion, authEventVersion)) return;
      if (error) {
        setAuthError('Unable to restore your sign-in session.');
        setAuthLoading(false);
        return;
      }
      applySession(data.session);
    }).catch(() => {
      if (active && canApplyInitialSession(initialAuthEventVersion, authEventVersion)) {
        setAuthError('Unable to restore your sign-in session.');
        setAuthLoading(false);
      }
    });
    if (Linking.getInitialURL) {
      Linking.getInitialURL().then((url) => {
        if (url) applyAuthRedirect(url);
      }).catch(() => {
        if (active) setAuthError('Unable to restore your sign-in redirect.');
      });
    }

    return () => {
      active = false;
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  const refreshHistory = useCallback(async () => {
    if (!authenticatedUserId) return false;

    const requestId = historyRequestId.current + 1;
    const requestGeneration = authGenerationRef.current;
    historyRequestId.current = requestId;
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const savedConversations = await listConversations();
      if (requestId !== historyRequestId.current
        || !canApplyAuthResult(
          authenticatedUserId,
          requestGeneration,
          authenticatedUserIdRef.current,
          authGenerationRef.current,
        )) return false;

      setThreads((current) => {
        const savedThreads = savedConversations.map((conversation) => {
          const existing = current.find((thread) => thread.ownerUserId === authenticatedUserId
            && (thread.conversationId === conversation.id
              || thread.id === conversation.id));
          return {
            id: existing?.id || conversation.id,
            conversationId: conversation.id,
            ownerUserId: authenticatedUserId,
            title: existing?.title || 'Conversation',
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messages: existing?.messages || [],
            messagesLoaded: Boolean(existing?.messagesLoaded),
            pinned: Boolean(existing?.pinned),
            pinnedAt: existing?.pinnedAt || null,
          };
        });
        const scopedThreads = getThreadsForIdentity(current, authenticatedUserId);
        const guestThreads = current.filter((thread) => !thread.ownerUserId);
        const otherIdentityThreads = current.filter((thread) => thread.ownerUserId
          && thread.ownerUserId !== authenticatedUserId);
        const unsavedThreads = scopedThreads.filter((thread) => !thread.conversationId);
        return sortThreads([
          ...savedThreads,
          ...unsavedThreads,
          ...guestThreads,
          ...otherIdentityThreads,
        ]);
      });

      setActiveThreadId((current) => {
        return getActiveThreadIdForIdentity(
          current,
          threadsRef.current,
          authenticatedUserId,
          savedConversations,
        );
      });
      return true;
    } catch (error) {
      if (requestId !== historyRequestId.current
        || !canApplyAuthResult(
          authenticatedUserId,
          requestGeneration,
          authenticatedUserIdRef.current,
          authGenerationRef.current,
        )) return false;
      setHistoryError(error.message || 'Unable to load saved conversations.');
      return false;
    } finally {
      if (requestId === historyRequestId.current) setHistoryLoading(false);
    }
  }, [authenticatedUserId]);

  useEffect(() => {
    historyRequestId.current += 1;
    setHistoryLoading(false);

    setActiveThreadId(null);

    if (authenticatedUserId) {
      refreshHistory();
      return;
    }
  }, [authenticatedUserId, refreshHistory]);

  const startChat = useCallback((firstMessage, attachmentName) => {
    const thread = createLocalThread(firstMessage, attachmentName, authenticatedUserId);
    setThreads((current) => sortThreads([thread, ...current]));
    setActiveThreadId(thread.id);
    return thread.id;
  }, [authenticatedUserId]);

  const addUserMessage = useCallback((content, attachmentName) => {
    const text = content.trim();
    if (!text) return null;

    const currentThread = getThreadsForIdentity(threads, authenticatedUserId)
      .find((thread) => thread.id === activeThreadId);
    if (!currentThread) return startChat(text, attachmentName);

    setThreads((current) => sortThreads(current.map((thread) => thread.id === currentThread.id
      ? {
        ...thread,
        title: thread.messages.length === 0 ? text.slice(0, 52) : thread.title,
        updatedAt: new Date().toISOString(),
        messages: [...thread.messages, createMessage('user', text, attachmentName)],
      }
      : thread)));
    return currentThread.id;
  }, [activeThreadId, authenticatedUserId, startChat, threads]);

  const addAssistantMessage = useCallback((threadId, content, submissionId) => {
    setThreads((current) => sortThreads(current.map((thread) => thread.id === threadId
      ? (() => {
        const existingIndex = submissionId
          ? thread.messages.findIndex((message) => message.role === 'assistant'
            && message.submissionId === submissionId)
          : -1;
        const messages = [...thread.messages];
        const message = createMessage('assistant', content, null, submissionId);
        if (existingIndex >= 0) messages[existingIndex] = { ...messages[existingIndex], content };
        else messages.push(message);
        return {
          ...thread,
          updatedAt: new Date().toISOString(),
          messages,
          messagesLoaded: true,
        };
      })()
      : thread)));
  }, []);

  const updateConversationId = useCallback((threadId, conversationId) => {
    if (!conversationId) return;
    setThreads((current) => current.map((thread) => thread.id === threadId
      ? { ...thread, conversationId, messagesLoaded: true }
      : thread));
  }, []);

  const openThread = useCallback(async (id, forceReload = false) => {
    setActiveThreadId(id);
    const thread = getThreadsForIdentity(threads, authenticatedUserId)
      .find((item) => item.id === id);
    const requestUserId = authenticatedUserId;
    const requestGeneration = authGenerationRef.current;

    if (!thread?.conversationId || (thread.messagesLoaded && !forceReload)) return true;

    setLoadingConversationId(id);
    setHistoryError('');

    try {
      const history = await loadConversation(thread.conversationId);
      if (!canApplyAuthResult(
        requestUserId,
        requestGeneration,
        authenticatedUserIdRef.current,
        authGenerationRef.current,
      )) return false;
      const firstUserMessage = history.messages.find((message) => message.role === 'user');
      setThreads((current) => current.map((item) => item.id === id
        ? {
          ...item,
          title: firstUserMessage?.content.trim().slice(0, 52) || 'Conversation',
          createdAt: history.createdAt,
          updatedAt: history.updatedAt,
          messages: history.messages,
          messagesLoaded: true,
        }
        : item));
      return true;
    } catch (error) {
      if (!canApplyAuthResult(
        requestUserId,
        requestGeneration,
        authenticatedUserIdRef.current,
        authGenerationRef.current,
      )) return false;
      setHistoryError(error.message || 'Unable to load this conversation.');
      return false;
    } finally {
      setLoadingConversationId((current) => current === id ? null : current);
    }
  }, [authenticatedUserId, threads]);

  const togglePinThread = useCallback((id) => {
    const pinnedAt = new Date().toISOString();
    setThreads((current) => sortThreads(current.map((thread) => thread.id === id
      ? { ...thread, pinned: !thread.pinned, pinnedAt: thread.pinned ? null : pinnedAt }
      : thread)));
  }, []);

  const deleteThread = useCallback(async (id) => {
    const thread = getThreadsForIdentity(threads, authenticatedUserId)
      .find((item) => item.id === id);
    if (thread?.conversationId) await deleteConversation(thread.conversationId);

    setThreads((current) => sortThreads(current.filter((item) => item.id !== id)));
    setActiveThreadId((current) => current === id ? null : current);
  }, [authenticatedUserId, threads]);

  const visibleThreads = useMemo(
    () => getThreadsForIdentity(threads, authenticatedUserId),
    [threads, authenticatedUserId],
  );
  const value = useMemo(() => ({
    threads: visibleThreads,
    activeThreadId,
    activeThread: visibleThreads.find((thread) => thread.id === activeThreadId) || null,
    authenticatedUser,
    authenticatedUserId,
    authError,
    authGeneration,
    isAuthenticated: Boolean(authenticatedUserId),
    authLoading,
    historyLoading,
    loadingConversationId,
    historyError,
    refreshHistory,
    retryLoadConversation: () => openThread(activeThreadId, true),
    startChat,
    addUserMessage,
    addAssistantMessage,
    updateConversationId,
    openThread,
    togglePinThread,
    deleteThread,
  }), [
    threads,
    visibleThreads,
    activeThreadId,
    authenticatedUser,
    authenticatedUserId,
    authError,
    authGeneration,
    authLoading,
    historyLoading,
    loadingConversationId,
    historyError,
    refreshHistory,
    openThread,
    startChat,
    addUserMessage,
    addAssistantMessage,
    updateConversationId,
    togglePinThread,
    deleteThread,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
