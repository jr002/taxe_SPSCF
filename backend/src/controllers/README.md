# Contrôleurs

Les contrôleurs traduisent les requêtes HTTP en appels aux services ou modèles,
puis renvoient les statuts et les données JSON.

- [`contribuable.controller.js`](contribuable.controller.js)
- [`declaration.controller.js`](declaration.controller.js) (dont la procédure
  contradictoire : notifications primitive et définitive, imputation du crédit
  d'impôt)
- [`controle.controller.js`](controle.controller.js)
- [`recoupement.controller.js`](recoupement.controller.js)
- [`centre.controller.js`](centre.controller.js)
- [`agent.controller.js`](agent.controller.js) : administration des comptes
  (activation, rôle, mot de passe, suppression), avec les garde-fous sur son
  propre compte et sur le dernier administrateur actif.

La logique d'authentification n'a pas de contrôleur : elle est écrite
directement dans [`../routes/auth.routes.js`](../routes/auth.routes.js).
