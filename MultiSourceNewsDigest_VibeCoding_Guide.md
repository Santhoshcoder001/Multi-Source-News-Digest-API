# 🚀 Multi-Source News Digest API — Full Vibe Coding Guide
### Using GitHub Copilot + Google Gemini | From Scratch to Deployment

---

> **What is Vibe Coding?**
> Prompt-driven development where you describe what you want in plain English to AI tools (GitHub Copilot in VS Code, Google Gemini in browser/terminal) and the AI writes the code. You guide, review, and steer.

---

## 🗺️ PROJECT ARCHITECTURE OVERVIEW

```
news-digest-app/
├── backend/             ← Node.js + Express REST API
│   ├── src/
│   │   ├── collectors/  ← News fetchers (RSS + NewsAPI)
│   │   ├── processors/  ← LLM summarizer + topic clusterer
│   │   ├── routes/      ← /digest, /topic/:name endpoints
│   │   ├── middleware/  ← Auth, rate limiting
│   │   └── scheduler/  ← Cron job
│   ├── swagger.yaml
│   └── server.js
├── frontend/            ← React + Vite UI
│   └── src/
│       ├── components/
│       └── pages/
└── README.md
```

**Tech Stack:**
- **Backend:** Node.js, Express, node-cron, rss-parser, axios, openai / @google/generative-ai
- **Frontend:** React (Vite), Axios, TailwindCSS
- **AI Tools:** GitHub Copilot (VS Code), Google Gemini (gemini.google.com)
- **APIs:** NewsAPI.org (free tier), any RSS feed (BBC, Reuters)

---

## ⚙️ PHASE 0 — ENVIRONMENT SETUP

### Step 0.1 — Install Tools

Open your terminal and run:
```bash
node -v          # Must be v18+
npm -v
git --version
code --version   # VS Code
```

Install VS Code extensions:
- **GitHub Copilot** (official, sign in with GitHub account)
- **GitHub Copilot Chat** (Ctrl+Shift+I to open)
- **REST Client** (for API testing inside VS Code)
- **Thunder Client** (Postman alternative inside VS Code)

### Step 0.2 — Get API Keys

| Service | URL | Free Tier |
|---------|-----|-----------|
| NewsAPI | https://newsapi.org/register | 100 req/day |
| Google Gemini API | https://aistudio.google.com/app/apikey | Free quota |
| (Optional) OpenAI | https://platform.openai.com | Pay-per-use |

### Step 0.3 — Bootstrap Project

```bash
mkdir news-digest-app && cd news-digest-app
git init
mkdir backend frontend
cd backend && npm init -y
cd ../frontend && npm create vite@latest . -- --template react
```

---

## 🔵 PHASE 1 — BACKEND SETUP

### Step 1.1 — Install Backend Dependencies

**In `backend/` folder, run:**
```bash
npm install express cors dotenv axios rss-parser node-cron \
  @google/generative-ai openai express-rate-limit swagger-ui-express \
  yaml js-yaml uuid
npm install --save-dev nodemon
```

---

### 🤖 COPILOT PROMPT 1 — Project Entry Point

> Open VS Code in `backend/` folder. Create a file `server.js`.
> Press `Ctrl+Shift+I` (Copilot Chat) and paste this prompt:

```
Create a Node.js Express server with the following:
- Load environment variables from .env using dotenv
- Enable CORS for all origins
- Parse JSON bodies
- Mount a router from ./src/routes/digest at /api
- Mount a router from ./src/routes/topic at /api
- Add a GET /health endpoint that returns { status: "ok", timestamp: new Date() }
- Start on PORT from env or 3001
- Export the app for testing

Use ES module syntax (import/export). Add comments explaining each section.
```

---

### 🤖 COPILOT PROMPT 2 — Environment Config

> Create `backend/.env` and `backend/src/config/env.js`. In Copilot Chat:

