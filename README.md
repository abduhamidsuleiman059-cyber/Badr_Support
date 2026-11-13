# BADR_SUPPORT

A responsive AI-assistant frontend foundation built with React Native, Expo, Expo Router, and Expo Web.

## Frontend routes

- `/` — AI dashboard
- `/chat` — local-only chat interface
- `/history` — conversations from the current app session
- `/explore` — feature previews
- `/profile` and `/settings` — guest profile and preferences
- `/welcome` and `/auth` — onboarding and authentication UI

The interface uses Lucide SVG icons and supports dark/light themes, responsive navigation, file-picker previews, and a voice-input UI preview.

## Run locally

```sh
npm install
npm run web
```

For Android, install the Expo Go app on a device and run:

```sh
npm run android
```

Authentication and AI chat are intentionally frontend-only. No API credentials, fabricated responses, or backend integration are included. Chat history and theme preferences are session-local; file attachments are not uploaded and voice capture is not active. The service contracts in `src/services/` fail explicitly until a backend is connected. The backend folder is maintained separately.