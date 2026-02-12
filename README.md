# Vibe-Pilot (Node + Express)

This is the Node.js version of the Vibe-Pilot web app. It serves the UI and proxies the AI analysis request server-side so your API key is not exposed in the browser.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file (use `.env.example` as a template) and add your `GEMINI_API_KEY`.
3. Start the server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Structure
- `server.js`: Express server and `/api/analyze` endpoint
- `public/index.html`: App UI (converted from the original HTML)
