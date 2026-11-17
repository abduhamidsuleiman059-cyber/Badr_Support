const config = require('../../config/config');
const geminiProvider = require('./geminiProvider');
const ollamaProvider = require('./ollamaProvider');

const providers = {
  gemini: geminiProvider,
  ollama: ollamaProvider,
};

function getProvider(providerName = config.aiProvider) {
  const provider = providers[providerName];

  if (!provider) {
    throw new Error(`Unsupported AI provider: ${providerName}`);
  }

  return provider;
}

function getFallbackProvider(providerName = config.aiProvider) {
  return getProvider(providerName === 'gemini' ? 'ollama' : 'gemini');
}

module.exports = { getProvider, getFallbackProvider };
