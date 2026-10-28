# Source frontend

Point d'entrée de l'interface React (React 19 + Vite, routage `react-router-dom` v7, client HTTP `axios`).

## Fichiers racine

* [`main.jsx`](main.jsx) : point de montage. Enveloppe `<App />` dans `StrictMode` et `BrowserRouter`, puis monte le tout sur l'élément `#root` de `index.html`. Importe [`index.css`](index.css).
* [`App.jsx`](App.jsx) : composant racine. Vérifie la session au démarrage, déclare toutes les routes, gère le thème clair / sombre et la déconnexion. Importe [`App.css`](App.css).
* [`index.css`](index.css) : feuille d'entrée Tailwind v4, réduite à `@import "tailwindcss";`.
* [`App.css`](App.css) : feuille de styles globale de l'application (mise en page, thème sombre, formulaires, graphiques, document de notification). Les couleurs sont définies par des jetons CSS dans `:root` (`--surface`, `--card`, `--border`, `--text`, `--brand`, …) et redéfinis par `.dark-theme` ; `--panel-bg`, `--card-bg`, `--border-color` et `--text-color` sont les alias consommés par les styles en ligne du backoffice.

## Comportements portés par `App.jsx`

* Contrôle de session : `api.get('/auth/me')` au montage. En attente, un message « Vérification de la session... » est affiché ; en cas d'échec, l'utilisateur est redirigé vers la page de connexion. Aucune vérification n'est lancée sur une URL `/espace-contribuable/…` : le portail du contribuable est hors session agent, et `isCheckingSession` en découle (aucun `setState` dans l'effet).
* Thème : l'état `isDarkMode` est initialisé depuis `localStorage['tva-ssif-theme']` et la classe `dark-theme` est appliquée sur `.app-shell` ; toute bascule est réécrite dans `localStorage`.
* Déconnexion : `api.post('/auth/logout')`, puis retour sur `/`. L'action est déclenchée par le bouton « Se déconnecter » du profil affiché dans l'en-tête.
* Profil transmis à l'en-tête : `currentUser` (renvoyé par `/auth/me`, donc `role`, `nom_centre` inclus) alimente la puce « nom + rôle » de `UserProfile.jsx`.
* Onglets de sous-modules de collecte transmis à l'en-tête : `sales` (TVA à payer), `theoretical` (TVA théorique), `reconciliation` (Recoupement), `declaration` (Declaration). L'état `currentModule` est local à `App.jsx` et passé à la route `/collecte`.

## Routes déclarées

