const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

process.env.AI_PROVIDER = 'ollama';
process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
process.env.OLLAMA_MODEL = 'test-model';
process.env.OLLAMA_TIMEOUT_MS = '40';

const config = require('../src/config/config');
const modelService = require('../src/services/modelService');
const geminiProvider = require('../src/services/ai/geminiProvider');
const ollamaProvider = require('../src/services/ai/ollamaProvider');
const originalFetch = global.fetch;
const originalGeminiGenerateResponse = geminiProvider.generateResponse;
const originalConsoleWarn = console.warn;

afterEach(() => {
  global.fetch = originalFetch;
  geminiProvider.generateResponse = originalGeminiGenerateResponse;
  console.warn = originalConsoleWarn;
});

test('uses configured Ollama API and maps the assistant response', async () => {
  let request;
  global.fetch = async (url, options) => {
    request = {
      url,
      options,
      body: JSON.parse(options.body),
    };

    return new Response(JSON.stringify({
      message: { role: 'assistant', content: '  Local answer  ' },
      done: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const result = await ollamaProvider.generateResponse('Test prompt');

  assert.equal(config.ollamaBaseUrl, 'http://127.0.0.1:11434');
  assert.equal(config.ollamaModel, 'test-model');
  assert.equal(request.url, 'http://127.0.0.1:11434/api/chat');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.signal instanceof AbortSignal, true);
  assert.deepEqual(request.body, {
    model: 'test-model',
    messages: [{ role: 'user', content: 'Test prompt' }],
    stream: false,
  });
  assert.deepEqual(result, { reply: 'Local answer', provider: 'ollama' });
});

test('maps Ollama connection failures to a safe unavailable error', async () => {
  global.fetch = async () => {
    const cause = Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' });
    throw new TypeError('fetch failed', { cause });
  };

  await assert.rejects(() => ollamaProvider.generateResponse('Test prompt'), (error) => {
    assert.equal(error.statusCode, 503);
    assert.equal(error.publicMessage, 'Ollama is unavailable. Ensure it is running and accessible.');
    assert.equal(error.message.includes('ECONNREFUSED'), false);
    return true;
  });
});

test('falls back to Gemini when an English Ollama request is unavailable', async () => {
  let calls = 0;
  let geminiMessage;
  global.fetch = async () => {
    calls++;
    const cause = Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' });
    throw new TypeError('fetch failed', { cause });
  };
  geminiProvider.generateResponse = async (message) => {
    geminiMessage = message;
    return { reply: 'Gemini fallback', provider: 'gemini' };
  };
  console.warn = () => {};

  const result = await modelService.generateResponse('Can you help me?');

  assert.equal(calls, 1);
  assert.equal(geminiMessage, 'Can you help me?');
  assert.deepEqual(result, { reply: 'Gemini fallback', provider: 'gemini' });
});

test('maps request timeouts to HTTP 504', async () => {
  global.fetch = (_url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });

  await assert.rejects(() => ollamaProvider.generateResponse('Test prompt'), (error) => {
    assert.equal(error.statusCode, 504);
    assert.equal(error.publicMessage, 'Ollama request timed out. Please try again.');
    return true;
  });
});

test('maps an uninstalled Ollama model to a safe HTTP 503 error', async () => {
  global.fetch = async () => new Response(JSON.stringify({
    error: 'model test-model not found; internal server details',
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });

  await assert.rejects(() => ollamaProvider.generateResponse('Test prompt'), (error) => {
    assert.equal(error.statusCode, 503);
    assert.equal(error.publicMessage, 'Configured Ollama model is unavailable. Verify that it is installed.');
    assert.equal(error.publicMessage.includes('internal server details'), false);
    return true;
  });
});

test('rejects invalid Ollama response payloads without exposing details', async () => {
  global.fetch = async () => new Response(JSON.stringify({
    message: { role: 'assistant', content: '' },
    internal: 'do not expose',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  await assert.rejects(() => ollamaProvider.generateResponse('Test prompt'), (error) => {
    assert.equal(error.statusCode, 502);
    assert.equal(error.publicMessage, 'Ollama could not complete the request. Please try again.');
    assert.equal(error.publicMessage.includes('do not expose'), false);
    return true;
  });
});
