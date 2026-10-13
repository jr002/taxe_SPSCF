# Backend SSIF

API REST du **Système de suivi et de contrôle fiscal (SSIF)**. Le backend
utilise Node.js, Express, PostgreSQL et Prisma.

## 1. Prérequis

- Node.js 18 ou une version plus récente ;
- npm ;
- PostgreSQL 14 ou une version plus récente ;
- une base de données PostgreSQL créée pour le projet.

## 2. Installation

Depuis ce dossier :

```bash
npm install
npm run prisma:generate
```

Le fichier `.env` doit se trouver directement dans `backend/`. Il contient les
paramètres locaux de la base de données et ne doit pas être partagé ou
committé.

Exemple de configuration :

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=taxe_verification
DB_USER=postgres
DB_PASSWORD=<mot_de_passe_postgresql>
DATABASE_URL="postgresql://postgres:<mot_de_passe_postgresql>@localhost:5432/taxe_verification?schema=public"

JWT_SECRET=<secret-aleatoire-long-et-prive>
```

Remarques sur ces variables :

- `DATABASE_URL` est lue directement par Prisma ; les variables `DB_HOST`,
  `DB_PORT`, `DB_NAME`, `DB_USER` et `DB_PASSWORD` n'alimentent que le pool `pg`
  de [`src/config/database.js`](src/config/database.js). Ce module n'est plus
  référencé par l'API, qui passe exclusivement par Prisma.
- `JWT_SECRET` n'est pas obligatoire en développement : sans lui,
  [`src/middlewares/auth.middleware.js`](src/middlewares/auth.middleware.js)
  utilise la valeur de repli `development-only-change-this-secret`. En
  production (`NODE_ENV=production`), son absence fait échouer la signature et
  la vérification des jetons.
- `CORS_ORIGIN` est encore présent dans certains `.env` et exposé par
  [`src/config/env.js`](src/config/env.js) (`config.cors.origin`), mais il n'est
  utilisé par aucune couche de l'application : la liste des origines autorisées
  est codée en dur dans [`src/app.js`](src/app.js) (voir § 7).

La base indiquée par `DATABASE_URL` doit exister avant le démarrage de l'API.

### Migrations SQL historiques

Le dossier [`migrations/`](migrations/) contient quatre scripts SQL ponctuels, à
appliquer manuellement et dans l'ordre sur une base antérieure à Prisma :

| Fichier | Objet |
| --- | --- |
| [`001-rename-contribuables.sql`](migrations/001-rename-contribuables.sql) | renomme `entreprises` en `contribuables` et `id_entreprise` en `id_contribuable` |
| [`002-notifications-redressement.sql`](migrations/002-notifications-redressement.sql) | ajoute à `declarations` les colonnes de la procédure contradictoire (dates de notification, prorogation, montants de redressement et de crédit d'impôt) |
| [`003-centres-contribuables.sql`](migrations/003-centres-contribuables.sql) | crée la table `centres`, la colonne `contribuables.id_centre` et sa clé étrangère |
| [`004-telephone-centres.sql`](migrations/004-telephone-centres.sql) | ajoute `centres.telephone_centre` et renseigne quelques numéros |

Ces scripts ne sont pas gérés par Prisma. Les instructions y utilisent
`IF EXISTS` et `IF NOT EXISTS` pour la plupart, mais `001` n'est pas rejouable :
le renommage de colonnes échoue au second passage. Sauvegardez la base et
vérifiez chaque script avant de l'appliquer. Les migrations de référence du
schéma se trouvent dans [`prisma/migrations/`](prisma/migrations/) et
s'appliquent avec `npm run prisma:deploy` (voir
[`prisma/README.md`](prisma/README.md)).

## 3. Démarrer le serveur

```bash
# Développement : redémarre automatiquement après une modification
npm run dev

# Démarrage normal
npm start
```

Par défaut, l'API écoute sur `http://localhost:5000`.

### Créer le premier compte agent

Les comptes ne sont pas ouverts à l'inscription publique. Après avoir configuré
la base, créez un compte depuis PowerShell :

```powershell
$env:AGENT_EMAIL = "agent@example.com"
$env:AGENT_PASSWORD = "un-mot-de-passe-de-12-caracteres-minimum"
$env:AGENT_FIRST_NAME = "Prenom"
$env:AGENT_LAST_NAME = "Nom"
npm run agent:create
```

