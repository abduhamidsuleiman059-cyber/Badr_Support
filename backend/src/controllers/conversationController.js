const { HttpError } = require('../middleware/errorHandler');
const conversationRepository = require('../services/database/conversationRepository');

const CONVERSATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function listConversations(req, res, next) {
  try {
    const conversations = await conversationRepository.listConversations(req.authenticatedUser.id);
    return res.status(200).json({ data: conversations });
  } catch (error) {
    return next(error);
  }
}

async function getConversationHistory(req, res, next) {
  try {
    const { conversationId } = req.params;

    if (!CONVERSATION_ID_PATTERN.test(conversationId)) {
      throw new HttpError(400, 'Conversation ID must be a UUID.');
    }

    const history = await conversationRepository.getConversationHistory(
      req.authenticatedUser.id,
      conversationId,
    );

    return res.status(200).json({ data: history });
  } catch (error) {
    return next(error);
  }
}

async function deleteConversation(req, res, next) {
  try {
    const { conversationId } = req.params;

    if (!CONVERSATION_ID_PATTERN.test(conversationId)) {
      throw new HttpError(400, 'Conversation ID must be a UUID.');
    }

    await conversationRepository.deleteConversation(
      req.authenticatedUser.id,
      conversationId,
    );

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listConversations,
  getConversationHistory,
  deleteConversation,
};
