# Modèles

Couche d'accès aux données PostgreSQL via le client Prisma partagé. Chaque
fichier expose une classe statique pour un domaine métier :

- [`contribuable.model.js`](contribuable.model.js) : `create` et `update`
  tiennent alignées les deux colonnes de rattachement fiscal. `id_centre` (table
  `centres`, portée par le périmètre des agents) et `centre_fiscal_ref`
  (référentiel `unitefiscal.json`, format `cle:nom`, consulté par les pages
  « unité fiscale ») décrivent le même centre : fournir `id_centre` dérive la
  référence textuelle, fournir `centre_fiscal_ref` seul retrouve le centre en
  base, et `id_centre` l'emporte quand les deux arrivent ensemble — c'est la
  colonne que `forceCentreOnWrite` impose déjà à un agent centré. Un centre sans
  équivalent dans le référentiel (`SSIF`) donne une référence nulle.
- [`declaration.model.js`](declaration.model.js) : le `create` normalise lui-même
  ce que le contrôleur ne calcule pas — `annee` repli sur les 4 premiers
  caractères de `periode` puis sur l'année courante, montants à `0` s'ils sont
  absents, `type_declaration` à `'TVA'`, `statut` à `'conforme'` et
  `observations_agent` à `null`. En revanche le `update` applique sa whitelist
  (`allowedFields`) champ par champ **sans jamais recalculer le statut** : un
  client qui modifie `tva_payee` ou `tva_theorique` doit pousser le `statut`
  dérivé, sinon la ligne reste étiquetée d'après sa valeur d'origine. C'est ce
  point qui impose au frontend de reproduire les seuils de
  `FiscalService.determinerStatut` lors d'une mise à jour (voir
  `../../../frontend/src/frontofficeagent/collecte/utils/enregistrerCollecte.js`).
  `getStats(scope, { national })` agrège le périmètre de l'agent ; avec
  `national: true` il ajoute `tva_theorique_dgi`, la somme de **toutes** les
  déclarations sans filtre de centre. Ce second total, sans aucun détail, n'est
  demandé que par le contrôleur pour un `chef_centre` : il lui permet de situer
  son centre (dont il ne voit que les dossiers) dans l'ensemble national.
- [`controle.model.js`](controle.model.js)
- [`recoupement.model.js`](recoupement.model.js)
- [`droit-communication.model.js`](droit-communication.model.js) : classe
  statique `DroitCommunicationModel` sur Prisma (`create`, `findById`,
  `findAll` paginé, `findByContribuable`, `update` filtré par une whitelist
  `allowedFields`, `delete`, `getStatutStats`) ; statuts autorisés
  `demande`, `reponse`, `partiel`, `relance`, `sans_suite`.
- [`centre.model.js`](centre.model.js) : exporte `{ CentreModel, CENTRE_TYPES }`
  et non une classe seule.
- [`agent.model.js`](agent.model.js) : exporte
  `{ AgentModel, AGENT_STATUTS, AGENT_ROLES, AGENT_SELECT, CENTRE_ADMINISTRATEURS }` ; `AGENT_ROLES` vaut
  `['admin', 'chef_centre', 'inspecteur', 'controleur', 'agent', 'contribuable', 'autre']`
  (colonne `agents.role` en `VarChar(50)`, donc aucun changement de schéma ; la
  valeur héritée `client` a été convertie en `contribuable` par la migration
  `../../../migrations/006-roles-centre-affectation.sql`) ; `AGENT_SELECT`
  garantit que `mot_de_passe` n'est jamais renvoyé par l'API et `findById` /
  `findAll` aplatissent la relation `centres` en `nom_centre` ;
  `updateCentre(id, id_centre)` affecte — ou retire avec `null` — le centre de
  rattachement qui détermine le périmètre de l'agent ;
  `updateRole(id, role, id_centre)` prend un troisième argument facultatif —
  `undefined` laisse l'affiliation actuelle intacte, une valeur (identifiant ou
  `null`) la réécrit dans la même requête que le rôle. `CENTRE_ADMINISTRATEURS`
  (`'SSIF'`, création et backfill par la migration
  `../../../migrations/008-centre-ssif-administrateurs.sql`) et
  `findIdCentreAdministrateurs()` portent la règle d'affiliation d'office des
  administrateurs : elle est purement informative, un `admin` n'étant jamais
  filtré par `id_centre`.

## Listes de valeurs

Les valeurs admises par les colonnes à contrainte `CHECK` sont déclarées une
seule fois, dans le modèle qui les écrit, puis exportées :
`STATUTS_ACTIVITE` et `STATUTS_CONFORMITE`
([`etat-contribuable.model.js`](etat-contribuable.model.js)), `TYPES_RELANCE` et
`STATUTS_RELANCE` ([`relance.model.js`](relance.model.js)),
`TYPES_RAPPROCHEMENT`, `STATUTS_RAPPROCHEMENT` et
`STATUT_RAPPROCHEMENT_PAR_DEFAUT`
([`rapprochement.model.js`](rapprochement.model.js)), `CENTRE_TYPES`
([`centre.model.js`](centre.model.js)), `AGENT_ROLES` et `AGENT_STATUTS`
([`agent.model.js`](agent.model.js)).
[`../middlewares/validation.middleware.js`](../middlewares/validation.middleware.js)
les importe pour ses `isIn(...)` et les cite dans ses messages d'erreur : une
valeur hors liste est refusée en `400` avant d'atteindre la base, au lieu
d'échouer sur la contrainte. Ajouter une valeur se fait donc dans le modèle, et
nulle part ailleurs — à condition de la refléter aussi dans la contrainte `CHECK`
par un script SQL additif (voir
[`../../../migrations/007-demande-eclaircissement.sql`](../../../migrations/007-demande-eclaircissement.sql)).

## Périmètre de données

Les modèles métier (`contribuable`, `declaration`, `relance`, `recoupement`,
`droit-communication`, `rapprochement`, `etat-contribuable`, `controle`,
`centre`) reçoivent le `req.dataScope` du contrôleur et le traduisent en filtre
Prisma grâce à [`../utils/data-scope.js`](../utils/data-scope.js) :
`applyScope` pour une table reliée directement à `contribuables`,
`applyScopeViaRelations` pour celles qui n'y arrivent que par plusieurs chemins
(`rapprochements` passe par `declarations` **ou** `recoupements`). Le filtre est
empilé dans `where.AND` pour n'écraser aucun filtre de recherche déjà posé, et un
appel interne sans `scope` (scripts, services) ne filtre rien.

`relances` dispose désormais de son modèle [`relance.model.js`](relance.model.js).
La table `agents` reste aussi interrogée directement par
[`../routes/auth.routes.js`](../routes/auth.routes.js) (connexion, inscription) et
par `../../scripts/create-agent.js`.
