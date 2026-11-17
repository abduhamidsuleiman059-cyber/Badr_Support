const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const config = require('../src/config/config');
const geminiProvider = require('../src/services/ai/geminiProvider');
const originalFetch = global.fetch;
const originalConsoleError = console.error;

afterEach(() => {
  global.fetch = originalFetch;
  console.error = originalConsoleError;
});

test('logs Gemini API status and code without logging secrets', async () => {
  const apiMessage = [
    'Service unavailable',
    'Authorization: Bearer test-token',
    'api_key=test-api-key',
    config.geminiApiKey,
  ].filter(Boolean).join('; ');
  let diagnostic;

  global.fetch = async () => new Response(JSON.stringify({
    error: {
      code: 503,
      message: apiMessage,
      status: 'UNAVAILABLE',
    },
  }), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'application/json' },
  });
  console.error = (...args) => {
    diagnostic = args;
  };

  await assert.rejects(() => geminiProvider.generateResponse('Test prompt'), (error) => {
    assert.equal(error.name, 'ProviderUnavailableError');
    assert.equal(error.statusCode, 503);
    return true;
  });

  assert.equal(diagnostic[0], '[Gemini] API request failed');
  assert.equal(diagnostic[1].httpStatus, 503);
  assert.equal(diagnostic[1].apiCode, 'UNAVAILABLE');
  assert.match(diagnostic[1].message, /Service unavailable/);
  assert.doesNotMatch(JSON.stringify(diagnostic), /test-token|test-api-key/);
  if (config.geminiApiKey) {
    assert.equal(JSON.stringify(diagnostic).includes(config.geminiApiKey), false);
  }
});
