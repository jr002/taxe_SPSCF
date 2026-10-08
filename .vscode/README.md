# Configuration VS Code

Ce dossier contient la configuration locale de VS Code pour le projet.

- [`launch.json`](launch.json) : configuration de débogage de type Chrome
  (« Lancer Chrome en utilisant localhost ») qui ouvre l'URL
  `http://localhost:8080` avec la racine du dépôt comme `webRoot`.

> Remarque : le serveur de développement Vite écoute par défaut sur
> `http://localhost:5173` (et l'API sur `http://localhost:5000`). L'URL `8080`
> de `launch.json` ne correspond donc pas au port réellement utilisé ; adaptez
> `url` avant de lancer ce débogage.

Ces fichiers facilitent le démarrage depuis VS Code sans modifier le code
applicatif.
