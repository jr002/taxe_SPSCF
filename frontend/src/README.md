# Source frontend

Point d'entrée de l'interface React (React 19 + Vite, routage `react-router-dom` v7, client HTTP `axios`).

## Fichiers racine

* [`main.jsx`](main.jsx) : point de montage. Enveloppe `<App />` dans `StrictMode` et `BrowserRouter`, puis monte le tout sur l'élément `#root` de `index.html`. Importe [`index.css`](index.css).
* [`App.jsx`](App.jsx) : composant racine. Vérifie la session au démarrage, déclare toutes les routes, gère le thème clair / sombre et la déconnexion. Importe [`App.css`](App.css).
* [`index.css`](index.css) : feuille d'entrée Tailwind v4, réduite à `@import "tailwindcss";`.
* [`App.css`](App.css) : feuille de styles globale de l'application (mise en page, thème sombre, formulaires, graphiques, document de notification).

## Comportements portés par `App.jsx`

* Contrôle de session : `api.get('/auth/me')` au montage. En attente, un message « Vérification de la session... » est affiché ; en cas d'échec, l'utilisateur est redirigé vers la page de connexion.
* Thème : l'état `isDarkMode` est initialisé depuis `localStorage['tva-ssif-theme']` et la classe `dark-theme` est appliquée sur `.app-shell` ; toute bascule est réécrite dans `localStorage`.
* Déconnexion : `api.post('/auth/logout')`, puis retour sur `/`.
* Onglets de sous-modules de collecte transmis à l'en-tête : `sales` (TVA à payer), `theoretical` (TVA théorique), `reconciliation` (Recoupement), `declaration` (Declaration). L'état `currentModule` est local à `App.jsx` et passé à la route `/collecte`.

## Routes déclarées

| Route | Élément |
| --- | --- |
| `/` | Écran de connexion si non authentifié, sinon redirection vers `/acceuil` |
| `/signin` | Redirection vers `/` |
| `/signup` | `Signup` (demande de création de compte) |
| `/admin` | `AccueilAdmin` (tableau de bord des comptes, administrateurs) |
| `/admin/utilisateurs` | `Admin` (gestion des utilisateurs, administrateurs) |
| `/acceuil` | `Accueil` |
| `/collecte` | `Collecte` (reçoit `currentModule`) |
| `/entreprises/nouveau` | `PhaseClassement` |
| `/entreprises/nouveau/form` | `FormInformation` |
| `/decisionnel` | `TableauDecisionnel` |
| `/register` | `Register` |
| `/centres/:id` | `CentreDetail` |
| `/suivi` | `SuiviFiscal` |
| `/suivi/:id` | `DeclarationDetail` |
| `/contribuables` | `Contribuables` |
| `/contribuables/:id` | `ContribuableDetail` |
| `/contribuables/:id/classification` | `ContribuableDetail` |
| `/contribuables/:id/declarations` | `ContribuableDetail` |
| `/contribuables/:id/relances` | `ContribuableDetail` |
| `/relance` | `RelanceFiscale` |
| `*` | Redirection vers `/` |

Toutes les routes métier (de `/acceuil` à `/relance`) sont des routes enfants d'une route de mise en page protégée qui rend [`Header`](components/common/Header.jsx) puis `<main className="app-main"><Outlet /></main>`. Les composants de page sont réexportés par le barrel [`pages/index.jsx`](pages/index.jsx).

## Sous-dossiers

* [`api/`](api/) : instance Axios et fonctions d'appel de l'API REST backend.
* [`assets/`](assets/) : ressources graphiques importées par le bundler.
* [`components/`](components/) : composants réutilisables (`charts/`, `common/`, `forms/`).
* [`hooks/`](hooks/) : hooks React partagés.
* [`pages/`](pages/) : écrans accessibles par route, organisés par domaine métier (voir [`pages/README.md`](pages/README.md)).
* [`users/`](users/) : écrans d'authentification côté client.
* [`utils/`](utils/) : formatage, classification et agrégations métier.

## Authentification

Il n'existe pas de module d'authentification isolé (ni dossier `auth/`, ni contexte React, ni gestion de jeton). L'authentification est assurée par :

* [`users/signin.jsx`](users/signin.jsx) : composant `Signin` (export par défaut), monté sur `/` par `App.jsx`. Soumet `api.post('/auth/login', { email, password })` et remonte l'état authentifié via la prop `onAuthenticated`.
* [`users/signup.jsx`](users/signup.jsx) : composant `Signup` (export par défaut), monté sur `/signup`. Soumet `api.post('/auth/register', { nom, prenom, email, password })` après vérification locale de la confirmation du mot de passe ; la demande crée un agent au statut `en_attente` et n'ouvre aucune session.
* [`users/login.jsx`](users/login.jsx) : composant `Login`, quasi identique à `Signin` (libellés français). Ce fichier n'est importé par aucun autre module et fait doublon avec `signin.jsx`.

Le détail des écrans, des champs et du contrat d'API est dans [`users/README.md`](users/README.md).

La session repose sur un cookie : l'instance Axios est créée avec `withCredentials: true` et la connexion est validée par `GET /auth/me`. Aucun jeton n'est stocké ni injecté côté client.
