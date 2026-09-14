# Backend - FastAPI

Ce dossier contient l'API backend construite avec **FastAPI** et **Pydantic v2**.

## Structure

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   └── health.py
│   │       └── router.py
│   ├── core/
│   │   └── config.py
│   └── main.py
├── tests/
│   └── test_health.py
├── requirements.txt
└── pyproject.toml
```

## Installation

### Avec `uv` (recommandé)

```bash
uv venv --python 3.12 .venv
source .venv/bin/activate
uv pip install -e ".[dev]"
```

### Avec `pip`

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install pytest httpx
```

## Démarrage du serveur de développement

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

- API : [http://localhost:8000](http://localhost:8000)
- Swagger Docs (OpenAPI) : [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- Redoc : [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)
- Healthcheck : [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

## Tests

```bash
pytest
```

