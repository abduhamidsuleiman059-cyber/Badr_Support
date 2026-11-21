require('dotenv').config();

const port = Number(process.env.PORT || 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const aiProvider = process.env.AI_PROVIDER || 'gemini';

if (!['gemini', 'ollama'].includes(aiProvider)) {
  throw new Error('AI_PROVIDER must be either "gemini" or "ollama".');
}

const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

const geminiApiKey = process.env.GEMINI_API_KEY?.trim() || '';
const geminiModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
const geminiTimeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 30000);

if (!Number.isInteger(geminiTimeoutMs) || geminiTimeoutMs < 1 || geminiTimeoutMs > 120000) {
  throw new Error('GEMINI_TIMEOUT_MS must be an integer between 1 and 120000.');
}

const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434')
  .replace(/\/+$/, '');

let parsedOllamaBaseUrl;

try {
  parsedOllamaBaseUrl = new URL(ollamaBaseUrl);
} catch {
  throw new Error('OLLAMA_BASE_URL must be a valid HTTP or HTTPS URL.');
}

if (!['http:', 'https:'].includes(parsedOllamaBaseUrl.protocol)
  || parsedOllamaBaseUrl.username
  || parsedOllamaBaseUrl.password
  || parsedOllamaBaseUrl.search
  || parsedOllamaBaseUrl.hash) {
  throw new Error('OLLAMA_BASE_URL must be an HTTP or HTTPS URL without credentials, query, or fragment.');
}

const ollamaModel = process.env.OLLAMA_MODEL?.trim() || 'llama3.2:1b';

if (/\s/.test(ollamaModel)) {
  throw new Error('OLLAMA_MODEL must not contain whitespace.');
}

const ollamaTimeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);

if (!Number.isInteger(ollamaTimeoutMs) || ollamaTimeoutMs < 1 || ollamaTimeoutMs > 300000) {
  throw new Error('OLLAMA_TIMEOUT_MS must be an integer between 1 and 300000.');
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port,
  corsOrigins,
  supabaseUrl,
  supabaseServiceRoleKey,
  aiProvider,
  geminiApiKey,
  geminiModel,
  geminiTimeoutMs,
  ollamaBaseUrl,
  ollamaModel,
  ollamaTimeoutMs,
};
