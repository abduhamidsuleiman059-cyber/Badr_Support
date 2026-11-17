const languageRouter = require('./ai/languageRouter');

async function generateResponse(message) {
  return languageRouter.generateResponse(message);
}

module.exports = { generateResponse };
