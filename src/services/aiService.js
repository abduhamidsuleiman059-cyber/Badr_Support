import { requestBackend } from './apiClient';

export class ServiceNotConfiguredError extends Error {
  constructor(service) {
    super(`${service} is not connected. Configure a backend before making requests.`);
    this.name = 'ServiceNotConfiguredError';
  }
}

export async function sendPrompt(message, conversationId = null, submissionId = null) {
  const result = await requestBackend('/api/chat', {
    method: 'POST',
    body: { message },
    conversationId,
    idempotencyKey: submissionId,
  });

  if (typeof result.data?.reply !== 'string' || !result.data.reply.trim()) {
    throw new Error('The backend did not return an assistant response.');
  }

  return {
    reply: result.data.reply,
    provider: result.data.provider,
    conversationId: result.conversationId,
    persistence: result.data.persistence || null,
  };
}

export async function getAvailableFeatures() {
  throw new ServiceNotConfiguredError('Feature catalogue');
}