Le script [`scripts/create-agent.js`](scripts/create-agent.js) refuse un mot de
passe de moins de 12 caractères et une adresse e-mail déjà utilisée pour les
comptes administrateur. L'inscription publique accepte un minimum de
4 caractères afin de permettre les comptes de test. Il
enregistre le mot de passe haché (bcrypt, 12 tours) et crée le compte avec
`role = "admin"` et `statut = "actif"`. Supprimez ensuite ces variables de
l'environnement PowerShell.

### Authentification

La session repose sur un cookie, pas sur un jeton transmis par le client :

- `POST /api/auth/login` (public) vérifie l'e-mail et le mot de passe, dépose
  le cookie `fiscal_session` (`httpOnly`, `sameSite=lax`, `secure` en
  production, durée 8 heures) et renvoie l'agent connecté ;
- `POST /api/auth/register` (public) enregistre une demande d'accès, avec un
  mot de passe haché et un compte `agent` au statut `en_attente` ;
- `GET /api/auth/me` (authentifié) renvoie l'agent porté par la session ;
- `POST /api/auth/logout` (public) supprime le cookie ;
- `app.use('/api', authenticate)` dans [`src/app.js`](src/app.js) protège
  **toutes** les autres routes `/api`, qui répondent `401` sans cookie valide.

Le jeton JWT est signé avec `JWT_SECRET` et expire au bout de huit heures
(`expiresIn: '8h'`), comme le cookie. Aucun contrôle de rôle n'est appliqué :
`agents.role` est enregistré et renvoyé, mais ne restreint aucun endpoint.

Vérifier que le serveur fonctionne :

```text
GET http://localhost:5000/health
```

Cette route est publique, comme `/api-docs` et `/api-docs/swagger.json`. Une
réponse correcte contient notamment `"status": "OK"`.

## 4. Documentation de l'API

La documentation interactive Swagger est disponible après le démarrage :

- interface : `http://localhost:5000/api-docs`
- spécification JSON : `http://localhost:5000/api-docs/swagger.json`

Le contenu de cette spécification est défini dans
[`src/config/swagger.js`](src/config/swagger.js).

### Routes principales

Sept domaines sont montés. Tous exigent le cookie `fiscal_session`, sauf
`/api/auth`.

| Préfixe | Rôle | Auth |
| --- | --- | --- |
| `/api/auth` | connexion, inscription, session courante, déconnexion | publique, sauf `GET /api/auth/me` |
| `/api/contribuables` | créer, consulter et modifier les contribuables | requise |
| `/api/declarations` | gérer les déclarations, leurs statistiques et la procédure contradictoire | requise |
| `/api/controles` | effectuer un contrôle et consulter son historique | requise |
| `/api/recoupements` | enregistrer et analyser des données de recoupement | requise |
| `/api/centres` | gérer les centres fiscaux (CRUD complet) | requise |
| `/api/agents` | administrer les comptes agents (activation, rôle, mot de passe, suppression) | requise **+ rôle `admin`** |

Il n'existe **aucun** préfixe `/api/entreprises` ni `/api/relances` : le modèle
Prisma `relances` existe en base mais n'est exposé par aucune route.

Exemples :

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout

GET  /api/contribuables
GET  /api/contribuables/:id
POST /api/contribuables
PUT  /api/contribuables/:id

GET  /api/declarations
GET  /api/declarations/stats
GET  /api/declarations/:id
POST /api/declarations
POST /api/declarations/:id/notification-primitive
POST /api/declarations/:id/notification-definitive
POST /api/declarations/:id/imputer-credit

GET  /api/controles/stats
POST /api/controles/:id_declaration/effectuer
GET  /api/controles/:id_declaration/historique

POST /api/recoupements
GET  /api/recoupements/:id_contribuable/analyser
GET  /api/recoupements/stats/sources

GET    /api/centres
GET    /api/centres/:id
POST   /api/centres
PUT    /api/centres/:id
DELETE /api/centres/:id

