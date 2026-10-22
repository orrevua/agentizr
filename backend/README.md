# Agentizr Backend

FastAPI service that owns catalogs, validation, generators, and zip streaming for Agentizr.

## Quickstart

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Health: `curl http://localhost:8000/api/v1/health`.

## Tests

```bash
uv run pytest
```
