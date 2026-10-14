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
  [`users/signin.jsx`](frontend/src/users/signin.jsx) si l'agent n'est pas
  authentifié, sinon elle redirige vers `/acceuil` ;
- les autres pages sont regroupées dans une route de layout sans chemin, qui
  rend [`Header.jsx`](frontend/src/components/common/Header.jsx) puis
  `<main><Outlet /></main>` lorsque la session est valide, et redirige vers `/`
  sinon ;
- toute URL inconnue correspond au motif `*` et redirige vers `/`.

| Route URL | Composant page | Accès | Rôle |
| :--- | :--- | :--- | :--- |
| `/` | `users/signin.jsx` | public | Écran de connexion ; redirige vers `/acceuil` si la session est déjà valide, ou vers `/admin` après connexion lorsque l'agent a le rôle `admin` |
| `/signin` | — | public | Redirection immédiate vers `/` |
| `/signup` | `users/signup.jsx` | public | Demande de création d'un compte agent (nom, prénom, e-mail, mot de passe et confirmation) ; enregistre la demande sans connecter l'utilisateur |
| `/admin` | `users/acceuiladmin.jsx` | protégé — administrateurs | **Accueil de l'espace admin** : tableau de bord des comptes agents (effectifs par statut, répartition, derniers comptes créés, accès rapides) |
| `/admin/utilisateurs` | `users/admin.jsx` | protégé — administrateurs | Gestion des comptes : activation des demandes, blocage / réactivation, rôles, mots de passe, suppression. Pour un admin, le `Header` ne présente que ces deux modules (et le logo renvoie vers `/admin`) |
| `/acceuil` | `Accueil.jsx` | protégé | Tableau de bord d'accueil et indicateurs de synthèse |
| `/collecte` | `Collecte.jsx` | protégé | Simulateur de collecte TVA ; l'onglet actif est porté par `currentModule` (`sales`, `theoretical`, `reconciliation`, `declaration`) |
| `/entreprises/nouveau` | `PhaseClassement.jsx` | protégé | Étape 1 de l'immatriculation : choix de la structure compétente |
| `/entreprises/nouveau/form` | `FormInformation.jsx` | protégé | Étape 2 de l'immatriculation : formulaire de création d'un contribuable (`?structure=…`) |
| `/decisionnel` | `TableauDecisionnel.jsx` | protégé | Tableau de bord de pilotage (KPI et graphiques) |
| `/register` | `Register.jsx` | protégé | Registre fiscal par centre |
| `/centres/:id` | `CentreDetail.jsx` | protégé | Fiche d'un centre et de ses contribuables |
| `/suivi` | `SuiviFiscal.jsx` | protégé | Suivi et recherche des déclarations |
| `/suivi/:id` | `DeclarationDetail.jsx` | protégé | Fiche détaillée d'une déclaration et actes de procédure contradictoire |
| `/contribuables` | `Contribuables.jsx` | protégé | Registre des contribuables |
| `/contribuables/:id` | `ContribuableDetail.jsx` | protégé | Fiche détaillée d'un contribuable |
| `/contribuables/:id/classification` | `ContribuableDetail.jsx` | protégé | Même fiche, onglet classification |
| `/contribuables/:id/declarations` | `ContribuableDetail.jsx` | protégé | Même fiche, onglet déclarations |
| `/contribuables/:id/relances` | `ContribuableDetail.jsx` | protégé | Même fiche, onglet relances (données locales, aucune API de relance) |
| `/relance` | `RelanceFiscale.jsx` | protégé | Relance fiscale et recouvrement, alimentée par les déclarations et les contribuables |
| `*` | — | public | Redirection vers `/` |

Remarques :

- l'orthographe `/acceuil` (au lieu de `/accueil`) est celle du code et doit
  être conservée dans les liens ;
- les pages sont réexportées par [`pages/index.jsx`](frontend/src/pages/index.jsx) ;
- [`users/login.jsx`](frontend/src/users/login.jsx) existe mais n'est importé
  par aucune route : l'écran de connexion réel est `users/signin.jsx` ;
- l'écran de connexion (`/`, composant `Signin`) renvoie vers `/signup` par un
  lien `Link`, et `signup.jsx` renvoie vers `/` (« Déjà inscrit ? Se
  connecter ») ;
- « protégé » signifie que l'accès direct à l'URL sans session valide redirige
  vers `/` ; les pages protégées elles-mêmes ne vérifient pas les rôles, sauf
  `/admin`, qui n'est proposée qu'aux administrateurs et dont les appels API
  sont de toute façon refusés (`403`) pour les autres rôles ;