| Route | Élément |
| --- | --- |
| `/` | Écran de connexion si non authentifié, sinon redirection vers l'accueil du rôle (`/admin` pour un admin, `/acceuil` sinon) |
| `/espace-contribuable/:token` | `EspaceContribuable` — portail contribuable en lecture seule, déclaré **avant** la route de mise en page : ni `Header` ni cookie agent requis |
| `/signin` | Redirection vers `/` |
| `/signup` | `Signup` (demande de création de compte) |
| `/acceuil` | `Accueil` |
| `/collecte` | `Collecte` (reçoit `currentModule`) |
| `/entreprises/nouveau` | `PhaseClassement` |
| `/entreprises/nouveau/form` | `FormInformation` |
| `/decisionnel` | `TableauDecisionnel` |
| `/register` | `Register` |
| `/centres/:id` | `CentreDetail` |
| `/centres-fiscaux` | `CentreListe` |
| `/centres-fiscaux/:type/:index` | `UniteFiscaleDetail` |
| `/suivi` | `SuiviFiscal` |
| `/suivi/:id` | `DeclarationDetail` |
| `/contribuables` | `Contribuables` — vue « Registre » ou « Statistique » (`?vue=statistique`) |
| `/contribuables/:id` | `ContribuableDetail` |
| `/contribuables/:id/classification` | `ContribuableDetail` |
| `/contribuables/:id/declarations` | `ContribuableDetail` |
| `/contribuables/:id/declarations/nouveau` | `DeclarationCreate` |
| `/contribuables/:id/recoupements` | `ContribuableDetail` |
| `/contribuables/:id/recoupements/nouveau` | `RecoupementCreate` |
| `/contribuables/:id/droits-communication` | `ContribuableDetail` |
| `/contribuables/:id/droits-communication/nouveau` | `DroitCommunicationCreate` |
| `/contribuables/:id/relances` | `ContribuableDetail` |
| `/contribuables/:id/confrontation` | `Confrontation` |
| `/relance` | `RelanceFiscale` (entrée « Relances » du `Header`) |
| `/admin` | `AccueilAdmin` (tableau de bord des comptes, administrateurs) |
| `/admin/utilisateurs` | `Admin` (gestion des utilisateurs, administrateurs) |
| `/admin/roles` | `AdminRoles` (rôles et périmètre par centre, administrateurs) |
| `/admin/verification-nif` | `AdminVerificationNIF` (synthèse + référentiel, administrateurs) |
| `/admin/verification-nif/sql` | `VerificationNifSql` (administrateurs) |
| `/admin/verification-nif/excel` | `VerificationNifExcel` (administrateurs) |
| `/admin/verification-nif/json` | `VerificationNifJson` (administrateurs) |
| `/admin/historique` | `AdminHistorique` (journal d'audit, administrateurs) |
| `*` | Redirection vers `/` |

Les routes protégées — de `/acceuil` à `/admin/historique` — sont des enfants
d'une même route de mise en page qui rend [`Header`](components/common/Header.jsx)
puis `<main className="app-main"><Outlet /></main>` ; sans session valide, elle
redirige vers `/`. Les écrans métier sont réexportés par le barrel
[`frontofficeagent/index.jsx`](frontofficeagent/index.jsx), les écrans
d'administration par [`backofficeadmin/`](backofficeadmin/).

## Sous-dossiers

* [`api/`](api/) : instance Axios et fonctions d'appel de l'API REST backend.
* [`assets/`](assets/) : ressources graphiques importées par le bundler.
* [`components/`](components/) : composants réutilisables (`charts/`, `common/`, `forms/`).
* [`hooks/`](hooks/) : hooks React partagés.
* [`frontofficeagent/`](frontofficeagent/) : espace de travail fiscal des rôles
  opérationnels (agent, contrôleur, chef de centre, inspecteur), organisé par
  domaine métier (voir [`frontofficeagent/README.md`](frontofficeagent/README.md)).
  Un domaine peut porter ses propres helpers, comme
  `frontofficeagent/collecte/utils/enregistrerCollecte.js` qui transforme un
  formulaire de collecte en écriture API.
* [`backofficeadmin/`](backofficeadmin/) : écrans d'authentification et backoffice
  administrateur (comptes, rôles, vérification NIF, journal d'audit).
* [`accountcontribuable/`](accountcontribuable/) : portail « Ma situation fiscale »
  du contribuable, ouvert par un lien à usage unique et en lecture seule
  (formulaire NIF + e-mail, tableau de bord des taxes, conseils et pénalités,
  historique TVA, droits de communication, recoupements, confrontation).
* [`utils/`](utils/) : formatage, classification, agrégations métier, libellés de relance et helpers partagés de pagination et d'état dans l'URL (voir [`utils/README.md`](utils/README.md)).

## Authentification

Il n'existe pas de module d'authentification isolé (ni dossier `auth/`, ni contexte React, ni gestion de jeton). L'authentification est assurée par :

* [`backofficeadmin/auth/signin.jsx`](backofficeadmin/auth/signin.jsx) : composant `Signin` (export par défaut), monté sur `/` par `App.jsx` avec les props `onAuthenticated`, `isDarkMode` et `onToggleTheme`. Soumet `api.post('/auth/login', { email, password })`, bascule la visibilité du mot de passe et renvoie vers la page dédiée `/mot-de-passe-oublie` (l'adresse déjà saisie y est transmise par l'état de navigation).
* [`backofficeadmin/auth/mot-de-passe-oublie.jsx`](backofficeadmin/auth/mot-de-passe-oublie.jsx) : composant `MotDePasseOublie` (export par défaut), monté sur `/mot-de-passe-oublie` avec `isDarkMode` et `onToggleTheme`. Même mise en page que `/` ; appelle `api.post('/auth/reset-request', { email })`.
* [`backofficeadmin/auth/signup.jsx`](backofficeadmin/auth/signup.jsx) : composant `Signup` (export par défaut), monté sur `/signup`. Soumet `api.post('/auth/register', { nom, prenom, email, password })` après vérification locale de la confirmation du mot de passe ; la demande crée un agent au statut `en_attente` et n'ouvre aucune session.
* [`backofficeadmin/auth/login.jsx`](backofficeadmin/auth/login.jsx) : composant `Login`, quasi identique à `Signin` (libellés français). Ce fichier n'est importé par aucun autre module et fait doublon avec `signin.jsx`.

Le détail des écrans, des champs et du contrat d'API est dans [`backofficeadmin/README.md`](backofficeadmin/README.md).

La session repose sur un cookie : l'instance Axios est créée avec `withCredentials: true` et la connexion est validée par `GET /auth/me`. Aucun jeton n'est stocké ni injecté côté client.
