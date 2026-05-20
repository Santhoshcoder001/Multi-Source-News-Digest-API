# Multi-Source News Digest API

```text
 __  __       _ _   _             ____                      _       
|  \/  | __ _(_) |_| |__   ___   / ___|_   _  ___  ___ ___ | |_ ___ 
| |\/| |/ _` | | __| '_ \ / _ \ | |  _| | | |/ _ \/ __/ __|| __/ __|
| |  | | (_| | | |_| | | |  __/ | |_| | |_| |  __/\__ \__ \| |_\__ \
|_|  |_|\__,_|_|\__|_| |_|\___|  \____|\__,_|\___||___/___/ \__|___/
```

A full-stack news digest app that collects stories from NewsAPI and RSS feeds, summarizes each article with Google Gemini, clusters related stories by topic, and serves the result through a Node.js REST API with a React + Vite frontend.

## Features

- Multi-source ingestion from NewsAPI, BBC RSS, and Reuters RSS.
- Gemini-powered 2-sentence article summaries with sentiment classification.
- Topic clustering using keyword overlap and manual TF-IDF similarity.
- Cron-based digest generation with in-memory retention for the latest 7 days.
- API key authentication and rate limiting.
- Swagger UI documentation at `/api-docs`.
- Dark-themed React dashboard for browsing digest clusters and topics.

## Architecture

```text
news-digest-app/
├── backend/
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── processors/
│       ├── routes/
│       ├── services/
│       └── index.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── services/
│       └── App.tsx
└── README.md
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, node-cron |
| Collection | axios, rss-parser, NewsAPI |
| AI | @google/generative-ai |
| API Docs | swagger-ui-express, js-yaml |
| Frontend | React 19, Vite, TypeScript |
| Styling | Custom CSS |

## Prerequisites

- Node.js 18 or newer.
- npm 9 or newer.
- NewsAPI key.
- Google Gemini API key.
- Optional API secret for request authentication.

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd news-digest-app
```

### 2. Configure the backend

Create `backend/.env`:

```env
PORT=3001
NEWS_API_KEY=your-newsapi-key-here
GEMINI_API_KEY=your-gemini-key-here
API_SECRET_KEY=your-secret-key-here
CRON_SCHEDULE=*/30 * * * *
```

Install backend dependencies:

```bash
cd backend
npm install
```

### 3. Configure the frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_API_KEY=your-secret-key-here
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Running the project

### Backend

```bash
cd backend
npm run dev
```

The API will start on the configured port and the first digest run will begin immediately.

### Frontend

```bash
cd frontend
npm run dev
```

Open the app in your browser at the Vite URL shown in the terminal.

## Environment Variables

### Backend

| Variable | Required | Description |
|---|---:|---|
| `PORT` | No | Backend port, defaults to `3001`. |
| `NEWS_API_KEY` | Yes | NewsAPI authentication key. |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for article summaries. |
| `API_SECRET_KEY` | Yes | Shared secret used by the API auth middleware. |
| `CRON_SCHEDULE` | No | Cron expression for digest refresh, defaults to every 30 minutes. |

### Frontend

| Variable | Required | Description |
|---|---:|---|
| `VITE_API_URL` | No | API base URL, defaults to `http://localhost:3001/api`. |
| `VITE_API_KEY` | No | API key forwarded as `x-api-key` by the frontend client. |

## API Endpoints

| Method | Path | Params | Description |
|---|---|---|---|
| GET | `/health` | none | Health check endpoint. |
| GET | `/api/digest` | `sentiment`, `limit`, `date` | Returns the latest or selected digest. |
| GET | `/api/topic/:name` | `name` | Returns clusters matching a topic search. |
| GET | `/api/topics` | none | Lists available topic names. |
| GET | `/api-docs` | none | Swagger UI for the API. |

## Screenshots

Add screenshots of the digest dashboard, topic drill-down, and Swagger UI here.

## Assignment Deliverables Checklist

- [x] News collection from multiple sources
- [x] Gemini article summarization
- [x] Topic clustering pipeline
- [x] Cron-based scheduling
- [x] Digest and topic API routes
- [x] API key authentication
- [x] Rate limiting
- [x] Swagger documentation
- [x] React frontend dashboard
- [x] REST Client smoke tests

## Notes

- The backend stores digests in memory, so restarting the server clears historical entries.
- The scheduler keeps only the latest 7 days of digests.
- The frontend expects the backend to run locally on port `3001` unless `VITE_API_URL` is changed.

## License

This project is provided for academic use.
