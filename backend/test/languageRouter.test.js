const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const geminiProvider = require('../src/services/ai/geminiProvider');
const ollamaProvider = require('../src/services/ai/ollamaProvider');
const modelService = require('../src/services/modelService');
const originalGeminiGenerateResponse = geminiProvider.generateResponse;
const originalOllamaGenerateResponse = ollamaProvider.generateResponse;
const originalConsoleWarn = console.warn;

afterEach(() => {
  geminiProvider.generateResponse = originalGeminiGenerateResponse;
  ollamaProvider.generateResponse = originalOllamaGenerateResponse;
  console.warn = originalConsoleWarn;
});

test('routes English messages to Ollama', async () => {
  const ollamaMessages = [];
  ollamaProvider.generateResponse = async (message) => {
    ollamaMessages.push(message);
    return { reply: 'Local reply', provider: 'ollama' };
  };
  geminiProvider.generateResponse = async () => {
    assert.fail('Gemini should not handle a detected English message.');
  };

  const messages = [
    'Can you help me with my account?',
    'Hello, I need help.',
  ];

  for (const message of messages) {
    const result = await modelService.generateResponse(message);
    assert.deepEqual(result, { reply: 'Local reply', provider: 'ollama' });
  }

  assert.deepEqual(ollamaMessages, messages);
});

test('routes Kiswahili messages to Gemini', async () => {
  let geminiMessage;
  ollamaProvider.generateResponse = async () => {
    assert.fail('Kiswahili must not be sent to Ollama.');
  };
  geminiProvider.generateResponse = async (message) => {
    geminiMessage = message;
    return { reply: 'Jibu', provider: 'gemini' };
  };

  const kiswahiliMessage = 'Umoja ni nguvu na utengano ni udhaifu.';
  const result = await modelService.generateResponse(kiswahiliMessage);

  assert.equal(geminiMessage, kiswahiliMessage);
  assert.deepEqual(result, { reply: 'Jibu', provider: 'gemini' });
});

test('routes other languages to Gemini', async () => {
  let geminiMessage;
  ollamaProvider.generateResponse = async () => {
    assert.fail('A non-English message must not be sent to Ollama.');
  };
  geminiProvider.generateResponse = async (message) => {
    geminiMessage = message;
    return { reply: 'Respuesta', provider: 'gemini' };
  };

  const result = await modelService.generateResponse('¿Puedes ayudarme con mi cuenta?');

  assert.equal(geminiMessage, '¿Puedes ayudarme con mi cuenta?');
  assert.deepEqual(result, { reply: 'Respuesta', provider: 'gemini' });
});

test('falls back to Gemini when Ollama fails for an English message', async () => {
  const calls = [];
  let warning;
  ollamaProvider.generateResponse = async () => {
    calls.push('ollama');
    throw Object.assign(new Error('Ollama is unavailable.'), { statusCode: 503 });
  };
  geminiProvider.generateResponse = async () => {
    calls.push('gemini');
    return { reply: 'Fallback reply', provider: 'gemini' };
  };
  console.warn = (...args) => {
    warning = args;
  };

  const result = await modelService.generateResponse('Can you help me?');

  assert.deepEqual(calls, ['ollama', 'gemini']);
  assert.deepEqual(result, { reply: 'Fallback reply', provider: 'gemini' });
  assert.equal(warning[0], '[AI] Ollama failed; falling back to Gemini.');
  assert.equal(warning[1].statusCode, 503);
});

test('propagates Gemini failures unchanged for primary and fallback requests', async () => {
  const geminiError = Object.assign(new Error('Gemini is temporarily unavailable.'), {
    statusCode: 503,
    publicMessage: 'Gemini is temporarily unavailable. Please try again later.',
  });
  geminiProvider.generateResponse = async () => {
    throw geminiError;
  };
  ollamaProvider.generateResponse = async () => {
    throw Object.assign(new Error('Ollama is unavailable.'), { statusCode: 503 });
  };
  console.warn = () => {};

  await assert.rejects(
    () => modelService.generateResponse('Habari, naomba msaada.'),
    (error) => error === geminiError,
  );
  await assert.rejects(
    () => modelService.generateResponse('Can you help me?'),
    (error) => error === geminiError,
  );
});

test('routes mixed Kiswahili-English messages to Gemini', async () => {
  let geminiMessage;
  ollamaProvider.generateResponse = async () => {
    assert.fail('A mixed Kiswahili-English message must not be sent to Ollama.');
  };
  geminiProvider.generateResponse = async (message) => {
    geminiMessage = message;
    return { reply: 'Jibu', provider: 'gemini' };
  };

  const mixedMessage = 'Habari, can you help me with my account?';
  const result = await modelService.generateResponse(mixedMessage);

  assert.equal(geminiMessage, mixedMessage);
  assert.deepEqual(result, { reply: 'Jibu', provider: 'gemini' });
});
