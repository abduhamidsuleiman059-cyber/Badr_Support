const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const aiController = require('../src/controllers/aiController');
const conversationController = require('../src/controllers/conversationController');
const conversationRepository = require('../src/services/database/conversationRepository');
const {
  ConversationNotFoundError,
  IdempotencyConflictError,
} = require('../src/services/database/databaseErrors');
const modelService = require('../src/services/modelService');
const supabaseClient = require('../src/services/database/supabaseClient');
const { errorHandler } = require('../src/middleware/errorHandler');

const originalGenerateResponse = modelService.generateResponse;
const originalSaveUserMessage = conversationRepository.saveUserMessage;
const originalGetAssistantMessage = conversationRepository.getAssistantMessage;
const originalSaveAssistantMessage = conversationRepository.saveAssistantMessage;
const originalGetHistory = conversationRepository.getConversationHistory;
const originalListConversations = conversationRepository.listConversations;
const originalDeleteConversation = conversationRepository.deleteConversation;
const originalConsoleError = console.error;

afterEach(() => {
  modelService.generateResponse = originalGenerateResponse;
  conversationRepository.saveUserMessage = originalSaveUserMessage;
  conversationRepository.getAssistantMessage = originalGetAssistantMessage;
  conversationRepository.saveAssistantMessage = originalSaveAssistantMessage;
  conversationRepository.getConversationHistory = originalGetHistory;
  conversationRepository.listConversations = originalListConversations;
  conversationRepository.deleteConversation = originalDeleteConversation;
  supabaseClient.getSupabaseClient = originalGetSupabaseClient;
  console.error = originalConsoleError;
});

const originalGetSupabaseClient = supabaseClient.getSupabaseClient;

function createRequest({ body = {}, authenticatedUser = null, headers = {}, params = {} } = {}) {
  return {
    body,
    authenticatedUser,
    params,
    get(name) {
      return headers[name.toLowerCase()];
    },
  };
}

function createResponse() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

test('reports complete persistence when both authenticated chat messages are saved', async () => {
  const calls = [];
  const conversationId = 'c0ffee00-0000-4000-8000-000000000001';
  const aiResponse = { reply: 'Assistant reply', provider: 'gemini' };
  modelService.generateResponse = async (message) => {
    assert.equal(message, 'Hello');
    return aiResponse;
  };
  conversationRepository.saveUserMessage = async (input) => {
    calls.push(['user', input]);
    return conversationId;
  };
  conversationRepository.saveAssistantMessage = async (input) => {
    calls.push(['assistant', input]);
  };

  const req = createRequest({
    body: { message: '  Hello  ' },
    authenticatedUser: { id: 'user-123' },
  });
  const res = createResponse();
  let nextError;

  await aiController.sendMessage(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    data: {
      ...aiResponse,
      persistence: {
        status: 'complete',
        userMessageSaved: true,
        assistantMessageSaved: true,
      },
    },
  });
  assert.equal(res.headers['X-Conversation-Id'], conversationId);
  assert.deepEqual(calls, [
    ['user', { userId: 'user-123', conversationId: null, submissionId: null, content: 'Hello' }],
    ['assistant', {
      userId: 'user-123',
      conversationId,
      submissionId: null,
      provider: 'gemini',
      content: 'Assistant reply',
    }],
  ]);
});

test('returns the AI reply when database persistence fails without logging database details', async () => {
  const log = [];
  const aiResponse = { reply: 'Still available', provider: 'ollama' };
  modelService.generateResponse = async () => aiResponse;
  conversationRepository.saveUserMessage = async () => {
    throw Object.assign(new Error('database detail service-role-secret'), {
      name: 'DatabaseOperationError',
      operation: 'save message',
    });
  };
  console.error = (...args) => {
    log.push(args);
  };

  const req = createRequest({
    body: { message: 'Hi' },
    authenticatedUser: { id: 'user-123' },
  });
  const res = createResponse();
  let nextError;

  await aiController.sendMessage(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    data: {
      ...aiResponse,
      persistence: {
        status: 'failed',
        userMessageSaved: false,
        assistantMessageSaved: false,
      },
    },
  });
  assert.equal(log.flat().join(' ').includes('service-role-secret'), false);
});

