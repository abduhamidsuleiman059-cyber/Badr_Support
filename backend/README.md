# BADR_SUPPORT Backend

Standalone Express API for the BADR_SUPPORT application. It is not connected to the frontend, authentication, or Supabase yet.

## Requirements

- Node.js 22 or newer
- npm

## Setup

From this directory:

```sh
npm install
Copy-Item .env.example .env
npm run dev
```

Set `GEMINI_API_KEY` in the ignored `backend/.env` file. Set `GEMINI_MODEL` there to select the Gemini model; it defaults to `gemini-3.5-flash-lite`. `GEMINI_TIMEOUT_MS` controls the request timeout (default 30000, maximum 120000). Never put the key in frontend code or commit `.env`.

Set `CORS_ORIGINS` to a comma-separated list of exact frontend origins that should be allowed. Requests without an `Origin` header (for example, command-line health checks) are also accepted. Unlisted browser origins are rejected.

## Endpoints

- `GET /api/health` — service status
- `POST /api/chat` — validates a `message` string (1-4000 characters) and returns `{ "data": { "reply": "...", "provider": "..." } }`

Example request body:

```json
{ "message": "Hello" }
```

`AI_PROVIDER` remains `gemini` by default; the language router determines the chat provider regardless of that setting. Gemini uses Google's official `@google/genai` SDK. Statistical language detection, with conservative markers for short and mixed-language messages, sends English messages to Ollama and Kiswahili, mixed Kiswahili-English, other, or undetected languages to Gemini. If Ollama fails for an English message, the backend falls back to Gemini; Gemini errors continue through the existing safe error handling. Ollama uses its local `/api/chat` endpoint, configured by `OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`) and `OLLAMA_MODEL` (default `llama3.2:1b`). `OLLAMA_TIMEOUT_MS` controls its request timeout (default 120000, maximum 300000). Install the model locally with `ollama pull llama3.2:1b`.

Provider errors and timeouts return safe HTTP 502/503/504 responses without exposing internal error details.

## Scripts

- `npm run dev` — start with Node.js watch mode
- `npm start` — start the production server
- `npm test` — run backend tests
