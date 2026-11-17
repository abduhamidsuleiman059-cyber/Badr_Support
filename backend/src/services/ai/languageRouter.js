const { detectLanguage } = require('./languageDetector');
const { getProvider } = require('./aiRouter');

async function generateResponse(message) {
  const language = await detectLanguage(message);

  if (language !== 'english') {
    return getProvider('gemini').generateResponse(message);
  }

  try {
    return await getProvider('ollama').generateResponse(message);
  } catch (error) {
    console.warn('[AI] Ollama failed; falling back to Gemini.', {
      error: error?.name || 'Error',
      statusCode: Number.isInteger(error?.statusCode) ? error.statusCode : null,
    });
    return getProvider('gemini').generateResponse(message);
  }
}

module.exports = { generateResponse };
