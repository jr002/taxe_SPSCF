# Documentation des routes frontend, backend et API (SP2CF / TVA•SSIF)

Ce document décrit les routes du frontend React, les endpoints de l'API REST
Express et les fonctions du client API du projet. Il est maintenu en regard du
code : [`frontend/src/App.jsx`](frontend/src/App.jsx),
[`frontend/src/api/api.js`](frontend/src/api/api.js) et
[`backend/src/app.js`](backend/src/app.js).

---

## 1. Routes frontend (React Router)

Toutes les routes sont déclarées dans [`App.jsx`](frontend/src/App.jsx). Au
montage, l'application appelle `GET /api/auth/me` avec le cookie de session :
tant que la réponse n'est pas connue, un message « Vérification de la session… »
est affiché. Ensuite :

- la route `/` affiche l'écran de connexion
  [`backofficeadmin/auth/signin.jsx`](frontend/src/backofficeadmin/auth/signin.jsx)
  si l'agent n'est pas authentifié, sinon elle redirige vers l'accueil de son
  rôle (`getLandingPath`) ;
- les autres pages sont regroupées dans une route de layout sans chemin, qui
  rend [`Header.jsx`](frontend/src/components/common/Header.jsx) puis
  `<main><Outlet /></main>` lorsque la session est valide, et redirige vers `/`
  sinon. La barre de navigation est fixe en haut de l'écran (`position: sticky`
  au-delà de 1024 px) et l'entrée surlignée est celle dont le chemin est le
  préfixe le plus long de l'URL courante, ce qui maintient le repère sur les
  routes détaillées (`/contribuables/51/relances`,
  `/admin/verification-nif/sql`) ;
- toute URL inconnue correspond au motif `*` et redirige vers `/`.

