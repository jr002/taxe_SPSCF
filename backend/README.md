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

CORS_ORIGIN=http://localhost:5173
JWT_SECRET=<secret-aleatoire-long-et-prive>
```

La base indiquée par `DATABASE_URL` doit exister avant le démarrage de l'API.
Le projet fournit une migration SQL historique à appliquer uniquement si votre
base ne contient pas encore le renommage attendu :
[`migrations/001-rename-contribuables.sql`](migrations/001-rename-contribuables.sql)
Ne l'exécutez qu'une seule fois et vérifiez son contenu avant de l'appliquer.

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

Le mot de passe est enregistré sous forme de hash. Supprimez ensuite ces
variables de l'environnement PowerShell. En production, définissez aussi un
`JWT_SECRET` aléatoire et privé ; sans lui, les sessions ne sont pas activées.
La session expire au bout de huit heures.

Vérifier que le serveur fonctionne :

```text
GET http://localhost:5000/health
```

Une réponse correcte contient notamment `"status": "OK"`.

## 4. Documentation de l'API

La documentation interactive Swagger est disponible après le démarrage :

- interface : `http://localhost:5000/api-docs`
- spécification JSON : `http://localhost:5000/api-docs/swagger.json`

Les exemples et le détail des paramètres sont également regroupés dans
[`../ROUTES_AND_API.md`](../ROUTES_AND_API.md).

### Routes principales

| Préfixe | Rôle |
| --- | --- |
| `/api/contribuables` | créer, consulter et modifier les contribuables |
| `/api/declarations` | gérer les déclarations et leurs statistiques |
| `/api/controles` | effectuer un contrôle et consulter son historique |
| `/api/recoupements` | enregistrer et analyser des données de recoupement |

Exemples :

```text
GET  /api/contribuables
GET  /api/contribuables/:id
POST /api/contribuables
PUT  /api/contribuables/:id

GET  /api/declarations
GET  /api/declarations/stats
GET  /api/declarations/:id
POST /api/declarations

GET  /api/controles/stats
POST /api/controles/:id_declaration/effectuer
GET  /api/controles/:id_declaration/historique

POST /api/recoupements
GET  /api/recoupements/:id_contribuable/analyser
GET  /api/recoupements/stats/sources
```

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
│   │   └── swagger.js        # documentation OpenAPI
│   ├── routes/               # définition des URL de l'API
│   ├── controllers/          # lecture de la requête et réponse HTTP
│   ├── services/             # logique métier et calculs fiscaux
│   ├── models/               # accès aux données
│   ├── middlewares/          # validation et gestion des erreurs
│   └── utils/                # fonctions communes
├── prisma/schema.prisma      # modèles et relations de la base
└── migrations/               # scripts SQL ponctuels
```

Pour ajouter une fonctionnalité, créer ou modifier les éléments dans cet ordre :

1. définir la route ;
2. ajouter la validation nécessaire ;
3. implémenter le controller ;
4. placer la logique métier dans un service ;
5. utiliser le modèle Prisma pour accéder à PostgreSQL.

## 6. Modèle de données

Les principaux modèles Prisma sont :

- `contribuables` : entreprises ou personnes suivies ;
- `declarations` : données fiscales annuelles ;
- `controles` : contrôles réalisés sur les déclarations ;
- `agents` : agents qui réalisent les contrôles ;
- `recoupements` : données provenant de sources externes.

Les relations et contraintes sont détaillées dans
[`prisma/schema.prisma`](prisma/schema.prisma). Après une modification du
schéma, régénérer le client :

```bash
npm run prisma:generate
```

## 7. Sécurité et dépannage

- Ne jamais exposer `DB_PASSWORD`, `DATABASE_URL` ou les mots de passe des
  agents dans le code, les logs ou les réponses JSON.
- Le CORS est limité aux origines locales configurées dans `src/app.js`.
- Une erreur `ECONNREFUSED` indique généralement que PostgreSQL n'est pas
  démarré ou que `DB_HOST`/`DB_PORT` sont incorrects.
- Une erreur Prisma de connexion indique généralement une `DATABASE_URL`
  incorrecte ou une base inexistante.
- Une erreur CORS signifie que l'adresse du frontend n'est pas autorisée ;
  vérifiez l'origine utilisée par Vite et la liste `allowedOrigins`.
- `npm test` est encore un script placeholder : aucun test automatisé n'est
  actuellement configuré dans le backend.

## Scripts npm

| Commande | Utilité |
| --- | --- |
| `npm install` | installe les dépendances |
| `npm run prisma:generate` | génère le client Prisma |
| `npm run dev` | lance le serveur avec nodemon |
| `npm start` | lance le serveur en mode normal |
