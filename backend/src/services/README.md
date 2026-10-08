# Services

Contient la logique métier réutilisable, appelée par les contrôleurs pour
garder les routes simples.

- [`fiscal.service.js`](fiscal.service.js) : calculs fiscaux (TVA théorique,
  écart, pourcentage, statut, somme recoupée, cohérence des recoupements).
- [`controle.service.js`](controle.service.js) : enchaîne la lecture de la
  déclaration, les calculs fiscaux, l'écriture du contrôle et la mise à jour de
  la déclaration.
- [`recoupement.service.js`](recoupement.service.js) : création et analyse des
  recoupements, statistiques par source.

Les services n'accèdent jamais directement à Express : ils reçoivent des
identifiants ou des objets et s'appuient sur les modèles.