| Route URL | Composant page | Accès | Rôle |
| :--- | :--- | :--- | :--- |
| `/` | `backofficeadmin/auth/signin.jsx` | public | Écran de connexion ; si la session est déjà valide, redirection vers `/admin` pour un administrateur et `/acceuil` pour les autres rôles (`getLandingPath` de `frontend/src/utils/session.utils.js`, partagé par `App.jsx` et `signin.jsx`) |
| `/signin` | — | public | Redirection immédiate vers `/` |
| `/signup` | `backofficeadmin/auth/signup.jsx` | public | Demande de création d'un compte agent (nom, prénom, e-mail, mot de passe et confirmation) ; enregistre la demande sans connecter l'utilisateur puis **redirige vers `/attente-activation`** avec l'identité saisie |
| `/attente-activation` | `backofficeadmin/auth/attente-activation.jsx` | public | Écran de statut « en attente d'activation » : atteint après une inscription ou après une connexion refusée pour `statut = en_attente` (`403` + `code: COMPTE_EN_ATTENTE`) ; reprend la mise en page de `/` et `/signup` et offre le bouton « ← Retour à la connexion », un lien « Mot de passe oublié ? » vers `/mot-de-passe-oublie` et un lien « Créer un autre compte » vers `/signup` |
| `/mot-de-passe-oublie` | `backofficeadmin/auth/mot-de-passe-oublie.jsx` | public | Demande de réinitialisation du mot de passe (`POST /api/auth/reset-request`) ; même mise en page que `/`, bouton de thème compris, et champ e-mail prérempli depuis l'état de navigation transmis par le lien « Mot de passe oublié ? » de `/` |
| `/admin` | `backofficeadmin/dashboard/AdminDashboard.jsx` | protégé — administrateurs | **Accueil de l'espace admin** : tableau de bord des comptes agents (effectifs par statut, répartition, derniers comptes créés, accès rapides) |
| `/admin/utilisateurs` | `backofficeadmin/utilisateurs/AdminUtilisateurs.jsx` | protégé — administrateurs | Gestion des comptes : activation des demandes, blocage / réactivation, rôles, centre de rattachement, identité, mots de passe, suppression. Chaque ligne se déplie en fiche de profil (identité éditable, rôle, liste des centres disponibles, périmètre, création, actions). **La fiche fonctionne en brouillon** : frapper un champ ou changer un sélecteur n'envoie rien, le pied de fiche affiche « N modification(s) non enregistrée(s) » et seul le bouton `💾 Enregistrer` déclenche les `PATCH`. Toute action (enregistrement, blocage / activation, mot de passe temporaire, suppression, abandon d'un brouillon) passe par la modale [`ModaleConfirmation`](frontend/src/components/common/ModaleConfirmation.jsx), qui liste les paires « avant → après » et propose Annuler / Valider ; les erreurs du serveur (e-mail déjà pris, dernier administrateur…) s'affichent dans la modale elle-même. Pour un admin, le `Header` ne présente que les modules admin (et le logo renvoie vers `/admin`) |
| `/admin/roles` | `backofficeadmin/roles/AdminRoles.jsx` | protégé — administrateurs | Gestion des rôles & accès par centre fiscal : matrice des 7 titres (Administrateur, Chef de centre, Inspecteur, Contrôleur, Agent Fiscal, Contribuable, Autre), changement de rôle par ligne (`PATCH /api/agents/:id/role`) et affectation du centre de rattachement (`PATCH /api/agents/:id/centre`) — l'affectation est lue et écrite en base, plus dans le `localStorage`. Le même sélecteur de centre est disponible dans la fiche de profil de `/admin/utilisateurs` |
| `/admin/verification-nif` | `backofficeadmin/verification-nif/AdminVerificationNIF.jsx` | protégé — administrateurs | Synthèse des trois types de vérification (requête, Excel, catalogue JSON) et tableau du référentiel NIF ; chaque bloc renvoie vers sa page dédiée |
| `/admin/verification-nif/sql` | `backofficeadmin/verification-nif/VerificationNifSql.jsx` | protégé — administrateurs | Vérification d'un NIF par requête API + référentiel local ; saisie multigne acceptant une requête collée (le premier NIF à 10 chiffres est retenu), journal des erreurs et les 3 dernières opérations du type |
| `/admin/verification-nif/excel` | `backofficeadmin/verification-nif/VerificationNifExcel.jsx` | protégé — administrateurs | Liaison du référentiel depuis un fichier `.xlsx` / `.xls` / `.csv` lu côté navigateur, avec modèle vierge `modele de verificationnif.xls` téléchargeable et les 3 dernières importations |
| `/admin/verification-nif/json` | `backofficeadmin/verification-nif/VerificationNifJson.jsx` | protégé — administrateurs | Synchronisation avec le catalogue `unitefiscal.json` (import module, pas `fetch`), modèle `modele de verificationnif.json` téléchargeable et API JSON enregistrables — fichiers de `frontend/public/referentiel-nif/` ou serveurs distants — avec les 3 dernières synchronisations |
| `/admin/historique` | `backofficeadmin/historique/AdminHistorique.jsx` | protégé — administrateurs | Journal des opérations d'administration (`GET /api/agents/historique`) |
| `/acceuil` | `Accueil.jsx` | protégé | Tableau de bord d'accueil et indicateurs de synthèse |
| `/collecte` | `Collecte.jsx` | protégé | Simulateur de collecte TVA ; l'onglet actif est porté par `currentModule` (`sales`, `theoretical`, `reconciliation`, `declaration`) |
| `/entreprises/nouveau` | `PhaseClassement.jsx` | protégé | Étape 1 de l'immatriculation : choix de la structure compétente |
| `/entreprises/nouveau/form` | `FormInformation.jsx` | protégé | Étape 2 de l'immatriculation : formulaire de création d'un contribuable (`?structure=…`) |
| `/decisionnel` | `TableauDecisionnel.jsx` | protégé | Tableau de bord de pilotage (KPI et graphiques) |
| `/register` | `Register.jsx` | protégé | Registre fiscal par centre |
| `/centres-fiscaux` | `CentreListe.jsx` | protégé | Liste des centres et unités fiscales |
| `/centres/:id` | `CentreDetail.jsx` | protégé | Fiche d'un centre et de ses contribuables |
| `/centres-fiscaux/:type/:index` | `UniteFiscaleDetail.jsx` | protégé | Fiche d'une unité fiscale (centre fiscal, SRE ou DGE) |
| `/suivi` | `SuiviFiscal.jsx` | protégé | Suivi et recherche des déclarations ; badge de contrôle **Rien à signaler** (vert, écart ≤ 25 %), **Risque moyen** (orange, écart ≤ 50 %) ou **À risque** (rouge) |
| `/suivi/:id` | `DeclarationDetail.jsx` | protégé | Fiche détaillée d'une déclaration et actes de procédure contradictoire : notification primitive, notification définitive, demande d'éclaircissements (CPF V-17, persistée dans `relances`), imputation du crédit d'impôt |
| `/contribuables` | `Contribuables.jsx` | protégé | Registre des contribuables (vue liste) |
| `/contribuables?vue=statistique` | `Contribuables.jsx` | protégé | Même page, vue **Statistique** : KPI, camemberts et histogrammes VSP / CSP et IS / IR / TVA (la vue est portée par l'query string, aucun état local) |
| `/contribuables/:id` | `ContribuableDetail.jsx` | protégé | Fiche détaillée d'un contribuable, onglet Synthèse |
| `/contribuables/:id/classification` | `ContribuableDetail.jsx` | protégé | Même fiche, onglet Nature d'impôt |
| `/contribuables/:id/declarations` | `ContribuableDetail.jsx` | protégé | Même fiche, onglet Déclarations |
| `/contribuables/:id/declarations/nouveau` | `pages/DeclarationCreate.jsx` | protégé | Page dédiée d'enregistrement d'une déclaration |
| `/contribuables/:id/recoupements` | `ContribuableDetail.jsx` | protégé | Même fiche, onglet Recoupements |
| `/contribuables/:id/recoupements/nouveau` | `pages/RecoupementCreate.jsx` | protégé | Page dédiée d'enregistrement d'un recoupement |
| `/contribuables/:id/droits-communication` | `ContribuableDetail.jsx` | protégé | Même fiche, onglet Droits de communication |
| `/contribuables/:id/droits-communication/nouveau` | `pages/DroitCommunicationCreate.jsx` | protégé | Page dédiée d'enregistrement d'un droit de communication |
| `/contribuables/:id/relances` | `ContribuableDetail.jsx` | protégé | Même fiche, onglet Relances (historique local, `localStorage`) |
| `/contribuables/:id/confrontation` | `pages/Confrontation.jsx` | protégé | Page unique de confrontation déclarations / recoupements, avec ses onglets internes |
| `/relance` | `RelanceFiscale.jsx` | protégé | Relance fiscale et recouvrement, alimentée par les déclarations et les contribuables |
| `*` | — | public | Redirection vers `/` |

Les pages du domaine contribuable sont réexportées depuis
[`frontend/src/frontofficeagent/index.jsx`](frontend/src/frontofficeagent/index.jsx).

Remarques :

- l'orthographe `/acceuil` (au lieu de `/accueil`) est celle du code et doit
  être conservée dans les liens ;
- les pages sont réexportées par [`frontofficeagent/index.jsx`](frontend/src/frontofficeagent/index.jsx) ;
- [`backofficeadmin/auth/login.jsx`](frontend/src/backofficeadmin/auth/login.jsx)
  existe mais n'est importé par aucune route : l'écran de connexion réel est
  `backofficeadmin/auth/signin.jsx` ;
- bouclage des quatre écrans publics : `/` (composant `Signin`) renvoie vers
  `/signup` et vers `/mot-de-passe-oublie` par des liens `Link` ; `signup.jsx`,
  sur `POST /api/auth/register` réussi, redirige vers `/attente-activation` ;
  `signin.jsx` y redirige aussi quand `POST /api/auth/login` répond `403` avec
  `code: 'COMPTE_EN_ATTENTE'` (un compte `COMPTE_BLOQUE` garde une erreur inline,
  sans redirection) ; `/attente-activation` ramène vers `/` par « ← Retour à la
  connexion » et propose les deux autres écrans publics en liens secondaires ;
  `/mot-de-passe-oublie` revient vers `/` par « ← Retour à la connexion » ;
- `Signin` et `MotDePasseOublie` reçoivent `isDarkMode` et `onToggleTheme` de
  `App.jsx` : le bouton de thème et les règles `.dark-theme .login-*` s'appliquent
  donc sur `/`, `/signup` et `/mot-de-passe-oublie`, ainsi que sur
  `/attente-activation` (sans bouton de thème propre, mais en héritant du thème
  enregistré). `Signin` affiche un bouton « Masquer / Afficher » sur le champ mot
  de passe ; la demande de réinitialisation, elle, est portée par la page dédiée
  `/mot-de-passe-oublie`, qui appelle `POST /api/auth/reset-request` ;
- « protégé » signifie que l'accès direct à l'URL sans session valide redirige
  vers `/` ; les pages protégées elles-mêmes ne vérifient pas les rôles, sauf
  `/admin`, qui n'est proposée qu'aux administrateurs. La restriction de périmètre
  ne se joue donc pas dans le navigateur : le serveur filtre les listes selon le
  centre de l'agent et refuse (`403`) tout accès hors périmètre (voir
  « Périmètre de données appliqué par l'API » en section 2) ; un agent
  `contribuable` ou `autre` qui ouvre une page fiscale n'obtient que le message de
  refus ;
- **redirection des administrateurs** : après une connexion réussie, un agent
  dont le rôle est `admin` est envoyé directement sur `/admin`, les autres rôles
  arrivent sur `/acceuil`. Le calcul est centralisé dans `getLandingPath`
  ([`frontend/src/utils/session.utils.js`](frontend/src/utils/session.utils.js)),
  consommé à la fois par
  [`backofficeadmin/auth/signin.jsx`](frontend/src/backofficeadmin/auth/signin.jsx)
  et par la route `/` de
  [`App.jsx`](frontend/src/App.jsx) : la redirection de `/` ne peut plus écraser
  la destination choisie après connexion. Le rôle provenant de la réponse de
  `POST /api/auth/login`, il n'y a aucun contournement d'authentification ;
- **espace administrateur** : pour un agent dont le rôle est `admin`, le
  `Header` ne propose que les cinq entrées admin — « Tableau de bord »
  (`/admin`), « Utilisateurs », « Rôles », « Vérification NIF » et
  « Historique & Audit » — et son logo renvoie vers `/admin` (`ADMIN_LINKS`) ;
  la navigation fiscale (`NAVIGATION_LINKS`) est réservée aux autres rôles. Les
  URL fiscales restent techniquement accessibles à un admin (aucun blocage de
  route), mais elles ne lui sont plus proposées, et aucune entrée du menu admin
  ne portant leur chemin, elles ne sont même plus surlignées.

---

## 2. Routes backend (API REST Express)

Le backend écoute par défaut sur le port `5000` (`http://localhost:5000`,
défini par `PORT` dans `backend/.env`). En développement, Vite relaie les
requêtes `/api` vers ce serveur via
[`frontend/vite.config.js`](frontend/vite.config.js).

### Authentification et routes publiques

`backend/src/app.js` monte onze domaines d'API :

```text
/api/auth               (monté avant le middleware d'authentification)
/api/contribuables
/api/declarations
/api/controles
/api/recoupements
/api/droits-communication (demandes de communication adressées aux tiers)
/api/centres
/api/agents
/api/rapprochements     (confrontation déclarations / recoupements)
/api/etat-contribuable  (suivi de statut et conformité)
/api/relances           (relances et recouvrement)
```

La ligne `app.use('/api', authenticate, enforceDataScope)` protège **toutes** les
routes `/api` sauf celles de `/api/auth`. Sans cookie `fiscal_session` valide, une
route protégée répond :

```json
{ "success": false, "message": "Authentification requise" }
```

(code `401`). Un cookie présent mais expiré ou signé avec un autre
`JWT_SECRET` répond `401` avec le message « Session invalide ou expirée ».
Le jeton vérifié, `authenticate` relit ensuite l'agent en base : un compte
devenu `inactif`, `en_attente` ou supprimé répond `401` (« Votre compte n'est
plus actif, reconnectez-vous » / « Compte introuvable, reconnectez-vous »),
`req.user` reprend le rôle, le statut et le centre courants, et `req.dataScope`
le périmètre qui en découle.

### Périmètre de données appliqué par l'API

Sept rôles, trois périmètres de lecture et deux droits d'écriture (règle unique
dans [`backend/src/utils/data-scope.js`](backend/src/utils/data-scope.js), contrôle
dans [`backend/src/middlewares/data-scope.middleware.js`](backend/src/middlewares/data-scope.middleware.js)) :

