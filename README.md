# Astra Frontend — Chat UI for CIS Controls v8 Assistant

React + Tailwind chat interface for Astra. Streams AI responses in real time,
renders markdown, shows source citations, collects feedback, and includes a
guided first-time tour, allows exporting chat in .md and .pdf formats.

**Backend repo:** [Astra Backend](https://github.com/MhmdNat/rag-backend) must be running at `http://localhost:8000`
before starting this app.

---

## Prerequisites

- Node.js 18+
- npm
- The backend API running locally (see backend README)

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Configure the API URL (optional)

By default the app points at `http://localhost:8000`. If your backend runs elsewhere,
update the `API` constant near the top of `src/App.jsx`:

```js
const API = 'http://localhost:<port>'
```

---

## 3. Run the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or whatever port Vite reports).

---

## Features

- **Real-time streaming chat** — responses type out token-by-token via Server-Sent Events, with full markdown rendering (bold, lists, code blocks)
- **Chat history** — sidebar lists saved conversations; click to reload, hover to delete, "New Chat" to start fresh
- **Source citations** — each response includes a "Show context" accordion listing the passages used to generate the answer
- **Feedback** — thumbs up/down on every response; thumbs down prompts for a reason (chips + free text)
- **Response regeneration & versioning** — regenerate any answer and flip between versions with the version navigator
- **Export** — download a conversation as Markdown or open a print-ready PDF view
- **Guided tour** — first-time users see a spotlighted walkthrough of the key features; replay anytime via the "Tour" button in the header

---

## Project Structure

```
src/
  App.jsx          # main app — chat state, streaming logic, layout
  components/ui/   # shared UI primitives (Button, etc.)
```

`App.jsx` contains all major components (Sidebar, Message, FeedbackRow,
ContextDropdown, VersionNav, TourOverlay).

---

## Troubleshooting

**CORS errors in the browser console:**
The backend's CORS middleware only allows `http://localhost:5173` and
`http://localhost:3000` by default. If your dev server runs on a different port,
add it to the `origins` list in the backend's `rag_api.py`.
