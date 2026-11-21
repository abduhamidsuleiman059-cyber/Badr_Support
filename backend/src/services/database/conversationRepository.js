const supabaseClient = require('./supabaseClient');
const {
  ConversationNotFoundError,
  DatabaseOperationError,
  IdempotencyConflictError,
} = require('./databaseErrors');

async function runQuery(operation, query) {
  let result;

  try {
    result = await query();
  } catch {
    throw new DatabaseOperationError(operation);
  }

  if (result?.error?.code === '22023' && operation === 'save idempotent user message') {
    throw new IdempotencyConflictError();
  }

  if (result?.error?.code === 'P0002' && operation === 'save idempotent user message') {
    throw new ConversationNotFoundError();
  }

  if (!result || result.error) {
    throw new DatabaseOperationError(operation);
  }

  return result.data;
}

async function createConversation(userId) {
  const client = supabaseClient.getSupabaseClient();
  const conversation = await runQuery('create conversation', () => client
    .from('conversations')
    .insert({ user_id: userId })
    .select('id')
    .single());

  if (!conversation?.id) {
    throw new DatabaseOperationError('create conversation');
  }

  return conversation.id;
}

async function ensureOwnedConversation(client, userId, conversationId) {
  const conversation = await runQuery('verify conversation ownership', () => client
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle());

  if (!conversation) {
    throw new ConversationNotFoundError();
  }
}

async function saveMessage(client, { userId, conversationId, role, content }) {
  await runQuery('save message', () => client
    .from('messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
    }));
}

async function saveUserMessage({ userId, conversationId, submissionId, content }) {
  const client = supabaseClient.getSupabaseClient();

  if (submissionId) {
    const rows = await runQuery('save idempotent user message', () => client.rpc(
      'save_user_message_once',
      {
        p_user_id: userId,
        p_conversation_id: conversationId,
        p_submission_id: submissionId,
        p_content: content,
      },
    ));
    const result = Array.isArray(rows) ? rows[0] : rows;

    if (!result?.conversation_id) {
      throw new DatabaseOperationError('save idempotent user message');
    }

    return {
      conversationId: result.conversation_id,
      duplicate: Boolean(result.duplicate),
    };
  }

  let ownedConversationId = conversationId;

  if (ownedConversationId) {
    await ensureOwnedConversation(client, userId, ownedConversationId);
  } else {
    ownedConversationId = await createConversation(userId);
  }

  await saveMessage(client, {
    userId,
    conversationId: ownedConversationId,
    role: 'user',
    content,
  });

  return ownedConversationId;
}

async function getAssistantMessage({ userId, submissionId }) {
  if (!submissionId) return null;

  const client = supabaseClient.getSupabaseClient();
  return runQuery('retrieve idempotent assistant message', () => client
    .from('messages')
    .select('content, provider')
    .eq('user_id', userId)
    .eq('submission_id', submissionId)
    .eq('role', 'assistant')
    .maybeSingle());
}

async function saveAssistantMessage({
  userId,
  conversationId,
  submissionId,
  provider,
  content,
}) {
  const client = supabaseClient.getSupabaseClient();
  await ensureOwnedConversation(client, userId, conversationId);

  if (!submissionId) {
    await saveMessage(client, {
      userId,
      conversationId,
      role: 'assistant',
      content,
    });
    return { content };
  }

  let result;
  try {
    result = await client
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        submission_id: submissionId,
        role: 'assistant',
        provider: provider || null,
        content,
      })
      .select('content')
      .single();
  } catch {
    throw new DatabaseOperationError('save assistant message');
  }

  if (result?.error?.code === '23505') {
    const existing = await getAssistantMessage({ userId, submissionId });
    if (existing?.content) return existing;
  }

  if (!result || result.error || !result.data?.content) {
    throw new DatabaseOperationError('save assistant message');
  }

  return result.data;
}

async function getConversationHistory(userId, conversationId) {
  const client = supabaseClient.getSupabaseClient();
  const conversation = await runQuery('retrieve conversation', () => client
    .from('conversations')
    .select('id, created_at, updated_at')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle());

  if (!conversation) {
    throw new ConversationNotFoundError();
  }

  const messages = await runQuery('retrieve messages', () => client
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true }));

  return {
    conversationId: conversation.id,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    messages: (messages || []).map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.created_at,
    })),
  };
}

async function listConversations(userId) {
  const client = supabaseClient.getSupabaseClient();
  const conversations = await runQuery('list conversations', () => client
    .from('conversations')
    .select('id, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false }));

  return (conversations || []).map((conversation) => ({
    id: conversation.id,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
  }));
}

async function deleteConversation(userId, conversationId) {
  const client = supabaseClient.getSupabaseClient();
  const conversation = await runQuery('delete conversation', () => client
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle());

  if (!conversation) {
    throw new ConversationNotFoundError();
  }
}

module.exports = {
  createConversation,
  saveUserMessage,
  getAssistantMessage,
  saveAssistantMessage,
  getConversationHistory,
  listConversations,
  deleteConversation,
};
