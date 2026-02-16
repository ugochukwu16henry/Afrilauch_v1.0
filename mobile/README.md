# RiseFlow Hub — React Native (Expo) Mobile App

Mobile app for **client project tracking**, **task notifications**, **agreement signing**, **team chat**, **push notifications**, and **AI assistant** — reusing the existing backend APIs.

## Features

- **Client project tracking** — List projects, view project detail, progress, and open project chat
- **Task notifications** — My tasks list with refresh
- **Agreement signing** — View agreements assigned to you, sign with your name
- **Chat with team** — Per-project chat: list projects, open thread, send/receive messages
- **Push notifications** — Expo Notifications: permission request, Android channel; register device token for backend later
- **AI assistant** — Evaluate idea (feasibility, risk, market) and get project insights (suggestions, risks)

## Setup

1. **Backend**  
   Ensure the RiseFlow Hub API is running (e.g. `cd backend && pnpm dev`) and reachable from your machine/emulator.

2. **API URL**  
   Create `mobile/.env`:
   ```bash
   EXPO_PUBLIC_API_URL=http://localhost:4000
   ```
   For a physical device, use your machine’s LAN IP (e.g. `http://192.168.1.10:4000`) or a deployed API URL.  
   If the backend uses strict CORS, set `CORS_ORIGIN=*` or add your Expo origin in the backend `.env` so the app can call the API.

3. **Install and run**
   ```bash
   cd mobile
   pnpm install
   pnpm start
   ```
   Then press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go.

## Backend APIs used

- `POST /api/v1/auth/login` — Login
- `GET /api/v1/auth/me` — Current user
- `GET /api/v1/projects` — List projects
- `GET /api/v1/projects/:id` — Project detail
- `GET /api/v1/projects/:id/messages` — Project chat messages
- `POST /api/v1/projects/:id/messages` — Send message (body: `{ message }`)
- `GET /api/v1/tasks/me` — My tasks
- `GET /api/v1/agreements/assigned` — Agreements assigned to me
- `POST /api/v1/agreements/:id/sign` — Sign agreement (body: `{ signatureText }`)
- `GET /api/v1/notifications` — Notifications
- `POST /api/v1/ai/evaluate-idea` — AI idea evaluation
- `POST /api/v1/ai/project-insights` — AI project insights

## Push notifications

- The app requests notification permission and sets an Android channel on launch.
- To send push from the backend, register the Expo push token (returned by `registerForPushNotificationsAsync`) with your backend and use Expo’s push API or a service that supports Expo.

## Assets

Add `assets/icon.png`, `assets/splash.png`, and `assets/adaptive-icon.png` if you want custom icons; otherwise Expo uses defaults. You can copy from `frontend/public/logo.png` for the icon.
