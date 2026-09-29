# Microservices d'intégration (Steam & GitHub)

Les appels aux API Steam et GitHub sont sortis du backend et placés dans deux
microservices **sans état**. Chacun tourne en plusieurs réplicas derrière son
propre load balancer nginx, et ils partagent un cache Redis.

```text
frontend ─► backend (auth, widgets, admin, OAuth, MySQL)
               ├─► steam-lb  (nginx) ─► steam-service  x N ─┐
               └─► github-lb (nginx) ─► github-service x N ─┴─► Redis (cache)
```

- **Le backend reste l'unique API publique.** Il valide le JWT, lit en base le
  `steam_id` ou le token GitHub de l'utilisateur, puis appelle le service
  interne. Les callbacks OAuth et l'enregistrement des comptes restent dans le backend.
- **Les services n'ont ni base de données ni auth utilisateur.** Ils reçoivent les
  identifiants dans la requête, appellent l'API externe et mettent le résultat en
  cache. C'est ce qui permet de les répliquer librement.
- **Le cache est partagé entre les réplicas** (Redis) : une donnée récupérée par une
  réplica profite aux autres. Les clés GitHub utilisent un hash SHA-256 du token,
  jamais le token lui-même. Si Redis tombe, le cache est simplement contourné.

## Structure

```text
services/
├── common/              # Code partagé : cache (Redis / mémoire), app de base (/health, X-Served-By)
├── steam-service/       # GET /players/{steam_id}/profile, /players/{steam_id}/stats
├── github-service/      # GET /user/profile, /user/stats, /user/orgs,
│                        #     /orgs/{org}/stats, /repos/{owner}/{repo}/stats
└── lb/                  # Configs nginx des load balancers
```

Le github-service reçoit le token de l'utilisateur via `Authorization: Bearer <token>`.
Le steam-service détient la clé `STEAM_API_KEY` (lue depuis `backend/.env` en Docker).

## Docker

```bash
docker compose up -d --build                      # 2 réplicas par service par défaut
docker compose up -d --scale steam-service=4      # changer le nombre de réplicas à chaud
docker compose logs -f steam-lb                   # voir la répartition et le cache
```

Chaque ligne de log du load balancer indique la réplica qui a répondu et si la
donnée venait du cache :

```text
172.18.0.9 "GET /players/7656.../stats HTTP/1.1" 200 upstream=172.18.0.5:8080 cache=MISS time=1.204s
172.18.0.9 "GET /players/7656.../stats HTTP/1.1" 200 upstream=172.18.0.6:8080 cache=HIT time=0.004s
```

Variables utiles :

| Variable            | Défaut | Rôle                                            |
| ------------------- | ------ | ----------------------------------------------- |
| `CACHE_TTL_SECONDS` | `300`  | Durée de vie du cache (`0` le désactive)        |
| `REDIS_URL`         | —      | Sans elle, cache mémoire local au processus     |

## Développement local (sans Docker)

Sans `REDIS_URL`, chaque service utilise un cache en mémoire. Le backend appelle
par défaut `http://localhost:8081` (Steam) et `http://localhost:8082` (GitHub).

```bash
cd services
uv venv --python 3.12 .venv
uv pip install -r steam-service/requirements.txt

# Terminal 1
cd steam-service && STEAM_API_KEY=xxx PYTHONPATH=.. ../.venv/bin/uvicorn app.main:app --port 8081 --reload
# Terminal 2
cd github-service && PYTHONPATH=.. ../.venv/bin/uvicorn app.main:app --port 8082 --reload
```

## Tests

```bash
cd services/steam-service && ../.venv/bin/pytest    # inclut les tests du cache partagé
cd services/github-service && ../.venv/bin/pytest
```
