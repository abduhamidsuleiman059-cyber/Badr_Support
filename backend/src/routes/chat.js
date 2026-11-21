const express = require('express');
const { sendMessage } = require('../controllers/aiController');
const {
  listConversations,
  getConversationHistory,
  deleteConversation,
} = require('../controllers/conversationController');
const {
  optionalSupabaseAuth,
  requireSupabaseAuth,
} = require('../middleware/supabaseAuth');

const router = express.Router();

router.post('/', optionalSupabaseAuth, sendMessage);
router.get('/conversations', requireSupabaseAuth, listConversations);
router.get('/conversations/:conversationId', requireSupabaseAuth, getConversationHistory);
router.delete('/conversations/:conversationId', requireSupabaseAuth, deleteConversation);

module.exports = router;