```
Create a config file at src/config/env.js that:
- Imports dotenv and calls config()
- Exports an object with these validated fields:
  PORT, NEWS_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY (optional),
  CRON_SCHEDULE (default "*/30 * * * *"), API_SECRET_KEY
- Throws a clear error if NEWS_API_KEY or GEMINI_API_KEY is missing
- Logs a startup message listing which keys are loaded (masked)
```

---

## 🔵 PHASE 2 — DATA COLLECTION (News Fetchers)

### Step 2.1 — NewsAPI Collector

> Create `backend/src/collectors/newsApiCollector.js`. Copilot Chat prompt:

```
Create a news collector module using the NewsAPI.org API.

Requirements:
- Use axios to call https://newsapi.org/v2/top-headlines
- Accept a `category` parameter (technology, science, business, health)
- Accept a `pageSize` parameter (default 10)
- Use NEWS_API_KEY from env config
- Return an array of normalized article objects with this shape:
  { id, title, description, content, url, source, publishedAt, category }
- Generate id using uuid v4
- Handle errors gracefully — log and return empty array, never throw
- Add JSDoc comments

Use async/await throughout. Export a named function fetchFromNewsApi.
```

---

### Step 2.2 — RSS Feed Collector

> Create `backend/src/collectors/rssCollector.js`. Copilot Chat prompt:

```
Create an RSS feed collector using the rss-parser npm package.

Requirements:
- Accept a feedUrl and a sourceName parameter
- Parse the RSS feed using rss-parser
- Normalize each item to this shape:
  { id, title, description, content, url, source, publishedAt, category: "general" }
- id should be generated using uuid v4
- publishedAt should be an ISO string (use pubDate or isoDate)
- Limit to the latest 15 items
- Handle network or parse errors gracefully — return empty array
- Export a named function fetchFromRss

Default feeds to try:
- BBC News: http://feeds.bbci.co.uk/news/rss.xml
- Reuters: https://feeds.reuters.com/reuters/topNews
```

---

### Step 2.3 — Combined Collector Aggregator

> Create `backend/src/collectors/index.js`. Copilot Chat prompt:

```
Create a collector aggregator module that:
- Imports fetchFromNewsApi and fetchFromRss
- Exports an async function collectAllNews() that:
  - Runs all collectors in parallel using Promise.allSettled
  - Collects from NewsAPI categories: technology, science, business
  - Collects from BBC RSS and Reuters RSS
  - Flattens all results into a single array
  - Deduplicates by title (case-insensitive, first 60 chars)
  - Logs how many articles collected from each source
  - Returns the combined deduplicated articles array
- Handle partial failures (if one source fails, return the rest)
```

---

## 🔵 PHASE 3 — AI PROCESSING

### Step 3.1 — Gemini Summarizer

> Create `backend/src/processors/summarizer.js`. Copilot Chat prompt:

```
Create an article summarizer using Google Gemini API (@google/generative-ai package).

Requirements:
- Initialize the Gemini client with GEMINI_API_KEY from env config
- Use model "gemini-1.5-flash" (free tier)
- Export an async function summarizeArticle(article) that:
  - Takes an article object { title, description, content }
  - Builds a prompt asking Gemini to produce EXACTLY 2 sentences:
    Sentence 1: What happened (factual)
    Sentence 2: Why it matters (context/impact)
  - Asks Gemini to also return sentiment: "positive" | "neutral" | "negative"
  - Requests response as JSON: { summary: string, sentiment: string }
  - Returns the parsed JSON or a fallback { summary: description, sentiment: "neutral" }
- Add retry logic: 3 attempts with 1 second delay between retries
- Rate-limit: wait 200ms between API calls using a queue or delay
- Add detailed error logging
```

---

### Step 3.2 — Topic Clusterer

> Create `backend/src/processors/clusterer.js`. Use **Google Gemini (browser)** for this one.

#### 🌐 GOOGLE GEMINI BROWSER PROMPT (gemini.google.com):

