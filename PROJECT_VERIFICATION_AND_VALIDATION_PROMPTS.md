# PROJECT_VERIFICATION_AND_VALIDATION_PROMPTS.md

# Full Project Verification & Validation Prompt Pack
Project: Multi-Source News Digest API  
Scope: Backend API, LLM Summarization, Clustering Engine, Scheduler, Database, Frontend, Deployment, Monitoring

---

# 1. Repository Structure Verification Prompt

```text
Act as a senior software architect and QA engineer.

Analyze the entire repository structure and verify whether the project follows clean architecture and modular development practices.

Check and validate:
- Folder organization
- Separation of concerns
- API layer structure
- Service layer
- Database layer
- Config management
- Environment variable usage
- Frontend/backend separation
- Reusability of modules
- Naming conventions
- Scalability and maintainability
- Error handling structure
- Logging structure
- Security configuration
- Scheduler/background jobs
- LLM integration structure

Generate:
1. Architecture validation report
2. Missing modules report
3. Scalability analysis
4. Refactoring recommendations
5. Production readiness score
6. Security risk analysis

Store final result in:
docs/ARCHITECTURE_VALIDATION_REPORT.md
```

---

# 2. Backend API Verification Prompt

```text
Act as a backend API auditor.

Verify the complete backend implementation.

Check:
- REST API correctness
- Route naming conventions
- HTTP methods usage
- Request validation
- Response consistency
- Error response format
- API status codes
- Middleware usage
- Authentication handling
- Rate limiting
- CORS configuration
- Input sanitization
- Environment configuration
- API modularity
- Controller/service separation

Test:
- Valid requests
- Invalid requests
- Empty payloads
- Large payloads
- Concurrent requests
- Timeout handling

Generate:
1. API validation report
2. Security vulnerabilities
3. Performance bottlenecks
4. Suggested fixes
5. API quality score

Store result in:
docs/API_VALIDATION_REPORT.md
```

---

# 3. Database Validation Prompt

```text
Act as a database reliability engineer.

Validate the complete database implementation.

Check:
- Schema correctness
- Table relationships
- Index optimization
- Query efficiency
- Duplicate prevention
- Migration handling
- Transaction safety
- Data consistency
- Retry mechanisms
- Backup strategy
- Failure recovery
- Database scalability

Analyze:
- Query execution patterns
- Connection pooling
- Data normalization
- Data retention strategy

Generate:
1. Database validation report
2. Query optimization report
3. Scalability analysis
4. Risk assessment
5. Production readiness checklist

Store result in:
docs/DATABASE_VALIDATION_REPORT.md
```

---

# 4. News Collection Engine Verification Prompt

```text
Act as a distributed data ingestion engineer.

Verify the news collection pipeline.

Validate:
- Multi-source ingestion
- RSS/API integration
- Retry handling
- Timeout handling
- Deduplication logic
- Failure recovery
- Scheduler reliability
- Source prioritization
- Parallel processing
- Data normalization
- Invalid article filtering
- Duplicate news prevention

Test:
- API failure scenarios
- Slow network simulation
- Empty source response
- Invalid JSON response
- Duplicate article ingestion

Generate:
1. News collector validation report
2. Reliability analysis
3. Failure handling analysis
4. Data quality score
5. Recommended improvements

Store result in:
docs/NEWS_COLLECTOR_VALIDATION.md
```

---

# 5. LLM Summarization Validation Prompt

```text
Act as an AI quality assurance engineer.

Validate the LLM summarization pipeline.

Check:
- Prompt engineering quality
- Summary relevance
- Hallucination risk
- Token efficiency
- Retry handling
- API failure handling
- Rate limit handling
- Prompt injection resistance
- Consistency of summaries
- Bias analysis
- Safety filtering

Evaluate:
- Summary accuracy
- Summary readability
- Context preservation
- Compression ratio
- Response latency

Generate:
1. AI summarization validation report
2. Hallucination analysis
3. Prompt optimization suggestions
4. Cost optimization analysis
5. Reliability score

Store result in:
docs/LLM_VALIDATION_REPORT.md
```

---

