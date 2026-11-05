# Source frontend

Point d'entrée de l'interface React (React 19 + Vite, routage `react-router-dom` v7, client HTTP `axios`).

## Fichiers racine

* [`main.jsx`](main.jsx) : point de montage. Enveloppe `<App />` dans `StrictMode` et `BrowserRouter`, puis monte le tout sur l'élément `#root` de `index.html`. Importe [`index.css`](index.css).
* [`App.jsx`](App.jsx) : composant racine. Vérifie la session au démarrage, déclare toutes les routes, gère le thème clair / sombre et la déconnexion. Importe [`App.css`](App.css).
* [`index.css`](index.css) : feuille d'entrée Tailwind v4, réduite à `@import "tailwindcss";`.
* [`App.css`](App.css) : feuille de styles globale de l'application (mise en page, thème sombre, formulaires, graphiques, document de notification). Les couleurs sont définies par des jetons CSS dans `:root` (`--surface`, `--card`, `--border`, `--text`, `--brand`, …) et redéfinis par `.dark-theme` ; `--panel-bg`, `--card-bg`, `--border-color` et `--text-color` sont les alias consommés par les styles en ligne du backoffice.

## Comportements portés par `App.jsx`

* Contrôle de session : `getMoi()` (`GET /auth/me`) au montage. En attente, un message « Vérification de la session... » est affiché ; en cas d'échec, l'utilisateur est redirigé vers la page de connexion. Aucune vérification n'est lancée sur une URL `/espace-contribuable/…` : le portail du contribuable est hors session agent, et `isCheckingSession` en découle (aucun `setState` dans l'effet).
* Thème : l'état `isDarkMode` est initialisé depuis `localStorage['tva-ssif-theme']` et la classe `dark-theme` est appliquée sur `.app-shell` ; toute bascule est réécrite dans `localStorage`.
* Déconnexion : `deconnexion()` (`POST /auth/logout`), puis retour sur `/`. L'action est déclenchée par le bouton « Se déconnecter » du profil affiché dans l'en-tête.
* Profil transmis à l'en-tête : `currentUser` (renvoyé par `/auth/me`, donc `role`, `nom_centre` inclus) alimente la puce « nom + rôle » de `UserProfile.jsx`.
* Onglets de sous-modules de collecte transmis à l'en-tête : `sales` (TVA à payer), `theoretical` (TVA théorique), `reconciliation` (Recoupement), `declaration` (Declaration). L'état `currentModule` est local à `App.jsx` et passé à la route `/collecte`.

## Routes déclarées

