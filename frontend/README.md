# Frontend SSIF

Interface web du **Système de suivi et de contrôle fiscal (SSIF)**, construite
avec React 19 et Vite 8. Elle consomme l'API REST du dossier
[`../backend/`](../backend/) et n'affiche les pages métier qu'après
authentification d'un agent.

## 1. Pile technique

| Élément | Version / rôle |
| --- | --- |
| React | 19 (`react`, `react-dom`) |
| Vite | 8, avec `@vitejs/plugin-react` |
| Routage | `react-router-dom` 7 (`BrowserRouter`, `Routes`, `Outlet`) |
| Requêtes HTTP | `axios`, instance centralisée dans `src/api/api.js` |
| Styles | Tailwind CSS 4 via `@tailwindcss/vite`, complété par `src/index.css` et `src/App.css` |
| Import Excel | `xlsx` (côté client) |
| Qualité | ESLint 10 (`eslint.config.js`) |

## 2. Prérequis et démarrage

L'API backend doit être démarrée : en développement, Vite relaie les requêtes
commençant par `/api` vers `http://localhost:5000` (voir `vite.config.js`).

```bash
npm install
npm run dev      # serveur de développement Vite (http://localhost:5173)
```

| Script | Utilité |
| --- | --- |
| `npm run dev` | serveur de développement avec rechargement à chaud |
| `npm run build` | construit l'application dans `dist/` |
| `npm run preview` | sert localement le build de production |
| `npm run lint` | analyse ESLint du dossier |

Le fichier `.env` du frontend est optionnel : `VITE_API_URL` permet de remplacer
l'URL de base du client Axios lorsque l'API n'est pas servie derrière le proxy
Vite (valeur par défaut : `/api`).

## 3. Organisation du code

```text
frontend/
├── index.html              # page hôte de l'application
├── vite.config.js          # plugins (React, Tailwind) et proxy /api
└── src/
    ├── main.jsx            # montage React dans BrowserRouter
    ├── App.jsx             # session, routage protégé, thème, déconnexion
    ├── App.css             # styles applicatifs (dont l'écran de connexion)
    ├── index.css           # point d'entrée Tailwind
    ├── api/                # client Axios et fonctions d'appel de l'API
    ├── assets/             # ressources importées par le bundler
    ├── components/         # composants réutilisables (common, forms, charts)
    ├── hooks/              # hooks React partagés
    ├── pages/              # écrans métier, organisés par domaine
    ├── users/              # écrans de connexion
    └── utils/              # formatage des montants et calculs frontend
```

Chaque dossier possède un `README.md` qui décrit son contenu ; le détail des
écrans est dans [`src/pages/README.md`](src/pages/README.md).

## 4. Routage et contrôle de session

`App.jsx` interroge `GET /api/auth/me` au montage. Tant que la réponse n'est pas
connue, un écran « Vérification de la session... » s'affiche ; un agent non
authentifié est ramené sur `/`.

| Route | Écran | Accès |
| --- | --- | --- |
| `/` | écran de connexion, ou redirection vers `/acceuil` si la session est valide | public |
| `/signin` | redirection vers `/` | public |
| `/signup` | `Signup` — demande de création de compte agent | public |
| `/admin` | `AccueilAdmin` — tableau de bord des comptes agents | protégé, administrateurs |
| `/admin/utilisateurs` | `Admin` — espace administrateur : activer / bloquer les comptes, rôles, mots de passe | protégé, administrateurs |
| `/acceuil` | `Accueil` — tableau de bord | protégé |
| `/collecte` | `Collecte` + onglets de modules TVA | protégé |
| `/entreprises/nouveau` | `PhaseClassement` | protégé |
| `/entreprises/nouveau/form` | `FormInformation` | protégé |
| `/decisionnel` | `TableauDecisionnel` | protégé |
| `/suivi` et `/suivi/:id` | `SuiviFiscal`, `DeclarationDetail` | protégé |
| `/contribuables` et `/contribuables/:id` | `Contribuables`, `ContribuableDetail` | protégé |
| `/contribuables/:id/classification`, `/declarations`, `/relances` | `ContribuableDetail` (onglets) | protégé |
| `/register`, `/centres/:id` | `Register`, `CentreDetail` | protégé |
| `/relance` | `RelanceFiscale` | protégé |
| toute autre URL | redirection vers `/` | — |