- **redirection des administrateurs** : après une connexion réussie, un agent
  dont le rôle est `admin` est envoyé directement sur `/admin`
  (`getLandingPath` de [`users/signin.jsx`](frontend/src/users/signin.jsx)) ;
  les autres rôles arrivent sur `/acceuil`. Le rôle provenant de la réponse de
  `POST /api/auth/login`, il n'y a aucun contournement d'authentification ;
- **espace administrateur** : pour un agent dont le rôle est `admin`, le
  `Header` ne propose que « Accueil » (`/admin`, le tableau de bord des comptes)
  et « Utilisateurs » (`/admin/utilisateurs`), et son logo renvoie vers
  `/admin` — la navigation fiscale est réservée aux autres rôles. Les URL
  fiscales restent techniquement accessibles à un admin (aucun blocage de
  route), mais elles ne lui sont plus proposées.

---

## 2. Routes backend (API REST Express)

Le backend écoute par défaut sur le port `5000` (`http://localhost:5000`,
défini par `PORT` dans `backend/.env`). En développement, Vite relaie les
requêtes `/api` vers ce serveur via
[`frontend/vite.config.js`](frontend/vite.config.js).

### Authentification et routes publiques

`backend/src/app.js` monte dix domaines d'API :

```text
/api/auth              (monté avant le middleware d'authentification)
/api/contribuables
/api/declarations
/api/controles
/api/recoupements
/api/rapprochements    (confrontation déclarations / recoupements)
/api/etat-contribuable (suivi de statut et conformité)
/api/relances          (relances et recouvrement)
/api/centres
/api/agents            (réservé au rôle admin, via le middleware requireAdmin)
```

La ligne `app.use('/api', authenticate)` protège **toutes** les routes `/api`
sauf celles de `/api/auth`. Sans cookie `fiscal_session` valide, une route
protégée répond :

```json
{ "success": false, "message": "Authentification requise" }
```

(code `401`). Un cookie présent mais expiré ou signé avec un autre
`JWT_SECRET` répond `401` avec le message « Session invalide ou expirée ».

Routes publiques : `GET /health`, l'interface `/api-docs`, la spécification
`/api-docs/swagger.json`, les fichiers statiques `/uploads`, ainsi que
`POST /api/auth/register`, `POST /api/auth/login` et `POST /api/auth/logout`.
`GET /api/auth/me` applique le middleware dans son propre routeur et exige donc
le cookie.

Le cookie `fiscal_session` est `httpOnly`, `sameSite=lax`, `secure` lorsque
`NODE_ENV=production`, et sa durée est de 8 heures, comme le jeton JWT
(`expiresIn: '8h'`).

### Santé et documentation

| Méthode | Endpoint | Accès | Réponse |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | public | `200` — `{ "status": "OK", "message": "API de contrôle fiscal en ligne", "version": "1.0.0" }` |
| `GET` | `/api-docs` | public | `200` — interface Swagger UI |
| `GET` | `/api-docs/swagger.json` | public | `200` — spécification OpenAPI 3.0.3 définie dans [`backend/src/config/swagger.js`](backend/src/config/swagger.js) |

### Module Auth (`/api/auth`)

| Méthode | Endpoint | Accès | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | public | `nom`, `prenom`, `email`, `password` (chaînes, obligatoires ; mot de passe de 4 caractères minimum) | `400` si les champs ou formats sont invalides ; `409` si l'e-mail existe déjà ; `201` avec une demande enregistrée et un compte `agent` au statut `en_attente` |
| `POST` | `/api/auth/login` | public | `email`, `password` (chaînes, obligatoires) | `400` si l'un manque ; `401` si les identifiants sont incorrects ou si le compte n'est pas `actif` ; `200` avec `{ success: true, user: { id, email, nom, prenom, role } }` et le cookie `fiscal_session` |
| `GET` | `/api/auth/me` | authentifié | — | `200` — `{ success: true, user }` ; `401` sans session valide |
| `POST` | `/api/auth/logout` | public | — | `200` — `{ success: true }` et suppression du cookie |

### Module Agents (`/api/agents`) — administration des comptes