test('reports partial persistence when saving the assistant message fails', async () => {
  const log = [];
  modelService.generateResponse = async () => ({
    reply: 'Delivered but not fully saved',
    provider: 'gemini',
  });
  conversationRepository.saveUserMessage = async () => 'c0ffee00-0000-4000-8000-000000000001';
  conversationRepository.saveAssistantMessage = async () => {
    throw Object.assign(new Error('database detail service-role-secret'), {
      name: 'DatabaseOperationError',
      operation: 'save message',
    });
  };
  console.error = (...args) => log.push(args);

  const req = createRequest({
    body: { message: 'Hi' },
    authenticatedUser: { id: 'user-123' },
  });
  const res = createResponse();
  let nextError;

  await aiController.sendMessage(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.data.persistence, {
    status: 'partial',
    userMessageSaved: true,
    assistantMessageSaved: false,
  });
  assert.equal(res.body.data.reply, 'Delivered but not fully saved');
  assert.equal(res.headers['X-Conversation-Id'], 'c0ffee00-0000-4000-8000-000000000001');
  assert.equal(log.flat().join(' ').includes('service-role-secret'), false);
});

test('reports saved user-message status when AI generation fails', async () => {
  modelService.generateResponse = async () => {
    throw new Error('Provider unavailable');
  };
  conversationRepository.saveUserMessage = async () => 'c0ffee00-0000-4000-8000-000000000001';

  const req = createRequest({
    body: { message: 'Hi' },
    authenticatedUser: { id: 'user-123' },
  });
  const res = createResponse();
  let nextError;

  await aiController.sendMessage(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError.persistence.status, 'partial');
  assert.deepEqual(nextError.persistence, {
    status: 'partial',
    userMessageSaved: true,
    assistantMessageSaved: false,
  });
  assert.equal(res.headers['X-Conversation-Id'], 'c0ffee00-0000-4000-8000-000000000001');
});

test('keeps anonymous chat responses working without persisting private conversations', async () => {
  const aiResponse = { reply: 'Anonymous reply', provider: 'gemini' };
  modelService.generateResponse = async () => aiResponse;
  conversationRepository.saveUserMessage = async () => {
    assert.fail('Anonymous messages must not be persisted.');
  };

  const req = createRequest({ body: { message: 'Hi' } });
  const res = createResponse();
  let nextError;

  await aiController.sendMessage(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.deepEqual(res.body, {
    data: {
      ...aiResponse,
      persistence: {
        status: 'not_applicable',
        userMessageSaved: false,
        assistantMessageSaved: false,
      },
    },
  });
  assert.equal(res.headers['X-Conversation-Id'], undefined);
});

test('coalesces concurrent authenticated requests with the same idempotency key', async () => {
  const conversationId = 'c0ffee00-0000-4000-8000-000000000001';
  const submissionId = 'c0ffee00-0000-4000-8000-000000000002';
  let releaseGeneration;
  let generationCount = 0;
  let userSaveCount = 0;
  let assistantSaveCount = 0;
  modelService.generateResponse = async () => {
    generationCount += 1;
    await new Promise((resolve) => {
      releaseGeneration = resolve;
    });
    return { reply: 'One reply', provider: 'gemini' };
  };
  conversationRepository.saveUserMessage = async () => {
    userSaveCount += 1;
    return { conversationId, duplicate: false };
  };
  conversationRepository.getAssistantMessage = async () => null;
  conversationRepository.saveAssistantMessage = async ({ content }) => {
    assistantSaveCount += 1;
    return { content };
  };

  const headers = { 'idempotency-key': submissionId };
  const requests = [
    { req: createRequest({ body: { message: 'Hello' }, authenticatedUser: { id: 'user-123' }, headers }), res: createResponse() },
    { req: createRequest({ body: { message: 'Hello' }, authenticatedUser: { id: 'user-123' }, headers }), res: createResponse() },
  ];
  const pending = requests.map(({ req, res }) => aiController.sendMessage(req, res, assert.fail));
  await new Promise((resolve) => setImmediate(resolve));
  releaseGeneration();
  await Promise.all(pending);

  assert.equal(generationCount, 1);
  assert.equal(userSaveCount, 1);
  assert.equal(assistantSaveCount, 1);
  for (const { res } of requests) {
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['X-Conversation-Id'], conversationId);
    assert.equal(res.body.data.persistence.status, 'complete');
  }
});

