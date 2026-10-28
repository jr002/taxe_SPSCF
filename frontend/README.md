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
| Requêtes HTTP | `axios`, instance unique dans `src/api/client.js`, fonctions d'appel réparties par domaine dans `src/api/` |
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
├── public/                 # ressources servies à la racine du site, dont `referentiel-nif/`
└── src/
    ├── main.jsx            # montage React dans BrowserRouter
    ├── App.jsx             # session, routage protégé, thème, déconnexion
    ├── App.css             # styles applicatifs (dont l'écran de connexion)
    ├── index.css           # point d'entrée Tailwind
    ├── api/                # client Axios et fonctions d'appel de l'API
    ├── assets/             # ressources importées par le bundler
    ├── components/         # composants réutilisables (common, forms, charts)
    ├── hooks/              # hooks React partagés
    ├── frontofficeagent/   # espace fiscal des rôles opérationnels (agent, contrôleur, chef de centre, inspecteur)
    ├── backofficeadmin/    # écrans de connexion, d'inscription et d'administration des comptes
    ├── accountcontribuable/ # portail « Ma situation fiscale » du contribuable, hors session agent
    └── utils/              # formatage des montants et calculs frontend
```

Chaque dossier possède un `README.md` qui décrit son contenu ; le détail des
écrans est dans [`src/frontofficeagent/README.md`](src/frontofficeagent/README.md).

## 4. Routage et contrôle de session

`App.jsx` interroge `GET /api/auth/me` au montage. Tant que la réponse n'est pas
connue, un écran « Vérification de la session... » s'affiche ; un agent non
authentifié est ramené sur `/`. Sur une URL commençant par
`/espace-contribuable/`, aucune vérification de session n'est lancée : le portail
contribuable n'a pas de session agent, et le réseau du navigateur ne montre ni
`GET /auth/me` ni `401` sur cette page.

| Route | Écran | Accès |
| --- | --- | --- |
| `/` | écran de connexion, ou redirection vers l'accueil du rôle (`/admin` pour un administrateur, `/acceuil` sinon) si la session est valide | public |
| `/espace-contribuable/:token` | `EspaceContribuable` — portail contribuable en lecture seule : formulaire NIF + e-mail, puis tableau de bord des taxes, conseils et pénalités, historique TVA, droits de communication, recoupements et confrontation | public, protégé par le jeton (voir [`src/accountcontribuable/README.md`](src/accountcontribuable/README.md)) |
| `/signin` | redirection vers `/` | public |
| `/signup` | `Signup` — demande de création de compte agent | public |
| `/attente-activation` | `AttenteActivation` — statut d'un compte en attente d'activation | public |
| `/mot-de-passe-oublie` | `MotDePasseOublie` — demande de réinitialisation du mot de passe | public |
| `/admin` | `AccueilAdmin` — tableau de bord des comptes agents | protégé, administrateurs |
| `/admin/utilisateurs` | `Admin` — activer / bloquer les comptes, rôles, centres, identité et mots de passe ; chaque ligne se déplie en fiche de profil **fonctionnant en brouillon**, avec bouton `💾 Enregistrer` et pop-up de confirmation pour toute action | protégé, administrateurs |
| `/admin/roles` | `AdminRoles` — rôles et centres | protégé, administrateurs |
| `/admin/verification-nif` | `AdminVerificationNIF` — synthèse des trois types de vérification + référentiel NIF | protégé, administrateurs |
| `/admin/verification-nif/sql` | `VerificationNifSql` — vérification par requête, 3 dernières opérations | protégé, administrateurs |
| `/admin/verification-nif/excel` | `VerificationNifExcel` — liaison depuis un fichier Excel, 3 dernières opérations | protégé, administrateurs |
| `/admin/verification-nif/json` | `VerificationNifJson` — synchronisation avec le catalogue JSON, 3 dernières opérations | protégé, administrateurs |
| `/admin/historique` | `AdminHistorique` — journal des opérations d'administration | protégé, administrateurs |
| `/acceuil` | `Accueil` — tableau de bord | protégé |
| `/collecte` | `Collecte` + onglets de modules TVA | protégé |
| `/entreprises/nouveau` | `PhaseClassement` | protégé |
| `/entreprises/nouveau/form` | `FormInformation` | protégé |
| `/decisionnel` | `TableauDecisionnel` | protégé |
| `/suivi` et `/suivi/:id` | `SuiviFiscal`, `DeclarationDetail` | protégé |
| `/contribuables` | `Contribuables` — vue Registre | protégé |
| `/contribuables?vue=statistique` | `Contribuables` — vue Statistique (camemberts et histogrammes VSP / CSP, IS / IR / TVA) | protégé |
| `/contribuables/:id` | `ContribuableDetail` — onglet Synthèse | protégé |
| `/contribuables/:id/classification`, `/declarations`, `/recoupements`, `/droits-communication`, `/relances` | `ContribuableDetail` (mêmes écrans, onglets déduits du chemin) | protégé |
| `/contribuables/:id/confrontation` | `Confrontation` — page unique de confrontation déclarations / recoupements | protégé |
| `/contribuables/:id/declarations/nouveau`, `/recoupements/nouveau`, `/droits-communication/nouveau` | pages dédiées d'enregistrement | protégé |
| `/register`, `/centres-fiscaux`, `/centres/:id`, `/centres-fiscaux/:type/:index` | `Register`, `CentreListe`, `CentreDetail`, `UniteFiscaleDetail` | protégé |
| `/relance` | `RelanceFiscale` | protégé — entrée « Relances » du `Header` |
| toute autre URL | redirection vers `/` | — |

Les routes protégées partagent un même layout (`<Outlet />`) qui rend
[`Header`](src/components/common/Header.jsx) puis `<main className="app-main">`.
Le `Header` est donc absent de l'écran de connexion.

La navigation du `Header` dépend du rôle : un agent voit « Accueil », « Collecte »,
« Décisionnel », « Dossier fiscal », « Relances », « Contribuables », « Centres »
et « Registre » ; un administrateur voit « Tableau de bord », « Utilisateurs »,
« Rôles », « Vérification NIF » et « Historique & Audit », son logo
renvoyant vers `/admin` (constantes `NAVIGATION_LINKS` et `ADMIN_LINKS` de
`Header.jsx`). La barre est fixe en haut de l'écran (`position: sticky`) et le
lien actif est celui dont le chemin est le préfixe le plus long de l'URL, y
compris sur les routes détaillées.

La barre se termine par le profil de l'agent connecté, ancré au coin supérieur
droit de l'en-tête hors du flux des liens
([`UserProfile.jsx`](src/components/common/UserProfile.jsx)) : simple pastille
d'initiales qui déroule l'e-mail, le rôle libellé par `roles.utils.js`, le centre
de rattachement, le périmètre du rôle et trois commandes — « 🔑 Changer mon mot de
passe » (modale [`ModaleConfirmation.jsx`](src/components/common/ModaleConfirmation.jsx),
qui demande le mot de passe actuel puis le nouveau deux fois, et appelle
`POST /api/auth/change-password`), la bascule du thème et « Se déconnecter ».
Aucune de ces commandes n'est alignée dans la barre.

> Remarque : la route du tableau de bord est orthographiée `/acceuil` dans le
> code (`App.jsx`, `Header.jsx`, écrans de connexion), et non `/accueil`.

## 5. Appels à l'API

[`src/api/client.js`](src/api/client.js) crée l'unique instance Axios ; les
fonctions d'appel sont réparties par domaine dans [`src/api/`](src/api/)
(`declarations.js`, `contribuables.js`, `centres.js`, `recoupements.js`,
`droits-communication.js`, `rapprochements.js`, `etats-contribuable.js`,
`relances.js`, `controles.js`, `procedure-contradictoire.js`, `agents.js`,
`acces-contribuable.js`, `auth.js`) et réexportées par
[`src/api/index.js`](src/api/index.js) :

- `baseURL` = `import.meta.env.VITE_API_URL` ou `/api` ;
- `withCredentials: true`, indispensable car la session repose sur le cookie
  `fiscal_session` posé par le backend (aucun jeton n'est stocké dans le
  `localStorage`) ;
- délai d'expiration de 10 secondes ;
- les fonctions exportées renvoient directement `res.data.data` et couvrent les
  déclarations et la procédure contradictoire, les contribuables, les centres,
  les recoupements, les droits de communication, les rapprochements
  (confrontation), les états de contribuable, les relances, les contrôles,
  l'administration des agents et les liens d'accès contribuable
  (`genererAccesContribuable`, `getStatutAccesContribuable`,
  `ouvrirAccesContribuable`) ;
- `getErrorMessage(error)` produit un message lisible à partir d'une erreur
  Axios ;
- le jeton du portail contribuable vient uniquement de l'URL : il n'est écrit
  dans le `localStorage` ni dans un cookie, et n'est jamais renvoyé par une autre
  route que celle qui l'émet.

La liste complète des fonctions et leur endpoint est dans
[`../ROUTES_AND_API.md`](../ROUTES_AND_API.md).

## 6. Connexion et déconnexion

- L'écran de connexion ([`src/backofficeadmin/auth/`](src/backofficeadmin/auth/)) envoie
  `POST /api/auth/login` avec l'e-mail et le mot de passe, affiche les erreurs
  renvoyées par l'API et désactive le bouton pendant l'envoi.
- En cas de succès, le cookie de session est posé pour 8 heures et
  l'utilisateur est redirigé vers `/admin` si son rôle est `admin`, sinon vers
  `/acceuil` (`getLandingPath` de `src/utils/session.utils.js`, utilisé à la fois
  par `App.jsx` et par l'écran de connexion). Le rôle est celui
  renvoyé par `POST /api/auth/login`, donc aucune redirection ne peut être
  forcée sans authentification valide.
- Le bouton « Se déconnecter » du profil ouvert dans le `Header` appelle
  `POST /api/auth/logout`, remet l'état d'authentification à `false` et revient
  sur `/`.
- Une session ouverte ne survit pas à son compte : le middleware backend relit
  l'agent à chaque requête protégée, donc un compte bloqué ou supprimé renvoie
  `401` et `App.jsx`, qui ouvre l'application par `GET /api/auth/me`, retombe sur
  l'écran de connexion.
- « Mot de passe oublié ? » sur `/` est un lien vers la page publique
  `/mot-de-passe-oublie` ([`MotDePasseOublie`](src/backofficeadmin/auth/pages/MotDePasseOublie.jsx)),
  qui reprend la mise en page de l'écran de connexion et envoie
  `POST /api/auth/reset-request` : aucune carte SMTP n'existant dans le projet,
  la demande est seulement consignée dans le journal d'audit et un
  administrateur saisit le nouveau mot de passe depuis `/admin/utilisateurs`.
  L'adresse déjà saisie sur `/` y est transmise par l'état de navigation ;
- `/` et `/mot-de-passe-oublie` reçoivent `isDarkMode` / `onToggleTheme` de
  `App.jsx` et affichent donc le bouton de thème ; `/signup` et
  `/attente-activation` n'ont pas de bouton propre mais héritent du thème
  enregistré. Le bouton « Masquer / Afficher » reste propre au champ mot de passe
  de `/`.
- La route publique `/signup` ([`Signup`](src/backofficeadmin/auth/pages/Signup.jsx)) envoie
  `POST /api/auth/register` (nom, prénom, e-mail, mot de passe confirmé côté
  client). La demande crée un agent au statut `en_attente` : elle n'ouvre pas de
  session, et la connexion reste refusée jusqu'à l'activation du compte par un
  administrateur. Le détail est dans
  [`src/backofficeadmin/README.md`](src/backofficeadmin/README.md).
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
