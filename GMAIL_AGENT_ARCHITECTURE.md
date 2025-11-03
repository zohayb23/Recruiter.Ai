# 🏗️ Gmail Agent Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         GMAIL AGENT SYSTEM                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│   Gmail Inbox   │
│   📧 📧 📧 📧   │
└────────┬────────┘
         │ IMAP Connection
         │ (checks every 60s)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              GMAIL AGENT (gmail_agent.py)                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  1. Connect to Gmail via IMAP                          │    │
│  │  2. Fetch UNSEEN emails                                │    │
│  │  3. Check if already processed (duplicate detection)   │    │
│  │  4. Extract: sender, subject, body, date               │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  AI PARSING (OpenAI GPT-4o-mini)                       │    │
│  │  • Categorize email type                               │    │
│  │  • Extract sender info                                 │    │
│  │  • Identify key points                                 │    │
│  │  • Detect resume/job inquiry                           │    │
│  │  • Assign priority                                     │    │
│  │  • Extract candidate info                              │    │
│  │  • Generate summary                                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  EMBEDDING GENERATION (sentence-transformers)          │    │
│  │  • Generate 384-dim vector                             │    │
│  │  • Enable semantic search                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  MILVUS STORAGE                                        │    │
│  │  • Store structured email data                         │    │
│  │  • Store semantic embedding                            │    │
│  │  • Update processed_emails.json                        │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MILVUS DATABASE                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Collection: "emails"                                  │    │
│  │  ┌──────────────────────────────────────────────┐     │    │
│  │  │  • id (VARCHAR)                               │     │    │
│  │  │  • sender_email (VARCHAR)                     │     │    │
│  │  │  • sender_name (VARCHAR)                      │     │    │
│  │  │  • subject (VARCHAR)                          │     │    │
│  │  │  • body (VARCHAR)                             │     │    │
│  │  │  • email_type (VARCHAR)                       │     │    │
│  │  │  • is_resume (BOOL)                           │     │    │
│  │  │  • priority (VARCHAR)                         │     │    │
│  │  │  • extracted_data (JSON)                      │     │    │
│  │  │  • embedding (FLOAT_VECTOR)                   │     │    │
│  │  └──────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BACKEND API (email_routes.py)                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  GET  /api/emails/list                                 │    │
│  │  GET  /api/emails/{id}                                 │    │
│  │  GET  /api/emails/search/semantic?query=...           │    │
│  │  GET  /api/emails/stats/overview                       │    │
│  │  DELETE /api/emails/{id}                               │    │
│  │  GET  /api/emails/health/agent-status                  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND / DASHBOARD                          │
│  • View all emails                                               │
│  • Search emails semantically                                    │
│  • Filter by type/priority                                       │
│  • View analytics                                                │
│  • Manage emails                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Email Ingestion
```
Gmail Inbox → IMAP → Gmail Agent → Parse → Store → API
```

### 2. Email Processing
```
Raw Email
    ↓
Extract Metadata (sender, subject, body)
    ↓
AI Parsing (categorization, extraction)
    ↓
Generate Embedding (semantic vector)
    ↓
Store in Milvus
    ↓
Available via API
```

### 3. Email Retrieval
```
API Request → Milvus Query → Format Response → Return JSON
```

### 4. Semantic Search
```
Search Query
    ↓
Generate Query Embedding
    ↓
Vector Similarity Search in Milvus
    ↓
Return Ranked Results
```

## Component Interaction

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Gmail IMAP      │────▶│  Gmail Agent     │────▶│  OpenAI API      │
│  (Email Source)  │     │  (Orchestrator)  │     │  (AI Parser)     │
└──────────────────┘     └─────────┬────────┘     └──────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │  Sentence        │
                         │  Transformers    │
                         │  (Embeddings)    │
                         └─────────┬────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │  Milvus DB       │
                         │  (Storage)       │
                         └─────────┬────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │  Email Routes    │
                         │  (API Layer)     │
                         └─────────┬────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │  Frontend        │
                         │  (UI/Dashboard)  │
                         └──────────────────┘
