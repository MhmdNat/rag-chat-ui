# Chat UI

A polished React + Vite chat interface built with Tailwind CSS, Radix UI primitives, and Lucide icons. The current screen is a conversational workspace mockup with a header, message feed, and composer area.

## Features

- Responsive chat layout with a floating glassmorphism-style shell
- Mock conversation data rendered as assistant and user messages
- Composer footer with action buttons and quick status chips
- Built with React 19, Vite, and utility-first styling

## Tech Stack

- React
- Vite
- Tailwind CSS
- Radix UI
- Lucide React
- Fontsource Geist, Inter, and IBM Plex Mono

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local URL shown in the terminal.

## Available Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - create a production build
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint across the project

## Project Structure

- `src/App.jsx` - main chat UI layout and mock messages
- `src/main.jsx` - React entry point
- `src/index.css` - global styles
- `src/components/ui/button.jsx` - shared button component
- `src/assets/` - static assets used by the app

## Notes

- The current UI uses mock content only and does not connect to a backend.
- The app is ready to extend with real message state, APIs, or streaming chat behavior.
