const config = require('../../config/config');
const { ProviderNotConfiguredError } = require('./geminiProvider');

class OllamaTimeoutError extends Error {
  constructor() {
    super('Ollama request timed out.');
    this.name = 'OllamaTimeoutError';
    this.statusCode = 504;
    this.publicMessage = 'Ollama request timed out. Please try again.';
  }
}

class OllamaUnavailableError extends Error {
  constructor() {
    super('Ollama is unavailable.');
    this.name = 'OllamaUnavailableError';
    this.statusCode = 503;
    this.publicMessage = 'Ollama is unavailable. Ensure it is running and accessible.';
  }
}

class OllamaModelUnavailableError extends Error {
  constructor() {
    super('Configured Ollama model is unavailable.');
    this.name = 'OllamaModelUnavailableError';
    this.statusCode = 503;
    this.publicMessage = 'Configured Ollama model is unavailable. Verify that it is installed.';
  }
}

class OllamaRequestError extends Error {
  constructor() {
    super('Ollama request failed.');
    this.name = 'OllamaRequestError';
    this.statusCode = 502;
    this.publicMessage = 'Ollama could not complete the request. Please try again.';
  }
}

function isTimeoutError(error) {
  return error?.name === 'TimeoutError'
    || error?.name === 'AbortError'
    || error?.code === 'ETIMEDOUT'
    || error?.code === 'ABORT_ERR'
    || /timed?\s*out/i.test(error?.message || '');
}

function isConnectionError(error) {
  const connectionCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ENOTFOUND',
    'EAI_AGAIN',
  ];

  return connectionCodes.includes(error?.cause?.code)
    || connectionCodes.includes(error?.code)
    || (error instanceof TypeError && /fetch failed/i.test(error.message));
}

async function generateResponse(message) {
  try {
    const response = await fetch(`${config.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollamaModel,
        messages: [{ role: 'user', content: message }],
        stream: false,
      }),
      signal: AbortSignal.timeout(config.ollamaTimeoutMs),
    });

    if (response.status === 404) {
      throw new OllamaModelUnavailableError();
    }

    if (!response.ok) {
      if (response.status >= 500) {
        throw new OllamaUnavailableError();
      }

      throw new OllamaRequestError();
    }

    let data;

    try {
      data = await response.json();
    } catch {
      throw new OllamaRequestError();
    }

    const reply = typeof data?.message?.content === 'string'
      ? data.message.content.trim()
      : '';

    if (!reply) {
      throw new OllamaRequestError();
    }

    return { reply, provider: 'ollama' };
  } catch (error) {
    if (error instanceof OllamaTimeoutError
      || error instanceof OllamaUnavailableError
      || error instanceof OllamaModelUnavailableError
      || error instanceof OllamaRequestError) {
      throw error;
    }

    if (isTimeoutError(error)) {
      throw new OllamaTimeoutError();
    }

    if (isConnectionError(error)) {
      throw new OllamaUnavailableError();
    }

    throw new OllamaRequestError();
  }
}

module.exports = {
  generateResponse,
  ProviderNotConfiguredError,
  OllamaTimeoutError,
  OllamaUnavailableError,
  OllamaModelUnavailableError,
  OllamaRequestError,
};
