import { requestBackend } from './apiClient';

export async function listConversations() {
  const result = await requestBackend('/api/chat/conversations', {
    requireAuthentication: true,
  });

  if (!Array.isArray(result.data)) {
    throw new Error('The backend returned an invalid conversation list.');
  }

  return result.data;
}

export async function loadConversation(conversationId) {
  const result = await requestBackend(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}`,
    { requireAuthentication: true },
  );

  if (!result.data || !Array.isArray(result.data.messages)) {
    throw new Error('The backend returned an invalid conversation history.');
  }

  return result.data;
}

export async function deleteConversation(conversationId) {
  await requestBackend(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}`,
    { method: 'DELETE', requireAuthentication: true },
  );
}