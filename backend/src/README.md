# Source de l'API

Point d'entrée de l'application Express et séparation des responsabilités du
backend. Les six domaines de routes sont montés dans [`app.js`](app.js) :
`/api/auth`, `/api/contribuables`, `/api/declarations`, `/api/controles`,
`/api/recoupements` et `/api/centres`.

[`app.js`](app.js) applique aussi `app.use('/api', authenticate)` : toutes les
routes `/api` exigent le cookie de session, sauf celles de `/api/auth`. Les
routes publiques restantes sont `/health`, `/uploads`, `/api-docs` et
`/api-docs/swagger.json`.

Dossiers : `config/` (environnement, Prisma, Swagger), `routes/`,
`controllers/`, `services/`, `models/`, `middlewares/` et `utils/` (réservé,
actuellement vide).

Pour ajouter une fonctionnalité, suivre le chemin
`route → validation → controller → service/model`.
