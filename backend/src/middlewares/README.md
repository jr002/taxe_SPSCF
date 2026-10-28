# Middlewares

Traitements exécutés pendant le cycle d'une requête Express.

- [`auth.middleware.js`](auth.middleware.js) : exporte `authenticate` (vérifie le
  cookie `fiscal_session`, puis **relit l'agent en base** pour renseigner
  `req.user` avec le rôle, le statut et le centre de rattachement courants — un
  compte bloqué ou supprimé reçoit donc un `401` dès la requête suivante — et
  `req.dataScope` avec le périmètre qui en découle), `authorize(...roles)` et
  `requireAdmin` (contrôle du rôle, utilisé par `/api/agents` et par les écritures
  sur `/api/centres`), ainsi que `getJwtSecret` (lit `JWT_SECRET`, avec une valeur
  de repli en développement).
- [`data-scope.middleware.js`](data-scope.middleware.js) : applique le périmètre de
  [`../utils/data-scope.js`](../utils/data-scope.js). `enforceDataScope`, monté par
  [`../app.js`](../app.js) derrière `authenticate`, renvoie `403` avec un message
  explicite sur les préfixes métier (`BUSINESS_PREFIXES`) quand le périmètre est
  `none`, et refuse de même — `WRITE_METHODS`, `POST`, `PUT`, `PATCH`, `DELETE` —
  toute écriture d'un scope en lecture seule (`canWrite === false`, le cas de
  l'`inspecteur`). Les garnitures `requireContribuableAccess`, `requireDeclarationAccess`,
  `requireRowContribuableAccess`, `requireRapprochementAccess`,
  `requireRapprochementLinks` et `requireCentreAccess` contrôlent au cas par cas les
  URL et les corps de requête qui ciblent un dossier : hors du centre de l'agent,
  la ressource renvoie `403` même si son identifiant est connu.
- [`rate-limit.middleware.js`](rate-limit.middleware.js) : exporte `rateLimit`,
  un limiteur maison à fenêtre glissante (Map en mémoire, aucun paquet npm)
  paramétré par `scope`, `windowMs`, `max`, `identity` et `message`. Il pose
  l'en-tête `Retry-After`, renvoie `429` et met `req.rateLimit.reset()` à
  disposition de la route pour vider le compteur après un succès. Il renseigne
  aussi `req.rateLimit.remaining` : le nombre de tentatives encore acceptées dans
  la fenêtre, réduit au plus petit des compteurs quand plusieurs limiteurs sont
  enchaînés sur la même route (cas de `POST /api/acces-contribuable/:token/ouvrir`,
  limité à la fois par lien + IP et par IP). Les compteurs vivent dans le
  processus : ils repartent de zéro au redémarrage et ne sont pas partagés entre
  plusieurs instances.
- [`validation.middleware.js`](validation.middleware.js) : exporte `validate` et
  les listes de règles `express-validator` montées par les routeurs. `validate`
  renvoie `400` avec l'enveloppe
  `{ success: false, message: 'Erreur de validation', errors: [{ field, message }] }`.
  Les listes fermées (`STATUTS_ACTIVITE`, `STATUTS_CONFORMITE`, `TYPES_RELANCE`,
  `STATUTS_RELANCE`, `TYPES_RAPPROCHEMENT`, `STATUTS_RAPPROCHEMENT`) et le plafond
  monétaire `MONTANT_MAX` sont importés des modèles : ceux-ci restent la seule
  source de vérité.

  | Export | Monté sur |
  | :--- | :--- |
  | `contribuableValidators` | `POST /api/contribuables` |
  | `contribuableUpdateValidators` | `PUT /api/contribuables/:id` |
  | `centreFiscalRefValidator` | `PUT /api/contribuables/:id` |
  | `centreFiscalRefQueryValidator` | `GET /api/contribuables` |
  | `declarationValidators` | `POST /api/declarations` |
  | `declarationUpdateValidators` | `PUT /api/declarations/:id` |
  | `notificationPrimitiveValidators`, `notificationDefinitiveValidators`, `imputationCreditValidators` | `POST /api/declarations/:id/notification-primitive`, `…/notification-definitive`, `…/imputer-credit` |
  | `recoupementValidators` | `POST /api/recoupements`, `PUT /api/recoupements/:id` |
  | `droitCommunicationValidators` | `POST /api/droits-communication` |
  | `droitCommunicationUpdateValidators` | `PUT /api/droits-communication/:id` |
  | `etatContribuableValidators` | `POST /api/etat-contribuable`, `POST /api/etat-contribuable/contribuable/:id_contribuable`, `PUT /api/etat-contribuable/:id`, `POST /api/contribuables/:id/etat` |
  | `relanceValidators` | `POST /api/relances` |
  | `relanceUpdateValidators` | `PUT /api/relances/:id` |
  | `rapprochementValidators` | `POST /api/rapprochements`, `PUT /api/rapprochements/:id` |
  | `rapprochementStatutValidators` | `PATCH /api/rapprochements/:id/statut` |

  `centreFiscalRefValidator` / `centreFiscalRefQueryValidator` confrontent la
  référence `cle:nom` au référentiel par
  [`../utils/unite-fiscale.utils.js`](../utils/unite-fiscale.utils.js).
  `declarationValidators` borne tous les montants à `min: 0` et accepte
  `tva_theorique` (le module « TVA collectée / déductible » la calcule lui-même
  depuis une assiette qui n'est pas le CA) ainsi que `observations_agent` limité
  à 2 000 caractères ; ces deux règles sont `.optional({ values: 'falsy' })`,
  donc un champ vide ou `0` côté client n'est pas une erreur de validation.
  Les listes `…UpdateValidators` ne reprennent que les champs réellement mutables
  du modèle correspondant, ce qui autorise un `PUT` au corps partiel sans exiger
  les champs obligatoires de création.
- [`error.middleware.js`](error.middleware.js) : gestionnaire d'erreurs central,
  exporté par défaut. Il honore `err.statusCode` s'il existe et renvoie sinon
  `500` avec le message générique « Erreur interne du serveur » : aucune erreur
  de `src/` ne pose `statusCode`, donc tout `next(error)` (auth, périmètre de
  données, JWT, bcrypt, Prisma) ressort masqué. Le détail complet reste écrit
  dans la console du serveur, et le champ `stack` n'est ajouté à la réponse
  qu'avec `NODE_ENV=development`.

La journalisation et les en-têtes de sécurité sont fournis directement par
`morgan` et `helmet` dans [`../app.js`](../app.js).
