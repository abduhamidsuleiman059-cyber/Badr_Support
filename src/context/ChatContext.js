import React, { createContext, useCallback, useMemo, useState } from 'react';

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

export function ChatProvider({ children }) {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);

  const startChat = useCallback((firstMessage, attachmentName) => {
    const now = new Date().toISOString();
    const id = `${Date.now()}`;
    const thread = {
      id,
      title: firstMessage ? firstMessage.trim().slice(0, 52) : 'New conversation',
      updatedAt: now,
      messages: firstMessage ? [{
        id: `${id}-1`,
        role: 'user',
        content: firstMessage.trim(),
        attachment: attachmentName || null,
        createdAt: now,
      }] : [],
    };
    setThreads((current) => sortThreads([thread, ...current]));
    setActiveThreadId(id);
    return id;
  }, []);

  const addUserMessage = useCallback((content, attachmentName) => {
    const text = content.trim();
    if (!text) return null;
    let id = activeThreadId;
    if (!id) {
      return startChat(text, attachmentName);
    }
    const now = new Date().toISOString();
    setThreads((current) => sortThreads(current.map((thread) => thread.id === id
      ? {
        ...thread,
        title: thread.messages.length === 0 ? text.slice(0, 52) : thread.title,
        updatedAt: now,
        messages: [...thread.messages, {
          id: `${id}-${Date.now()}`,
          role: 'user',
          content: text,
          attachment: attachmentName || null,
          createdAt: now,
        }],
      }
      : thread)));
    return id;
  }, [activeThreadId, startChat]);

  const openThread = useCallback((id) => {
    setActiveThreadId(id);
  }, []);

  const togglePinThread = useCallback((id) => {
    const pinnedAt = new Date().toISOString();
    setThreads((current) => sortThreads(current.map((thread) => thread.id === id
      ? { ...thread, pinned: !thread.pinned, pinnedAt: thread.pinned ? null : pinnedAt }
      : thread)));
  }, []);

  const deleteThread = useCallback((id) => {
    setThreads((current) => sortThreads(current.filter((thread) => thread.id !== id)));
    setActiveThreadId((current) => current === id ? null : current);
  }, []);

  const value = useMemo(() => ({
    threads,
    activeThreadId,
    activeThread: threads.find((thread) => thread.id === activeThreadId) || null,
    startChat,
    addUserMessage,
    openThread,
    togglePinThread,
    deleteThread,
  }), [threads, activeThreadId, startChat, addUserMessage, openThread, togglePinThread, deleteThread]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}