# SSIF — Système de suivi et de contrôle fiscal

Application de suivi et de contrôle fiscaux (SP2CF / TVA•SSIF) composée d'une
API Node.js/Express adossée à PostgreSQL et d'une interface web React/Vite.

## Repères rapides

| Dossier | Rôle | Documentation |
| --- | --- | --- |
| [`backend/`](backend/) | API REST, authentification, logique métier et accès PostgreSQL (Prisma) | [`backend/README.md`](backend/README.md) |
| [`frontend/`](frontend/) | Interface web React accessible après authentification | [`frontend/README.md`](frontend/README.md) |
| [`.vscode/`](.vscode/) | Configuration de lancement VS Code | [`.vscode/README.md`](.vscode/README.md) |

Documentation transverse :

- [`ROUTES_AND_API.md`](ROUTES_AND_API.md) : routes frontend, endpoints de l'API
  et mapping du client Axios ;
- `README.md` présents dans chaque dossier de `backend/src/` et
  `frontend/src/` : rôle du dossier et fichiers qu'il contient.

## Pile technique

| Côté | Technologies |
| --- | --- |
| Backend | Node.js 18+, Express 5, Prisma 6, PostgreSQL 14+, JWT (`jsonwebtoken`), `bcryptjs`, Swagger UI |
| Frontend | React 19, Vite 8, React Router 7, Axios, Tailwind CSS 4 |

## Prérequis

- Node.js 18 ou plus récent, et npm ;
- PostgreSQL 14 ou plus récent, avec une base créée pour le projet ;
- un compte agent créé en base pour pouvoir se connecter à l'interface.

## Démarrage

1. Configurer `backend/.env` (base de données, `PORT`, `JWT_SECRET`). Le détail
   des variables est décrit dans [`backend/README.md`](backend/README.md).
2. Installer les dépendances et préparer la base depuis `backend/` :

   ```bash
   cd backend
   npm install
   npm run prisma:generate
   ```

3. Créer le premier compte agent (les inscriptions publiques ne sont pas
   ouvertes) :

   ```powershell
   $env:AGENT_EMAIL = "agent@example.com"
   $env:AGENT_PASSWORD = "un-mot-de-passe-de-12-caracteres-minimum"
   $env:AGENT_FIRST_NAME = "Prenom"
   $env:AGENT_LAST_NAME = "Nom"
   cd backend
   npm run agent:create
   ```

4. Installer les dépendances du frontend :

   ```bash
   cd frontend
   npm install
   ```

5. Lancer les deux applications :

   ```bash
   # depuis la racine : frontend et backend en parallèle
   npm install
   npm run dev
   ```

   Ou séparément : `npm run dev` dans `backend/` (nodemon, port 5000) et dans
   `frontend/` (Vite, port 5173).

L'interface est servie sur `http://localhost:5173` et redirige vers l'écran de
connexion tant qu'aucune session valide n'est présente. En développement, Vite
relaie les requêtes `/api` vers `http://localhost:5000`.

Vérification rapide de l'API : `GET http://localhost:5000/health`.

## Authentification

- L'API expose `POST /api/auth/login`, `GET /api/auth/me` et
  `POST /api/auth/logout` sur `/api/auth`, seuls endpoints publics avec
  `/health` et la documentation Swagger.
- La connexion renvoie un cookie de session `fiscal_session` (`httpOnly`),
  valable 8 heures ; toutes les autres routes `/api` exigent ce cookie.
- Les agents sont créés hors de l'interface web (script `agent:create`) et leur
  mot de passe est stocké haché avec bcrypt.

## Scripts npm utiles

| Emplacement | Commande | Utilité |
| --- | --- | --- |
| racine | `npm run dev` | lance frontend et backend en parallèle |
| racine | `npm run build` | construit le frontend de production |
| `backend/` | `npm run dev` / `npm start` | démarre l'API avec nodemon / en mode normal |
| `backend/` | `npm run prisma:generate`, `prisma:migrate`, `prisma:deploy`, `prisma:studio` | gestion du schéma et de la base |
| `backend/` | `npm run agent:create` | crée un compte agent |
| `frontend/` | `npm run dev`, `npm run build`, `npm run lint`, `npm run preview` | cycle de vie de l'interface |