test('rejects concurrent reuse of an idempotency key with different content', async () => {
  const submissionId = 'c0ffee00-0000-4000-8000-000000000002';
  let releaseGeneration;
  let markGenerationStarted;
  const generationStarted = new Promise((resolve) => {
    markGenerationStarted = resolve;
  });
  modelService.generateResponse = async () => new Promise((resolve) => {
    releaseGeneration = () => resolve({ reply: 'First request', provider: 'gemini' });
    markGenerationStarted();
  });
  conversationRepository.saveUserMessage = async () => 'c0ffee00-0000-4000-8000-000000000001';
  conversationRepository.getAssistantMessage = async () => null;
  conversationRepository.saveAssistantMessage = async () => ({ content: 'First request' });

  const firstResponse = createResponse();
  const firstRequest = aiController.sendMessage(createRequest({
    body: { message: 'First message' },
    authenticatedUser: { id: 'user-123' },
    headers: { 'idempotency-key': submissionId },
  }), firstResponse, assert.fail);
  await generationStarted;

  let conflict;
  await aiController.sendMessage(createRequest({
    body: { message: 'Different message' },
    authenticatedUser: { id: 'user-123' },
    headers: { 'idempotency-key': submissionId },
  }), createResponse(), (error) => {
    conflict = error;
  });

  assert.equal(conflict.statusCode, 409);
  releaseGeneration();
  await firstRequest;
});

test('passes submission IDs to the database idempotency function', async () => {
  const conversationId = 'c0ffee00-0000-4000-8000-000000000001';
  const submissionId = 'c0ffee00-0000-4000-8000-000000000002';
  let rpcCall;
  supabaseClient.getSupabaseClient = () => ({
    rpc(name, args) {
      rpcCall = { name, args };
      return Promise.resolve({
        data: [{ conversation_id: conversationId, duplicate: true }],
        error: null,
      });
    },
  });

  const result = await conversationRepository.saveUserMessage({
    userId: 'user-123',
    conversationId: null,
    submissionId,
    content: 'Question',
  });

  assert.deepEqual(rpcCall, {
    name: 'save_user_message_once',
    args: {
      p_user_id: 'user-123',
      p_conversation_id: null,
      p_submission_id: submissionId,
      p_content: 'Question',
    },
  });
  assert.deepEqual(result, { conversationId, duplicate: true });
});

test('rejects reusing a submission ID with different content', async () => {
  supabaseClient.getSupabaseClient = () => ({
    rpc() {
      return Promise.resolve({
        data: null,
        error: { code: '22023', message: 'content mismatch' },
      });
    },
  });

  await assert.rejects(
    conversationRepository.saveUserMessage({
      userId: 'user-123',
      submissionId: 'c0ffee00-0000-4000-8000-000000000002',
      content: 'Different content',
    }),
    IdempotencyConflictError,
  );
});

test('returns the canonical assistant response when another request already inserted it', async () => {
  const conversationId = 'c0ffee00-0000-4000-8000-000000000001';
  const submissionId = 'c0ffee00-0000-4000-8000-000000000002';
  const calls = [];
  supabaseClient.getSupabaseClient = () => ({
    from(table) {
      const builder = {
        eq(field, value) {
          calls.push({ table, method: 'eq', field, value });
          return this;
        },
        insert(value) {
          calls.push({ table, method: 'insert', value });
          return this;
        },
        maybeSingle() {
          return Promise.resolve({
            data: table === 'conversations'
              ? { id: conversationId }
              : { content: 'Canonical reply', provider: 'ollama' },
            error: null,
          });
        },
        select() {
          return this;
        },
        single() {
          return Promise.resolve({
            data: null,
            error: { code: '23505' },
          });
        },
      };
      return builder;
    },
  });

  const result = await conversationRepository.saveAssistantMessage({
    userId: 'user-123',
    conversationId,
    submissionId,
    provider: 'gemini',
    content: 'Competing reply',
  });

  assert.deepEqual(result, { content: 'Canonical reply', provider: 'ollama' });
  assert.ok(calls.some((call) => call.table === 'messages'
    && call.method === 'insert'
    && call.value.submission_id === submissionId
    && call.value.provider === 'gemini'));
});