Ces routes passent par `authenticate` (cookie de session) **puis** par
`requireAdmin` : un agent dont le rôle n'est pas `admin` reçoit `403`.

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/agents` | query facultatives `search` (nom, prénom ou e-mail), `statut` (`actif`, `en_attente`, `inactif`), `role` (`agent`, `admin`) | `200` — `{ success: true, data: [...] }`, toujours sans `mot_de_passe` |
| `PATCH` | `/api/agents/:id/statut` | `{ statut }` | `200` ; `400` si le statut est invalide, s'il s'agit de son propre compte ou du dernier administrateur actif ; `404` si introuvable |
| `PATCH` | `/api/agents/:id/role` | `{ role }` | `200` ; `400` (rôle invalide, son propre compte, dernier administrateur actif) ; `404` |
| `PATCH` | `/api/agents/:id/password` | `{ password }` (4 caractères minimum, 72 octets maximum) | `200` — nouveau mot de passe haché (bcrypt, 12 tours) ; `400` ; `404` |
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
| `GET` | `/api/contribuables/:id/etat` | `id` = `id_contribuable` | `200` — historique des statuts d'activité et de conformité |
| `POST` | `/api/contribuables/:id/etat` | `{ statut_activite, statut_conformite, motif }` | `201` — nouvel enregistrement d'état pour le contribuable |
| `GET` | `/api/contribuables/:id/rapprochements` | `id` = `id_contribuable` | `200` — liste des rapprochements du contribuable |
| `GET` | `/api/contribuables/:id/relances` | `id` = `id_contribuable` | `200` — liste des relances du contribuable |

### Module Déclarations (`/api/declarations`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/declarations` | query `page`, `limit`, `search` (NIF ou raison sociale), `statut`, `annee`, `type_declaration`, `periode` | `200` — liste paginée enrichie du NIF, de la raison sociale, du type et de la période |
| `GET` | `/api/declarations/stats` | — | `200` — `total`, `conformes`, `alertes`, `critiques`, `ca_moyen`, `tva_totale`, `tva_theorique_totale`, `ecart_total` |
| `GET` | `/api/declarations/:id` | `id` = `id_declaration` | `200` — déclaration avec informations contribuable et rapprochements ; `404` si introuvable |
| `POST` | `/api/declarations` | `id_contribuable` (entier), `annee` (entier), `type_declaration` (défaut 'TVA'), `periode` (ex: '2025-01'), `ca`, `benefice`, `tva_collectee`, `tva_deductible`, `tva_payee` ; `regime_fiscal` (`IS` ou `IR`) | `201` avec `{ declaration, analyse: { tva_theorique, ecart, pourcentage_ecart, statut } }` ; `400` si validation échoue ; `500` sinon |
| `PUT` | `/api/declarations/:id` | champs modifiables de la déclaration | `200` ; `404` si introuvable |
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

### Module Rapprochements (`/api/rapprochements`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/rapprochements` | query `page`, `limit`, `statut`, `type_rapprochement`, `id_declaration`, `id_recoupement`, `id_controle`, `id_contribuable` | `200` — liste paginée avec détails déclaration, recoupement et contrôle |
| `GET` | `/api/rapprochements/stats` | — | `200` — `{ total, par_statut, par_type, score_moyen, ecart_moyen, ecart_total }` |
| `GET` | `/api/rapprochements/:id` | `id` = `id_rapprochement` | `200` — détail complet ; `404` si introuvable |
| `POST` | `/api/rapprochements` | `id_declaration`, `id_recoupement`, `type_rapprochement`, `score`, `montant_declare`, `montant_recoupe`, `statut`, `motif` | `201` — enregistrement du rapprochement |
| `POST` | `/api/rapprochements/confronter` | `{ id_declaration, id_recoupement, montant_declare?, montant_recoupe?, id_controle?, motif? }` | `201` — confrontation automatique et calcul du score de cohérence |
| `POST` | `/api/rapprochements/auto/:id_contribuable` | query `periode` optionnelle | `200` — confrontation en lot des déclarations et recoupements du contribuable |
| `PATCH` | `/api/rapprochements/:id/statut` | `{ statut, motif }` (`valide`, `a_verifier`, `anomalie`, `rejete`) | `200` — statut mis à jour |
| `PUT` | `/api/rapprochements/:id` | champs modifiables | `200` ; `404` si introuvable |
| `DELETE` | `/api/rapprochements/:id` | `id` = `id_rapprochement` | `200` ; `404` si introuvable |