```
I'm building a news digest app in Node.js. I need a topic clustering module.

Write a file `clusterer.js` that exports an async function clusterArticles(articles).

It should:
1. Use a TF-IDF style approach to group articles by topic similarity
   (implement this manually without external ML libraries)
2. Also use keyword matching: extract top 5 keywords from each article's title
3. Group articles that share 2+ keywords into the same cluster
4. Each cluster should have:
   { 
     clusterId: uuid, 
     topic: string (inferred topic name from keywords),
     articles: Article[],
     keywords: string[]
   }
5. Articles that don't match any cluster go into a "general" cluster
6. Minimum cluster size: 2 articles (singletons merge into "general")
7. Return array of cluster objects sorted by article count descending

Use a stop-words list to exclude: the, a, an, in, on, at, is, are, was, were, 
of, to, for, and, or, but, it, its, with, that, this, as, by, from, has, have.

Write in Node.js using ES module syntax. No external ML dependencies.
```

> Copy the response into `backend/src/processors/clusterer.js`

---

### Step 3.3 — Main Processor Pipeline

> Create `backend/src/processors/index.js`. Copilot Chat prompt:

```
Create a news processing pipeline in src/processors/index.js.

It should export an async function processArticles(articles) that:
1. Filters out articles with no title or description (clean the data)
2. For each article, calls summarizeArticle and adds:
   - article.summary (2-sentence string)
   - article.sentiment ("positive" | "neutral" | "negative")
3. Processes summaries with concurrency limit of 3 (use p-limit or manual semaphore)
   (implement a simple manual concurrency limiter — no extra packages)
4. After all summaries are done, calls clusterArticles(articles)
5. Returns the clusters array
6. Log progress: "Processing article X of Y: title..."
7. Log total time taken at the end
```

---

## 🔵 PHASE 4 — SCHEDULER (CRON JOB)

> Create `backend/src/scheduler/index.js`. Copilot Chat prompt:

```
Create a news scheduler using node-cron.

Requirements:
- Import collectAllNews and processArticles
- Maintain an in-memory store: a Map called digestStore
  Key: ISO date string (YYYY-MM-DD), Value: { clusters, lastUpdated, articleCount }
- Export a function startScheduler() that:
  - Runs immediately on startup (call runDigest() at start)
  - Then runs on CRON_SCHEDULE from env (default every 30 minutes)
  - runDigest():
    1. Logs "Starting news collection..."
    2. Calls collectAllNews()
    3. Calls processArticles(articles)
    4. Saves result to digestStore with today's date key
    5. Keeps only last 7 days in store (delete older keys)
    6. Logs "Digest ready: X clusters, Y articles"
- Export a function getLatestDigest() that returns the most recent store entry
- Export a function getDigestStore() that returns the full store map
```

---

## 🔵 PHASE 5 — REST API ROUTES

### Step 5.1 — /digest Route

> Create `backend/src/routes/digest.js`. Copilot Chat prompt:

```
Create an Express router for GET /digest in src/routes/digest.js.

The endpoint should:
- Call getLatestDigest() from the scheduler
- Return 503 if no digest is available yet (with a helpful message)
- Support query params:
  ?sentiment=positive|neutral|negative  (filter articles by sentiment)
  ?limit=N  (limit number of clusters returned, default all)
  ?date=YYYY-MM-DD (get digest for a specific date)
- Return JSON response:
  {
    success: true,
    lastUpdated: ISO string,
    clusterCount: number,
    articleCount: number,
    clusters: [ { clusterId, topic, keywords, articles: [...] } ]
  }
- Add response time header: X-Response-Time
- Log each request with method, path, query params, response time
```

---

### Step 5.2 — /topic Route

> Create `backend/src/routes/topic.js`. Copilot Chat prompt:

```
Create an Express router for GET /topic/:name in src/routes/topic.js.

The endpoint should:
- Get :name from params (URL-decode it, lowercase it)
- Search the latest digest clusters for a match where:
  cluster.topic includes the search term (case-insensitive)
  OR any cluster keyword includes the search term
- Return 404 with { success: false, message: "Topic not found", availableTopics: [...] }
  if nothing matches (include list of all current topic names)
- Return 200 with:
  {
    success: true,
    topic: string,
    clusters: [matched clusters],
    articleCount: number
  }
- Also support GET /topics (no :name) to list all available topic names
```

