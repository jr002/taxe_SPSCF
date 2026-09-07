# Configuration

Contient la lecture de l'environnement et la connexion PostgreSQL.

- [`env.js`](env.js) : variables et valeurs de configuration.
- [`database.js`](database.js) : pool de connexions à la base de données.
- [`prisma.js`](prisma.js) : instance Prisma Client pour l'ORM.
- [`swagger.js`](swagger.js) : configuration et documentation Swagger / OpenAPI.

Les secrets et paramètres propres à la machine restent dans `backend/.env`.
