# FULL_PROJECT_EXECUTION_PROCESS_PROMPTS.md

# Full End-to-End Project Execution Prompt Pack
Project: Multi-Source News Digest API

---

# Phase 1 — Project Planning

```text
Act as a senior software architect.

Design a complete implementation roadmap for a Multi-Source News Digest API.

The system must:
- Collect news from multiple APIs/RSS feeds
- Normalize articles
- Deduplicate articles
- Generate AI summaries
- Cluster related articles
- Expose REST APIs
- Provide a frontend dashboard
- Support scheduled background jobs
- Store data in database
- Support production deployment

Generate:
1. System architecture
2. Module breakdown
3. Tech stack justification
4. Database schema
5. API structure
6. Folder structure
7. Development milestones
8. Risk analysis
9. Scalability strategy
10. Security strategy

Store in:
docs/PROJECT_ARCHITECTURE_PLAN.md
```

---

# Phase 2 — Environment Setup

```text
Act as a DevOps engineer.

Generate complete environment setup instructions.

Include:
- Node.js installation
- Package manager setup
- Environment variables
- Database setup
- Docker setup
- Git initialization
- ESLint + Prettier
- Husky hooks
- Testing framework
- CI/CD preparation

Generate:
1. Setup guide
2. Required dependencies
3. Installation commands
4. Configuration files
5. Common troubleshooting fixes

Store in:
docs/ENVIRONMENT_SETUP_GUIDE.md
```

---

# Phase 3 — Backend Development

```text
Act as a backend engineer.

Implement backend modules step by step.

Modules:
1. Express/Fastify server
2. Routing layer
3. Middleware layer
4. Authentication
5. News ingestion engine
6. Scheduler
7. Database integration
8. Logging system
9. Error handling
10. Search APIs
11. Filtering APIs
12. Trending topics APIs

Generate:
- Complete implementation plan
- File-by-file breakdown
- Folder structure
- API contracts
- Request/response schemas
- Testing strategy

Store in:
docs/BACKEND_IMPLEMENTATION_GUIDE.md
```

---

# Phase 4 — News Aggregation Engine

```text
Act as a distributed systems engineer.

Design and implement the news collection engine.

Requirements:
- Multi-source collection
- RSS parsing
- REST API ingestion
- Retry mechanisms
- Parallel fetching
- Deduplication
- Failure recovery
- Rate limiting
- Source reliability tracking

Generate:
1. Collection workflow
2. Data normalization logic
3. Scheduler workflow
4. Retry architecture
5. Failure handling strategy
6. Monitoring approach

Store in:
docs/NEWS_ENGINE_IMPLEMENTATION.md
```

---

# Phase 5 — AI Summarization Engine

```text
Act as an AI systems engineer.

Implement the LLM summarization engine.

Requirements:
- Prompt engineering
- Summarization pipeline
- Hallucination prevention
- Token optimization
- Retry handling
- Cost optimization
- AI response validation
- Safety filtering

Generate:
1. Prompt templates
2. LLM workflow
3. API integration strategy
4. Error handling
5. Cost analysis
6. Quality evaluation metrics

Store in:
docs/AI_SUMMARIZATION_IMPLEMENTATION.md
```

---

# Phase 6 — Topic Clustering Engine

```text
Act as an ML engineer.

Implement article clustering and topic grouping.

Requirements:
- Embedding generation
- Similarity scoring
- Topic clustering
- Duplicate detection
- Keyword extraction
- Trending topic analysis

Generate:
1. Clustering architecture
2. Similarity algorithms
3. Embedding workflow
4. Topic extraction pipeline
5. Evaluation metrics
6. Scalability approach

Store in:
docs/CLUSTERING_ENGINE_GUIDE.md
```

---

# Phase 7 — Frontend Dashboard

```text
Act as a frontend architect.

Build a responsive frontend dashboard.

Features:
- News feed
- Topic grouping
- Search
- Filtering
- Pagination
- Trending topics
- Dark mode
- Responsive UI
- Error states
- Loading states

Generate:
1. UI architecture
2. Component structure
3. State management
4. API integration workflow
5. Responsive strategy
6. Accessibility strategy

Store in:
docs/FRONTEND_IMPLEMENTATION_GUIDE.md
```

---

# Phase 8 — Testing Strategy

```text
Act as a QA automation engineer.

Create complete testing strategy.

Include:
- Unit tests
- Integration tests
- API tests
- Load tests
- Security tests
- UI tests
- AI pipeline tests
- Database tests

Generate:
1. Testing architecture
2. Test case templates
3. Mocking strategy
4. Automation strategy
5. CI test pipeline

Store in:
docs/TESTING_STRATEGY_GUIDE.md
```

---

# Phase 9 — Security Hardening

```text
Act as a cybersecurity engineer.

Perform security hardening.

Secure:
- API keys
- Environment variables
- Authentication
- Database
- HTTP headers
- Input validation
- Prompt injection
- Rate limiting
- Dependency vulnerabilities

Generate:
1. Security checklist
2. Hardening steps
3. Threat model
4. Attack simulations
5. Remediation strategy

Store in:
docs/SECURITY_HARDENING_GUIDE.md
```

---

# Phase 10 — Deployment & DevOps

```text
Act as a DevOps architect.

Prepare production deployment.

Requirements:
- Docker
- Docker Compose
- CI/CD
- Monitoring
- Logging
- Health checks
- Auto restart
- Backup strategy
- Scalability support

Generate:
1. Deployment workflow
2. CI/CD pipeline
3. Infrastructure diagram
4. Monitoring strategy
5. Disaster recovery plan

Store in:
docs/DEPLOYMENT_GUIDE.md
```

---

# Phase 11 — Final Production Audit

```text
Act as a principal software engineer.

Perform a final production audit of the entire project.

Analyze:
- Architecture quality
- Scalability
- Security
- Maintainability
- Reliability
- AI quality
- API quality
- Frontend quality
- Deployment readiness

Generate:
1. Final audit report
2. Functional checklist
3. Non-functional checklist
4. Technical debt analysis
5. Production readiness score
6. Future roadmap

Store in:
docs/FINAL_PRODUCTION_AUDIT.md
```

---