---

### Step 5.3 — API Key Auth Middleware

> Create `backend/src/middleware/auth.js`. Copilot Chat prompt:

```
Create an Express middleware for API key authentication in src/middleware/auth.js.

Requirements:
- Read API_SECRET_KEY from env config
- Check the incoming request for the key in two places:
  1. Header: x-api-key
  2. Query param: ?apiKey=xxx
- If API_SECRET_KEY is not set in env, skip auth (open mode) — log a warning once
- If key is present but wrong: return 401 { success: false, error: "Invalid API key" }
- If key is missing: return 401 { success: false, error: "API key required", hint: "Add x-api-key header or ?apiKey= param" }
- If key matches: call next()
- Export as default middleware function
```

---

### Step 5.4 — Rate Limiting Middleware

> Create `backend/src/middleware/rateLimiter.js`. Copilot Chat prompt:

```
Create a rate limiter using express-rate-limit in src/middleware/rateLimiter.js.

Create and export two limiters:
1. generalLimiter: 100 requests per 15 minutes per IP
2. strictLimiter: 20 requests per minute per IP (for expensive routes)

Both should return JSON error responses:
{ success: false, error: "Too many requests", retryAfter: seconds }

Use standardHeaders: true and legacyHeaders: false.
```

---

## 🔵 PHASE 6 — SWAGGER / API DOCS

> Create `backend/swagger.js`. Use **Google Gemini (browser)** prompt:

```
I have a Node.js Express API with these endpoints:

GET /api/digest
  - Query: sentiment (string), limit (number), date (YYYY-MM-DD)
  - Response: { success, lastUpdated, clusterCount, articleCount, clusters[] }

GET /api/topic/:name
  - Params: name (topic name to search)
  - Response: { success, topic, clusters[], articleCount }

GET /api/topics
  - Response: { success, topics: string[] }

GET /health
  - Response: { status: "ok", timestamp }

All routes require x-api-key header.

Generate a complete OpenAPI 3.0 YAML specification for these endpoints.
Include:
- Info section (title: News Digest API, version 1.0.0)
- Security scheme: ApiKeyAuth (header x-api-key)
- Full request/response schemas with examples
- Error response schemas (401, 404, 429, 503)
- Descriptions for every field

Return only the raw YAML, no markdown.
```

> Save as `backend/swagger.yaml`

Then in Copilot Chat:
```
Create backend/swagger.js that:
- Reads swagger.yaml using fs and js-yaml
- Sets up swagger-ui-express at GET /api-docs
- Exports a function setupSwagger(app) to call from server.js
```

---

## 🔵 PHASE 7 — FRONTEND (React + Vite)

### Step 7.1 — Install Frontend Dependencies

```bash
cd frontend
npm install axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

### Step 7.2 — API Service Layer

> Create `frontend/src/services/api.js`. Copilot Chat prompt:

```
Create a frontend API service file at src/services/api.js using axios.

