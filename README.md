<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b40f1a0a-7ed4-4ab0-bc5e-1d06426d98ae

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy (Render)

This app is full-stack (React + Express + SQLite), so deploy it as a Node web service.

1. Push this repo to GitHub.
2. In Render, create a new Web Service from the repo.
3. Render will detect `render.yaml` automatically.
4. Set required env vars in Render:
   - `GOOGLE_CLIENT_ID` (optional unless Google login is used)
   - `OWNER_EMAIL` and `ALLOWED_EMAILS` (if using Google allowlist auth)
   - `ADMIN_PASSCODE`, `VIEW_PASSCODE` (if using passcode auth)
   - `GEMINI_API_KEY` (if using AI magic fill)
5. Deploy.

Notes:
- SQLite and uploads are persisted on the mounted disk at `/var/data`.
- The server now reads `PORT` from the hosting platform automatically.
