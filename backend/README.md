# Backend

API REST du SSIF, construite avec Node.js et Express. Le serveur démarre depuis [`server.js`](server.js) et l'application Express est assemblée dans [`src/app.js`](src/app.js).

## Organisation

- [`src/config/`](src/config/) : configuration de l'environnement et de la base de données.
- [`src/routes/`](src/routes/) : routes HTTP `/api`.
- [`src/controllers/`](src/controllers/) : réception des requêtes et réponses.
- [`src/services/`](src/services/) : calculs et orchestration de la logique métier.
- [`src/models/`](src/models/) : accès aux données PostgreSQL.
- [`src/middlewares/`](src/middlewares/) : validation et gestion des erreurs.
- [`src/utils/`](src/utils/) : fonctions techniques partagées.

## Commandes

```bash
npm install
npm run dev       # développement avec nodemon
npm start         # démarrage normal
```

Le fichier `.env` contient les paramètres locaux et ne doit pas être versionné.
