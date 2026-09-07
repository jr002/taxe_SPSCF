# Source de l'API

Point d'entrée de l'application Express et séparation des responsabilités du backend. Les routes sont montées dans [`app.js`](app.js), sous les préfixes `/api/contribuables`, `/api/declarations`, `/api/controles` et `/api/recoupements`.

Pour ajouter une fonctionnalité, suivre le chemin `route → controller → service/model`.
