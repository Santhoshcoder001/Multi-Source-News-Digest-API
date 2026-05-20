# DEPLOYMENT GUIDE

## 📋 Overview
This guide walks you through the **complete end‑to‑end process** for setting up, building, deploying, and validating the **Multi‑Source News Digest API** project. It covers both **Docker‑based production deployment** (recommended) and an **optional local run** for development.

---

## 🛠 Prerequisites
| Requirement | Details |
|------------|---------|
| **Operating System** | Windows 10/11 (PowerShell) – paths are Windows style but Docker works on any OS. |
| **Docker Desktop** | >= 27.0 with **WSL 2** backend enabled. |
| **Docker‑Compose** | Comes with Docker Desktop (v2+). |
| **Node.js** (optional, local dev) | v20 (alpine base is used in containers). |
| **Git** | For cloning the repo. |
| **Environment variables** | See the `.env.example` file; copy it to `.env` and set your secrets.

---

## 📥 Clone the Repository
```powershell
# Open PowerShell in a suitable folder
git clone https://github.com/your‑username/news-digest-app.git
cd news-digest-app
```

---

## ⚙️ Configuration
1. **Copy the example env file**
   ```powershell
   cp .env.example .env
   ```
2. **Edit `.env`** (use any editor). Minimum required keys:
   ```text
   NODE_ENV=production
   API_SECRET_KEY=my-secret-key-2026   # used by auth middleware
   GEMINI_API_KEY=YOUR_GEMINI_KEY
   NEWSAPI_KEY=YOUR_NEWSAPI_KEY
   ```
   > **Tip**: keep `.env` out of source control – it is already in `.gitignore`.

---

## 🐳 Docker Build (Multi‑stage)
The repository contains two Dockerfiles:
- `backend/Dockerfile` – builds the Express API.
- `frontend/Dockerfile` – builds the React app.

Run the builds **once** (or after code changes):
```powershell
# From the project root
docker compose build
```
Docker will:
- Use `node:20-alpine` as the base.
- Run `npm ci` for deterministic installs.
- Compile the frontend with Vite.
- Copy only the compiled artefacts into a minimal runtime image.

---

## 🚀 Deploy with Docker‑Compose
```powershell
docker compose up -d
```
Docker‑Compose launches three services:
| Service | Purpose |
|--------|---------|
| `backend` | Express API (listening on **http://localhost:3000**). |
| `frontend` | Nginx serving the React build (available at **http://localhost**). |
| `nginx` | Reverse‑proxy: forwards `/api/*` to the backend and serves static assets. |

### Healthchecks
- **Backend**: `curl -f http://localhost:3000/health || exit 1`
- **Frontend (nginx)**: `curl -f http://localhost/ || exit 1`
Docker‑Compose will automatically restart any unhealthy container according to the `restart: unless-stopped` policy.

---

## 📚 Verify the Deployment
1. **API Swagger UI** – open **http://localhost:3000/api-docs**.
2. **Frontend** – open **http://localhost** in a browser; you should see the digest UI.
3. **Health endpoint** – run:
   ```powershell
   curl http://localhost:3000/health
   ```
   Expected JSON:
   ```json
   { "status": "ok" }
   ```
4. **Persistent storage** – a named Docker volume `digest-data` stores the digest JSON file. Verify it persists across restarts:
   ```powershell
   docker compose down
   docker compose up -d   # data remains
   ```

---

## 🛑 Graceful Shutdown (Production)
The containers are configured with a **10‑second SIGTERM timeout**. When you stop the stack:
```powershell
docker compose down
```
Docker sends `SIGTERM` to each container, allowing the Node process to close the HTTP server and flush pending writes before the container exits.

---

## 📦 Optional: Run Locally (without Docker)
```powershell
# Backend
cd backend
npm ci
npm run start   # assumes NODE_ENV=production
# Frontend (in another terminal)
cd ../frontend
npm ci
npm run dev    # Vite dev server at http://localhost:5173
```
Use **Postman** or **curl** to hit `http://localhost:3000/api/digest`.

---

## ✅ Test Suite
```powershell
# From the backend root
npm test
```
The test script uses **Jest** and **Supertest** and runs with the experimental ESM loader (`node --experimental-vm-modules`). All tests should pass (≈ 30 tests).

---

## 📦 Production Best Practices (summary)
- Run containers as **non‑root** users (defined in Dockerfiles).
- Enable **gzip compression** and static‑asset **cache‑control** headers in `nginx.conf` (already bundled).
- Keep secrets out of images – they are read from the host‑provided `.env` file.
- Use the named volume `digest-data` for stateful storage.
- Monitor health endpoints; integrate with a container orchestrator (K8s, Swarm) if needed.

---

## 🛠️ Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `Connection refused` on port 3000 | Backend container not started | `docker compose logs backend` for errors; ensure `.env` contains `API_SECRET_KEY`. |
| 404 on `/api-docs` | Nginx config not reloaded | `docker compose restart nginx` |
| No digest data persisted | Volume not mounted or permission issue | `docker volume inspect digest-data` and verify the mount path `./backend/data`. |
| Test failures (`401 Unauthorized`) | Missing `x-api-key` header in test request | Tests were updated to include `API_SECRET_KEY`; run `npm test` again. |

---

## 📂 Repository Structure (relevant files)
```
news-digest-app/
├─ backend/
│  ├─ Dockerfile          # multi‑stage, non‑root
│  ├─ src/
│  │  ├─ index.js         # server entry point, healthcheck
│  │  ├─ routes/          # /digest, /topic
│  │  └─ services/        # Gemini summarizer, scheduler
│  └─ docker-compose.yml  # defined at root (includes both services)
├─ frontend/
│  ├─ Dockerfile          # Vite build → nginx static
│  └─ src/                # React components, topic view
└─ nginx.conf               # gzip, cache‑control, reverse‑proxy
```

---

## 📖 Further Reading
- Docker best practices – https://docs.docker.com/develop/develop-images/multistage-build/
- Nginx performance tuning – https://nginx.org/en/docs/
- Security hardening – keep `API_SECRET_KEY` secret; rotate regularly.

---

*Prepared by Antigravity – your AI‑powered DevOps partner.*
