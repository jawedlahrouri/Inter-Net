# INTER-NET — Modular Distributed Dashboard

> **Projet Dashboard Epitech**  
> Application web full-stack conteneurisée permettant de composer un tableau de bord dynamique et modulaire avec rafraîchissement périodique individuel par widget, gestion multi-services et architecture distribuée en microservices.

![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.12-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_19-TypeScript-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?logo=redis&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-81%2F81_Passed-brightgreen?logo=pytest&logoColor=white)

---

## 📑 Sommaire

1. [Architecture & Topologie](#-architecture--topologie)
2. [Ports et Accès Clés (Sujet Epitech)](#-ports-et-accès-clés-sujet-epitech)
3. [Démarrage Rapide (En une seule commande)](#-démarrage-rapide-en-une-seule-commande)
4. [Spécification Obligatoire `/about.json`](#-spécification-obligatoire-aboutjson)
5. [Catalogue des Services et Widgets](#-catalogue-des-services-et-widgets)
6. [Sécurité et Résilience](#-sécurité-et-résilience)
7. [Gestion des Rôles & Panel Administrateur](#-gestion-des-rôles--panel-administrateur)
8. [Tests Automatisés et Qualité](#-tests-automatisés-et-qualité)
9. [Fichiers et Guides Utiles](#-fichiers-et-guides-utiles)

---

## 🏛 Architecture & Topologie

Le projet s'appuie sur une architecture microservices entièrement conteneurisée avec Docker Compose. L'API Core FastAPI agit comme passerelle unique (**API Gateway**) vers les microservices métier répliqués derrière des répartiteurs de charge Nginx et un cache Redis partagé.

```text
                                  ┌──────────────────────────────┐
                                  │   Navigateur Client / SPA    │
                                  │   React 19 / Nginx (:3000)   │
                                  └──────────────┬───────────────┘
                                                 │ HTTP / REST
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │     Core API / Gateway       │
                                  │      FastAPI (:8080)         │
                                  └──────┬──────────┬──────────┬─┘
                                         │          │          │
                 ┌───────────────────────┘          │          └───────────────────────┐
                 ▼                                  ▼                                  ▼
      ┌───────────────────────┐          ┌───────────────────────┐          ┌───────────────────────┐
      │   Base de Données     │          │  Microservice Steam   │          │ Microservice GitHub   │
      │   MySQL 8.0 (:3306)   │          │  steam-lb (nginx:80)  │          │ github-lb (nginx:80)  │
      └───────────────────────┘          └───┬───────────────┬───┘          └───┬───────────────┬───┘
                                             │               │                  │               │
                                             ▼               ▼                  ▼               ▼
                                      ┌─────────────┐ ┌─────────────┐    ┌─────────────┐ ┌─────────────┐
                                      │steam-replica│ │steam-replica│    │github-repl. │ │github-repl. │
                                      └──────┬──────┘ └──────┬──────┘    └──────┬──────┘ └──────┬──────┘
                                             │               │                  │               │
                                             └───────┬───────┘                  └───────┬───────┘
                                                     ▼                                  ▼
                                            ┌───────────────────────────────────────────────────┐
                                            │               Redis Cache (:6379)                 │
                                            └───────────────────────────────────────────────────┘
```

### Rôles des Conteneurs :
- **`frontend` (Port 3000)** : Application React 19 servie par Nginx en production. Embarque un reverse-proxy interne redirigeant `/api/` vers `http://server:8080/api/` et `/about.json` vers `http://server:8080/about.json`.
- **`server` (Port 8080)** : Core API Gateway FastAPI. Authentification JWT, CRUD des widgets, chiffrement des secrets, point d'entrée unique imposé par le barème Epitech.
- **`db` (Port 3306)** : Serveur MySQL 8.0 initialisé via `init.sql` (utilisateurs, services, définitions, paramètres).
- **`redis`** : Cache mémoire partagé haute performance pour les requêtes vers les APIs tierces (Steam, GitHub) évitant les limitations de débit (*rate-limits*).
- **`steam-lb` & `steam-service` (x2 réplicas)** : Load balancer Nginx et workers Python dédiés à l'intégration de la plateforme Steam.
- **`github-lb` & `github-service` (x2 réplicas)** : Load balancer Nginx et workers Python pour l'extraction de métriques GitHub (commits, pull requests, repos, orgs).
- **`mailpit` (Ports 8025 / 1025)** : Serveur SMTP et interface web locale pour capturer les e-mails de validation de compte à l'inscription.

---

## 🌐 Ports et Accès Clés

| Service / Interface | URL d'accès | Description |
| :--- | :--- | :--- |
| **Frontend Web** | [`http://localhost:3000`](http://localhost:3000) | Dashboard modulaire utilisateur & administration |
| **Core API Gateway** | [`http://localhost:8080`](http://localhost:8080) | Point d'entrée unique du serveur |
| **Spécification Epitech** | [`http://localhost:8080/about.json`](http://localhost:8080/about.json) | **Endpoint obligatoire** (IP client, Unix timestamp, catalogue typé) |
| **Documentation Swagger** | [`http://localhost:8080/api/v1/docs`](http://localhost:8080/api/v1/docs) | OpenAPI interactive pour tester tous les endpoints |
| **Documentation Redoc** | [`http://localhost:8080/api/v1/redoc`](http://localhost:8080/api/v1/redoc) | Documentation alternative de l'API |
| **Webmail Mailpit (Dev)** | [`http://localhost:8025`](http://localhost:8025) | Interface de réception des e-mails d'activation de compte |
| **Serveur SMTP** | `localhost:1025` | Port SMTP local utilisé par `fastapi-mail` |
| **Base MySQL** | `localhost:3306` | Base relationnelle MySQL (User: `Admin` / Pass: `Admin123`) |

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- [Docker](https://docs.docker.com/get-docker/) et [Docker Compose](https://docs.docker.com/compose/) installés sur votre machine hôte.

### 2. Configuration des Variables d'Environnement
Copiez les fichiers d'exemple `.env.example` à la racine et dans le dossier backend :

```bash
# À la racine du projet
cp .env.example .env
cp backend/.env.example backend/.env
```

### 3. Lancement du Projet
Exécutez la commande universelle à la racine du dépôt :

```bash
docker compose up --build
```

*(Ou en arrière-plan avec le flag `-d`)* :
```bash
docker compose up --build -d
```

Tous les conteneurs démarrent, s'auto-initialisent et attendent que la base de données soit saine (*healthy*) avant de lancer les services applicatifs. Vous pouvez immédiatement accéder à l'application sur [http://localhost:3000](http://localhost:3000).

---

## 📋 Spécification Obligatoire `/about.json`

Accessible en `GET` sur `http://localhost:8080/about.json` (et via proxy frontend sur `http://localhost:3000/about.json`), cet endpoint respecte scrupuleusement la structure imposée :

```json
{
  "client": {
    "host": "127.0.0.1"
  },
  "server": {
    "current_time": 1728489600,
    "services": [
      {
        "name": "weather",
        "widgets": [
          {
            "name": "city_temperature",
            "description": "Affiche la température et les prévisions d'une ville",
            "params": [
              {
                "name": "city",
                "type": "string"
              }
            ]
          }
        ]
      },
      {
        "name": "rss",
        "widgets": [
          {
            "name": "article_list",
            "description": "Affiche les derniers articles d'un flux RSS",
            "params": [
              {
                "name": "link",
                "type": "string"
              },
              {
                "name": "number",
                "type": "integer"
              }
            ]
          }
        ]
      },
      {
        "name": "steam",
        "widgets": [
          {
            "name": "profile_status",
            "description": "Statut de profil et niveau Steam",
            "params": [
              {
                "name": "steam_id",
                "type": "string"
              }
            ]
          }
        ]
      },
      {
        "name": "github",
        "widgets": [
          {
            "name": "total_commits",
            "description": "Total des commits de l'utilisateur",
            "params": [
              {
                "name": "username",
                "type": "string"
              },
              {
                "name": "days",
                "type": "integer"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 🧩 Catalogue des Services et Widgets

Le dashboard propose une collection riche de widgets configurables avec minuteur individuel de rafraîchissement:

### 1. Service Météo (`weather`)
- **Température & Prévisions (`city_temperature`)** : Affiche la température en temps réel, l'humidité, la vitesse du vent et la tendance sur 24h via Open-Meteo.
  - Paramètre : `city` (`string`) — Ville ciblée (géocodage automatique ou détection GPS).

### 2. Service Flux RSS (`rss`)
- **Articles d'actualité (`article_list`)** : Agrège et présente les derniers articles d'un flux de nouvelles.
  - Paramètres : `link` (`string`) — URL du flux RSS/Atom ; `number` (`integer`) — Nombre d'articles à afficher.

### 3. Service API JSON Universelle (`custom`)
- **Métriques personnalisées (`custom_api`)** : Permet d'extraire n'importe quelle valeur depuis une API REST tierce sans écrire de code.
  - Paramètres : `apiUrl` (`string`), `jsonPath` (`string`).
  - Modes d'affichage : Statut texte, badge numérique, ou **jauge SVG animée** avec bornes Min/Max et unité personnalisable.

### 4. Service Steam (`steam`)
Intégration du catalogue et des statistiques de jeu du joueur avec rafraîchissement périodique :
- **Statut de profil & Niveau (`profile_status`, `steam_level`)** : Avatar, pseudo, statut en ligne, badge de niveau.
- **Jeux récents & Temps de jeu (`last_played`, `most_played`, `total_playtime`)** : Détail des heures accumulées et historique de jeu.
- **Backlog & Jeux non joués (`unplayed_games`)** : Carrousel interactif des titres de la bibliothèque jamais lancés.
  - Paramètre : `steam_id` (`string`).

### 5. Service GitHub (`github`)
Métriques d'ingénierie et de collaboration :
- **Commits & Lignes de code (`total_commits`, `lines_stats`, `weekly_top_devs`)**.
- **Pull Requests (`pr_overview`, `pr_merge_rate`, `code_reviews_done`)**.
- **Dépôts & Organisations (`repo_overview`, `top_repos_by_commits`, `org_overview`)**.
  - Paramètres typés : `username` (`string`), `days` (`integer`), `limit` (`integer`), `repoFullName` (`string`), `orgName` (`string`).

---

## 🔒 Sécurité et Résilience

- **Chiffrement symétrique des secrets au repos (Fernet / AES)** :
  - Les jetons OAuth tiers (`access_token`, `refresh_token`) stockés en base de données MySQL sont automatiquement chiffrés au repos à l'aide d'un `TypeDecorator` SQLAlchemy et d'une clé dérivée de `SECRET_KEY` par SHA-256 (`gAAAAA...`).
- **Gestion granulaire des pannes (Error Isolation)** :
  - **Frontend** : Chaque composant widget est isolé dans un `WidgetErrorBoundary` React 19. Si un widget échoue (données corrompues, timeout), une carte d'erreur élégante avec bouton de réessai est affichée sans jamais bloquer ni faire crasher la grille.
  - **Backend** : Un gestionnaire global d'exceptions non interceptées intercepte les erreurs serveur inattendues pour renvoyer un JSON d'erreur 500 assaini sans exposer de traceback sensible.
- **Authentification & Validation d'Email** :
  - Mots de passe hashés par `bcrypt`.
  - Jetons JWT signés à expiration courte.
  - Activation de compte obligatoire par email via `fastapi-mail` (interception immédiate sur `http://localhost:8025` en environnement de dev).
- **Interface 100% Responsive** :
  - Compatible mobile (iPhone, Android 375px+), tablette et écran large 4K.
  - Glisser-déposer intuitif (*Drag-and-Drop*) et sélecteur de dimensions fluide (1 à 6 colonnes, 1 à 3 lignes).

---

## 👑 Gestion des Rôles & Panel Administrateur

INTER-NET intègre une gestion stricte des privilèges : rôle `user` et rôle `admin`.

### 1. Inscription d'un Compte
1. Rendez-vous sur `http://localhost:3000`.
2. Créez un compte via l'onglet **S'inscrire** (ex : pseudo `admin`, email `admin@inter-net.com`, mot de passe fort).
3. Ouvrez Mailpit sur `http://localhost:8025` pour consulter l'e-mail de validation reçu et cliquez sur le lien d'activation (ou validez le token).

### 2. Promotion d'un Utilisateur en Administrateur
Pour élever un utilisateur au rang d'administrateur, exécutez la commande suivante sur le conteneur de base de données :

```bash
docker compose exec db mysql -u Admin -pAdmin123 inter_net -e "UPDATE users SET role = 'admin', is_verified = TRUE WHERE username = 'votre_pseudo';"
```

### 3. Fonctionnalités du Panel Administrateur
Une fois connecté avec un compte administrateur, l'option **Panel d'Administration** apparaît dans le menu utilisateur :
- **Vue d'ensemble & Métriques** : Nombre total d'utilisateurs, administrateurs, dashboards et widgets actifs.
- **Gestion des Utilisateurs** : Consultation, modification de rôle, création et suppression de comptes.
- **Supervision des Dashboards & Widgets** : Inspection en direct des configurations de chaque utilisateur, modification à distance de la disposition des widgets.

---

## 🧪 Tests Automatisés et Qualité

Le projet dispose d'une suite de tests complète couvrant les tests unitaires, l'intégration des services et la conformité des schémas :

```bash
# Lancer les tests Pytest backend en local hors Docker
pytest backend/tests -v

# Lancer les tests dans le conteneur actif Docker
docker compose exec server pytest -v

# Lancer les tests des microservices
pytest services/steam-service/tests -v
pytest services/github-service/tests -v

# Vérifier le typage TypeScript du frontend
cd frontend && npm run build
```

> **Résultat de la suite de tests** : **81/81 tests passés avec succès à 100%** (52 tests Core API, 19 tests Steam, 10 tests GitHub).

---

## 📚 Fichiers et Guides Utiles
- [init.sql](init.sql) : Schéma relationnel initial de la base de données MySQL 8.0.
- [docker-compose.yml](docker-compose.yml) : Définition multi-conteneurs de l'orchestration Docker.