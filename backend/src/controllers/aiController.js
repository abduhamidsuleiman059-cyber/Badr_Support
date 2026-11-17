const { HttpError } = require('../middleware/errorHandler');
const modelService = require('../services/modelService');

async function sendMessage(req, res, next) {
  try {
    const message = typeof req.body?.message === 'string'
      ? req.body.message.trim()
      : '';

    if (!message) {
      throw new HttpError(400, 'A non-empty message is required.');
    }

    if (message.length > 4000) {
      throw new HttpError(400, 'Message must be 4000 characters or fewer.');
    }

    const response = await modelService.generateResponse(message);
    return res.status(200).json({ data: response });
  } catch (error) {
    return next(error);
  }
}

module.exports = { sendMessage };
