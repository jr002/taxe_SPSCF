# Routes

Définit les endpoints de l'API et relie chaque URL à son contrôleur.

Les sept fichiers de routes sont montés dans [`../app.js`](../app.js) sous
`/api/auth`, `/api/contribuables`, `/api/declarations`, `/api/controles`,
`/api/recoupements`, `/api/centres` et `/api/agents`.

- [`auth.routes.js`](auth.routes.js) : `POST /login`, `POST /register`,
  `GET /me`, `POST /logout` ; seul domaine placé avant le middleware
  `authenticate`.
- [`contribuable.routes.js`](contribuable.routes.js) : validation sur la
  création uniquement.
- [`declaration.routes.js`](declaration.routes.js) : liste, statistiques,
  détail, création et actes de procédure contradictoire.
- [`controle.routes.js`](controle.routes.js)
- [`recoupement.routes.js`](recoupement.routes.js)
- [`centre.routes.js`](centre.routes.js) : CRUD complet, sans validation par
  middleware (contrôles effectués dans le contrôleur).
- [`agent.routes.js`](agent.routes.js) : administration des comptes, protégée
  par `authenticate` **et** `requireAdmin`.

Toutes ces routes, sauf `/api/auth`, sont protégées par `authenticate` ;
`/api/agents` exige en plus le rôle `admin`.