| Rôle           | Ce qu'il voit                                                      |
| -------------- | ------------------------------------------------------------------ |
| `admin`        | Back-office + tous les centres, écriture comprise                    |
| `inspecteur`   | Tous les centres, en **consultation seule**                          |
| `chef_centre`  | Uniquement les dossiers de `agents.id_centre`                       |
| `controleur`   | Uniquement les dossiers de `agents.id_centre`                       |
| `agent`        | Uniquement les dossiers de `agents.id_centre`                       |
| `contribuable` | Aucun dossier (le lien compte ↔ NIF n'est pas encore implémenté)    |
| `autre`        | Aucun dossier                                                       |

- un rôle centré **sans** `id_centre` est traité comme sans périmètre ;
- listes et statistiques sont filtrées côté serveur, jamais côté navigateur ;
- `403` sur toute route qui cible un dossier hors périmètre (identifiant deviné
  compris), avec le message « Ce contribuable dépend d'un autre centre fiscal que
  le vôtre », « Cet enregistrement dépend d'un autre centre fiscal que le vôtre »
  ou, périmètre vide, « Le rôle … ne donne accès à aucun dossier fiscal » ;
- `req.dataScope.canWrite` distinct lire et écrire : sur les neuf préfixes
  métiers, `POST`, `PUT`, `PATCH` et `DELETE` d'un scope en lecture seule
  (`inspecteur`) répondent `403` « Le rôle Inspecteur consulte les dossiers de
  tous les centres mais ne peut ni en créer ni en modifier. » ; `/api/auth`
  restant hors périmètre métier, un inspecteur y change son propre mot de passe ;
- une création ou une modification de contribuable par un agent centré écrit
  d'office son propre `id_centre` (l'administrateur seul choisit un autre centre).

Routes publiques : `GET /health`, l'interface `/api-docs`, la spécification
`/api-docs/swagger.json`, les fichiers statiques `/uploads`, ainsi que
`POST /api/auth/register`, `POST /api/auth/login`,
`POST /api/auth/reset-request` et `POST /api/auth/logout`.
`GET /api/auth/me` applique le middleware dans son propre routeur et exige donc
le cookie.

`POST /api/auth/login`, `POST /api/auth/register` et
`POST /api/auth/reset-request` sont limités par
[`backend/src/middlewares/rate-limit.middleware.js`](backend/src/middlewares/rate-limit.middleware.js)
(fenêtre glissante en mémoire, `429` avec `Retry-After`) : 5 tentatives par
paire IP + e-mail et 20 par IP pour la connexion, 10 envois par IP pour les
deux formulaires. `POST /api/auth/change-password` applique le même
mécanisme, compté par agent connecté (6 tentatives par fenêtre).

Le cookie `fiscal_session` est `httpOnly`, `sameSite=lax`, `secure` lorsque
`NODE_ENV=production`, et sa durée est de 8 heures, comme le jeton JWT
(`expiresIn: '8h'`).

### Validation des corps et contrat d'erreur

Chaque route d'écriture branche un jeu de validateurs
([`backend/src/middlewares/validation.middleware.js`](backend/src/middlewares/validation.middleware.js))
avant son contrôleur. Les bornes reproduisent le schéma PostgreSQL : une valeur
hors limite est refusée par l'API au lieu de faire échouer l'insertion en base.

- montants en `numeric(15,2)` — `ca`, `benefice`, `tva_collectee`,
  `tva_deductible`, `tva_payee`, `tva_theorique`, `montant_redressement`,
  `credit_impot`, `montant_impute`, `montant_net_a_payer`, `montant_du`,
  `somme_recoupee`, `montant_declare`, `montant_tva`, `montant_ttc` — de `0` à
  `9 999 999 999 999,99` ;
- `score` en `numeric(5,2)` : de `0` à `100` ;
- `annee` : de `2000` à `2100` ; `prorogation_jours` : de `0` à `3650` ;
- `periode` : 7 caractères au plus (`2025-01`) ;
- `observations`, `observations_agent`, `motif` : 2000 caractères au plus ;
- chaînes `VarChar` d'un contribuable : `nif` de 10 à 50 caractères,
  `raison_sociale` de 2 à 255, `secteur_activite` 100, `telephone` 20,
  `email` 100 — y compris sur `PUT /api/contribuables/:id` ;
- dates (`date_emission`, `date_demande`, `date_reponse`,
  `date_notification_primitive`, `date_notification_definitive`,
  `date_limite_reponse`, `date_regularisation`) : ISO 8601 ;
- listes fermées, exportées par le modèle qui en est la source et consommées
  telles quelles par le middleware : `STATUTS_ACTIVITE` et
  `STATUTS_CONFORMITE`, `TYPES_RELANCE` et `STATUTS_RELANCE`,
  `TYPES_RAPPROCHEMENT` et `STATUTS_RAPPROCHEMENT`, `CENTRE_TYPES`, statuts de
  droit de communication (`demande`, `reponse`, `partiel`, `relance`,
  `sans_suite`). `declarations.statut` n'a pas de contrainte en base : il est
  borné à 40 caractères, les valeurs produites par l'API étant `conforme`,
  `alerte`, `critique`, `PRIMITIVE_ENVOYÉE` et `DÉFINITIVE_ENVOYÉE`.

