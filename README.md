# 🏛️ SSIF — Système de suivi et de contrôle fiscal

> **SSIF** (Système de Pilotage et de Suivi du Contrôle Fiscal / TVA•SSIF) est une application web moderne conçue pour assister les inspecteurs et agents des administrations fiscales dans le suivi, la collecte, le contrôle des déclarations de TVA et la gestion des défaillants.

## ✨ Fonctionnalités Clés

- 📊 **Tableau de Bord & Décisionnel** : Visualisation en temps réel des indicateurs clés, taux de déclaration et statistiques de recouvrement.
- 🏢 **Gestion des Contribuables & Entreprises** : Répertoire complet des entreprises assujetties, classification par unité fiscale et historique déclaratif.
- 💰 **Suivi de la Collecte & Déclarations** : Enregistrement, traitement et analyse des déclarations périodiques de TVA.
- 🚨 **Détection d'Anomalies & Contrôle Fiscal** : Alertes automatiques sur les incohérences déclaratives, sélection des dossiers à risque et programmation des vérifications.
- 📩 **Gestion des Relances** : Automatisation du suivi des défaillants (défaut de déclaration ou de paiement) et émission des relances.
- 🔐 **Sécurité & Rôles** : Authentification stricte par session JWT sécurisée (`httpOnly`), hachage bcrypt et gestion des droits des agents.

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
| Backend | Node.js 20.19+, Express 5, Prisma 6, PostgreSQL 14+, JWT (`jsonwebtoken`), `bcryptjs`, Swagger UI |
| Frontend | React 19, Vite 8, React Router 7, Axios, Tailwind CSS 4 |

## Prérequis

- Node.js 20.19 ou plus récent, avec Corepack et pnpm 11 ;
- PostgreSQL 14 ou plus récent, avec une base créée pour le projet ;
- un compte agent créé en base pour pouvoir se connecter à l'interface.

## Démarrage

1. Activer pnpm si nécessaire :

   ```bash
   corepack enable
   ```

2. Copier `backend/.env.example` vers `backend/.env`, puis renseigner les
   identifiants PostgreSQL et un `JWT_SECRET` privé. La base PostgreSQL doit
   exister et être accessible avant de lancer la préparation.

3. Depuis la racine du projet, installer les dépendances du frontend et du
   backend, appliquer les migrations Prisma, et générer le client Prisma avec
   une seule commande :

   ```bash
   pnpm run setup:project
   ```

   Cette commande applique les migrations aux bases neuves. Si vous restaurez
   une base déjà créée sans historique Prisma, suivez d'abord les instructions
   de baseline dans [`backend/prisma/README.md`](backend/prisma/README.md).

4. Créer le premier compte agent (les inscriptions publiques ne sont pas
   ouvertes) :

   ```powershell
   $env:AGENT_EMAIL = "agent@example.com"
   $env:AGENT_PASSWORD = "mot_de_passe
   $env:AGENT_FIRST_NAME = "testeur"
   $env:AGENT_LAST_NAME = "testeur"
   pnpm --filter backend run agent:create
   ```

5. Lancer les deux applications depuis la racine :

   ```bash
   pnpm run dev
   ```

   Ou séparément : `pnpm --filter backend run dev` (port 5000) et
   `pnpm --filter frontend run dev` (port 5173).

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

## Scripts pnpm utiles

| Emplacement | Commande | Utilité |
| --- | --- | --- |
| racine | `pnpm run setup:project` | installe les dépendances, applique les migrations et génère Prisma |
| racine | `pnpm run dev` | lance frontend et backend en parallèle |
| racine | `pnpm run build` | construit le frontend de production |
| racine | `pnpm run prisma:deploy` | applique les migrations et régénère Prisma |
| `backend/` | `pnpm --filter backend run dev` / `start` | démarre l'API avec nodemon / en mode normal |
| `backend/` | `pnpm --filter backend run prisma:migrate`, `prisma:deploy`, `prisma:studio` | gestion du schéma et de la base |
| `backend/` | `pnpm --filter backend run agent:create` | crée un compte agent |
| `frontend/` | `pnpm --filter frontend run dev`, `build`, `lint`, `preview` | cycle de vie de l'interface |
