# AI Knowledge Assistant

A Retrieval-Augmented Generation (RAG) service built with FastAPI, PostgreSQL and pgvector.
Upload PDF, DOCX or TXT documents, and ask natural-language questions about their content —
the assistant retrieves the most relevant passages via semantic vector search and answers
using OpenAI, citing its sources.

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

This starts two services:

- `postgres` — PostgreSQL with the `pgvector` extension (health-checked)
- `api` — the FastAPI application, which waits for PostgreSQL to be healthy, runs Alembic
  migrations automatically, then starts Uvicorn

The API will be available at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Basic application info |
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/documents` | Upload a PDF/DOCX/TXT document and run the ingestion pipeline |
| `GET` | `/api/v1/documents` | List all uploaded documents |
| `GET` | `/api/v1/documents/{id}` | Fetch a single document |
| `POST` | `/api/v1/search` | Semantic search over indexed chunks |
| `POST` | `/api/v1/ask` | Ask a question — full RAG pipeline |

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