```

## Deployment Architecture

### Development
```
Local Machine
├── Gmail Agent (Python process)
├── Milvus (Docker container)
├── Backend API (FastAPI on port 8804)
└── Frontend (React on port 3000)
```

### Production
```
Cloud Server
├── Gmail Agent (systemd service or Docker)
├── Milvus (Docker container or managed service)
├── Backend API (behind Nginx reverse proxy)
└── Frontend (static files served by Nginx)
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────────┤
│  1. Gmail Authentication                                         │
│     • App Password (not regular password)                        │
│     • Environment variables (not hardcoded)                      │
│     • TLS/SSL connection                                         │
├─────────────────────────────────────────────────────────────────┤
│  2. OpenAI API                                                   │
│     • API key in environment                                     │
│     • Rate limiting                                              │
│     • Error handling                                             │
├─────────────────────────────────────────────────────────────────┤
│  3. Milvus Database                                              │
│     • Local network only (default)                               │
│     • No public exposure                                         │
│     • Authentication enabled (production)                        │
├─────────────────────────────────────────────────────────────────┤
│  4. Backend API                                                  │
│     • CORS configuration                                         │
│     • Input validation                                           │
│     • Error handling                                             │
├─────────────────────────────────────────────────────────────────┤
│  5. Data Privacy                                                 │
│     • No email content in logs                                   │
│     • Local processing only                                      │
│     • Configurable data retention                                │
└─────────────────────────────────────────────────────────────────┘
```

## Scalability Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SINGLE INSTANCE (Current)                    │
│  • Handles: ~100 emails/hour                                     │
│  • Processing: 2-3s per email                                    │
│  • Memory: 200-300 MB                                            │
│  • CPU: ~5% during processing                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  MULTI-INSTANCE (Future)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ Agent #1   │  │ Agent #2   │  │ Agent #3   │                │
│  │ (Account A)│  │ (Account B)│  │ (Account C)│                │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                │
│        │                │                │                       │
│        └────────────────┴────────────────┘                       │
│                         │                                        │
│                         ▼                                        │
│                 ┌──────────────┐                                 │
│                 │  Shared      │                                 │
│                 │  Milvus DB   │                                 │
│                 └──────────────┘                                 │
│  • Handles: ~300 emails/hour                                     │
│  • Multiple accounts                                             │
│  • Load balanced                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      MONITORING STACK                            │
├─────────────────────────────────────────────────────────────────┤
│  Application Level:                                              │
│  • gmail_agent.log (processing logs)                             │
│  • processed_emails.json (tracking)                              │
│  • /api/emails/health/agent-status (health check)               │
├─────────────────────────────────────────────────────────────────┤
│  System Level:                                                   │
│  • CPU/Memory monitoring                                         │
│  • Disk usage                                                    │
│  • Network connectivity                                          │
├─────────────────────────────────────────────────────────────────┤
│  Database Level:                                                 │
│  • Milvus collection size                                        │
│  • Query performance                                             │
│  • Storage utilization                                           │
├─────────────────────────────────────────────────────────────────┤
│  API Level:                                                      │
│  • Response times                                                │
│  • Error rates                                                   │
│  • Request counts                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Email Processing
    │
    ├─── Gmail Connection Error
    │    └─── Log error, retry after 60s
    │
    ├─── OpenAI API Error
    │    └─── Fallback to basic parsing
    │
    ├─── Milvus Storage Error
    │    └─── Log error, continue processing
    │
    ├─── Embedding Generation Error
    │    └─── Use zero vector fallback
    │
    └─── Unknown Error
         └─── Log error, skip email, continue
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                        STATE TRACKING                            │
├─────────────────────────────────────────────────────────────────┤
│  processed_emails.json                                           │
│  • List of processed email IDs                                   │
│  • Prevents duplicate processing                                 │
│  • Persists across restarts                                      │
│  • Can be reset to reprocess                                     │
├─────────────────────────────────────────────────────────────────┤
│  In-Memory State                                                 │
│  • Current connection status                                     │
│  • Processing queue                                              │
│  • Error counters                                                │
│  • Performance metrics                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRATION DIAGRAM                           │
└─────────────────────────────────────────────────────────────────┘

Gmail Agent ←──→ Gmail (IMAP)
    │
    ├──→ OpenAI (API)
    │
    ├──→ Sentence Transformers (Local)
    │
    ├──→ Milvus (Database)
    │
    └──→ Backend API
            │
            ├──→ Frontend (React)
            │
            ├──→ Mobile App (Future)
            │
            └──→ Webhooks (Future)
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER              │  TECHNOLOGY                                │
├─────────────────────────────────────────────────────────────────┤
│  Email Client       │  imaplib (Python standard library)         │
│  AI Parsing         │  OpenAI GPT-4o-mini                        │
│  Embeddings         │  sentence-transformers (all-MiniLM-L6-v2)  │
│  Vector DB          │  Milvus                                    │
│  API Framework      │  FastAPI                                   │
│  Language           │  Python 3.9+                               │
│  Container          │  Docker (for Milvus)                       │
│  Process Manager    │  systemd / nohup / Docker                  │
└─────────────────────────────────────────────────────────────────┘
```

