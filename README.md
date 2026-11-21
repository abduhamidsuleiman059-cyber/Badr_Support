# BADR_SUPPORT

A responsive AI assistant built with React Native, Expo, Expo Router, and Expo Web, backed by an Express API.

## Frontend routes

- `/` — AI dashboard
- `/chat` — AI chat; signed-in conversations are saved to Supabase
- `/history` — saved conversations for the signed-in account
- `/explore` — feature previews
- `/profile` and `/settings` — account status, service status, and preferences
- `/welcome` and `/auth` — onboarding and authentication UI

The interface uses Lucide SVG icons and supports dark/light themes, responsive navigation, file-picker previews, and a voice-input UI preview.

## Run locally

Copy `.env.example` to `.env` and set the public Expo variables:

```text
EXPO_PUBLIC_BACKEND_API_URL=http://localhost:3001
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

Only the Supabase publishable key belongs in frontend configuration. Never use the service-role/secret key in the app. For Android emulators or physical devices, set the backend URL to the host address reachable from that device instead of `localhost`.

Configure `CORS_ORIGINS` in `backend/.env` to include the exact Expo Web origin (for example, `http://localhost:8081`). Start the backend from `backend/` after configuring its server-only Supabase and AI provider settings:

```sh
cd backend
npm install
npm run dev
```

Then start Expo from the repository root:

```sh
npm install
npm run web
```

For Android, install the Expo Go app on a device and run:

```sh
npm run android
```

Email/password registration, sign-in, password recovery, and Google sign-in use Supabase Auth. Google sign-in requires enabling the provider in Supabase and configuring its OAuth client in Google Cloud; register the Supabase provider callback in Google Cloud and allow the app callback generated for each web/native environment in Supabase URL Configuration. Do not store Google client secrets in frontend configuration.

Signed-in chat requests send the access token to the backend and persist history in Supabase; guest chats can receive AI responses but are not saved. The API reports whether both sides of an exchange were persisted. Authenticated retries use a stable idempotency key; requests without one retain their earlier behavior. Conversation history is retrieved from the backend, while pin preferences remain local to the current app session. File attachments are not uploaded and voice capture is not active.