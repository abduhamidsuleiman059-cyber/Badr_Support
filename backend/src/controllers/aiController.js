const { HttpError } = require('../middleware/errorHandler');
const conversationRepository = require('../services/database/conversationRepository');
const modelService = require('../services/modelService');

const CONVERSATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUBMISSION_ID_PATTERN = CONVERSATION_ID_PATTERN;
const inFlightSubmissions = new Map();
const { IdempotencyConflictError } = require('../services/database/databaseErrors');

function getPersistenceStatus(authenticated, userMessageSaved, assistantMessageSaved) {
  if (!authenticated) {
    return {
      status: 'not_applicable',
      userMessageSaved: false,
      assistantMessageSaved: false,
    };
  }

  if (userMessageSaved && assistantMessageSaved) {
    return {
      status: 'complete',
      userMessageSaved: true,
      assistantMessageSaved: true,
    };
  }

  if (userMessageSaved) {
    return {
      status: 'partial',
      userMessageSaved: true,
      assistantMessageSaved: false,
    };
  }

  return {
    status: 'failed',
    userMessageSaved: false,
    assistantMessageSaved: false,
  };
}

function logPersistenceFailure(error) {
  console.error('[Chat] Conversation persistence failed.', {
    error: typeof error?.name === 'string' ? error.name : 'Error',
    operation: typeof error?.operation === 'string' ? error.operation : 'persist message',
  });
}

async function generateAndPersist({
  userId,
  message,
  requestedConversationId,
  submissionId,
}) {
  let conversationId = null;
  let userMessageSaved = false;
  let assistantMessageSaved = false;
  let savedAssistantReply = null;
  let savedAssistantProvider = null;

  if (userId) {
    try {
      const savedUserMessage = await conversationRepository.saveUserMessage({
        userId,
        conversationId: requestedConversationId,
        submissionId,
        content: message,
      });
      conversationId = typeof savedUserMessage === 'string'
        ? savedUserMessage
        : savedUserMessage.conversationId;
      userMessageSaved = Boolean(conversationId);

      if (userMessageSaved && submissionId) {
        const existingAssistant = await conversationRepository.getAssistantMessage({
          userId,
          submissionId,
        });
        if (existingAssistant) {
          assistantMessageSaved = true;
          savedAssistantReply = existingAssistant.content;
          savedAssistantProvider = existingAssistant.provider;
        }
      }
    } catch (error) {
      if (error instanceof IdempotencyConflictError) throw error;
      logPersistenceFailure(error);
    }
  }

  if (assistantMessageSaved) {
    return {
      conversationId,
      response: { reply: savedAssistantReply, provider: savedAssistantProvider },
      persistence: getPersistenceStatus(true, true, true),
    };
  }

  let response;
  try {
    response = await modelService.generateResponse(message);
  } catch (error) {
    if (error && typeof error === 'object') {
      error.persistence = getPersistenceStatus(Boolean(userId), userMessageSaved, false);
      if (conversationId) error.conversationId = conversationId;
    }
    throw error;
  }

  if (userId && userMessageSaved && conversationId) {
    try {
      const savedAssistantMessage = await conversationRepository.saveAssistantMessage({
        userId,
        conversationId,
        submissionId,
        provider: response.provider,
        content: response.reply,
      });
      assistantMessageSaved = true;
      if (savedAssistantMessage?.content) {
        response = {
          ...response,
          reply: savedAssistantMessage.content,
          provider: savedAssistantMessage.provider || response.provider,
        };
      }
    } catch (error) {
      logPersistenceFailure(error);
    }
  }

  return {
    conversationId,
    response,
    persistence: getPersistenceStatus(Boolean(userId), userMessageSaved, assistantMessageSaved),
  };
}

function getOrRunSubmission(userId, submissionId, message, operation) {
  const key = `${userId}:${submissionId}`;
  const existing = inFlightSubmissions.get(key);
  if (existing) {
    if (existing.message !== message) {
      throw new HttpError(409, 'This submission ID has already been used for a different message.');
    }
    return existing.promise;
  }

  const entry = { message, promise: operation() };
  inFlightSubmissions.set(key, entry);
  return entry.promise.finally(() => {
    if (inFlightSubmissions.get(key) === entry) inFlightSubmissions.delete(key);
  });
}

async function sendMessage(req, res, next) {
  try {
    const message = typeof req.body?.message === 'string'
      ? req.body.message.trim()
      : '';
    const requestedConversationId = req.get('x-conversation-id')?.trim() || null;
    const submissionId = req.get('idempotency-key')?.trim() || null;

    if (!message) {
      throw new HttpError(400, 'A non-empty message is required.');
    }

    if (message.length > 4000) {
      throw new HttpError(400, 'Message must be 4000 characters or fewer.');
    }

    if (requestedConversationId && !CONVERSATION_ID_PATTERN.test(requestedConversationId)) {
      throw new HttpError(400, 'X-Conversation-Id must be a UUID.');
    }

    if (submissionId && !SUBMISSION_ID_PATTERN.test(submissionId)) {
      throw new HttpError(400, 'Idempotency-Key must be a UUID.');
    }

    const userId = req.authenticatedUser?.id || null;
    const operation = () => generateAndPersist({
      userId,
      message,
      requestedConversationId,
      submissionId: userId ? submissionId : null,
    });
    const result = userId && submissionId
      ? await getOrRunSubmission(userId, submissionId, message, operation)
      : await operation();

    if (result.conversationId) {
      res.set('X-Conversation-Id', result.conversationId);
    }

    return res.status(200).json({
      data: {
        ...result.response,
        persistence: result.persistence,
      },
    });
  } catch (error) {
    if (error?.conversationId) res.set('X-Conversation-Id', error.conversationId);
    return next(error);
  }
}

module.exports = { sendMessage };
