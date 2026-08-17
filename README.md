# Masteacon — Your beacon to mastery.

Masteacon is a Retrieval-Augmented Generation (RAG) knowledge assistant built with FastAPI,
PostgreSQL and pgvector, with a React web app on top. Upload PDF, DOCX or TXT documents, and
ask natural-language questions about their content — Masteacon retrieves the most relevant
passages via semantic vector search and answers using OpenAI or Anthropic, citing its sources.

> The underlying repository, package names and technical identifiers still use the project's
> original working name (`ai-knowledge-assistant`) — only the product-facing name changed.

## Project Overview

This project is a knowledge-base backend: it turns unstructured documents into a searchable,
question-answerable knowledge base.

```text
Document Upload
       ↓
Text Extraction
       ↓
Chunking
       ↓
Embedding
       ↓
PostgreSQL + pgvector
       ↓
Semantic Search
       ↓
Relevant Chunks
       ↓
RAG
       ↓
OpenAI
       ↓
Answer + Sources
```

## Features

- Upload PDF, DOCX and TXT documents through a REST API
- Automatic text extraction, chunking and embedding on upload
- Semantic (vector) search over indexed document chunks
- Retrieval-Augmented Generation question answering, grounded strictly in retrieved context
- Source attribution for every generated answer
- File upload security: extension/MIME validation, size limits, safe generated filenames
- Clean layered architecture (routes → services → repositories → database)
- Fully async FastAPI + SQLAlchemy stack
- Dockerized for one-command local startup

## Tech Stack

