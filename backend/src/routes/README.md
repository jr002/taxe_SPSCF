# Routes

Définit les endpoints de l'API et relie chaque URL à son contrôleur.

Les onze fichiers de routes sont montés dans [`../app.js`](../app.js) sous
`/api/auth`, `/api/contribuables`, `/api/declarations`, `/api/controles`,
`/api/recoupements`, `/api/droits-communication`, `/api/centres`, `/api/agents`,
`/api/rapprochements`, `/api/etat-contribuable` et `/api/relances`.

- [`auth.routes.js`](auth.routes.js) : `POST /login`, `POST /reset-request`,
  `POST /register`, `POST /change-password`, `GET /me`, `POST /logout` ; seul
  domaine placé avant le middleware `authenticate`, donc chaque route
  authentifiée l'applique explicitement. `POST /login` est protégé par deux
  limiteurs (5 tentatives par fenêtre glissante de 15 min pour une paire
  IP + e-mail, 20 pour l'IP seule), `POST /register` comme
  `POST /reset-request` par un limiteur à 10 envois par IP, et
  `POST /change-password` par 6 tentatives par agent.
- [`contribuable.routes.js`](contribuable.routes.js) : validation sur la
  création uniquement. `/:id` et ses sous-ressources (`/etat`, `/rapprochements`,
  `/relances`) passent par `requireContribuableAccess('id')`.
- [`declaration.routes.js`](declaration.routes.js) : liste, statistiques,
  détail, création et actes de procédure contradictoire, avec
  `requireDeclarationAccess` sur chaque route ciblant une déclaration.
- [`controle.routes.js`](controle.routes.js) : `GET /stats`,
  `POST /:id_declaration/effectuer` et `GET /:id_declaration/historique`, les deux
  derniers étant gardés par `requireDeclarationAccess('id_declaration')`.
- [`recoupement.routes.js`](recoupement.routes.js) : analyse et CRUD, gardés par
  `requireContribuableAccess` (routes `/…/analyser`, `POST /`) et
  `requireRowContribuableAccess` (`GET|PUT|DELETE /:id`).
- [`droit-communication.routes.js`](droit-communication.routes.js) :
  `GET /`, `GET /stats/statuts` (déclaré avant `GET /:id`), `GET /:id`,
  `POST /` et `PUT /:id` tous deux validés par `droitCommunicationValidators`,
  `DELETE /:id` ; `droitInScope` contrôle l'accès à chaque ligne.
- [`centre.routes.js`](centre.routes.js) : lecture selon le périmètre de l'agent
  (`requireCentreAccess` sur `GET /:id`, liste filtrée par le modèle) ; la
  création, la modification et la suppression exigent `requireAdmin`. Aucun
  contrôle de validation par middleware (effectué dans le contrôleur).
- [`agent.routes.js`](agent.routes.js) : administration des comptes
  (`GET /`, `GET /historique`, `PATCH /:id/statut`, `/role`, `/centre`,
  `/password`, `DELETE /:id`), protégée par `authenticate` **et** `requireAdmin`.
- [`rapprochement.routes.js`](rapprochement.routes.js) : confrontation
  déclaration / recoupement (`GET /`, `GET /stats`, `POST /confronter`,
  `POST /auto/:id_contribuable`, `GET /:id`, `POST /`,
  `PATCH /:id/statut`, `PUT /:id`, `DELETE /:id`) ; `linksInScope` vérifie les
  liens transmis, `rapprochementInScope` le centre de la ligne ciblée.
- [`etat-contribuable.routes.js`](etat-contribuable.routes.js) : suivi de
  statut et de conformité (`GET /`, `GET /stats`,
  `GET /contribuable/:id_contribuable` et son `/latest`, `GET /:id`, `POST /`,
  `POST /contribuable/:id_contribuable`, `PUT /:id`, `DELETE /:id`), le tout gardé
  par `requireContribuableAccess` et `requireRowContribuableAccess`.
- [`relance.routes.js`](relance.routes.js) : relances et recouvrement
  (`GET /`, `GET /stats`, `GET /contribuable/:id_contribuable`, `GET /:id`,
  `POST /`, `PUT /:id`, `DELETE /:id`).

Toutes ces routes, sauf `/api/auth`, sont protégées par `authenticate` puis par
`enforceDataScope` (périmètre du rôle, voir
[`../utils/data-scope.js`](../utils/data-scope.js)) ; `/api/agents` exige en plus
le rôle `admin`.
