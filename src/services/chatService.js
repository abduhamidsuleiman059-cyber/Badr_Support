import { ServiceNotConfiguredError } from './aiService';

export async function listConversations() {
  throw new ServiceNotConfiguredError('Conversation history');
}

export async function loadConversation() {
  throw new ServiceNotConfiguredError('Conversation history');
}