Un refus renvoie `400` avec
`{ "success": false, "message": "Erreur de validation", "errors": [{ "field": "ca", "message": "..." }] }`.
Un `POST` ou un `PUT` envoyé sans corps JSON renvoie la même erreur sur les
champs obligatoires — jamais un `500`.

Les réponses d'erreur ne contiennent plus le détail technique de l'exception
(aucune clé `error`) : le client reçoit un message générique et la cause reste
journalisée côté serveur par `console.error`. Toute erreur transmise à
[`backend/src/middlewares/error.middleware.js`](backend/src/middlewares/error.middleware.js)
sans `statusCode` — aucun `next(error)` du code n'en pose — ressort donc en
`500` avec « Erreur interne du serveur », qu'elle vienne de l'authentification,
du périmètre de données ou d'une exception Prisma/JWT/bcrypt ; le champ `stack`
n'est ajouté à la réponse qu'avec `NODE_ENV=development`. Les conflits métier ont leur code
propre : `409` pour un doublon sur
`declarations(id_contribuable, periode, type_declaration)` ou pour un
`numero_centre` déjà utilisé, `400` pour un `id_centre` qui ne correspond à
aucun centre, `404` pour un identifiant non numérique ou une ligne absente,
`403` pour une ligne rattachée à un autre centre.

`PUT /api/contribuables/:id`, `PUT /api/declarations/:id`, `PUT /api/relances/:id`
et `PUT /api/droits-communication/:id` acceptent un corps partiel : seuls les
champs fournis sont écrits, les autres sont conservés. `id_contribuable` n'y est
pas modifiable pour une déclaration. `PATCH /api/rapprochements/:id/statut`
exige en revanche `statut`.

### Santé et documentation

| Méthode | Endpoint | Accès | Réponse |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | public | `200` — `{ "status": "OK", "message": "API de contrôle fiscal en ligne", "version": "1.0.0" }` |
| `GET` | `/api-docs` | public | `200` — interface Swagger UI |
| `GET` | `/api-docs/swagger.json` | public | `200` — spécification OpenAPI 3.0.3 définie dans [`backend/src/config/swagger.js`](backend/src/config/swagger.js) |

### Module Auth (`/api/auth`)

| Méthode | Endpoint | Accès | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | public, limité | `nom`, `prenom`, `email`, `password` (chaînes, obligatoires ; mot de passe de 4 caractères minimum) | `400` si les champs ou formats sont invalides ; `409` si l'e-mail existe déjà ; `429` au-delà de 10 envois par IP et par fenêtre de 15 min ; `201` avec une demande enregistrée et un compte `agent` au statut `en_attente` |
| `POST` | `/api/auth/login` | public, limité | `email`, `password` (chaînes, obligatoires) | `400` si l'un manque ; `401` « Identifiants incorrects » (compte inconnu ou mot de passe erroné) ; `403` « Votre compte est en attente d'activation par un administrateur. » **et `code: 'COMPTE_EN_ATTENTE'`** si `statut = en_attente` ; `403` « Ce compte a été bloqué... » **et `code: 'COMPTE_BLOQUE'`** si le compte n'est pas `actif` ; `429` au-delà de 5 échecs par e-mail ou 20 par IP ; `200` avec `{ success: true, user: { id, email, nom, prenom, role } }` et le cookie `fiscal_session` |
| `POST` | `/api/auth/reset-request` | public, limité | `email` (chaîne, format validé) | `400` si l'e-mail est invalide ; `429` au-delà de 10 envois par IP et par fenêtre ; `200` avec le même message que le compte existe ou non — une ligne `RESET_REQUEST` est ajoutée au journal d'audit seulement dans ce cas |
| `POST` | `/api/auth/change-password` | authentifié, limité | `password_actuel`, `password_nouveau`, `password_confirmation` (chaînes, obligatoires ; nouveau mot de passe de 4 caractères minimum, 72 octets maximum) | `400` si un champ manque, si les deux nouveaux mots de passe diffèrent, si le nouveau est trop court ou identique à l'actuel, ou si `password_actuel` ne correspond pas au hash enregistré ; `401` si le compte de la session n'existe plus ; `429` au-delà de 6 tentatives par agent et par fenêtre de 15 min ; `200` — mot de passe remplacé (bcrypt, 12 tours) et ligne `MDP_CHANGEMENT` dans le journal. Le cookie courant n'est **pas** révoqué : seules les connexions suivantes utilisent le nouveau mot de passe |
| `GET` | `/api/auth/me` | authentifié | — | `200` — `{ success: true, user }` ; `401` sans session valide, ou si le compte a été bloqué ou supprimé |
| `POST` | `/api/auth/logout` | public | — | `200` — `{ success: true }` et suppression du cookie |

### Module Agents (`/api/agents`) — administration des comptes

Ces routes passent par `authenticate` (cookie de session) **puis** par
`requireAdmin` : un agent dont le rôle n'est pas `admin` reçoit `403`.

