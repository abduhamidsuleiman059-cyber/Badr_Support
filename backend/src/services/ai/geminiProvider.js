const { GoogleGenAI } = require('@google/genai');
const config = require('../../config/config');

let client;

class ProviderNotConfiguredError extends Error {
  constructor(provider) {
    super(`${provider} provider is not configured.`);
    this.name = 'ProviderNotConfiguredError';
    this.provider = provider;
    this.statusCode = 503;
    this.publicMessage = provider === 'Gemini'
      ? 'Gemini is not configured. Set GEMINI_API_KEY in backend/.env.'
      : `${provider} provider is not configured.`;
  }
}

class ProviderTimeoutError extends Error {
  constructor() {
    super('Gemini request timed out.');
    this.name = 'ProviderTimeoutError';
    this.statusCode = 504;
    this.publicMessage = 'Gemini request timed out. Please try again.';
  }
}

class ProviderUnavailableError extends Error {
  constructor() {
    super('Gemini is temporarily unavailable.');
    this.name = 'ProviderUnavailableError';
    this.statusCode = 503;
    this.publicMessage = 'Gemini is temporarily unavailable. Please try again later.';
  }
}

class ProviderRequestError extends Error {
  constructor() {
    super('Gemini request failed.');
    this.name = 'ProviderRequestError';
    this.statusCode = 502;
    this.publicMessage = 'Gemini could not complete the request. Please try again.';
  }
}

function getClient() {
  if (!config.geminiApiKey) {
    throw new ProviderNotConfiguredError('Gemini');
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: {
        timeout: config.geminiTimeoutMs,
        retryOptions: { attempts: 1 },
      },
    });
  }

  return client;
}

function isTimeoutError(error) {
  return error?.status === 504
    || error?.code === 'DEADLINE_EXCEEDED'
    || error?.name === 'TimeoutError'
    || error?.name === 'AbortError'
    || ['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT'].includes(error?.code)
    || /timed?\s*out|deadline\s+(?:exceeded|expired)/i.test(error?.message || '');
}

function sanitizeDiagnosticText(value) {
  let text = String(value ?? '');

  if (config.geminiApiKey) {
    text = text.split(config.geminiApiKey).join('[REDACTED]');
  }

  return text
    .replace(/\bBearer\s+[^\s,;"']+/gi, 'Bearer [REDACTED]')
    .replace(/((?:["']?(?:authorization|x-goog-api-key|gemini[_-]?api[_-]?key|api[_-]?key)["']?)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;}]+)/gi, '$1"[REDACTED]"')
    .replace(/([?&](?:key|api_key)=)[^&\s"'`]+/gi, '$1[REDACTED]');
}

function getApiError(error) {
  if (error?.error && typeof error.error === 'object') {
    return error.error;
  }

  try {
    const payload = JSON.parse(error?.message);
    return payload?.error && typeof payload.error === 'object'
      ? payload.error
      : null;
  } catch {
    return null;
  }
}

function logGeminiError(error) {
  const apiError = getApiError(error);
  const status = [error?.status, error?.statusCode, apiError?.code]
    .find(Number.isInteger) ?? null;
  const code = error?.code || apiError?.status
    || (typeof apiError?.code === 'string' ? apiError.code : null);
  const message = apiError?.message ?? error?.message ?? '';

  console.error('[Gemini] API request failed', {
    httpStatus: status,
    apiCode: typeof code === 'number' ? code : sanitizeDiagnosticText(code),
    message: sanitizeDiagnosticText(message),
  });
}

async function generateResponse(message) {
  try {
    const response = await getClient().models.generateContent({
      model: config.geminiModel,
      contents: message,
    }, {
      timeout_ms: config.geminiTimeoutMs,
      retries: { strategy: 'none' },
    });
    const reply = typeof response.text === 'string' ? response.text.trim() : '';

    if (!reply) {
      throw new ProviderRequestError();
    }

    return { reply, provider: 'gemini' };
  } catch (error) {
    if (error instanceof ProviderNotConfiguredError || error instanceof ProviderRequestError) {
      throw error;
    }

    logGeminiError(error);

    if (isTimeoutError(error)) {
      throw new ProviderTimeoutError();
    }

    if (error?.status === 503 || error?.code === 'UNAVAILABLE') {
      throw new ProviderUnavailableError();
    }

    throw new ProviderRequestError();
  }
}

module.exports = {
  generateResponse,
  ProviderNotConfiguredError,
  ProviderRequestError,
  ProviderTimeoutError,
  ProviderUnavailableError,
};
