# Modèles

Couche d'accès aux données PostgreSQL via le client Prisma partagé. Chaque
fichier expose une classe statique pour un domaine métier :

- [`contribuable.model.js`](contribuable.model.js)
- [`declaration.model.js`](declaration.model.js)
- [`controle.model.js`](controle.model.js)
- [`recoupement.model.js`](recoupement.model.js)
- [`centre.model.js`](centre.model.js) : exporte `{ CentreModel, CENTRE_TYPES }`
  et non une classe seule.
- [`agent.model.js`](agent.model.js) : exporte
  `{ AgentModel, AGENT_STATUTS, AGENT_ROLES, AGENT_SELECT }` ; `AGENT_SELECT`
  garantit que `mot_de_passe` n'est jamais renvoyé par l'API.

Il n'existe pas de modèle pour `relances` : la table est présente en base mais
aucun code ne l'utilise. La table `agents` reste interrogée directement par
`../routes/auth.routes.js` (connexion, inscription) et par
`../../scripts/create-agent.js`.