Tout compte `admin` est affilié d'office au centre `SSIF` — créé et appliqué aux
administrateurs existants par le script additif
[`backend/migrations/008-centre-ssif-administrateurs.sql`](backend/migrations/008-centre-ssif-administrateurs.sql).
Ce centre est **informatif** : `admin` étant un rôle national, `data-scope.js`
ne filtre jamais un administrateur par `id_centre`. Sa suppression est refusée
(`400`) pour ne pas vider silencieusement l'affiliation des comptes `admin`.

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/agents` | query facultatives `search` (nom, prénom ou e-mail), `statut` (`actif`, `en_attente`, `inactif`), `role` (`admin`, `chef_centre`, `inspecteur`, `controleur`, `agent`, `contribuable`, `autre`) | `200` — `{ success: true, data: [...] }`, toujours sans `mot_de_passe`, chaque ligne portant `id_centre` et `nom_centre` |
| `GET` | `/api/agents/historique` | query `page`, `limit` | `200` — journal des opérations d'administration |
| `PATCH` | `/api/agents/:id/statut` | `{ statut }` | `200` ; `400` si le statut est invalide, s'il s'agit de son propre compte ou du dernier administrateur actif ; `404` si introuvable |
| `PATCH` | `/api/agents/:id/role` | `{ role }` parmi `admin` (Administrateur), `chef_centre` (Chef de centre), `inspecteur` (Inspecteur), `controleur` (Contrôleur), `agent` (Agent Fiscal), `contribuable` (Contribuable), `autre` (Autre) — liste `AGENT_ROLES` de `backend/src/models/agent.model.js` | `200` — l'agent mis à jour avec `nom_centre` ; **le centre est réécrit automatiquement** : entrée dans `admin` ⇒ affiliation au centre `SSIF` (`AgentModel.findIdCentreAdministrateurs()`), sortie de `admin` ⇒ `id_centre` remis à `null`, autres rôles ⇒ affectation conservée. Si le centre `SSIF` manque en base, l'affiliation existante reste intacte et le message ne l'annonce pas. ; `400` (rôle invalide, son propre compte, dernier administrateur actif) ; `404`. Journalisation `ROLE_CHANGE` avec `id_centre` dans les valeurs avant/après |
| `PATCH` | `/api/agents/:id/centre` | `{ id_centre }` — identifiant du centre de rattachement, `null` ou `""` pour le retirer | `200` — l'agent mis à jour avec `nom_centre`, message indiquant le périmètre effectif ; `400` (champ absent ou invalide) ; `404` (compte ou centre introuvable) |
| `PATCH` | `/api/agents/:id/password` | `{ password }` (4 caractères minimum, 72 octets maximum) | `200` — nouveau mot de passe haché (bcrypt, 12 tours) ; `400` ; `404` |
| `PATCH` | `/api/agents/:id/identite` | `{ nom, prenom, email }` (chaînes obligatoires, 100 caractères maximum, e-mail validé et unique) | `200` — l'agent mis à jour ; `400` (champ absent, trop long ou e-mail invalide) ; `404` ; `409` « Un autre compte utilise déjà cette adresse e-mail. » — journalisation `IDENTITE_UPDATE` seulement pour les clés réellement modifiées |
| `DELETE` | `/api/agents/:id` | — | `200` ; `400` sur son propre compte ou sur le dernier administrateur actif ; `404` |

La suppression d'un agent ne supprime ni ses contrôles, ni ses relances, ni ses états :
`controles.id_agent`, `relances.id_agent` et `etat_contribuable.id_agent` passent à `NULL`.

### Module Contribuables (`/api/contribuables`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/contribuables` | query `page` (défaut 1), `limit` (défaut 20), `search` (NIF, raison sociale ou secteur), `centre_fiscal_ref` (référence JSON `type:nom`) | `200` — `{ data: { data: [...], pagination: { page, limit, total, pages } } }` incluant `dernier_etat`, `statut_activite`, `statut_conformite` |
| `GET` | `/api/contribuables/:id` | `id` = `id_contribuable` | `200` — contribuable, ses `declarations`, la relation `centres`, `dernier_etat` et historique `etat_contribuable`, `nb_declarations` et `ca_moyen` ; `404` si introuvable |
| `POST` | `/api/contribuables` | `nif` (obligatoire, au moins 10 chiffres, numérique), `raison_sociale` (obligatoire, 2 caractères minimum), `secteur_activite` (obligatoire), `adresse` (obligatoire), `telephone` (obligatoire, format `[0-9+\-\s]{8,}`), `email` (optionnel, e-mail valide), `regime_fiscal` (optionnel, `IS` ou `IR`), `id_centre` (optionnel, entier ≥ 1), `centre_fiscal_ref` (optionnel, référence JSON `type:nom` valide) | `201` ; `400` si la validation échoue, si le NIF existe déjà, ou si `id_centre` ou `centre_fiscal_ref` est invalide ; `500` sinon |
| `PUT` | `/api/contribuables/:id` | champs modifiables : `raison_sociale`, `secteur_activite`, `adresse`, `telephone`, `email`, `regime_fiscal`, `id_centre`, `centre_fiscal_ref` | `200` ; `404` si introuvable ; `400` si `id_centre` ou `centre_fiscal_ref` est invalide |

Le rattachement fiscal est tenu cohérent par le modèle
([`backend/src/models/contribuable.model.js`](backend/src/models/contribuable.model.js)) :
`id_centre` (table `centres`, colonne portée par le périmètre) et
`centre_fiscal_ref` (référentiel `unitefiscal.json`, format `cle:nom` avec `cle`
valant `centres_fiscaux`, `sre` ou `dge`) décrivent le même centre. Fournir
`id_centre` dérive la référence textuelle — un centre sans équivalent dans le
référentiel, comme `SSIF`, donne une référence nulle ; fournir
`centre_fiscal_ref` seul retrouve le centre correspondant et renseigne
`id_centre` ; fournir les deux laisse `id_centre` l'emporter, puisqu'il est déjà
imposé à un agent centré par `forceCentreOnWrite`. L'existant a été rattrapé par
le script additif
[`backend/migrations/009-centre-fiscal-ref.sql`](backend/migrations/009-centre-fiscal-ref.sql),
qui aligne aussi sur le référentiel l'orthographe de quatre `nom_centre`.
| `GET` | `/api/contribuables/:id/etat` | `id` = `id_contribuable` | `200` — historique des statuts d'activité et de conformité |
| `POST` | `/api/contribuables/:id/etat` | `{ statut_activite, statut_conformite, motif }` | `201` — nouvel enregistrement d'état pour le contribuable |
| `GET` | `/api/contribuables/:id/rapprochements` | `id` = `id_contribuable` | `200` — liste des rapprochements du contribuable |
| `GET` | `/api/contribuables/:id/relances` | `id` = `id_contribuable` | `200` — liste des relances du contribuable |

### Module Déclarations (`/api/declarations`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/declarations` | query `page`, `limit`, `search` (NIF ou raison sociale), `statut`, `annee`, `type_declaration`, `periode` | `200` — liste paginée enrichie du NIF, de la raison sociale, du type et de la période |
| `GET` | `/api/declarations/stats` | — | `200` — `total`, `conformes`, `alertes`, `critiques`, `ca_moyen`, `tva_totale`, `tva_theorique_totale`, `ecart_total`. Pour un `chef_centre` seulement, s'ajoute `tva_theorique_dgi` : le total TVA théorique de toutes les déclarations, hors filtre de centre, agrégé et sans détail |
| `GET` | `/api/declarations/:id` | `id` = `id_declaration` | `200` — déclaration avec informations contribuable et rapprochements ; `404` si introuvable |
| `POST` | `/api/declarations` | `id_contribuable` (entier), `annee` (entier de 2000 à 2100), `type_declaration` (défaut 'TVA', 30 caractères max), `periode` (ex: '2025-01', 7 caractères max), `ca`, `benefice`, `tva_collectee`, `tva_deductible`, `tva_payee` (montants de 0 à 9 999 999 999 999,99) ; `regime_fiscal` (`IS` ou `IR`) | `201` avec `{ declaration, analyse: { tva_theorique, ecart, pourcentage_ecart, statut } }` ; `400` si la validation échoue ; `409` si une déclaration existe déjà pour ce contribuable, cette période et ce type ; `500` sinon |
| `PUT` | `/api/declarations/:id` | corps partiel : `annee`, `type_declaration`, `periode`, `ca`, `benefice`, `tva_collectee`, `tva_deductible`, `tva_payee`, `tva_theorique`, `statut`, dates de notification et `date_limite_reponse`, `prorogation_jours`, `montant_redressement`, `credit_impot`, `montant_impute`, `montant_net_a_payer`, `observations_agent`. `id_contribuable` n'est pas modifiable | `200` — seuls les champs fournis sont écrits ; `400` si une valeur est hors borne ; `404` si introuvable |
| `POST` | `/api/declarations/:id/notification-primitive` | `date_emission` (défaut : maintenant), `prorogation_jours` (défaut 0), `montant_redressement`, `credit_impot`, `observations_agent` | `200` — statut `PRIMITIVE_ENVOYÉE`, `date_limite_reponse` = date d'émission + 30 jours + prorogation ; `404` si introuvable |
| `POST` | `/api/declarations/:id/notification-definitive` | `date_emission` (défaut : maintenant), `montant_valide`, `credit_impot`, `observations_agent` | `200` — statut `DÉFINITIVE_ENVOYÉE`, montants arrêtés et imputation débloquée ; `404` si introuvable |
| `POST` | `/api/declarations/:id/imputer-credit` | `credit_impot`, `montant_a_imputer`, `observations_agent` | `200` — `montant_impute` et `montant_net_a_payer` recalculés ; `400` si le statut n'est pas `DÉFINITIVE_ENVOYÉE` ; `404` si introuvable |

