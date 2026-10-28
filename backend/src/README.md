# Source de l'API

Point d'entrée de l'application Express et séparation des responsabilités du
backend. Onze domaines de routes sont montés dans [`app.js`](app.js) :
`/api/auth`, `/api/contribuables`, `/api/declarations`, `/api/controles`,
`/api/recoupements`, `/api/droits-communication`, `/api/centres`, `/api/agents`,
`/api/rapprochements`, `/api/etat-contribuable` et `/api/relances`.

[`app.js`](app.js) applique aussi `app.use('/api', authenticate, enforceDataScope)` :
toutes les routes `/api` exigent le cookie de session, sauf celles de `/api/auth`,
et chaque réponse métier est ensuite filtrée selon le périmètre de l'agent
(tous les centres, son centre de rattachement ou aucun dossier). Les routes
publiques restantes sont `/health`, `/uploads`, `/api-docs` et
`/api-docs/swagger.json`.

Dossiers : `config/` (environnement, Prisma, Swagger), `routes/`,
`controllers/`, `services/`, `models/`, `middlewares/` et `utils/`
(périmètre de données et références des unités fiscales).

Pour ajouter une fonctionnalité, suivre le chemin
`route → validation → controller → service/model`.