Les routes protégées partagent un même layout (`<Outlet />`) qui rend
[`Header`](src/components/common/Header.jsx) puis `<main className="app-main">`.
Le `Header` est donc absent de l'écran de connexion.

La navigation du `Header` dépend du rôle : un agent voit les modules fiscaux
(Accueil, Collecte TVA, Tableau décisionnel, Suivi fiscal, Contribuables,
Relance fiscale), tandis qu'un administrateur ne voit que **« Accueil »**
(`/admin`, tableau de bord des comptes) et **« Utilisateurs »**
(`/admin/utilisateurs`), son logo renvoyant vers `/admin`.

> Remarque : la route du tableau de bord est orthographiée `/acceuil` dans le
> code (`App.jsx`, `Header.jsx`, écrans de connexion), et non `/accueil`.

## 5. Appels à l'API

[`src/api/api.js`](src/api/api.js) crée une instance Axios unique :

- `baseURL` = `import.meta.env.VITE_API_URL` ou `/api` ;
- `withCredentials: true`, indispensable car la session repose sur le cookie
  `fiscal_session` posé par le backend (aucun jeton n'est stocké dans le
  `localStorage`) ;
- délai d'expiration de 10 secondes ;
- les fonctions exportées renvoient directement `res.data.data` et couvrent les
  déclarations, les contribuables, les centres, les recoupements, les contrôles
  et la procédure contradictoire ;
- `getErrorMessage(error)` produit un message lisible à partir d'une erreur
  Axios.

La liste complète des fonctions et leur endpoint est dans
[`../ROUTES_AND_API.md`](../ROUTES_AND_API.md).

## 6. Connexion et déconnexion

- L'écran de connexion ([`src/users/`](src/users/)) envoie
  `POST /api/auth/login` avec l'e-mail et le mot de passe, affiche les erreurs
  renvoyées par l'API et désactive le bouton pendant l'envoi.
- En cas de succès, le cookie de session est posé pour 8 heures et
  l'utilisateur est redirigé vers `/acceuil` — ou vers `/admin` si son rôle est
  `admin` (`getLandingPath` de `src/users/signin.jsx`). Le rôle est celui
  renvoyé par `POST /api/auth/login`, donc aucune redirection ne peut être
  forcée sans authentification valide.
- Le bouton « Déconnexion » du `Header` appelle `POST /api/auth/logout`, remet
  l'état d'authentification à `false` et revient sur `/`.
- La route publique `/signup` ([`Signup`](src/users/signup.jsx)) envoie
  `POST /api/auth/register` (nom, prénom, e-mail, mot de passe confirmé côté
  client). La demande crée un agent au statut `en_attente` : elle n'ouvre pas de
  session, et la connexion reste refusée jusqu'à l'activation du compte par un
  administrateur. Le détail est dans
  [`src/users/README.md`](src/users/README.md).
- Le contrôle de session n'a lieu qu'au chargement de l'application
  (`GET /api/auth/me`). Un `401` survenu plus tard, pendant la navigation, n'est
  pas intercepté : seule une actualisation de la page ou une déconnexion ramène
  l'utilisateur sur l'écran de connexion.

## 7. Thème clair / sombre

`App.jsx` conserve le choix de thème dans `localStorage` (clé
`tva-ssif-theme`) et applique la classe `dark-theme` sur `.app-shell`. Le bouton
de bascule se trouve dans le `Header`.

## 8. Build de production

```bash
npm run build     # génère dist/
npm run preview   # vérifie le rendu du build
```

Le build produit un ensemble statique à servir par un serveur web ; l'API doit
alors être exposée sur la même origine que l'interface (ou via
`VITE_API_URL`), les appels `/api` étant accompagnés du cookie de session.