GET    /api/agents
PATCH  /api/agents/:id/statut
PATCH  /api/agents/:id/role
PATCH  /api/agents/:id/password
DELETE /api/agents/:id
```

Le détail des corps attendus, des codes HTTP et du mapping avec le client
React est regroupé dans [`../ROUTES_AND_API.md`](../ROUTES_AND_API.md).

## 5. Organisation du code

Le traitement d'une requête suit généralement le chemin :
**route → controller → service/model → PostgreSQL**.

```text
backend/
├── server.js                 # démarre le serveur HTTP
├── src/
│   ├── app.js                # Express, middlewares et routes
│   ├── config/
│   │   ├── env.js            # variables d'environnement
│   │   ├── prisma.js         # client Prisma
│   │   ├── database.js       # pool pg (module non utilisé par l'API)
│   │   └── swagger.js        # documentation OpenAPI
│   ├── routes/               # définition des URL de l'API
│   ├── controllers/          # lecture de la requête et réponse HTTP
│   ├── services/             # logique métier et calculs fiscaux
│   ├── models/               # accès aux données via Prisma
│   ├── middlewares/          # authentification, validation, gestion des erreurs
│   └── utils/                # réservé, actuellement vide
├── scripts/create-agent.js   # création d'un compte agent
├── prisma/schema.prisma      # modèles et relations de la base
├── prisma/migrations/        # migrations gérées par Prisma
└── migrations/               # scripts SQL ponctuels (hors Prisma)
```

Pour ajouter une fonctionnalité, créer ou modifier les éléments dans cet ordre :

1. définir la route ;
2. ajouter la validation nécessaire dans
   [`src/middlewares/validation.middleware.js`](src/middlewares/validation.middleware.js) ;
3. implémenter le controller ;
4. placer la logique métier dans un service ;
5. utiliser le modèle Prisma pour accéder à PostgreSQL.

## 6. Modèle de données

Les modèles Prisma sont :

- `contribuables` : entreprises ou personnes suivies ;
- `declarations` : données fiscales annuelles et montants de TVA ;
- `controles` : contrôles réalisés sur les déclarations ;
- `agents` : agents qui réalisent les contrôles (mot de passe haché) ;
- `recoupements` : données provenant de sources externes ;
- `centres` : centres fiscaux rattachés aux contribuables ;
- `relances` : relances émises (aucune route API ne les expose actuellement).

Les relations et contraintes sont détaillées dans
[`prisma/schema.prisma`](prisma/schema.prisma) et
[`prisma/README.md`](prisma/README.md). Après une modification du schéma,
régénérer le client :

```bash
npm run prisma:generate
```

## 7. Sécurité et dépannage

- Ne jamais exposer `DB_PASSWORD`, `DATABASE_URL` ou les mots de passe des
  agents dans le code, les logs ou les réponses JSON.
- Le CORS est limité à une liste codée en dur dans [`src/app.js`](src/app.js),
  avec `credentials: true` : `http://localhost:3000`, `http://localhost:5173`,
  `http://localhost:5174`, `http://localhost:5175` et les mêmes adresses en
  `127.0.0.1`. Les requêtes sans en-tête `Origin` sont acceptées. Modifier
  `CORS_ORIGIN` dans le `.env` n'a aucun effet.
- Un `401` sur toutes les routes `/api` (hors `/api/auth/login` et
  `/api/auth/logout`) signifie que le cookie `fiscal_session` est absent,
  expiré ou signé avec un autre `JWT_SECRET`.
- Une erreur `ECONNREFUSED` indique généralement que PostgreSQL n'est pas
  démarré ou que `DB_HOST`/`DB_PORT` sont incorrects.
- Une erreur Prisma de connexion indique généralement une `DATABASE_URL`
  incorrecte ou une base inexistante.
- Une erreur CORS signifie que l'adresse du frontend n'est pas autorisée ;
  vérifiez l'origine utilisée par Vite et la liste `allowedOrigins`.
- `app.use('/uploads', ...)` sert des fichiers statiques depuis
  `backend/uploads`, dossier qui n'existe pas dans le dépôt (à créer si des
  pièces jointes sont ajoutées).
- Les dépendances `multer`, `pdfkit`, `xlsx` et `pg-pool` sont déclarées dans
  `package.json` mais ne sont utilisées par aucun fichier du backend.
- `npm test` est encore un script placeholder : aucun test automatisé n'est
  actuellement configuré dans le backend.

## Scripts npm

| Commande | Utilité |
| --- | --- |
| `npm install` | installe les dépendances |
| `npm run prisma:generate` | génère le client Prisma |
| `npm run prisma:migrate` | crée/applique une migration en développement |
| `npm run prisma:deploy` | applique les migrations existantes |
| `npm run prisma:studio` | ouvre Prisma Studio |
| `npm run agent:create` | crée un compte agent à partir des variables `AGENT_*` |
| `npm run dev` | lance le serveur avec nodemon |
| `npm start` | lance le serveur en mode normal |
| `npm test` | placeholder, aucun test configuré |