Requirements:
- Create an axios instance with baseURL from import.meta.env.VITE_API_URL
  (default to http://localhost:3001/api)
- Add request interceptor: attach x-api-key header from
  import.meta.env.VITE_API_KEY if set
- Export these async functions:
  1. fetchDigest({ sentiment, limit, date }) → GET /digest with query params
  2. fetchTopic(name) → GET /topic/:name
  3. fetchTopics() → GET /topics
  4. checkHealth() → GET /health (use the root axios instance, not /api prefix)
- Each function returns response.data directly
- Handle and re-throw errors with a friendly message property added
```

---

### Step 7.3 — Main App Component

> Replace `frontend/src/App.jsx`. Use **Google Gemini (browser)** prompt:

```
I'm building a React news digest app. Create a full App.jsx using React hooks (useState, useEffect, useCallback).

The app should have these views:
1. Home/Digest view: shows all topic clusters
2. Topic view: shows articles for a selected topic

Functionality:
- On load, call fetchDigest() and display results
- Show a loading spinner while fetching
- Show an error banner if fetch fails with retry button
- Display a top navbar with:
  - App title "📰 News Digest"
  - Last updated timestamp
  - Filter dropdown: All | Positive | Neutral | Negative (sentiment filter)
  - Refresh button (manual re-fetch)
- Display clusters as cards:
  - Topic name as card title
  - Keywords as tags
  - Number of articles badge
  - Clicking a cluster expands it to show articles
- Each article shows:
  - Title (linked to original URL, opens in new tab)
  - Source name and published date (formatted as "X hours ago")
  - 2-sentence AI summary
  - Sentiment badge (🟢 positive, ⚪ neutral, 🔴 negative)
- Use TailwindCSS for styling. Dark theme with slate colors.
- Use useState for: clusters, loading, error, selectedSentiment, expandedCluster
- Import fetchDigest from ./services/api

Return only the complete JSX code for App.jsx.
```

---

### Step 7.4 — Individual Components

#### ClusterCard Component
> Create `frontend/src/components/ClusterCard.jsx`. Copilot Chat prompt:

```
Create a React component ClusterCard.jsx that receives props:
{ cluster: { clusterId, topic, keywords, articles[] }, isExpanded, onToggle }

Render:
- A card with cursor-pointer, onClick calls onToggle
- Header: topic name + article count badge + expand/collapse chevron icon (▼ / ▲)
- Keywords as small pill badges in a flex-wrap row
- When isExpanded: render a list of ArticleItem components for each article
- Animate expand/collapse with CSS transition on max-height

Use TailwindCSS dark theme (bg-slate-800, text-white, etc.)
Export as default.
```

#### ArticleItem Component
> Create `frontend/src/components/ArticleItem.jsx`. Copilot Chat prompt:

```
Create a React component ArticleItem.jsx that receives an article prop:
{ title, url, source, publishedAt, summary, sentiment }

Render:
- Title as a link (opens in new tab) — truncate at 2 lines
- Source name + relative time ("2 hours ago") on one line, gray text
- Summary text in slightly smaller font
- Sentiment badge:
  positive → green background "😊 Positive"
  negative → red background "😟 Negative"  
  neutral  → gray background "😐 Neutral"

Write a helper function formatRelativeTime(isoString) that returns:
"X minutes ago", "X hours ago", "X days ago"

Use TailwindCSS. Export as default.
```

#### LoadingSpinner & ErrorBanner
> Create both at once. Copilot Chat prompt:

```
Create two small React components in src/components/:

1. LoadingSpinner.jsx:
   - Centered spinner with "Fetching latest news..." text below
   - Animate with TailwindCSS animate-spin on a circle border element

2. ErrorBanner.jsx — receives props { message, onRetry }:
   - Red banner at top of page
   - Shows error message
   - Has a "Retry" button that calls onRetry

Both use TailwindCSS. Export as default.
```

---

### Step 7.5 — Environment Variables

> Create `frontend/.env`:
```
VITE_API_URL=http://localhost:3001/api
VITE_API_KEY=your-secret-key-here
```

> Create `backend/.env`:
```
PORT=3001
NEWS_API_KEY=your-newsapi-key-here
GEMINI_API_KEY=your-gemini-key-here
API_SECRET_KEY=your-secret-key-here
CRON_SCHEDULE=*/30 * * * *
```

---

## 🔵 PHASE 8 — INTEGRATION & WIRING

### Step 8.1 — Connect Everything in server.js

> Open `backend/server.js`. Copilot Chat prompt:

```
Update server.js to wire everything together:
1. Import startScheduler from ./src/scheduler/index.js
2. Import generalLimiter, strictLimiter from ./src/middleware/rateLimiter.js
3. Import authMiddleware from ./src/middleware/auth.js
4. Import setupSwagger from ./swagger.js
5. Apply generalLimiter globally to all routes
6. Apply authMiddleware to all /api/* routes
7. Apply strictLimiter specifically to GET /api/digest
8. Mount digest router at /api/digest
9. Mount topic router at /api/topic and /api/topics
10. Set up Swagger at /api-docs
11. Call startScheduler() after server starts listening
12. Add a global error handler middleware at the bottom that returns:
    { success: false, error: err.message, stack: (only in development) }
```

---

### Step 8.2 — Update package.json Scripts

> In `backend/package.json`. Copilot Chat prompt:

```
Add these npm scripts to package.json:
- "start": "node server.js"
- "dev": "nodemon server.js"
- "test:api": "node -e \"import('./src/collectors/index.js').then(m => m.collectAllNews()).then(a => console.log(a.length + ' articles'))\""

Also add "type": "module" to enable ES modules.
```

---

## 🔵 PHASE 9 — TESTING & DEBUGGING

### Step 9.1 — Create REST Client Test File

> Create `backend/test.http` (for VS Code REST Client extension). Copilot Chat prompt:

```
Create a test.http file for the VS Code REST Client extension.

Test all these scenarios:
1. GET /health
2. GET /api/digest (no auth - expect 401)
3. GET /api/digest with x-api-key header
4. GET /api/digest?sentiment=positive
5. GET /api/digest?limit=3
6. GET /api/topics
7. GET /api/topic/technology
8. GET /api/topic/nonexistent (expect 404)
9. GET /api-docs

Use @baseUrl = http://localhost:3001
Use @apiKey = your-secret-key-here
Add comments explaining what each test checks.
```

---

### Step 9.2 — Debug Common Issues

#### 🌐 GOOGLE GEMINI BROWSER PROMPT for debugging:

```
I'm building a Node.js news digest API. Here's my issue:
[paste your error message here]

Here's the relevant code:
[paste the file with the problem]

Identify the bug, explain why it happens, and give me the fixed code with 
comments showing what changed and why.
```

---

## 🔵 PHASE 10 — BONUS FEATURES

### Bonus 1 — Sentiment Tagging Enhancement

> Copilot Chat prompt:

```
Update src/processors/summarizer.js to add more detailed sentiment analysis.

Add a function analyzeSentiment(text) that:
- Scores positive words (good, great, success, growth, breakthrough, win) → +1 each
- Scores negative words (crisis, fail, crash, attack, loss, warning, death) → -1 each
- Returns "positive" if score > 1, "negative" if score < -1, else "neutral"

Use this as a fallback if Gemini doesn't return a clear sentiment.
Also add a sentimentScore number field (−10 to +10) to the article object.
```

---

### Bonus 2 — OpenAPI Postman Collection Export

> Create `backend/scripts/exportPostman.js`. Copilot Chat prompt:

```
Create a Node.js script at scripts/exportPostman.js that:
- Reads swagger.yaml
- Converts it to a Postman Collection v2.1 JSON format
- Fills in example values for all variables
- Saves it as postman-collection.json in the project root
- Can be run with: node scripts/exportPostman.js

Do not use any external converter packages — build the mapping manually.
```

---

### Bonus 3 — Topic Subscription (In-Memory)

> Create `backend/src/routes/subscriptions.js`. Copilot Chat prompt:

```
Create a simple in-memory topic subscription system.

Endpoints:
- POST /api/subscribe { email, topics: string[] }  → saves subscription
- GET /api/subscriptions/:email → gets user's subscribed topics
- DELETE /api/unsubscribe { email, topic } → removes one topic

Store subscriptions in a Map<email, Set<topic>>.
Validate email format and that topics array is non-empty.
Return appropriate success/error JSON responses.

Note: This is in-memory only (no database needed for this assignment).
```

---

## 🔵 PHASE 11 — README & DOCUMENTATION

> Create `README.md` at project root. **Google Gemini browser prompt:**

```
I built a Multi-Source News Digest API project. Write a professional GitHub README.md for it.

Project details:
- Node.js + Express backend
- Fetches news from NewsAPI and RSS feeds (BBC, Reuters)
- Uses Google Gemini to summarize each article in 2 sentences
- Clusters related articles by topic using keyword matching
- REST API: GET /api/digest, GET /api/topic/:name, GET /api/topics
- React + Vite frontend with dark theme
- API key auth, rate limiting, Swagger docs at /api-docs
- Runs on a cron schedule (every 30 minutes)

Include these sections:
1. Project banner (text-based ASCII art)
2. Features list with emoji bullets
3. Architecture diagram (ASCII)
4. Tech stack table
5. Prerequisites
6. Setup & Installation (step by step with code blocks)
7. Environment Variables table (with descriptions, mark which are required)
8. API Endpoints documentation (table format with method, path, params, description)
9. Running the project (backend + frontend commands)
10. Screenshots section placeholder
11. Assignment deliverables checklist
12. License

Make it look professional and impressive for academic submission.
```

---

## 🔵 PHASE 12 — FINAL CHECKLIST & RUN

### Start the Project

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Should print: Server running on port 3001
# Should print: Starting news collection...
# Should print: Digest ready: X clusters, Y articles
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Should print: VITE v5.x.x ready at http://localhost:5173
```

**Open in browser:** http://localhost:5173

---

### Final Verification Checklist

| Feature | How to Check |
|---------|-------------|
| ✅ Fetches from 2+ sources | Check backend logs on startup |
| ✅ Runs on schedule | Wait 30 mins or change CRON_SCHEDULE to `* * * * *` |
| ✅ 2-line AI summaries | Open /api/digest, check each article.summary |
| ✅ Topic clustering | Check clusters array in /api/digest response |
| ✅ GET /digest endpoint | Hit http://localhost:3001/api/digest |
| ✅ GET /topic/:name | Hit http://localhost:3001/api/topic/technology |
| ✅ Frontend displays headlines | Open http://localhost:5173 |
| ✅ Frontend shows summaries | Expand any cluster card |
| ✅ Grouped stories shown | Each card = one cluster/group |
| ✅ Sentiment tagging (bonus) | Check article.sentiment field |
| ✅ API key auth (bonus) | Remove x-api-key header, expect 401 |
| ✅ Rate limiting (bonus) | Send 101 requests in 15 min |
| ✅ Swagger docs (bonus) | Open http://localhost:3001/api-docs |

---

## 🎁 QUICK CHEAT SHEET — WHAT TO USE WHEN

| Task | Use This Tool |
|------|---------------|
| Writing boilerplate (Express server, routes, middleware) | **GitHub Copilot Chat** (Ctrl+Shift+I) |
| Generating complex algorithms (clustering, TF-IDF) | **Google Gemini** (browser) |
| Debugging an error (paste error + code) | **GitHub Copilot Chat** inline (`Ctrl+I`) |
| Writing README / documentation | **Google Gemini** (browser) |
| Auto-completing code while typing | **GitHub Copilot** (inline suggestions, Tab to accept) |
| Generating test cases | **GitHub Copilot Chat** |
| Converting between formats (YAML → JSON, etc.) | **Google Gemini** (browser) |
| Explaining why code doesn't work | Either — paste the full error |

---

## 💡 VIBE CODING TIPS

1. **Be specific in prompts** — always mention the filename, the imports you want, and the exact shape of data
2. **One file per prompt** — don't ask Copilot to write 3 files at once
3. **Review before accepting** — Copilot is fast but not always right; read the code
4. **Iterate with follow-ups** — "Now add error handling to that function" works great
5. **Use Gemini for thinking, Copilot for writing** — Gemini is better for architecture decisions; Copilot is better for generating code inside your editor
6. **Commit after each phase** — `git add . && git commit -m "Phase X complete"` after each section

---

*Generated for Assignment 4: Multi-Source News Digest API*
*Category: API Integration + Automation*