- **Framework:** FastAPI (async)
- **Database:** PostgreSQL + [pgvector](https://github.com/pgvector/pgvector)
- **ORM / Migrations:** SQLAlchemy 2.0 (async) + Alembic
- **Config:** Pydantic Settings
- **LLM Provider:** OpenAI (chat completions + embeddings)
- **Parsing:** pypdf, python-docx
- **Tokenization:** tiktoken
- **Testing:** pytest, pytest-asyncio
- **Containerization:** Docker, Docker Compose

## Architecture

The codebase follows a strict layering discipline: `route → service → repository → database`.
Business logic never talks to SQLAlchemy directly, and the API layer never talks to OpenAI
directly — both are isolated behind services and a provider abstraction.

```text
app/
├── main.py                      # FastAPI app, routers, exception handlers
│
├── api/
│   ├── dependencies.py          # Dependency-injection wiring
│   └── routes/                  # HTTP routes (thin — delegate to services)
│       ├── health.py
│       ├── documents.py
│       ├── search.py
│       └── rag.py
│
├── core/
│   ├── config.py                # Pydantic Settings
│   ├── database.py              # Async engine/session/Base
│   ├── exceptions.py            # Domain exceptions → HTTP status mapping
│   └── logging.py
│
├── models/                      # SQLAlchemy ORM models
│   ├── document.py
│   └── document_chunk.py
│
├── schemas/                     # Pydantic request/response models
│   ├── document.py
│   ├── search.py
│   └── rag.py
│
├── repositories/                # Database queries only
│   ├── document_repository.py
│   └── chunk_repository.py
│
├── services/                    # Business logic / orchestration
│   ├── document_service.py      # Upload → validate → store → parse → chunk → embed
│   ├── parsing_service.py       # PDF/DOCX/TXT text extraction
│   ├── chunking_service.py      # Token-aware overlapping chunking
│   ├── embedding_service.py     # Wraps an EmbeddingProvider
│   ├── retrieval_service.py     # Semantic search
│   └── rag_service.py           # Retrieval + prompt construction + generation
│
└── providers/                   # External API abstractions
    ├── base_embedding_provider.py
    ├── base_chat_provider.py
    └── openai_provider.py       # OpenAI implementation of both providers

tests/       # pytest suite (fully mocked providers — no real OpenAI calls)
alembic/     # Database migrations
uploads/     # Uploaded file storage (gitignored, safe generated filenames only)
```

## RAG Pipeline

1. **Upload:** a document is validated, safely stored, parsed into plain text.
2. **Chunking:** text is split into overlapping, token-bounded chunks (`CHUNK_SIZE` / `CHUNK_OVERLAP`).
3. **Embedding:** each chunk is embedded via OpenAI (`OPENAI_EMBEDDING_MODEL`) and stored in
   PostgreSQL using a `pgvector` column.
4. **Ask:** a question is embedded the same way, and the most similar chunks are retrieved
   from PostgreSQL via cosine similarity (`SEARCH_TOP_K`, `SIMILARITY_THRESHOLD`).
5. **Generate:** the retrieved chunks are placed into a strict, context-only system prompt sent
   to OpenAI (`OPENAI_CHAT_MODEL`). If no relevant context is found, the assistant explicitly
   says so instead of hallucinating an answer.
6. **Respond:** the answer is returned together with the list of source chunks that were used.

## Installation

### Prerequisites

- Python 3.11+
- Docker & Docker Compose (recommended — see [Docker Usage](#docker-usage))
- An OpenAI API key

### Local (without Docker)

```bash
python -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash
pip install -r requirements.txt
cp .env.example .env            # then fill in OPENAI_API_KEY and DATABASE_URL
alembic upgrade head
uvicorn app.main:app --reload
```

This requires a running PostgreSQL instance with the `pgvector` extension available
(the Docker setup below provisions this for you).

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `APP_NAME` | Application name | `AI Knowledge Assistant` |
| `APP_ENV` | Environment name | `development` |
| `DEBUG` | Enable debug logging / SQL echo | `true` |
| `DATABASE_URL` | Async PostgreSQL connection string | — |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `OPENAI_CHAT_MODEL` | Chat completion model | `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |
| `CHUNK_SIZE` | Max tokens per chunk | `800` |
| `CHUNK_OVERLAP` | Token overlap between chunks | `150` |
| `SEARCH_TOP_K` | Default number of chunks retrieved | `5` |
| `SIMILARITY_THRESHOLD` | Minimum cosine similarity to keep a match | `0.3` |
| `MAX_UPLOAD_SIZE_MB` | Max upload size | `20` |
| `UPLOAD_DIRECTORY` | Directory for stored uploads | `uploads` |

See [`.env.example`](.env.example) for a ready-to-copy template. The real `.env` file is
never committed.

## Docker Usage

```bash
docker compose up --build
```

This starts three services:

- `postgres` — PostgreSQL with the `pgvector` extension (health-checked)
- `api` — the FastAPI application, which waits for PostgreSQL to be healthy, runs Alembic
  migrations automatically, then starts Uvicorn
- `frontend` — the React web app, built and served by nginx

The API is available at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`. The web app is available at `http://localhost:5173`.

> This project has grown beyond the original single-user MVP described further below — it now
> also has JWT authentication, per-user workspaces, persistent conversation history, a
> configurable OpenAI/Anthropic provider, LLM function-calling tools, and this frontend. See
> `/docs` (Swagger) for the full, current list of endpoints; the sections below are being
> updated to match as that work lands.

## Frontend

A React + Vite + TypeScript single-page app in [`frontend/`](frontend), covering:

- **Auth** — register / login (JWT stored client-side, attached to every API call)
- **Workspaces** — create and switch between workspaces
- **Documents** — upload PDF/DOCX/TXT, see indexing status
- **Chat** — per-workspace conversations with persistent history and source citations
- **Agent** — ask questions that may trigger LLM function-calling tools (list workspaces/
  documents, summarize a document), with a log of exactly which tools ran and their result

Run it standalone against a local API:

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL, defaults to http://localhost:8000
npm install
npm run dev             # http://localhost:5173
```

## API Endpoints

The authoritative, up-to-date list is always at `/docs` (Swagger UI). As of this writing:

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Basic application info |
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/auth/register` | Create an account, returns an access token |
| `POST` | `/api/v1/auth/login` | Log in, returns an access token |
| `GET` | `/api/v1/auth/me` | Current authenticated user |
| `POST` | `/api/v1/workspaces` | Create a workspace |
| `GET` | `/api/v1/workspaces` | List your workspaces |
| `GET` | `/api/v1/workspaces/{id}` | Fetch one of your workspaces |
| `POST` | `/api/v1/documents` | Upload a PDF/DOCX/TXT document into a workspace |
| `GET` | `/api/v1/documents` | List documents in a workspace |
| `GET` | `/api/v1/documents/{id}` | Fetch a single document |
| `POST` | `/api/v1/search` | Semantic search within a workspace |
| `POST` | `/api/v1/ask` | Ask a question — one-shot RAG, no history |
| `POST` | `/api/v1/conversations` | Start a conversation in a workspace |
| `GET` | `/api/v1/conversations` | List your conversations in a workspace |
| `GET` | `/api/v1/conversations/{id}` | Fetch a conversation with its messages |
| `POST` | `/api/v1/conversations/{id}/messages` | Ask within a conversation (RAG + history) |
| `POST` | `/api/v1/agent/ask` | Ask, letting the LLM call read-only tools if it needs to |

All endpoints except `/`, `/health`, `/docs` and `/api/v1/auth/*` require a `Bearer` access
token, and every workspace-scoped endpoint verifies you own that workspace before returning
anything.

## Example Requests

**Upload a document**

```bash
curl -X POST http://localhost:8000/api/v1/documents \
  -F "file=@employee_handbook.pdf"
```

**Semantic search**

```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Şirketin yıllık izin politikası nedir?", "limit": 5}'
```

**Ask a question (RAG)**

```bash
curl -X POST http://localhost:8000/api/v1/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Şirketin yıllık izin politikası nedir?"}'
```

```json
{
  "answer": "Şirket politikasına göre çalışanlar yılda 14 gün izin hakkına sahiptir.",
  "sources": [
    {
      "document_id": 1,
      "filename": "employee_handbook.pdf",
      "chunk_index": 4,
      "similarity_score": 0.91
    }
  ]
}
```

## Testing

```bash
pytest
```

The test suite covers the health endpoint, parsing (PDF/DOCX/TXT), chunking, the embedding
service, semantic retrieval and the RAG pipeline. All OpenAI calls are replaced with
deterministic fake providers — no real, billable API calls are made during testing, and
results are reproducible.

## Roadmap

Planned for future iterations (intentionally **not** part of the current MVP):

- Anthropic Claude as an alternative chat provider
- Function calling / tool use
- Authentication and user accounts
- Multi-user workspaces
- Persistent conversation history
- Redis + Celery for async background document indexing
- Reranking of retrieved chunks
- Metadata filtering in search
- Observability (tracing, metrics)
- Automated RAG evaluation
- Frontend UI