### Module État Contribuable (`/api/etat-contribuable`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/etat-contribuable` | query `page`, `limit`, `statut_activite`, `statut_conformite`, `id_contribuable` | `200` — liste des états |
| `GET` | `/api/etat-contribuable/stats` | — | `200` — statistiques par statut d'activité et de conformité |
| `GET` | `/api/etat-contribuable/contribuable/:id_contribuable` | `id_contribuable` | `200` — historique des états du contribuable |
| `GET` | `/api/etat-contribuable/contribuable/:id_contribuable/latest` | `id_contribuable` | `200` — dernier état en vigueur |
| `GET` | `/api/etat-contribuable/:id` | `id` = `id_etat` | `200` ; `404` si introuvable |
| `POST` | `/api/etat-contribuable` | `{ id_contribuable, statut_activite, statut_conformite, motif }` | `201` — état enregistré |
| `PUT` | `/api/etat-contribuable/:id` | `{ statut_activite, statut_conformite, motif }` | `200` ; `404` si introuvable |
| `DELETE` | `/api/etat-contribuable/:id` | `id` = `id_etat` | `200` ; `404` si introuvable |

### Module Relances (`/api/relances`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/relances` | query `page`, `limit`, `search`, `statut`, `type_relance`, `annee`, `id_contribuable` | `200` — liste paginée des relances |
| `GET` | `/api/relances/stats` | — | `200` — statistiques globales des relances et montants dus |
| `GET` | `/api/relances/contribuable/:id_contribuable` | `id_contribuable` | `200` — relances du contribuable |
| `GET` | `/api/relances/:id` | `id` = `id_relance` | `200` ; `404` si introuvable |
| `POST` | `/api/relances` | `{ id_contribuable, id_declaration?, type_relance, annee, montant_du, jours_retard?, observations? }` | `201` — relance créée |
| `PUT` | `/api/relances/:id` | `{ statut, montant_du, jours_retard, date_regularisation, document_url, observations }` | `200` ; `404` si introuvable |
| `DELETE` | `/api/relances/:id` | `id` = `id_relance` | `200` ; `404` si introuvable |

### Module Centres (`/api/centres`)

