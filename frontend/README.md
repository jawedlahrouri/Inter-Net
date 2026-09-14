# Frontend - React + TypeScript + Vite

Application frontend pour **INTER-NET** utilisant **React 19**, **TypeScript**, **Vite** et **Tailwind CSS**.

## Structure

```text
frontend/
├── src/
│   ├── services/
│   │   └── api.ts          # Client API & interfaces typées
│   ├── App.tsx             # Composant principal avec status checker
│   ├── App.css
│   ├── index.css           # Tailwind CSS
│   └── main.tsx            # Point d'entrée React
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts          # Config Vite + Tailwind + Proxy API
```

## Installation

```bash
npm install
```

## Démarrage en développement

```bash
npm run dev
```

L'application démarre par défaut sur [http://localhost:5173](http://localhost:5173).

## Build de production

```bash
npm run build
```

## Linting

```bash
npm run lint
```