## Network Architecture

```
Internet
    │
    ├──→ Gmail IMAP (imap.gmail.com:993)
    │    └─── TLS/SSL encrypted
    │
    ├──→ OpenAI API (api.openai.com:443)
    │    └─── HTTPS encrypted
    │
    └──→ Hugging Face (for model download)
         └─── HTTPS encrypted

Local Network
    │
    ├──→ Milvus (localhost:19530)
    │
    └──→ Backend API (localhost:8804)
```

## Development vs Production

### Development Setup
```
┌─────────────────────────────────────────────────────────────────┐
│  • Run agent directly: python3 -m backend.services.gmail_agent  │
│  • Manual start/stop                                             │
│  • Logs to console                                               │
│  • No automatic restart                                          │
│  • Easy debugging                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Production Setup
```
┌─────────────────────────────────────────────────────────────────┐
│  • Run as systemd service or Docker container                    │
│  • Automatic start on boot                                       │
│  • Logs to file                                                  │
│  • Automatic restart on failure                                  │
│  • Monitoring and alerting                                       │
│  • Load balancing (if multi-instance)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Future Architecture Enhancements

```
┌─────────────────────────────────────────────────────────────────┐
│                     FUTURE ENHANCEMENTS                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Multi-Account Support                                        │
│     • Process multiple Gmail accounts                            │
│     • Shared Milvus database                                     │
│     • Account-based filtering                                    │
├─────────────────────────────────────────────────────────────────┤
│  2. Attachment Processing                                        │
│     • Extract and parse PDF resumes                              │
│     • Store attachments in object storage                        │
│     • Link to email records                                      │
├─────────────────────────────────────────────────────────────────┤
│  3. Email Threading                                              │
│     • Group related emails                                       │
│     • Track conversation history                                 │
│     • Context-aware parsing                                      │
├─────────────────────────────────────────────────────────────────┤
│  4. Webhook Integration                                          │
│     • Trigger external systems                                   │
│     • Real-time notifications                                    │
│     • Workflow automation                                        │
├─────────────────────────────────────────────────────────────────┤
│  5. Advanced Analytics                                           │
│     • Sentiment analysis                                         │
│     • Trend detection                                            │
│     • Predictive insights                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

This architecture is designed to be:
- **Scalable**: Can handle increasing email volumes
- **Maintainable**: Clean separation of concerns
- **Reliable**: Robust error handling and recovery
- **Secure**: Multiple layers of security
- **Extensible**: Easy to add new features

The current implementation provides a solid foundation that can grow with your needs.