test('reuses an already-saved assistant reply on a later retry', async () => {
  const conversationId = 'c0ffee00-0000-4000-8000-000000000001';
  const submissionId = 'c0ffee00-0000-4000-8000-000000000002';
  let generateCount = 0;
  let userSaveCount = 0;
  let savedReply = null;
  modelService.generateResponse = async () => {
    generateCount += 1;
    return { reply: 'Saved reply', provider: 'gemini' };
  };
  conversationRepository.saveUserMessage = async () => {
    userSaveCount += 1;
    return { conversationId, duplicate: userSaveCount > 1 };
  };
  conversationRepository.getAssistantMessage = async () => (
    savedReply ? { content: savedReply } : null
  );
  conversationRepository.saveAssistantMessage = async ({ content }) => {
    savedReply = content;
    return { content };
  };

  async function send() {
    const res = createResponse();
    await aiController.sendMessage(createRequest({
      body: { message: 'Hello' },
      authenticatedUser: { id: 'user-123' },
      headers: { 'idempotency-key': submissionId },
    }), res, assert.fail);
    return res;
  }

  const first = await send();
  const retry = await send();

  assert.equal(first.body.data.reply, 'Saved reply');
  assert.equal(retry.body.data.reply, 'Saved reply');
  assert.equal(first.body.data.persistence.status, 'complete');
  assert.equal(retry.body.data.persistence.status, 'complete');
  assert.equal(userSaveCount, 2);
  assert.equal(generateCount, 1);
});

test('includes safe persistence state in generation error responses', (t) => {
  t.mock.method(console, 'error', () => {});
  const res = createResponse();
  const persistence = {
    status: 'partial',
    userMessageSaved: true,
    assistantMessageSaved: false,
  };

  errorHandler(
    Object.assign(new Error('provider failed'), {
      statusCode: 503,
      publicMessage: 'AI service is unavailable.',
      persistence,
    }),
    {},
    res,
    assert.fail,
  );

  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, {
    error: { message: 'AI service is unavailable.' },
    persistence,
  });
});