### Module Contrôles (`/api/controles`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/controles/stats` | — | `200` — `{ global: { total, conformes, alertes, critiques, ecart_moyen, ecart_max }, par_type: [ { type, total, ecart_moyen } ] }` |
| `POST` | `/api/controles/:id_declaration/effectuer` | `id_agent` (optionnel) ; calcule la TVA théorique, l'écart et le statut, enregistre le contrôle puis met à jour la déclaration | `200` — `{ controle, declaration, analyse }` ; `500` si la déclaration n'existe pas |
| `GET` | `/api/controles/:id_declaration/historique` | `id_declaration` | `200` — contrôles triés par date décroissante, enrichis du nom et du prénom de l'agent |

### Module Recoupements (`/api/recoupements`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recoupements` | query `page`, `limit`, `search`, `periode`, `source`, `type_operation`, `id_contribuable` | `200` — liste paginée de recoupements |
| `GET` | `/api/recoupements/:id` | `id` = `id_recoupement` | `200` — détail avec données contribuable et rapprochements ; `404` si introuvable |
| `POST` | `/api/recoupements` | `id_contribuable`, `source`, `periode`, `reference`, `type_operation`, `nif_tiers`, `date_operation`, `montant_declare`, `montant_tva`, `montant_ttc`, détails marchandises/achats/services, `ca_declare` (optionnel) | `201` — `{ data, source_utilisee }` avec `somme_recoupee` calculée |
| `PUT` | `/api/recoupements/:id` | champs modifiables du recoupement | `200` ; `404` si introuvable |
| `DELETE` | `/api/recoupements/:id` | `id` = `id_recoupement` | `200` — suppression du recoupement |
| `GET` | `/api/recoupements/:id_contribuable/analyser` | `id_contribuable` | `200` — analyse de cohérence par rapport aux déclarations |
| `GET` | `/api/recoupements/stats/sources` | — | `200` — statistiques agrégées par source |

### Module Droits de communication (`/api/droits-communication`)

Fiches de droit de communication : une demande adressée par un agent à un tiers
(banque, assurance, administration, notaire, fournisseur, client, autre) pour un
contribuable donné. Table `droits_communication`, créée par le script additif
[`backend/migrations/005-droits-communication.sql`](backend/migrations/005-droits-communication.sql).

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/droits-communication` | query `page`, `limit`, `search` (tiers, objet, NIF du tiers ou NIF / raison sociale du contribuable), `statut`, `type_tier`, `id_contribuable` | `200` — liste paginée triée par `date_demande` décroissant, enrichie du contribuable (NIF, raison sociale) et de l'agent instructeur (`agent_nom`) |
| `GET` | `/api/droits-communication/stats/statuts` | query `id_contribuable` (facultative, restreint alors les compteurs à un contribuable) | `200` — effectifs par statut |
| `GET` | `/api/droits-communication/:id` | `id` = `id_droit` | `200` ; `404` si introuvable |
| `POST` | `/api/droits-communication` | `id_contribuable` (entier, obligatoire), `tier` (obligatoire, 255 car. max), `objet` (obligatoire), `date_demande` (ISO 8601, obligatoire) ; `type_tier` (30 car. max, défaut `autre`), `nif_tier` (50 car. max), `date_reponse` (ISO 8601), `statut` (`demande`, `reponse`, `partiel`, `relance`, `sans_suite` ; défaut `demande`), `pieces_demandees`, `documents_recus`, `observations`. L'`id_agent` instructeur est horodaté depuis la session (`req.user.id`) | `201` ; `400` si la validation échoue |
| `PUT` | `/api/droits-communication/:id` | corps partiel, via la liste blanche `allowedFields` du modèle : les champs de constitution du dossier (`tier`, `objet`, `date_demande`) ne sont pas exigés | `200` — seuls les champs fournis sont écrits ; `400` si une valeur est invalide ; `404` si introuvable |
| `DELETE` | `/api/droits-communication/:id` | `id` = `id_droit` | `200` — suppression de la fiche |

`GET /stats/statuts` est déclaré **avant** `GET /:id` dans
[`droit-communication.routes.js`](backend/src/routes/droit-communication.routes.js),
sans quoi le chemin serait absorbé par le paramètre `id`.

### Module Rapprochements (`/api/rapprochements`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/rapprochements` | query `page`, `limit`, `statut`, `type_rapprochement`, `id_declaration`, `id_recoupement`, `id_controle`, `id_contribuable` | `200` — liste paginée avec détails déclaration, recoupement et contrôle |
| `GET` | `/api/rapprochements/stats` | — | `200` — `{ total, par_statut, par_type, score_moyen, ecart_moyen, ecart_total }` |
| `GET` | `/api/rapprochements/:id` | `id` = `id_rapprochement` | `200` — détail complet ; `404` si introuvable |
| `POST` | `/api/rapprochements` | `id_declaration`, `id_recoupement`, `type_rapprochement` (`exact`, `tolerance`, `partiel`, `manuel`), `score` (0 à 100), `montant_declare`, `montant_recoupe`, `statut` (`rapproche`, `a_verifier`, `ecart`, `valide`, `rejete`, `annule`), `motif` | `201` — enregistrement du rapprochement ; `400` si une valeur sort des listes ou des bornes |
| `POST` | `/api/rapprochements/confronter` | `{ id_declaration, id_recoupement, montant_declare?, montant_recoupe?, id_controle?, motif? }` | `201` — confrontation automatique et calcul du score de cohérence |
| `POST` | `/api/rapprochements/auto/:id_contribuable` | query `periode` optionnelle | `200` — confrontation en lot des déclarations et recoupements du contribuable ; un écart significatif est qualifié `partiel` / `ecart`, seules valeurs admises par les contraintes `chk_rapprochements_type` et `chk_rapprochements_statut` |
| `PATCH` | `/api/rapprochements/:id/statut` | `{ statut, motif? }` — `statut` obligatoire, parmi `rapproche`, `a_verifier`, `ecart`, `valide`, `rejete`, `annule` | `200` — statut mis à jour ; `400` si `statut` manque ou sort de la liste ; `404` si introuvable |
| `PUT` | `/api/rapprochements/:id` | champs modifiables, mêmes listes de valeurs que `POST` | `200` ; `400` si une valeur est invalide ; `404` si introuvable |
| `DELETE` | `/api/rapprochements/:id` | `id` = `id_rapprochement` | `200` ; `404` si introuvable |