| Méthode | Endpoint | Corps / paramètres | Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/centres` | — | `200` — centres triés par nom, avec `_count.contribuables` |
| `GET` | `/api/centres/:id` | `id` = `id_centre` | `200` ; `404` si introuvable |
| `POST` | `/api/centres` | `nom_centre`, `numero_centre`, `type_centre` (obligatoires) ; `email_centre`, `telephone_centre` (optionnels) | `201` ; `400` si un champ obligatoire manque ou si `type_centre` est invalide ; `409` si `numero_centre` existe déjà |
| `PUT` | `/api/centres/:id` | mêmes champs, tous optionnels | `200` ; `400` si `type_centre` est invalide ; `404` ; `409` si `numero_centre` existe déjà |
| `DELETE` | `/api/centres/:id` | `id` = `id_centre` | `200` — les contribuables rattachés conservent leur ligne et voient `id_centre` passer à `NULL` ; `404` si introuvable |

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
| `api.post('/auth/register', { nom, prenom, email, password })` | `POST /api/auth/register` | [`users/signup.jsx`](frontend/src/users/signup.jsx) |
| `api.post('/auth/login', { email, password })` | `POST /api/auth/login` | [`users/signin.jsx`](frontend/src/users/signin.jsx) |
| `api.get('/auth/me')` | `GET /api/auth/me` | [`App.jsx`](frontend/src/App.jsx) au montage |
| `api.post('/auth/logout')` | `POST /api/auth/logout` | bouton de déconnexion de [`Header.jsx`](frontend/src/components/common/Header.jsx), câblé dans `App.jsx` |

### Fonctions exportées

| Fonction JS | Méthode et endpoint backend | Rôle |
| :--- | :--- | :--- |
| `getDeclarations(params)` | `GET /api/declarations` | Liste des déclarations (`limit: 250` par défaut, surchargeable) |
| `getDeclarationById(id)` | `GET /api/declarations/:id` | Fiche d'une déclaration |
| `getDeclarationStats()` | `GET /api/declarations/stats` | Agrégats pour le tableau décisionnel |
| `createDeclaration(payload)` | `POST /api/declarations` | Enregistrement d'une déclaration |
| `getContribuables(params)` | `GET /api/contribuables` | Liste paginée des contribuables |
| `getContribuableById(id)` | `GET /api/contribuables/:id` | Fiche d'un contribuable |
| `getContribuableByNif(nif)` | `GET /api/contribuables?search=<nif>&limit=20` | Recherche par NIF, puis filtrage exact côté client |
| `createContribuable(payload)` | `POST /api/contribuables` | Création d'un contribuable |
| `getCentres()` | `GET /api/centres` | Liste des centres |
| `getCentreById(id)` | `GET /api/centres/:id` | Fiche d'un centre |
| `createCentre(payload)` | `POST /api/centres` | Création d'un centre |
| `updateCentre(id, payload)` | `PUT /api/centres/:id` | Mise à jour d'un centre |
| `deleteCentre(id)` | `DELETE /api/centres/:id` | Suppression d'un centre (renvoie la réponse Axios complète) |
| `getAgents(params)` | `GET /api/agents` | Liste des comptes agents (réservé aux administrateurs) |
| `updateAgentStatut(id, statut)` | `PATCH /api/agents/:id/statut` | Active ou désactive un compte |
| `updateAgentRole(id, role)` | `PATCH /api/agents/:id/role` | Change le rôle d'un compte |
| `resetAgentPassword(id, password)` | `PATCH /api/agents/:id/password` | Réinitialise le mot de passe d'un compte |
| `deleteAgent(id)` | `DELETE /api/agents/:id` | Supprime un compte (renvoie la réponse Axios complète) |
| `createRecoupement(payload)` | `POST /api/recoupements` | Enregistrement d'un recoupement |
| `getRecoupementsByContribuable(id)` | `GET /api/recoupements/:id_contribuable/analyser` | Recoupements et analyse de cohérence |
| `effectuerControle(idDeclaration, payload)` | `POST /api/controles/:id_declaration/effectuer` | Déclenchement d'un contrôle fiscal |
| `getControlesDeclaration(idDeclaration)` | `GET /api/controles/:id_declaration/historique` | Historique des contrôles |
| `emettreNotificationPrimitive(id, payload)` | `POST /api/declarations/:id/notification-primitive` | Émission de la notification primitive |
| `emettreNotificationDefinitive(id, payload)` | `POST /api/declarations/:id/notification-definitive` | Émission de la notification définitive |
| `imputerCreditImpot(id, payload)` | `POST /api/declarations/:id/imputer-credit` | Imputation du crédit d'impôt |
| `getErrorMessage(error)` | *(utilitaire local)* | Extrait `error.response.data.message`, sinon `error.message`, sinon un message réseau générique |

Sauf `deleteCentre` et `deleteAgent`, qui renvoient la réponse Axios complète,
toutes ces fonctions renvoient `res.data.data`, c'est-à-dire le contenu utile de
l'enveloppe `{ success, data }` de l'API.

---

## 4. Écarts connus entre le frontend et l'API

- `POST /api/controles/:id_declaration/effectuer` se termine actuellement en
  `500` même quand tout se passe bien : `ControleService.effectuerControle`
  enregistre d'abord le contrôle (`ControleModel.create`), puis appelle
  `DeclarationModel.update`, qui lève un `ReferenceError` parce que la variable
  `updateData` n'y est jamais déclarée (contrairement aux autres modèles de
  `backend/src/models/`). Le contrôle est donc bien écrit en base, mais la
  déclaration n'est jamais mise à jour (ni `statut`, ni `tva_theorique`) et
  l'API répond `500` avec `message: "Erreur lors du contrôle"` et
  `error: "updateData is not defined"`. La route reste documentée ci-dessus
  telle qu'elle est écrite.
- La page `/relance` et l'onglet « relances » d'une fiche contribuable
  fonctionnent à partir des déclarations et des contribuables : aucune API de
  relance n'existe côté backend, alors que la table `relances` est présente en
  base.
- Les corps de `POST /api/declarations` et `POST /api/recoupements` attendent
  `id_contribuable` (et non `id_entreprise`, nom des colonnes avant la migration
  `001-rename-contribuables.sql`).
- Le régime fiscal n'est pas persisté sur `declarations` : les contrôles
  ultérieurs ne peuvent pas le relire et retombent sur le taux par défaut de
  `FiscalService.calculerTVATheorique`.
- Aucune fonction du client n'appelle `PUT /api/contribuables/:id` : la mise à
  jour d'un contribuable, y compris le changement de `id_centre`, n'est
  possible que directement par l'API. Le rattachement à un centre passe par le
  champ `id_centre` du formulaire d'immatriculation
  ([`FormInformation.jsx`](frontend/src/pages/entreprises/FormInformation.jsx)),
  qui utilise `POST /api/contribuables`.
