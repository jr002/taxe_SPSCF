# Backend

API REST du SSIF, construite avec Node.js et Express. Le serveur démarre depuis [`server.js`](server.js) et l'application Express est assemblée dans [`src/app.js`](src/app.js).

## Organisation

- [`src/config/`](src/config/) : configuration de l'environnement et de la base de données.
- [`src/routes/`](src/routes/) : routes HTTP `/api`.
- [`src/controllers/`](src/controllers/) : réception des requêtes et réponses.
- [`src/services/`](src/services/) : calculs et orchestration de la logique métier.
- [`src/models/`](src/models/) : accès aux données PostgreSQL.
- [`src/middlewares/`](src/middlewares/) : validation et gestion des erreurs.
- [`src/utils/`](src/utils/) : fonctions techniques partagées.
- [`src/config/prisma.js`](src/config/prisma.js) : instance Prisma ORM pour PostgreSQL.

## Commandes

```bash
npm install
npm run prisma:generate # régénérer le client Prisma
npm run dev             # développement avec nodemon
npm start               # démarrage normal
```

Le fichier `.env` contient les paramètres locaux et ne doit pas être versionné (notamment `DATABASE_URL`).

## Migration de la base

Exécuter [`migrations/001-rename-contribuables.sql`](migrations/001-rename-contribuables.sql) une seule fois sur la base existante avant de démarrer l'API renommée.

Les modèles utilisent l'instance Prisma exportée par `src/config/prisma.js`.

## Documentation Swagger

Après le démarrage du serveur, l'interface interactive est disponible à l'adresse :

```text
http://localhost:5000/api-docs
```

La spécification OpenAPI JSON est disponible sur `http://localhost:5000/api-docs/swagger.json`.