| Route | Élément |
| --- | --- |
| `/` | Écran de connexion si non authentifié, sinon redirection vers l'accueil du rôle (`/admin` pour un admin, `/accueil` sinon) |
| `/espace-contribuable/:token` | `EspaceContribuable` — portail contribuable en lecture seule, déclaré **avant** la route de mise en page : ni `Header` ni cookie agent requis |
| `/signin` | Redirection vers `/` |
| `/signup` | `Signup` (demande de création de compte) |
| `/accueil` | `Accueil` |
| `/collecte` | `Collecte` (reçoit `currentModule`) |
| `/entreprises/nouveau` | `PhaseClassement` |
| `/entreprises/nouveau/form` | `FormInformation` |
| `/decisionnel` | `TableauDecisionnel` |
| `/unites-operationnelles` | `UnitesOperationnelles` |
| `/unites-operationnelles/:type/:nom` | `UniteOperationnelleDetail` |
| `/register`, `/centres-fiscaux`, `/centres/:id`, `/centres-fiscaux/:type/:index` | redirection vers `/unites-operationnelles` |
| `/suivi` | `SuiviFiscal` |
| `/suivi/:id` | `DeclarationDetail` |
| `/contribuables` | `Contribuables` — vue « Registre » ou « Statistique » (`?vue=statistique`) ; rôles opérationnels |
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
| `/admin` | `AdminDashboard` (tableau de bord des comptes, administrateurs) |
| `/admin/utilisateurs` | `AdminUtilisateurs` (gestion des utilisateurs, administrateurs) |
| `/admin/roles` | `AdminRoles` (rôles et périmètre par centre, administrateurs) |
| `/admin/verification-nif` | `AdminVerificationNIF` (synthèse + référentiel, administrateurs) |
| `/admin/verification-nif/sql` | `VerificationNifSql` (administrateurs) |
| `/admin/verification-nif/excel` | `VerificationNifExcel` (administrateurs) |
| `/admin/verification-nif/json` | `VerificationNifJson` (administrateurs) |
| `/admin/historique` | `AdminHistorique` (journal d'audit, administrateurs) |
| `*` | Redirection vers `/` |

Les routes protégées — de `/accueil` à `/admin/historique` — sont des enfants
d'une même route de mise en page qui rend [`Header`](components/common/index.js)
puis `<main className="app-main"><Outlet /></main>` ; sans session valide, elle
redirige vers `/`.

Les onze routes `/contribuables…` passent en plus par
[`EspaceOperateurs`](components/common/EspaceOperateurs.jsx) (exporté par le barrel
`components/common/index.js`) : le registre et ses fiches appartiennent à l'espace
des rôles opérationnels, et un compte `admin` qui les atteint — même en tapant
l'URL — obtient un écran « Contribuables non accessible » au lieu de la page. Le
garde est côté route, jamais côté API, parce que la Vérification NIF de l'admin lit
`GET /api/contribuables` pour son référentiel.

## Comment le code est organisé

* **Un dossier par domaine, une arborescence identique partout.** Un domaine du
  front-office ou du back-office se structure en `pages/` (les écrans branchés sur
  une route), `components/` (les vues internes), `hooks/` et `utils/`. Un dossier
  qui n'a pas besoin d'une de ces cases ne la crée pas.
* **`@/` désigne `src/`** (alias déclaré dans [`../vite.config.js`](../vite.config.js)
  et repris dans [`../jsconfig.json`](../jsconfig.json) pour l'éditeur). Tout
  import interne s'écrit `@/…` : déplacer un fichier ne demande plus de recalculer
  la profondeur des `../` chez ses importateurs.
* **Un `index.js` par domaine ou par dossier partagé** : c'est la porte de sortie,
  et elle n'expose que ce que le domaine offre aux autres — les pages routées pour
  un domaine, les composants pour `components/*`. Les composants, hooks et
  utilitaires internes d'un domaine s'importent par leur chemin, pour qu'un barrel
  ne boucle jamais sur un fichier qu'il ré-exporte.
* **Trois portes d'entrée d'espace** : [`frontofficeagent/index.js`](frontofficeagent/index.js),
  [`backofficeadmin/index.js`](backofficeadmin/index.js) et
  [`accountcontribuable/index.js`](accountcontribuable/index.js). `App.jsx` ne
  connaît que ces trois chemins ; retirer ou ajouter un domaine se joue dans
  l'espace concerné.
* **Le client HTTP suit le même découpage** : une instance dans
  [`api/client.js`](api/client.js), une fonction d'appel par endpoint répartie dans
  les modules de domaine de [`api/`](api/), et `@/api` comme porte d'entrée (voir
  [`api/README.md`](api/README.md)).
* **Une seule sortie hors de `src/`** : [`data/referentiel-unites.js`](data/referentiel-unites.js),
  qui va lire `unitefiscal.json` à la racine du dépôt parce que le backend lit le
  même fichier.

## Sous-dossiers

* [`api/`](api/) : instance Axios et fonctions d'appel de l'API REST backend.
* [`assets/`](assets/) : ressources graphiques importées par le bundler.
* [`components/`](components/) : composants réutilisables (`charts/`, `common/`, `forms/`).
* [`hooks/`](hooks/) : hooks React partagés.
* [`data/`](data/) : registre **neutre** des textes fiscaux officiels, hors des
  trois espaces. [`data/textesFiscaux.data.js`](data/textesFiscaux.data.js) écrit
  une seule fois chaque référence citée — l'article, la page imprimée, l'URL du
  PDF de l'éditeur, et, quand l'article ne dit pas la valeur affichée par
  l'application, la phrase d'écart (`conforme: 'partiel'`). Le portail, les actes
  imprimables et les écrans d'instruction ne peuvent pas s'importer entre eux :
  ils partagent donc ce registre et le rendent par
  [`components/common/RefLegal.jsx`](components/common/RefLegal.jsx). Un numéro
  d'article ou une page se corrige ici et nulle part ailleurs ; une règle interne
  au système reste **sans source**, donc sans lien.
  [`data/navigationAgent.data.js`](data/navigationAgent.data.js) tient de la même
  façon les écrans du frontoffice agent — chemin, nom, icône, groupe et rôle
  autorisé — lus à la fois par la barre latérale et par les onglets de domaine.
  Un écran n'a donc qu'un seul nom, et un écran sans entrée de barre
  (`/relance`, `/collecte`, `/entreprises/nouveau`) allume malgré tout le groupe
  dont il relève.
* [`frontofficeagent/`](frontofficeagent/) : espace de travail fiscal des rôles
  opérationnels (agent, contrôleur, chef de centre, inspecteur), organisé par
  domaine métier (voir [`frontofficeagent/README.md`](frontofficeagent/README.md)).
  Un domaine peut porter ses propres helpers, comme
  `frontofficeagent/collecte/utils/enregistrerCollecte.js` qui transforme un
  formulaire de collecte en écriture API. Le domaine `aide/` est l'équivalent
  agent du registre de règles du portail : `data/aideAgent.data.js` tient les
  termes (`TERMES`) et les écrans (`AIDES`), `AideTerme` explique un mot au
  survol, au focus clavier et au tap, `AideLectureModal` résume l'écran où se
  trouve l'agent avec un glossaire déduit des termes qu'il cite, et `BoutonAide`
  pose le `? Aide` des en-têtes de page. Rien n'est partagé avec
  `accountcontribuable/` : les deux espaces gardent leur propre registre de
  termes. Seule la référence légale est commune aux deux — elle vit hors des
  espaces, dans [`data/textesFiscaux.data.js`](data/textesFiscaux.data.js) : le
  registre d'aide nomme les articles en prose, l'article, sa page et son PDF
  viennent du registre neutre et sont posés par
  [`components/common/RefLegal.jsx`](components/common/RefLegal.jsx) sur les
  écrans et les actes.
* [`backofficeadmin/`](backofficeadmin/) : écrans d'authentification et backoffice
  administrateur (comptes, rôles, vérification NIF, journal d'audit).
* [`accountcontribuable/`](accountcontribuable/) : portail « Ma situation fiscale »
  du contribuable, ouvert par un lien à usage unique et en lecture seule
  (formulaire NIF + e-mail, tableau de bord des taxes, conseils et pénalités,
  historique TVA, droits de communication, recoupements, confrontation) et sa vue
  jumelle « Aide & repères légaux » ; les libellés de statuts et le contenu de
  l'aide vivent dans `data/statuts.data.js` et `data/aide.data.js`, source unique
  de tout le vocabulaire du portail ; les règles énoncées (amende de 40 %, jours
  francs, seuil de redressement…) vivent dans `data/regles.data.js`, avec leur
  `source` pointant une entrée de [`data/textesFiscaux.data.js`](data/textesFiscaux.data.js),
  et sont rendues par `RegleFiscale` (survol `Infobulle` + renvoi `LienAide` +
  puce `RefLegal`), le survol
  fonctionnant aussi au focus clavier et au tap, et disparaissant à l'impression.
* [`utils/`](utils/) : ce que plusieurs domaines réclament — formatage des
  montants, découpe de table en pages, état conservé dans l'URL et chemin
  d'atterrissage selon le rôle. Un helper propre à un domaine vit dans
  `frontofficeagent/<domaine>/utils/`, pas ici.

## Authentification

Il n'existe pas de module d'authentification isolé (ni dossier `auth/`, ni contexte React, ni gestion de jeton). L'authentification est assurée par :

* [`backofficeadmin/auth/pages/Signin.jsx`](backofficeadmin/auth/pages/Signin.jsx) : composant `Signin` (export par défaut), monté sur `/` par `App.jsx` avec les props `onAuthenticated`, `isDarkMode` et `onToggleTheme`. Appelle `connexion()` (`POST /auth/login`), bascule la visibilité du mot de passe et renvoie vers la page dédiée `/mot-de-passe-oublie` (l'adresse déjà saisie y est transmise par l'état de navigation).
* [`backofficeadmin/auth/pages/MotDePasseOublie.jsx`](backofficeadmin/auth/pages/MotDePasseOublie.jsx) : composant `MotDePasseOublie` (export par défaut), monté sur `/mot-de-passe-oublie` avec `isDarkMode` et `onToggleTheme`. Même mise en page que `/` ; appelle `demanderReinitialisationMotDePasse()`.
* [`backofficeadmin/auth/pages/Signup.jsx`](backofficeadmin/auth/pages/Signup.jsx) : composant `Signup` (export par défaut), monté sur `/signup`. Appelle `inscrireAgent()` (`POST /auth/register`) après vérification locale de la confirmation du mot de passe ; la demande crée un agent au statut `en_attente` et n'ouvre aucune session.

Le détail des écrans, des champs et du contrat d'API est dans [`backofficeadmin/README.md`](backofficeadmin/README.md).

La session repose sur un cookie : l'instance Axios est créée avec `withCredentials: true` et la connexion est validée par `getMoi()` (`GET /auth/me`). Aucun jeton n'est stocké ni injecté côté client.
