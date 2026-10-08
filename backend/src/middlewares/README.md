# Middlewares

Traitements exécutés pendant le cycle d'une requête Express.

- [`auth.middleware.js`](auth.middleware.js) : exporte `authenticate` (vérifie le
  cookie `fiscal_session` et renseigne `req.user`) et `getJwtSecret` (lit
  `JWT_SECRET`, avec une valeur de repli en développement).
- [`validation.middleware.js`](validation.middleware.js) : exporte `validate`,
  `contribuableValidators` et `declarationValidators` (basés sur
  `express-validator`).
- [`error.middleware.js`](error.middleware.js) : gestionnaire d'erreurs central,
  exporté par défaut.

Le rate limiting, la journalisation et les en-têtes de sécurité sont fournis
directement par `morgan` et `helmet` dans [`../app.js`](../app.js).
