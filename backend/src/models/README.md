# Modèles

Couche d'accès aux données PostgreSQL via le client Prisma partagé. Chaque
fichier expose une classe statique pour un domaine métier :

- [`contribuable.model.js`](contribuable.model.js)
- [`declaration.model.js`](declaration.model.js)
- [`controle.model.js`](controle.model.js)
- [`recoupement.model.js`](recoupement.model.js)
- [`centre.model.js`](centre.model.js) : exporte `{ CentreModel, CENTRE_TYPES }`
  et non une classe seule.

Il n'existe pas de modèle pour `agents` ni pour `relances` : la table `agents`
est interrogée directement par `../routes/auth.routes.js` et
`../../scripts/create-agent.js`, et `relances` n'est utilisée par aucun code.