### Module État Contribuable (`/api/etat-contribuable`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/etat-contribuable` | query `page`, `limit`, `statut_activite`, `statut_conformite`, `id_contribuable` | `200` — liste des états |
| `GET` | `/api/etat-contribuable/stats` | — | `200` — statistiques par statut d'activité et de conformité |
| `GET` | `/api/etat-contribuable/contribuable/:id_contribuable` | `id_contribuable` | `200` — historique des états du contribuable |
| `GET` | `/api/etat-contribuable/contribuable/:id_contribuable/latest` | `id_contribuable` | `200` — dernier état en vigueur |
| `GET` | `/api/etat-contribuable/:id` | `id` = `id_etat` | `200` ; `404` si introuvable |
| `POST` | `/api/etat-contribuable` | `{ id_contribuable, statut_activite, statut_conformite, motif }` — `statut_activite` parmi `Actif`, `En sommeil`, `En cessation`, `Radié` ; `statut_conformite` parmi `En règle`, `Défaillant`, `Sous contrôle`, `Bloqué` | `201` — état enregistré ; `400` si un statut sort de ces listes |
| `PUT` | `/api/etat-contribuable/:id` | `{ statut_activite, statut_conformite, motif }`, mêmes listes | `200` ; `400` si un statut est invalide ; `404` si introuvable |
| `DELETE` | `/api/etat-contribuable/:id` | `id` = `id_etat` | `200` ; `404` si introuvable |

### Module Relances (`/api/relances`)

`type_relance` accepte `rappel1`, `rappel2`, `mise_en_demeure` et
`demande_eclaircissement`. Ce quatrième type — la demande d'éclaircissements et
de justifications du CPF Art. V-17 — a été ajouté par le script additif
[`backend/migrations/007-demande-eclaircissement.sql`](backend/migrations/007-demande-eclaircissement.sql)
(nouvelle contrainte `relances_type_relance_check`) ; il n'a ajouté aucune
colonne, la demande réutilisant `observations` pour les points posés et
`date_emission` pour son horodatage.

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/relances` | query `page`, `limit`, `search`, `statut`, `type_relance`, `annee`, `id_contribuable` | `200` — liste paginée des relances |
| `GET` | `/api/relances/stats` | — | `200` — statistiques globales des relances et montants dus |
| `GET` | `/api/relances/contribuable/:id_contribuable` | `id_contribuable` | `200` — relances du contribuable |
| `GET` | `/api/relances/:id` | `id` = `id_relance` | `200` ; `404` si introuvable |
| `POST` | `/api/relances` | `{ id_contribuable, id_declaration?, type_relance, annee, montant_du?, jours_retard?, date_emission?, date_regularisation?, document_url?, observations?, statut? }` — `type_relance` parmi `rappel1`, `rappel2`, `mise_en_demeure`, `demande_eclaircissement` ; `statut` parmi `emise`, `regularisee`, `annulee` (défaut `emise`) ; `annee` de 2000 à 2100 ; `montant_du` de 0 à 9 999 999 999 999,99 ; `jours_retard` de 0 à 36500 | `201` — relance créée (`id_agent` horodaté depuis `req.user.id`) ; `400` si un champ manque ou sort des listes et bornes |
| `PUT` | `/api/relances/:id` | corps partiel : `statut`, `type_relance`, `montant_du`, `jours_retard`, `date_regularisation`, `document_url`, `observations`, `id_agent` — les champs de création ne sont pas exigés | `200` — seuls les champs fournis sont écrits ; `400` si une valeur sort des listes ou des bornes ; `404` si introuvable |
| `DELETE` | `/api/relances/:id` | `id` = `id_relance` | `200` ; `404` si introuvable |

`GET` et `POST /api/relances` sont appelés par la fiche de déclaration
`/suivi/:id` : `GET ?id_contribuable&type_relance=demande_eclaircissement` au
chargement pour savoir si une demande a déjà été émise, `POST` pour en émettre
une nouvelle. `POST` passe par `requireContribuableAccess('id_contribuable', { source: 'body' })`,
donc seul un rôle sans périmètre centré (admin) ou rattaché au centre du
contribuable peut émettre la demande.

### Module Centres (`/api/centres`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/centres` | — | `200` — centres triés par nom, avec `_count.contribuables` ; un agent centré ne reçoit que son propre centre |
| `GET` | `/api/centres/:id` | `id` = `id_centre` | `200` ; `403` pour un agent centré qui demande un autre centre ; `404` si introuvable |
| `POST` | `/api/centres` | `nom_centre`, `numero_centre`, `type_centre` (obligatoires) ; `email_centre`, `telephone_centre` (optionnels) | `201` ; `400` si un champ obligatoire manque ou si `type_centre` est invalide ; `409` si `numero_centre` existe déjà ; réservé `admin` (`403`) |
| `PUT` | `/api/centres/:id` | mêmes champs, tous optionnels | `200` ; `400` si `type_centre` est invalide ; `404` ; `409` si `numero_centre` existe déjà ; réservé `admin` (`403`) |
| `DELETE` | `/api/centres/:id` | `id` = `id_centre` | `200` — les contribuables rattachés conservent leur ligne et voient `id_centre` passer à `NULL`, comme les agents (`404` si introuvable) ; `400` pour le centre `SSIF`, qui est l'affiliation des administrateurs et dont la suppression remettrait tous leurs `id_centre` à `NULL` en silence (`ON DELETE SET NULL`) ; réservé `admin` (`403`) |

---

## 3. Client API frontend

