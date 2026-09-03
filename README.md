# SSIF — Système de suivi et de contrôle fiscal

Application composée d'une API Node.js/Express et d'une interface React/Vite.

## Repères rapides

| Dossier | Rôle |
| --- | --- |
| [`backend/`](backend/) | API REST, logique métier et accès PostgreSQL |
| [`frontend/`](frontend/) | Interface web React |
| [`.vscode/`](.vscode/) | Configuration de lancement VS Code |

## Démarrage

1. Configurer les variables d'environnement dans `backend/.env`.
2. Dans `backend/`, lancer `npm install`, puis `npm run dev`.
3. Dans `frontend/`, lancer `npm install`, puis `npm run dev`.

La documentation des routes est disponible dans [`ROUTES_AND_API.md`](ROUTES_AND_API.md).
