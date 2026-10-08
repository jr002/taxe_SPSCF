# Configuration

Contient la lecture de l'environnement et les connexions à PostgreSQL.

- [`env.js`](env.js) : variables d'environnement (`env`, `port`, `db`, `cors`).
- [`prisma.js`](prisma.js) : instance `PrismaClient` partagée, utilisée par tous
  les modèles et par `scripts/create-agent.js`.
- [`swagger.js`](swagger.js) : spécification OpenAPI et export de
  `swagger-ui-express` pour `/api-docs`.
- [`database.js`](database.js) : pool `pg` historique, référencé par aucun
  fichier de l'API.

Les secrets et paramètres propres à la machine restent dans `backend/.env`.
`config.cors.origin` (variable `CORS_ORIGIN`) n'est plus consommé : la liste des
origines autorisées est codée en dur dans [`../app.js`](../app.js).