[`frontend/src/api/api.js`](frontend/src/api/api.js) crée une instance Axios
unique :

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
});
```

L'authentification ne repose sur aucun jeton côté client : il n'y a ni
`localStorage`, ni en-tête `Authorization: Bearer`. Le cookie `fiscal_session`
est `httpOnly`, donc invisible au JavaScript, et c'est `withCredentials: true`
qui le fait circuler. Les appels de connexion, de vérification de session et de
déconnexion utilisent directement l'instance par défaut `api` (aucune fonction
dédiée n'est exportée) :

| Appel | Endpoint | Utilisé par |
| :--- | :--- | :--- |
| `api.post('/auth/register', { nom, prenom, email, password })` | `POST /api/auth/register` | [`backofficeadmin/auth/signup.jsx`](frontend/src/backofficeadmin/auth/signup.jsx) |
| `api.post('/auth/login', { email, password })` | `POST /api/auth/login` | [`backofficeadmin/auth/signin.jsx`](frontend/src/backofficeadmin/auth/signin.jsx) |
| `api.post('/auth/reset-request', { email })` | `POST /api/auth/reset-request` | page « Mot de passe oublié » [`backofficeadmin/auth/mot-de-passe-oublie.jsx`](frontend/src/backofficeadmin/auth/mot-de-passe-oublie.jsx) (`/mot-de-passe-oublie`) |
| `api.get('/auth/me')` | `GET /api/auth/me` | [`App.jsx`](frontend/src/App.jsx) au montage |
| `api.post('/auth/logout')` | `POST /api/auth/logout` | bouton « Se déconnecter » du profil de [`Header.jsx`](frontend/src/components/common/Header.jsx) ([`UserProfile.jsx`](frontend/src/components/common/UserProfile.jsx)), câblé dans `App.jsx` |
| `changeOwnPassword({ password_actuel, password_nouveau, password_confirmation })` | `POST /api/auth/change-password` | modale « 🔑 Changer mon mot de passe » de [`UserProfile.jsx`](frontend/src/components/common/UserProfile.jsx) |

### Fonctions exportées

Le détail fonction par fonction est dans
[`frontend/src/api/README.md`](frontend/src/api/README.md).

| Groupe | Fonctions | Endpoints couverts |
| :--- | :--- | :--- |
| Contribuables | `getContribuables`, `getContribuableById`, `getContribuableByNif`, `createContribuable` | `GET/POST /api/contribuables`, `GET /api/contribuables/:id` |
| Déclarations | `getDeclarations`, `getDeclarationById`, `getDeclarationStats`, `createDeclaration`, `updateDeclaration` | `GET/POST /api/declarations`, `GET/PUT /api/declarations/:id`, `GET /api/declarations/stats` |
| Procédure contradictoire | `emettreNotificationPrimitive`, `emettreNotificationDefinitive`, `imputerCreditImpot` | `POST /api/declarations/:id/notification-primitive`, `…/notification-definitive`, `…/imputer-credit` |
| Demande d'éclaircissements | `getRelances`, `createRelance` | `GET /api/relances?id_contribuable&type_relance=demande_eclaircissement`, `POST /api/relances` |
| Recoupements | `getRecoupements`, `getRecoupementById`, `createRecoupement`, `updateRecoupement`, `deleteRecoupement`, `getRecoupementsByContribuable`, `getRecoupementSourceStats` | `GET/POST /api/recoupements`, `GET/PUT/DELETE /api/recoupements/:id`, `GET /api/recoupements/:id_contribuable/analyser`, `GET /api/recoupements/stats/sources` |
| Droits de communication | `getDroitsCommunication`, `getDroitCommunicationById`, `createDroitCommunication`, `updateDroitCommunication`, `deleteDroitCommunication` | `GET/POST /api/droits-communication`, `GET/PUT/DELETE /api/droits-communication/:id` |
| Rapprochements | `getRapprochements`, `getRapprochementById`, `getRapprochementStats`, `createRapprochement`, `confronterRapprochement`, `autoRapprocherContribuable`, `updateRapprochementStatut`, `updateRapprochement`, `deleteRapprochement` | `GET/POST /api/rapprochements`, `GET /api/rapprochements/stats`, `POST /api/rapprochements/confronter`, `POST /api/rapprochements/auto/:id_contribuable`, `GET/PUT/DELETE /api/rapprochements/:id`, `PATCH /api/rapprochements/:id/statut` |
| État contribuable | `getEtatsContribuable`, `getHistoriqueEtatContribuable`, `getDernierEtatContribuable`, `createEtatContribuable`, `getEtatStats` | `GET /api/etat-contribuable`, `GET /api/etat-contribuable/stats`, `GET /api/etat-contribuable/contribuable/:id/latest`, `GET/POST /api/contribuables/:id/etat` |
| Relances | `getRelances`, `getRelanceById`, `getRelancesByContribuable`, `createRelance`, `updateRelance`, `getRelanceStats` | `GET/POST /api/relances`, `GET/PUT /api/relances/:id`, `GET /api/relances/stats`, `GET /api/contribuables/:id/relances` |
| Contrôles | `effectuerControle`, `getControlesDeclaration` | `POST /api/controles/:id_declaration/effectuer`, `GET /api/controles/:id_declaration/historique` |
| Centres | `getCentres`, `getCentreById`, `createCentre`, `updateCentre`, `deleteCentre` | `GET/POST /api/centres`, `GET/PUT/DELETE /api/centres/:id` |
| Agents (admin) | `getAgents`, `getHistoriqueAgents`, `updateAgentStatut`, `updateAgentRole`, `updateAgentCentre`, `updateAgentIdentite`, `resetAgentPassword`, `deleteAgent` | `GET /api/agents`, `GET /api/agents/historique`, `PATCH /api/agents/:id/statut`, `…/role`, `…/centre`, `…/identite`, `…/password`, `DELETE /api/agents/:id` |
| Utilitaire | `getErrorMessage` | *(local)* extrait `error.response.data.message`, sinon `error.message`, sinon un message réseau générique |

Sauf `deleteCentre`, `deleteAgent`, `deleteRecoupement` et
`deleteDroitCommunication`, qui renvoient la réponse Axios complète, toutes ces
fonctions renvoient `res.data.data`, c'est-à-dire le contenu utile de
l'enveloppe `{ success, data }` de l'API.

---

## 4. Écarts connus entre le frontend et l'API

- La page `/relance` et l'onglet « Relances » d'une fiche contribuable
  fonctionnent à partir des déclarations et des contribuables. L'API
  `/api/relances` est maintenant appelée par la fiche de déclaration
  `/suivi/:id` pour la demande d'éclaircissements (`GET` + `POST`), mais la
  fiche contribuable écrit toujours son historique de relances dans
  `localStorage` (`relance_historique`) au lieu d'y persister ses rappels.
- **VSP / CSP n'est stocké nulle part.** La vue Statistique du registre
  (`/contribuables?vue=statistique`) déduit la procédure de contrôle côté
  frontend, dans
  [`statistiques.utils.js`](frontend/src/frontofficeagent/contribuables/utils/statistiques.utils.js) :
  une déclaration est VSP si elle porte une date de notification (primitive ou
  définitive) ou un `montant_redressement` supérieur à 0, sinon CSP. La
  ventilation IS / IR / TVA est elle aussi dérivée du champ `regime_fiscal` du
  contribuable (`RS`, `RNS` et valeur absente tombent en `TVA`). Ces deux règles
  sont volontairement frontend : rien dans le schéma ne distingue aujourd'hui un
  contrôle sur pièces d'une vérification sur place, et la table `controles` est
  vide.
- `GET /api/droits-communication/stats/statuts` n'est encapsulé par aucune
  fonction du client ; seule la liste est consommée par
  `DroitCommunicationPanel`.
- Les corps de `POST /api/declarations` et `POST /api/recoupements` attendent
  `id_contribuable` (et non `id_entreprise`, nom des colonnes avant la migration
  `001-rename-contribuables.sql`).
- Le régime fiscal n'est pas persisté sur `declarations` : les contrôles
  ultérieurs ne peuvent pas le relire et retombent sur le taux par défaut de
  `FiscalService.calculerTVATheorique`.
- Aucune fonction du client n'appelle `PUT /api/contribuables/:id` : la mise à
  jour d'un contribuable, y compris le changement de `id_centre`, n'est
  possible que directement par l'API. Les deux chemins de création du
  frontend ne renseignent pas la même colonne de rattachement : le formulaire
  d'immatriculation
  ([`FormInformation.jsx`](frontend/src/frontofficeagent/entreprises/FormInformation.jsx))
  envoie `centre_fiscal_ref` (référence `cle:nom` du référentiel
  `unitefiscal.json`), tandis que l'import Excel
  ([`ExcelImportModal.jsx`](frontend/src/components/forms/ExcelImportModal.jsx))
  envoie `id_centre`, retrouvé par nom de centre. Le backend dérive la colonne
  manquante dans les deux cas, de sorte que le périmètre des agents et les
  pages « unité fiscale » voient le même rattachement.
