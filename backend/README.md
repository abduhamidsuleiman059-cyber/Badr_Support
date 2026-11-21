# BADR_SUPPORT Backend

Standalone Express API for the BADR_SUPPORT application. Supabase conversation persistence is available to authenticated backend requests; the frontend remains separate.

## Requirements

- Node.js 22 or newer
- npm
- A Supabase project for authenticated conversation persistence

## Setup

From this directory:

```sh
npm install
Copy-Item .env.example .env
npm run dev
```

Set `GEMINI_API_KEY` in the ignored `backend/.env` file. Set `GEMINI_MODEL` there to select the Gemini model; it defaults to `gemini-3.5-flash-lite`. `GEMINI_TIMEOUT_MS` controls the request timeout (default 30000, maximum 120000). Never put the key in frontend code or commit `.env`.

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` to enable conversation storage. The service-role key is server-only and must never be sent to a client or committed. The initial schema is in `supabase/migrations/20261117000000_create_chat_tables.sql`. Before deploying idempotent submission support, manually review and apply the forward migration `supabase/migrations/20261120000000_add_chat_message_idempotency.sql`; the application does not run migrations automatically.

The Expo frontend reads `EXPO_PUBLIC_BACKEND_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from its root `.env`. Only the publishable key is used in the client. Set `CORS_ORIGINS` in `backend/.env` to the exact Expo Web origin; native requests do not send a browser origin.

Set `CORS_ORIGINS` to a comma-separated list of exact frontend origins that should be allowed. Requests without an `Origin` header (for example, command-line health checks) are also accepted. Unlisted browser origins are rejected.

## Endpoints

- `GET /api/health` — service status
- `POST /api/chat` — validates a `message` string (1-4000 characters) and returns `{ "data": { "reply": "...", "provider": "...", "persistence": { "status": "complete|partial|failed|not_applicable", "userMessageSaved": true, "assistantMessageSaved": true } } }`
- `GET /api/chat/conversations` — requires a Supabase access token and lists only the authenticated user's conversations
- `GET /api/chat/conversations/:conversationId` — requires a Supabase access token and returns history only when the conversation belongs to the authenticated user
- `DELETE /api/chat/conversations/:conversationId` — requires a Supabase access token and deletes only the authenticated user's selected conversation

Example request body:

```json
{ "message": "Hello" }
```

`AI_PROVIDER` remains `gemini` by default; the language router determines the chat provider regardless of that setting. Gemini uses Google's official `@google/genai` SDK. Statistical language detection, with conservative markers for short and mixed-language messages, sends English messages to Ollama and Kiswahili, mixed Kiswahili-English, other, or undetected languages to Gemini. If Ollama fails for an English message, the backend falls back to Gemini; Gemini errors continue through the existing safe error handling. Ollama uses its local `/api/chat` endpoint, configured by `OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`) and `OLLAMA_MODEL` (default `llama3.2:1b`). `OLLAMA_TIMEOUT_MS` controls its request timeout (default 120000, maximum 300000). Install the model locally with `ollama pull llama3.2:1b`.

Authenticated chat requests send `Authorization: Bearer <Supabase access token>`. The backend verifies the token with Supabase Auth and uses only its verified user ID for persistence. `persistence.status` is `complete` only when both the user and assistant messages are saved; `partial` means the user message was saved but the assistant response was not, and `failed` means the user message was not saved. Generation errors include the same persistence state at the top level of the error response. `X-Conversation-Id` identifies the conversation but is not proof of a complete exchange. Send that header on later chat requests to append messages.

Authenticated clients may send a UUID `Idempotency-Key` per logical message submission and must reuse it for retries. The migration-backed database function serializes creation of a user message for a given user/key, and unique indexes prevent duplicate stored user and assistant rows. A process-local single-flight also coalesces concurrent duplicate requests in one backend process. Across multiple backend instances, duplicate generation may still occur; the database uniqueness constraint prevents duplicate stored messages but does not guarantee at-most-once model calls. Requests without an idempotency key retain their earlier behavior for backward compatibility. Anonymous chat requests continue to receive AI responses but are not persisted. History retrieval always requires a valid token, and IDs are additionally scoped to the token's user ID. The service-role key is used only by the backend.

Database or authentication-service failures do not expose credentials or message contents. Persistence failures do not prevent an AI response; if an optional chat token is invalid or cannot be verified, the request continues as anonymous and is not persisted. Provider errors and timeouts return safe HTTP 502/503/504 responses without exposing internal error details.

## Scripts

- `npm run dev` — start with Node.js watch mode
- `npm start` — start the production server
- `npm test` — run backend tests