# 6. Clustering & Topic Grouping Validation Prompt

```text
Act as an ML systems evaluator.

Validate the article clustering implementation.

Check:
- Similarity calculation
- Topic grouping accuracy
- Duplicate cluster prevention
- Cluster consistency
- Embedding usage
- Keyword extraction
- Semantic grouping quality
- Noise filtering
- Edge case handling

Test:
- Similar articles
- Completely unrelated articles
- Breaking news scenarios
- High-volume article ingestion
- Multi-topic conflicts

Generate:
1. Clustering validation report
2. Topic consistency analysis
3. Precision/recall estimation
4. Error analysis
5. Suggested improvements

Store result in:
docs/CLUSTERING_VALIDATION_REPORT.md
```

---

# 7. Frontend Validation Prompt

```text
Act as a senior frontend QA engineer.

Validate the frontend implementation.

Check:
- Responsive design
- Accessibility
- Loading performance
- Error handling
- API integration
- State management
- Search functionality
- Pagination
- UI consistency
- SEO optimization
- Lazy loading
- Mobile compatibility

Test:
- Slow network
- Broken API response
- Empty news feeds
- Large article volume
- Different screen sizes

Generate:
1. Frontend validation report
2. UI/UX analysis
3. Accessibility report
4. Performance report
5. Mobile compatibility report

Store result in:
docs/FRONTEND_VALIDATION_REPORT.md
```

---

# 8. Security Validation Prompt

```text
Act as a cybersecurity auditor.

Perform full security validation.

Check:
- API key exposure
- Environment variable leaks
- SQL injection vulnerabilities
- XSS vulnerabilities
- CSRF protection
- Authentication weaknesses
- Dependency vulnerabilities
- Rate limiting
- Input validation
- Sensitive logging
- Secret management
- Prompt injection attacks
- SSRF risks

Generate:
1. Security audit report
2. Vulnerability severity classification
3. Exploitation scenarios
4. Remediation plan
5. OWASP compliance analysis

Store result in:
 docs/SECURITY_AUDIT_REPORT.md
```

---

# 9. Performance Testing Prompt

```text
Act as a performance engineer.

Run full performance validation.

Test:
- API latency
- Database query speed
- LLM response latency
- Concurrent users
- Memory usage
- CPU utilization
- Scheduler performance
- Cache efficiency
- Frontend rendering speed
- Cold start performance

Simulate:
- 100 users
- 1000 users
- Burst traffic
- API provider failures
- Database slowdown

Generate:
1. Performance benchmarking report
2. Bottleneck analysis
3. Optimization recommendations
4. Load testing results
5. Scalability estimation

Store result in:
docs/PERFORMANCE_REPORT.md
```

---

# 10. Deployment Validation Prompt

```text
Act as a DevOps engineer.

Validate deployment readiness.

Check:
- Docker configuration
- Environment setup
- CI/CD pipeline
- Production secrets
- Health checks
- Logging
- Monitoring
- Backup configuration
- Rollback strategy
- Scalability setup

Verify:
- Local deployment
- Cloud deployment
- Production startup
- Restart resilience
- Failure recovery

Generate:
1. Deployment validation report
2. Infrastructure readiness analysis
3. CI/CD audit
4. Production checklist
5. Reliability score

Store result in:
docs/DEPLOYMENT_VALIDATION_REPORT.md
```

---

# 11. Final End-to-End Validation Prompt

```text
Act as a principal software engineer performing final production validation.

Perform complete end-to-end validation of the Multi-Source News Digest API project.

Validate:
- News ingestion
- Database storage
- LLM summarization
- Topic clustering
- API functionality
- Frontend rendering
- Search/filter functionality
- Error handling
- Logging
- Monitoring
- Deployment readiness
- Security posture
- Performance stability

Generate:
1. Complete project audit report
2. Functional verification checklist
3. Non-functional verification checklist
4. Production readiness report
5. Architecture quality analysis
6. Final project score out of 10
7. Patent/research novelty analysis
8. Future enhancement recommendations

Store final output in:
docs/FINAL_PROJECT_AUDIT_REPORT.md
```
