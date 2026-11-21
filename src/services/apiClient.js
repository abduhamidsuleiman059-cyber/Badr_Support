import { getAccessToken, isSupabaseConfigured } from './supabaseClient';

export class ApiRequestError extends Error {
  constructor(message, {
    status = 0,
    conversationId = null,
    persistence = null,
  } = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.conversationId = conversationId;
    this.persistence = persistence;
  }
}

export function isBackendConfigured() {
  return Boolean(process.env.EXPO_PUBLIC_BACKEND_API_URL?.trim());
}

function getBackendUrl() {
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL?.trim();

  if (!backendUrl) {
    throw new Error('Chat service is not configured. Set EXPO_PUBLIC_BACKEND_API_URL.');
  }

  let url;

  try {
    url = new URL(backendUrl);
  } catch {
    throw new Error('EXPO_PUBLIC_BACKEND_API_URL must be a valid HTTP or HTTPS URL.');
  }

  if (!['http:', 'https:'].includes(url.protocol)
    || url.username
    || url.password
    || url.search
    || url.hash) {
    throw new Error('EXPO_PUBLIC_BACKEND_API_URL must be an HTTP or HTTPS URL without credentials, query, or fragment.');
  }

  return url.toString().replace(/\/+$/, '');
}

export async function requestBackend(path, {
  method = 'GET',
  body,
  conversationId,
  idempotencyKey,
  requireAuthentication = false,
} = {}) {
  const backendUrl = getBackendUrl();
  let accessToken = null;

  if (isSupabaseConfigured()) {
    accessToken = await getAccessToken();
  }

  if (requireAuthentication && !accessToken) {
    throw new ApiRequestError('Sign in to access saved conversations.', { status: 401 });
  }

  const headers = { Accept: 'application/json' };

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (conversationId) headers['X-Conversation-Id'] = conversationId;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  let response;

  try {
    response = await fetch(`${backendUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError('Could not reach the BADR_SUPPORT backend. Check the API URL and your connection.');
  }

  const responseConversationId = response.headers.get('X-Conversation-Id');
  if (response.status === 204) {
    return { data: null, conversationId: responseConversationId };
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new ApiRequestError(
      'The backend returned an invalid response.',
      { status: response.status, conversationId: responseConversationId },
    );
  }

  if (!response.ok) {
    throw new ApiRequestError(
      payload?.error?.message || 'The chat request failed. Please try again.',
      {
        status: response.status,
        conversationId: responseConversationId,
        persistence: payload?.persistence || null,
      },
    );
  }

  return { data: payload?.data, conversationId: responseConversationId };
}