test('retrieves history using the verified user ID', async () => {
  const history = {
    conversationId: 'c0ffee00-0000-4000-8000-000000000001',
    messages: [],
  };
  let received;
  conversationRepository.getConversationHistory = async (userId, conversationId) => {
    received = { userId, conversationId };
    return history;
  };

  const req = createRequest({
    authenticatedUser: { id: 'user-123' },
    params: { conversationId: history.conversationId },
  });
  const res = createResponse();
  let nextError;

  await conversationController.getConversationHistory(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.deepEqual(received, { userId: 'user-123', conversationId: history.conversationId });
  assert.deepEqual(res.body, { data: history });
});

test('lists conversations using the verified user ID', async () => {
  const conversations = [{
    id: 'c0ffee00-0000-4000-8000-000000000001',
    createdAt: 'created',
    updatedAt: 'updated',
  }];
  let receivedUserId;
  conversationRepository.listConversations = async (userId) => {
    receivedUserId = userId;
    return conversations;
  };

  const req = createRequest({ authenticatedUser: { id: 'user-123' } });
  const res = createResponse();
  let nextError;

  await conversationController.listConversations(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 200);
  assert.equal(receivedUserId, 'user-123');
  assert.deepEqual(res.body, { data: conversations });
});

test('deletes only the conversation selected by the verified user', async () => {
  let received;
  conversationRepository.deleteConversation = async (userId, conversationId) => {
    received = { userId, conversationId };
  };

  const req = createRequest({
    authenticatedUser: { id: 'user-123' },
    params: { conversationId: 'c0ffee00-0000-4000-8000-000000000001' },
  });
  const res = createResponse();
  let nextError;

  await conversationController.deleteConversation(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 204);
  assert.deepEqual(received, {
    userId: 'user-123',
    conversationId: 'c0ffee00-0000-4000-8000-000000000001',
  });
});

function createQueryBuilder(table, response, calls) {
  const builder = {
    delete() {
      calls.push({ table, method: 'delete' });
      return this;
    },
    insert(value) {
      calls.push({ table, method: 'insert', value });
      return this;
    },
    select(value) {
      calls.push({ table, method: 'select', value });
      return this;
    },
    eq(field, value) {
      calls.push({ table, method: 'eq', field, value });
      return this;
    },
    maybeSingle() {
      return Promise.resolve(response);
    },
    single() {
      return Promise.resolve(response);
    },
    order(field, options) {
      calls.push({ table, method: 'order', field, options });
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(response).then(resolve, reject);
    },
  };

  return builder;
}

test('repository creates conversations and saves each role with the authenticated owner', async () => {
  const calls = [];
  const conversationId = 'c0ffee00-0000-4000-8000-000000000001';
  const fakeClient = {
    from(table) {
      const response = table === 'conversations'
        ? { data: { id: conversationId }, error: null }
        : { data: null, error: null };
      return createQueryBuilder(table, response, calls);
    },
  };
  supabaseClient.getSupabaseClient = () => fakeClient;

  const savedId = await conversationRepository.saveUserMessage({
    userId: 'user-123',
    content: 'Question',
  });
  await conversationRepository.saveAssistantMessage({
    userId: 'user-123',
    conversationId: savedId,
    content: 'Answer',
  });

  assert.equal(savedId, conversationId);
  assert.deepEqual(calls.filter((call) => call.method === 'insert'), [
    { table: 'conversations', method: 'insert', value: { user_id: 'user-123' } },
    {
      table: 'messages',
      method: 'insert',
      value: {
        conversation_id: conversationId,
        user_id: 'user-123',
        role: 'user',
        content: 'Question',
      },
    },
    {
      table: 'messages',
      method: 'insert',
      value: {
        conversation_id: conversationId,
        user_id: 'user-123',
        role: 'assistant',
        content: 'Answer',
      },
    },
  ]);
});

test('repository scopes history queries to the authenticated user', async () => {
  const calls = [];
  const conversationId = 'c0ffee00-0000-4000-8000-000000000001';
  const fakeClient = {
    from(table) {
      const response = table === 'conversations'
        ? {
          data: { id: conversationId, created_at: 'created', updated_at: 'updated' },
          error: null,
        }
        : {
          data: [{ id: 'message-1', role: 'user', content: 'Hello', created_at: 'created' }],
          error: null,
        };
      return createQueryBuilder(table, response, calls);
    },
  };
  supabaseClient.getSupabaseClient = () => fakeClient;

  const history = await conversationRepository.getConversationHistory('user-123', conversationId);

  assert.deepEqual(history.messages, [{
    id: 'message-1',
    role: 'user',
    content: 'Hello',
    createdAt: 'created',
  }]);
  assert.ok(calls.some((call) => call.table === 'conversations'
    && call.method === 'eq' && call.field === 'user_id' && call.value === 'user-123'));
  assert.ok(calls.some((call) => call.table === 'messages'
    && call.method === 'eq' && call.field === 'user_id' && call.value === 'user-123'));
});

test('repository lists conversations for the authenticated user in update order', async () => {
  const calls = [];
  const fakeClient = {
    from(table) {
      return createQueryBuilder(table, {
        data: [{
          id: 'c0ffee00-0000-4000-8000-000000000001',
          created_at: 'created',
          updated_at: 'updated',
        }],
        error: null,
      }, calls);
    },
  };
  supabaseClient.getSupabaseClient = () => fakeClient;

  const conversations = await conversationRepository.listConversations('user-123');

  assert.deepEqual(conversations, [{
    id: 'c0ffee00-0000-4000-8000-000000000001',
    createdAt: 'created',
    updatedAt: 'updated',
  }]);
  assert.ok(calls.some((call) => call.table === 'conversations'
    && call.method === 'eq' && call.field === 'user_id' && call.value === 'user-123'));
  assert.ok(calls.some((call) => call.method === 'order'
    && call.field === 'updated_at' && call.options.ascending === false));
});

test('repository refuses to append a message to another user conversation', async () => {
  const calls = [];
  const fakeClient = {
    from(table) {
      return createQueryBuilder(table, { data: null, error: null }, calls);
    },
  };
  supabaseClient.getSupabaseClient = () => fakeClient;

  await assert.rejects(
    conversationRepository.saveUserMessage({
      userId: 'user-123',
      conversationId: 'c0ffee00-0000-4000-8000-000000000002',
      content: 'Unauthorized append',
    }),
    ConversationNotFoundError,
  );
  assert.equal(calls.some((call) => call.method === 'insert'), false);
  assert.ok(calls.some((call) => call.method === 'eq'
    && call.field === 'user_id' && call.value === 'user-123'));
});

test('repository scopes conversation deletion to the authenticated user', async () => {
  const calls = [];
  const conversationId = 'c0ffee00-0000-4000-8000-000000000001';
  const fakeClient = {
    from(table) {
      return createQueryBuilder(table, { data: { id: conversationId }, error: null }, calls);
    },
  };
  supabaseClient.getSupabaseClient = () => fakeClient;

  await conversationRepository.deleteConversation('user-123', conversationId);

  assert.ok(calls.some((call) => call.method === 'delete'));
  assert.ok(calls.some((call) => call.method === 'eq'
    && call.field === 'id' && call.value === conversationId));
  assert.ok(calls.some((call) => call.method === 'eq'
    && call.field === 'user_id' && call.value === 'user-123'));
});
