# INTER-NET

Projet Web fullstack composé d'un backend en **FastAPI (Python)** et d'un frontend en **React (TypeScript + Vite + Tailwind CSS)**.

---

## 📁 Architecture du projet

```text
INTER-NET/
├── backend/                  # API FastAPI (Python 3.12+)
│   ├── app/
│   │   ├── api/v1/           # Endpoints & routeurs versionnés
│   │   │   ├── endpoints/    # health, etc.
│   │   │   └── router.py
│   │   ├── core/             # Configuration & Pydantic settings
│   │   │   └── config.py
│   │   └── main.py           # Application FastAPI & middleware CORS
│   ├── tests/                # Tests unitaires pytest
│   ├── requirements.txt
│   └── pyproject.toml
│
├── frontend/                 # Application React (TypeScript + Vite)
│   ├── src/
│   │   ├── services/         # Client API HTTP typé
│   │   │   └── api.ts
│   │   ├── App.tsx           # Dashboard / Statut API
│   │   ├── index.css         # Tailwind CSS
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts        # Configuration Vite + Proxy API
│   └── package.json
│
├── .gitignore
├── .dockerignore
└── package.json              # Scripts racine pratiques
```

---

## 🚀 Démarrage rapide

### 1. Prérequis

- Python 3.11+ (recommandé 3.12) et `uv` ou `pip`
- Node.js 20+ et `npm`

### 2. Backend (FastAPI)

```bash
cd backend
# Création du venv et installation des dépendances (avec uv)
uv venv --python 3.12 .venv
source .venv/bin/activate
uv pip install -e ".[dev]"

# Lancement du serveur en mode reload
uvicorn app.main:app --reload --port 8000
```

- API : [http://localhost:8000](http://localhost:8000)
- Documentation Swagger : [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- Health check : [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 3. Frontend (React + Vite)

Dans un autre terminal :

```bash
cd frontend
npm install
npm run dev
```

- Frontend disponible sur : [http://localhost:5173](http://localhost:5173)

---

## 🧪 Tests

### Tests Backend

```bash
cd backend
source .venv/bin/activate
pytest
```

### Build Frontend

```bash
cd frontend
npm run build
```