# Backoffice administrateur (`/src/backofficeadmin`)

Ce dossier porte l'espace de l'administrateur, c'est-à-dire la **gestion des
utilisateurs** : créer, activer, bloquer un compte, choisir son rôle et son
centre, corriger son identité, réinitialiser son mot de passe, ainsi que les
écrans qui l'accompagnent (tableau de bord des comptes, rôles, vérification NIF,
journal d'audit). Les écrans de travail fiscal des rôles opérationnels (agent,
contrôleur, chef de centre, inspecteur) ne vivent pas ici mais dans
[`../frontofficeagent/`](../frontofficeagent/).

Ce dossier regroupe les écrans liés aux comptes agents : la connexion et la
demande d'inscription (montées **hors du layout protégé**, donc sans `Header`),
et les cinq pages d'administration montées sous `/admin…`, rendues à l'intérieur
du layout protégé. Les pages admin partagent une barre de navigation interne,
[`components/AdminNav.jsx`](components/AdminNav.jsx), qui les relie entre elles.

Les domaines de l'espace (`auth`, `dashboard`, `utilisateurs`, `roles`,
`verification-nif`, `historique`) suivent la même grille que le front-office :
`pages/` pour les écrans routés, `components/` pour les vues internes,
`utils/` pour ce qui ne sert qu'à eux, et un `index.js` par domaine. La règle
complète est dans [`../README.md`](../README.md#comment-le-code-est-organisé).

## Arborescence

```text
backofficeadmin/
├── index.js         porte d'entrée de l'espace : ré-exporte les portes des domaines
├── auth/            pages/ Signin.jsx, Signup.jsx, AttenteActivation.jsx,
│                     MotDePasseOublie.jsx   (+ index.js)
├── components/      AdminNav.jsx (navigation interne des pages admin)
├── dashboard/       pages/AdminDashboard.jsx, components/CamembertUtilisateurs.jsx
├── utilisateurs/    pages/AdminUtilisateurs.jsx
├── roles/           pages/AdminRoles.jsx
├── utils/           roles.utils.js (référentiel des rôles partagé)
├── verification-nif/ pages/AdminVerificationNIF.jsx, VerificationNifSql.jsx /
│                     Excel.jsx / Json.jsx, components/VerificationNifLayout.jsx,
│                     HistoriqueVerification.jsx, ErreursVerification.jsx,
│                     utils/verification.utils.js
└── historique/      pages/AdminHistorique.jsx, components/HistoriqueUtilisateurs.jsx
```

## Fichiers

| Fichier | Composant | Route | État |
| --- | --- | --- | --- |
| [`auth/pages/Signin.jsx`](auth/pages/Signin.jsx) | `Signin({ onAuthenticated, isDarkMode, onToggleTheme })` | `/` | **utilisé** |
| [`auth/pages/Signup.jsx`](auth/pages/Signup.jsx) | `Signup()` | `/signup` | **utilisé** |
| [`auth/pages/AttenteActivation.jsx`](auth/pages/AttenteActivation.jsx) | `AttenteActivation()` | `/attente-activation` | **utilisé** |
| [`auth/pages/MotDePasseOublie.jsx`](auth/pages/MotDePasseOublie.jsx) | `MotDePasseOublie({ isDarkMode, onToggleTheme })` | `/mot-de-passe-oublie` | **utilisé** |
| [`dashboard/pages/AdminDashboard.jsx`](dashboard/pages/AdminDashboard.jsx) | `AdminDashboard({ currentUser })` | `/admin` | **utilisé** (administrateurs) |
| [`dashboard/components/CamembertUtilisateurs.jsx`](dashboard/components/CamembertUtilisateurs.jsx) | `CamembertUtilisateurs({ stats, agents })` | sous-composant de `/admin` | **utilisé** |
| [`utilisateurs/pages/AdminUtilisateurs.jsx`](utilisateurs/pages/AdminUtilisateurs.jsx) | `AdminUtilisateurs({ currentUser })` | `/admin/utilisateurs` | **utilisé** (administrateurs) |
| [`roles/pages/AdminRoles.jsx`](roles/pages/AdminRoles.jsx) | `AdminRoles({ currentUser })` | `/admin/roles` | **utilisé** (administrateurs) |
| [`utils/roles.utils.js`](utils/roles.utils.js) | — (`ROLES_AGENTS`, `roleDefinition`, `isCentreScoped`, `getRoleLabel`, `CENTRE_TEXTES`, `centreResume`) | — | **utilisé** (Utilisateurs, Rôles, camembert, profil de l'en-tête) |
| [`verification-nif/pages/AdminVerificationNIF.jsx`](verification-nif/pages/AdminVerificationNIF.jsx) | `AdminVerificationNIF({ currentUser })` | `/admin/verification-nif` | **utilisé** (administrateurs) |
| [`verification-nif/components/VerificationNifLayout.jsx`](verification-nif/components/VerificationNifLayout.jsx) | `VerificationNifLayout({ currentUser, eyebrow, titre, description, children })` | conteneur des 3 pages dédiées | **utilisé** |
| [`verification-nif/pages/VerificationNifSql.jsx`](verification-nif/pages/VerificationNifSql.jsx) | `VerificationNifSql({ currentUser })` | `/admin/verification-nif/sql` | **utilisé** (administrateurs) |
| [`verification-nif/pages/VerificationNifExcel.jsx`](verification-nif/pages/VerificationNifExcel.jsx) | `VerificationNifExcel({ currentUser })` | `/admin/verification-nif/excel` | **utilisé** (administrateurs) |
| [`verification-nif/pages/VerificationNifJson.jsx`](verification-nif/pages/VerificationNifJson.jsx) | `VerificationNifJson({ currentUser })` | `/admin/verification-nif/json` | **utilisé** (administrateurs) |
| [`verification-nif/components/HistoriqueVerification.jsx`](verification-nif/components/HistoriqueVerification.jsx) | `HistoriqueVerification({ entries, emptyLabel })` | sous-composant des 3 pages | **utilisé** |
| [`verification-nif/components/ErreursVerification.jsx`](verification-nif/components/ErreursVerification.jsx) | `ErreursVerification({ entries, onClear })` | sous-composant des 3 pages | **utilisé** |
| [`verification-nif/utils/verification.utils.js`](verification-nif/utils/verification.utils.js) | — (fonctions utilitaires) | — | **utilisé** |
| [`historique/pages/AdminHistorique.jsx`](historique/pages/AdminHistorique.jsx) | `AdminHistorique({ currentUser })` | `/admin/historique` | **utilisé** (wrapper de page) |
| [`historique/components/HistoriqueUtilisateurs.jsx`](historique/components/HistoriqueUtilisateurs.jsx) | `HistoriqueUtilisateurs()` | rendue par `AdminHistorique` | **utilisé** |
| [`components/AdminNav.jsx`](components/AdminNav.jsx) | `AdminNav()` | rendue par les 5 pages admin | **utilisé** |

## Routes

| Route | Déclaration dans `App.jsx` | Accès |
| --- | --- | --- |
| `/` | écran de connexion (`Signin`) si `GET /api/auth/me` échoue, sinon redirection vers l'accueil du rôle | public |
| `/signin` | redirection immédiate vers `/` | public |
| `/signup` | `Signup` | public |
| `/attente-activation` | `AttenteActivation` — statut « en attente d'activation » après une inscription ou une connexion refusée pour ce motif | public |
| `/mot-de-passe-oublie` | `MotDePasseOublie` — demande de réinitialisation du mot de passe (`POST /api/auth/reset-request`) | public |
| `/admin` | `AdminDashboard` — tableau de bord des comptes agents et camembert de répartition | protégé, réservé aux administrateurs |
| `/admin/utilisateurs` | `Admin` — gestion des comptes | protégé, réservé aux administrateurs |
| `/admin/roles` | `AdminRoles` — rôles des agents et périmètre par centre fiscal | protégé, réservé aux administrateurs |
| `/admin/verification-nif` | `AdminVerificationNIF` — synthèse des trois types de vérification et tableau du référentiel NIF | protégé, réservé aux administrateurs |
| `/admin/verification-nif/sql` | `VerificationNifSql` — vérification d'un NIF par requête sur l'API ; saisie multigne acceptant une requête collée, tableau des lignes pour un `SELECT` de liste, journal des erreurs | protégé, réservé aux administrateurs |
| `/admin/verification-nif/excel` | `VerificationNifExcel` — liaison du référentiel depuis un fichier `.xlsx` / `.xls` / `.csv`, avec modèle vierge téléchargeable | protégé, réservé aux administrateurs |
| `/admin/verification-nif/json` | `VerificationNifJson` — synchronisation avec le catalogue `unitefiscal.json`, modèle JSON téléchargeable et API JSON enregistrables (fichiers de `public/referentiel-nif/` ou serveurs distants) | protégé, réservé aux administrateurs |
| `/admin/historique` | `AdminHistorique` — journal d'audit des actions sur les comptes (`GET /api/agents/historique`) | protégé, réservé aux administrateurs |

`AdminNav` liste ces cinq destinations avec libellé, icône et sous-titre ; la
page active est marquée par `NavLink`. Seule l'entrée `/admin` porte `end`, donc
l'onglet « Vérification NIF » reste actif sur les trois sous-routes
`/admin/verification-nif/{sql,excel,json}`.

Les styles en ligne du backoffice (`AdminNav`, `AdminRoles`, `HistoriqueUtilisateurs`,
`HistoriqueVerification`, `CamembertUtilisateurs`, `VerificationNifExcel`) lisent
`var(--panel-bg)`, `var(--card-bg)`, `var(--border-color)`, `var(--text-color)` et
`var(--text-muted)`. Ces quatre premiers jetons sont désormais définis par
`App.css` — en clair comme en sombre — de sorte que ces composants suivent le
thème : leurs libellés étaient en blanc sur fond blanc en mode sombre (contraste
1,0:1) tant que les variables restaient indéfinies et tombaient sur leur valeur
de repli claire.

Les routes protégées sont regroupées dans une route de layout séparée qui, sans
session valide, redirige vers `/` : un agent non connecté ne peut donc pas
atteindre le reste de l'application.

Tant que la vérification `GET /api/auth/me` n'a pas répondu, `App.jsx` affiche
le message « Vérification de la session... » (classe `auth-loading`) à la place
de l'écran de connexion et du layout protégé.

## Pagination des tableaux : 10 lignes par page

Les cinq pages du backoffice paginent **toutes** leurs tables à 10 lignes, avec
le même couple partagé :

* [`../hooks/useTablePagination.js`](../hooks/useTablePagination.js) découpe la
  liste déjà filtrée (`pageItems`, `currentPage`, `totalPages`) ;
* [`../components/common/Pagination.jsx`](../components/common/Pagination.jsx)
  affiche « Précédent · 1 2 … · Suivant » sous le tableau — le composant du
  registre des contribuables, remonté en commun pour l'occasion. Sa classe
  `pagination-controls` et ses styles inline existants sont réutilisés à
  l'identique : **aucune nouvelle feuille de style** n'a été ajoutée.
* Par défaut le composant se retire quand `totalPages <= 1`. Le backoffice ne
  compte que quelques comptes agents : la barre serait donc invisible. Les pages
  `/admin/utilisateurs`, `/admin/roles` et `/admin/verification-nif` passent
  `showSinglePage={Boolean(ligneFiltrée.length)}` — la barre reste affichée
  (« Précédent » et « Suivant » désactivés, un seul numéro) dès qu'il y a au
  moins une ligne, et disparaît sur un résultat de recherche vide.

| Page | Tableau | Liste paginée |
| --- | --- | --- |
| `/admin` | Derniers comptes créés | `derniersComptes` triés par `date_creation` décroissante (l'ancienne limite de 5 lignes a été supprimée) |
| `/admin/utilisateurs` | Comptes agents | `visibleAgents` (filtre statut + recherche) |
| `/admin/roles` | Rôles des agents et centre affecté | `filteredAgents` (filtre rôle + recherche) |
| `/admin/verification-nif` | Référentiel NIF | `nifsFiltres` (barre `.datatable-toolbar` : recherche NIF / raison sociale / centre / source, compteur `n sur total`, bouton « ✕ Effacer la recherche ») |
| `/admin/historique` | Journal d'audit | `filteredLogs` (onglet `type_action` + recherche) |

Deux règles de rédaction imposées par ESLint :

- la découpe n'intervient qu'à l'affichage : les lignes d'action dépliables
  (réinitialisation du mot de passe, confirmation de suppression) restent keyed
  par `id_agent` et fonctionnent sur la page courante ;
- la page revient à `1` **dans les gestionnaires d'événement** des filtres,
  onglets, recherches et bouton d'actualisation — jamais dans un `useEffect`,
  interdit par `react-hooks/set-state-in-effect`.

En dessous de 10 lignes, `Pagination` ne rend rien : une base de quatre comptes
n'affiche donc aucune barre.

## `auth/pages/Signin.jsx` — connexion

Écran affiché sur `/` tant qu'aucune session valide n'est détectée. Il :

- affiche un panneau institutionnel (logo DGI, mention « République de
  Madagascar · DGI », titre TVA•SSIF et rappel du sigle du projet) et un
  formulaire e-mail + mot de passe ;
- conserve les champs et l'état d'envoi avec `useState` ;
- soumet `connexion(email, password)` — fonction de
  [`../api/auth.js`](../api/auth.js) ré-exportée par le barrel `@/api`, qui envoie
  `POST /auth/login` sur l'instance Axios de
  [`../api/client.js`](../api/client.js)) ;
- affiche l'erreur renvoyée par l'API avec `getErrorMessage` dans un paragraphe
  `role="alert"` et désactive le bouton pendant l'envoi ; **sauf** si la réponse
  porte `code: 'COMPTE_EN_ATTENTE'` : `navigate('/attente-activation', { state:
  { origine: 'connexion', email } })` bascule alors sur l'écran de statut du
  compte. Le `code` machine évite de comparer des textes ; `COMPTE_BLOQUE` et les
  autres échecs (`401`, `429`) restent signalés en ligne ;
- appelle la propriété `onAuthenticated` fournie par `App.jsx`, puis redirige
  vers `/acceuil`, ou vers `/admin` lorsque l'agent connecté est administrateur
  (voir ci-dessous) ;
- propose un bouton « Masquer / Afficher » (`aria-pressed`) qui bascule le champ
  mot de passe entre `type="password"` et `type="text"`, sans quitter le focus ;
- propose un lien « Mot de passe oublié ? » (`Link` de `react-router-dom` vers
  `/mot-de-passe-oublie`) qui transmet l'adresse déjà saisie par l'état de
  navigation `state={{ email }}` : la page dédiée la reprend comme valeur
  initiale de son propre champ ;
- reprend le bouton de thème (`className="theme-toggle"`, même markup que le
  `Header`) et l'état sombre de `App.jsx`, donc `/` et `/signup` se conforment au
  thème choisi ;
- propose le lien « S'inscrire » vers `/signup` (composant `Link` de
  `react-router-dom`).

| Propriété | Description |
| --- | --- |
| `onAuthenticated` | Callback appelé après une connexion réussie ; met à jour l'état `isAuthenticated` de `App.jsx`. |
| `isDarkMode` | Booléen portant l'état du thème (`localStorage['tva-ssif-theme']`), utilisé pour l'`aria-label` du bouton. |
| `onToggleTheme` | Appelé au clic sur le bouton de thème ; bascule la classe `dark-theme` de l'`app-shell`. |

Les styles correspondants sont dans
[`../App.css`](../App.css) : blocs `.login-form-top`,
`.login-field-control`, `.login-password-toggle`, `.login-forgot`
et leurs variantes `.dark-theme .login-*`.

Le bloc « Attendre les autorisations de l'administrateur du site. » rappelle que
les comptes sont activés manuellement (voir la section API ci-dessous).

## `auth/pages/MotDePasseOublie.jsx` — demande de réinitialisation

Page publique montée sur `/mot-de-passe-oublie`, atteinte par le lien « Mot de
passe oublié ? » de `/` et par celui de `/attente-activation`. Elle reprend
intégralement la mise en page de `/`, `/signup` et `/attente-activation`
(`.login-page`, `.login-brand-panel`, `.login-form-panel`, `.login-form`) et :

- préremplit le champ e-mail depuis `useLocation().state?.email` (état transmis
  par l'écran de connexion ; rien n'est lu depuis l'URL) ;
- explique dans l'encadré `.login-reset` qu'aucun e-mail automatique n'est envoyé
  et liste les trois étapes dans `.attente-etapes` ;
- soumet `api.post('/auth/reset-request', { email })` et affiche la réponse dans
  `.login-success` (`role="status"`) ou `.login-error` (`role="alert"`) via
  `getErrorMessage` ; le bouton passe à « Envoi en cours... » pendant l'appel. Le
  message de succès est volontairement le même que le compte existe ou non, car
  c'est l'API qui renvoie une chaîne identique dans les deux cas ;
- reprend le bouton de thème de `/` (props `isDarkMode` et `onToggleTheme`
  fournies par `App.jsx`) et le lien `.auth-link` « ← Retour à la connexion ».

| Propriété | Description |
| --- | --- |
| `isDarkMode` | Booléen portant l'état du thème, utilisé pour l'`aria-label` du bouton. |
| `onToggleTheme` | Appelé au clic sur le bouton de thème ; bascule la classe `dark-theme` de l'`app-shell`. |

### Redirection des administrateurs

La page d'arrivée est calculée par `getLandingPath`, exportée par
[`../utils/session.utils.js`](../utils/session.utils.js) et utilisée à la fois
par `Signin.jsx` et par la route `/` de `App.jsx` :

```js
export const getLandingPath = (user) => (user?.role === 'admin' ? '/admin' : '/acceuil');
```

- **rôle `admin`** → `/admin`, le backoffice ;
- **tout autre rôle** → `/acceuil`, le tableau de bord agent.

Les deux appels sont obligatoires : si `/` redirigeait tout seul vers `/acceuil`
pendant que `Signin.jsx` navigue vers `/admin`, la redirection de `/` écrasait la
destination et un administrateur débarquait sur l'espace agent avant d'atteindre
son backoffice. Le chemin d'arrivée vient d'un seul helper, donc les deux
redirections ne peuvent plus se contredire.

Le rôle provient de la réponse de `POST /api/auth/login`, donc d'une session
réellement authentifiée : il n'y a aucun contournement possible. L'espace
administrateur est dédié à la gestion des comptes : le `Header` d'un admin ne
présente que les entrées de l'espace admin (`ADMIN_LINKS`, son logo pointe
également vers `/admin`), tandis qu'un agent non administrateur qui ouvrirait
`/admin` à la main verrait le message « réservé aux administrateurs » (`403`
côté API).

> Aucun compte n'est administrateur par défaut : le premier doit être créé avec
> `npm run agent:create` dans `backend/` (ou promu depuis la base), après quoi
> les rôles se gèrent directement depuis `/admin`.

## `auth/pages/Signup.jsx` — demande de création de compte

Formulaire public d'enregistrement d'une demande d'accès. Le composant ne prend
**aucune propriété** et ne connecte pas l'utilisateur : il enregistre la demande
puis invite à attendre l'activation.

Saisies demandées :

| Champ | Détails |
| --- | --- |
| Nom | `type="text"`, `maxLength={100}`, `autoComplete="family-name"` |
| Prénom | `type="text"`, `maxLength={100}`, `autoComplete="given-name"` |
| Adresse e-mail | `type="email"`, `maxLength={255}`, `autoComplete="email"` |
| Mot de passe | `type="password"`, `minLength={4}`, `autoComplete="new-password"` |
| Confirmation | `type="password"`, `minLength={4}`, `name="password-confirmation"` |

Déroulement :

1. `handleSubmit` empêche le rechargement de la page ;
2. si `password !== confirmation`, un message local « Les mots de passe ne
   correspondent pas. » est affiché et aucun appel réseau n'est effectué ;
3. sinon `api.post('/auth/register', { nom, prenom, email, password })` ;
4. en cas de succès, le composant **redirige** (`navigate(..., { replace: true })`)
   vers `/attente-activation` en passant l'état `{ origine: 'inscription', email,
   nom, prenom }` : c'est cet écran qui affiche la confirmation, avec le bouton de
   retour vers la connexion ;
5. en cas d'échec, `getErrorMessage` affiche le message de l'API (par exemple
   « Un compte utilise déjà cette adresse e-mail ») dans le formulaire.

Le lien « Déjà inscrit ? Se connecter » ramène vers `/`.

## `auth/pages/AttenteActivation.jsx` — compte en attente d'activation

Écran public de statut, atteint par deux chemins et par aucune autre voie : la
fin d'une inscription (`/signup`) et une connexion refusée parce que le compte
n'est pas encore activé (`/`). Il ne prend **aucune propriété** et ne lit aucune
donnée depuis l'URL : tout vient de `useLocation().state`.

- Reprend trait pour trait la mise en page de `/` et `/signup` : `.login-page`,
  `.login-brand-panel` (logo, « République de Madagascar · DGI », titre, sigle,
  filet, note), `.login-form-panel` > `.login-form`, et les mêmes variantes
  `.dark-theme`. Aucune classe nouvelle de design : `.attente-compte`,
  `.attente-etapes`, `.attente-statut` et `.attente-retour` prolongent les
  styles du formulaire (`login-reset` pour la carte, `login-submit` pour le bouton).
- Trois titres et trois accroches selon l'origine : `inscription` →
  « Demande enregistrée », `connexion` → « Compte en attente d'activation » avec
  « La connexion restera refusée jusque-là. », aucune donnée (accès direct,
  rechargement brutal) → formulation neutre et **aucune fiche d'identité**.
- Fiche `.attente-compte` (`<dl>`) : titulaire, adresse e-mail, état du compte —
  uniquement les lignes réellement connues. Pastille `.badge.surveillance`
  « En attente d'activation », puis les trois étapes jusqu'à la décision de
  l'administrateur.
- Bouton principal « ← Retour à la connexion » (`Link to="/"`), puis deux liens
  secondaires `.auth-link` : « Mot de passe oublié ? » vers `/mot-de-passe-oublie`
  et « Créer un autre compte » vers `/signup`.

## `dashboard/pages/AdminDashboard.jsx` — tableau de bord de l'administrateur

Page d'accueil de l'espace admin (`/admin`) : c'est là qu'arrive tout
administrateur après sa connexion. Elle présente :

- **quatre indicateurs** — nombre total de comptes, comptes actifs, demandes en attente d'activation et comptes bloqués (le chiffre prend la couleur de l'état) ;
- une **alerte cliquable** lorsqu'il reste des demandes à traiter : le lien ouvre la liste pré-filtrée sur `en_attente` (`state={{ statut: 'en_attente' }}`) ;
- la **répartition des comptes** par statut sous forme de barres avec pourcentages, complétée par le nombre d'administrateurs et d'agents simples ;
- les **comptes créés récemment**, triés du plus récent au plus ancien et **paginés à 10 par page** (nom, e-mail, statut, date) ;
- deux **accès rapides** vers `/admin/utilisateurs`.

| Propriété | Description |
| --- | --- |
| `currentUser` | Agent connecté (`{ id, email, nom, prenom, role }`) fourni par `App.jsx` ; sert à personnaliser le message d'accueil et à refuser la page aux non-administrateurs. |

Toutes les statistiques sont agrégées dans la page à partir de `getAgents()` :
aucun endpoint de statistiques n'existe côté serveur.

## `utilisateurs/pages/AdminUtilisateurs.jsx` — gestion des utilisateurs

Page de gestion des comptes montée sur `/admin/utilisateurs`, **à l'intérieur du
layout protégé**. C'est l'espace de l'administrateur : quand
`currentUser.role === 'admin'`, le `Header` ne présente que les cinq entrées
admin (`ADMIN_LINKS` : `/admin`, `/admin/utilisateurs`, `/admin/roles`,
`/admin/verification-nif`, `/admin/historique`), et le logo renvoie vers
`/admin` — les modules fiscaux ne sont donc pas proposés à un admin. La page
affiche un lien « ← Retour au tableau de bord ». L'API répond `403` à tout autre
rôle, et si un agent non administrateur ouvre l'URL directement, la page affiche
un message « réservée aux administrateurs » au lieu de la liste.

| Propriété | Description |
| --- | --- |
| `currentUser` | Agent connecté (`{ id, email, nom, prenom, role }`) fourni par `App.jsx` ; sert à afficher le module dans le `Header`, à marquer « votre compte » et à désactiver les actions sur soi-même. |

Fonctionnalités :

- **Liste des comptes** (avatar d'initiales, nom, prénom, e-mail, rôle, statut, date de création) chargée avec `getAgents()` et `getCentres()` en parallèle (`Promise.allSettled`), **paginée à 10 lignes** ;
- **onglets de filtre** par statut (Tous, En attente, Actifs, Bloqués) avec compteurs, plus une recherche libre sur le nom, le prénom, l'e-mail ou le rôle ;
- **lignes colorées** selon le statut : vert `actif`, jaune `en_attente`, rouge `inactif` — affiché « Bloqué » (classes `row-conforme`, `row-surveillance`, `row-critique`) ;
- **fiche de profil dépliable** : chaque ligne (`admin-row-clickable`, `tabIndex` +
  `aria-expanded`) s'ouvre au clic — ou à la touche `Entrée` / `Espace` — et déroule
  une carte `agent-profile` sous la ligne, presentation « profil utilisateur » du
  même style que la puce de l'en-tête. Le bouton « ▾ Fiche / ▴ Replier » de la
  colonne Actions fait la même chose ; cliquer sur un `button`, `select`, `input`
  ou `a` de la ligne ne déclenche pas le pliage. La fiche est unique : ouvrir un
  autre compte ferme le précédent (`profileId`), et la croix `✕` la replie. La
  carte `.agent-profile` est en `width: 100%` : elle occupe exactement la largeur
  du `td` étendu (`colSpan={5}`), donc la largeur réelle du tableau — plus
  aucune plafond `min(780px, …)` qui la rendait plus étroite que la datatable.
  Sur écran étroit, où le tableau garde un `min-width: 700px`, un `useEffect`
  ramène le `.table-wrap` en `scrollLeft: 0` et amène la carte dans la zone
  visible ;
- **la fiche est un brouillon** : elle porte l'identité (initiales, nom complet,
  e-mail, badge de statut), le **rôle / titre**, le **centre de rattachement** —
  liste des 105 centres renvoyés par `getCentres()` plus « Aucun centre (accès
  fermé) » —, le **périmètre de consultation** (`droits`), la **date de création**
  et l'**identifiant** technique. Nom, prénom et e-mail sont maintenant des
  champs saisissables (`updateAgentIdentite(id, { nom, prenom, email })` →
  `PATCH /api/agents/:id/identite`). Aucun de ces contrôles n'écrit en base :
  `ecrireBrouillon()` ne met à jour que l'état local `brouillons[ id ]` (et déplie
  la fiche au passage). Le pied de fiche affiche « N modification(s) non
  enregistrée(s) », un bouton « Reprendre les valeurs enregistrées » revient aux
  valeurs serveur, et seul `💾 Enregistrer` envoie les `PATCH` — identité, puis
  rôle, puis centre, dans cet ordre, uniquement pour les groupes réellement
  modifiés. La liste déroulante « Rôle / Titre » de la colonne du tableau est un
  raccourci vers le même brouillon. Les rôles non centrés n'ont pas de sélecteur
  de centre : la fiche affiche `centreResume(role, agent.nom_centre)` — le
  libellé `CENTRE_TEXTES` du périmètre, enrichi du centre d'affiliation quand le
  compte en porte un (« 🌐 Tous les centres (National) · affilié à SSIF » pour un
  administrateur ; `SSIF` est posé côté serveur par
  `PATCH /api/agents/:id/role`, voir
  [`../../../backend/migrations/008-centre-ssif-administrateurs.sql`](../../../backend/migrations/008-centre-ssif-administrateurs.sql)),
  et un paragraphe reprend la `description`
  du référentiel ;
- **toute action passe par [`../components/common/ModaleConfirmation.jsx`](../components/common/ModaleConfirmation.jsx)** :
  `enregistrer` (liste des paires « avant → après », une ligne par champ
  réellement modifié), `statut` (Activer / Bloquer, variante `danger` pour le
  blocage, libellé « Activation » pour un compte `en_attente` et « Réactivation »
  pour un compte bloqué), `motdepasse` (champ libre du mot de passe temporaire,
  4 caractères minimum, avec bouton « Afficher », puis `resetAgentPassword(id, password)`),
  `suppression` (variante `danger`, bouton « Oui, supprimer ») et `abandon`
  (fermer la fiche alors que le brouillon n'est pas vide). Une badge « N à
  enregistrer » reste visible sur la ligne refermée. Tant qu'une modale est
  ouverte, les erreurs serveur — `409` « Un autre compte utilise déjà cette
  adresse e-mail. », refus du dernier administrateur, `429` — s'affichent
  **dans la modale** (la bannière de page est masquée derrière l'obscurcissement)
  et le brouillon est conservé pour correction ;
- **activer / bloquer** un compte avec `updateAgentStatut(id, 'actif' | 'inactif')`,
  après validation de la modale : « Activer » autorise la connexion (c'est
  l'action qui rend utilisable un compte créé depuis `/signup`), « Bloquer » la
  refuse immédiatement, même si l'agent possède encore une session ouverte ;
- **supprimer** un compte : `deleteAgent(id)` après la modale « Action
  irréversible ».

Un message de succès unique résume l'enregistrement — « Compte … enregistré :
Prénom, Rôle / titre mis à jour. » — et n'ajoute l'avertissement « ce rôle ne
consulte que son centre » que lorsque le rôle vient justement d'être changé.

Garde-fous appliqués des deux côtés : sur son propre compte, les champs
d'identité, les sélecteurs et les actions sensibles sont désactivés — la fiche
reste ouvrable pour consulter le rôle, le centre, le périmètre et la date de
création ; chacun change son propre mot de passe depuis le profil de l'en-tête.
Le serveur, lui, refuse de désactiver, de rétrograder ou de supprimer le dernier
administrateur actif.

## `roles/pages/AdminRoles.jsx` — rôles et périmètre par centre

Page `/admin/roles`, réservée aux administrateurs comme les autres pages du
backoffice. Elle charge `getAgents()` et `getCentres()` en parallèle
(`Promise.allSettled`) et affiche un tableau « Agent / Statut / Rôle attribué /
Centre fiscal d'affectation / Périmètre de consultation ».

- **sept titres** gérés depuis un référentiel unique,
  [`utils/roles.utils.js`](utils/roles.utils.js) : `admin` (Administrateur),
  `inspecteur` (Inspecteur), `chef_centre` (Chef de centre), `controleur`
  (Contrôleur), `agent` (Agent Fiscal), `contribuable` (Contribuable) et `autre`
  (Autre), dans cet ordre. Chaque entrée porte `label`, `badge`, `couleur`,
  `description`, `droits` et `perimetre` (`backoffice`, `tous_lecture`, `centre`
  ou `aucun`, la même classification que `backend/src/utils/data-scope.js`,
  `tous_lecture` étant le national en consultation seule de l'inspecteur) ;
  `getRoleLabel(role)`
  traduit la valeur stockée en base, `roleDefinition(role)` renvoie l'entrée et
  `isCentreScoped(role)` dit si un centre de rattachement est nécessaire. `CENTRE_TEXTES`
  associe chaque `perimetre` à son libellé figé (icône, couleur, texte) et
  `centreResume(role, nomCentre)` rend ce libellé augmenté du centre
  d'affiliation — c'est ce que voient les administrateurs, rattachés d'office au
  centre `SSIF` sans que cela change leur périmètre national. Le même
  référentiel alimente la matrice explicative de cartes, les deux listes
  déroulantes de cette page, la colonne « Rôle / Titre » et la fiche de profil de
  `AdminUtilisateurs` et
  les tranches du camembert « Par Rôle utilisateur » — ajouter un rôle ne se fait
  donc qu'à un seul endroit ;
- le rôle se change par la liste déroulante `admin-role-select`, qui appelle
  `updateAgentRole(id, role)` ; passer à un rôle centré alors que l'agent n'a pas
  de centre affiche un avertissement dans le message de confirmation ;
- la colonne « Centre fiscal d'affectation » ne propose le sélecteur que pour les
  rôles centrés (`chef_centre`, `controleur`, `agent`) et écrit en base par
  `updateAgentCentre(id, id_centre)` → `PATCH /api/agents/:id/centre` (`null` =
  « Aucun centre (accès fermé) »). Les autres rôles affichent un libellé figé —
  « 🌐 Tous les centres (National) » pour `admin`, « 👁 Tous les centres
  (consultation seule) » pour `inspecteur`, « 🔒 Aucun centre de
  rattachement » pour `contribuable` et `autre`. L'affectation n'est plus stockée
  dans `localStorage` : elle revient identique d'un navigateur à l'autre et le
  serveur l'applique à chaque requête ;
- onglet de filtre par rôle et recherche libre, comme sur
  `AdminUtilisateurs` — le tableau est paginé à 10 lignes, la recherche couvre
  aussi le nom du centre et le filtre remet la page à `1`.

> L'accès au back-office reste binaire : `requireAdmin = authorize('admin')`. Tout
> autre rôle reçoit `403` sur `/api/agents/*`, ne voit que les modules métier dans
> le `Header` et atterrit sur `/acceuil`. Le périmètre de consultation, lui, est
> réellement appliqué côté serveur : `admin` et `inspecteur` voient tous les
> centres — mais l'`inspecteur` en consultation seule, ses `POST`, `PUT`, `PATCH`
> et `DELETE` sur les routes métier répondent `403` —, `chef_centre` /
> `controleur` / `agent` uniquement leur centre (`agents.id_centre`) et
> `contribuable` / `autre` aucun dossier — sans centre affecté, un rôle centré est
> traité comme sans périmètre. Les pages métier du front-office ne sont pas encore
> aveugles à ce droit d'écrire : un inspecteur voit les boutons de saisie et
> reçoit le `403` de l'API.

## `verification-nif/` — vérification NIF

`/admin/verification-nif` est une **page de synthèse** : trois cartes (une par
type de vérification) et le tableau du référentiel. Chaque carte porte un lien
`Ouvrir cette vérification →` vers sa **route dédiée**, où se trouve le
formulaire complet ; la page dédiée affiche elle-même les **trois dernières
opérations** de son type sous le formulaire.

| Type | Route dédiée | Ce qu'elle fait |
| --- | --- | --- |
| `sql` — requête | `/admin/verification-nif/sql` | carte verte « certifié » ou rouge « introuvable » après `getContribuableByNif(nif)` et repli sur le référentiel local ; **ou** petit tableau de lignes quand la saisie est un `SELECT … FROM contribuables` sans NIF |
| `excel` — fichier | `/admin/verification-nif/excel` | lecture client (`XLSX.read` / `sheet_to_json`), colonnes reconnues `NIF`/`nif`/`Numero`, `RaisonSociale`/`Nom`/`raison_sociale`, `Centre`/`centre`, puis fusion dans le référentiel |
| `json` — catalogue | `/admin/verification-nif/json` | synchronisation avec le catalogue des unités fiscales importé en module ([`@/data/referentiel-unites`](../data/referentiel-unites.js)) : le nom de la DGE + trois NIF de contrôle |

### Gabarits, journal d'erreurs et API JSON

* **Modèles téléchargeables.** `telechargerModeleExcel()` fabrique côté
  navigateur un classeur BIFF8 vierge d'une seule feuille « NIF » portant la
  ligne d'en-têtes `NIF · RaisonSociale · Centre`, sous le nom
  **`modele de verificationnif.xls`** ; `telechargerModeleJson()` produit
  **`modele de verificationnif.json`**, le même format en tableau d'objets. Tous
  deux utilisent la dépendance `xlsx` déjà présente (aucune dépendance nouvelle) et un
  `Blob` + `URL.createObjectURL` pour le JSON. Le contenu du gabarit JSON est
  aussi déposé en statique dans
  [`../../public/referentiel-nif/`](../../public/referentiel-nif/) — dossier que
  l'administrateur alimente lui-même pour exposer un référentiel.
* **Saisie longue sur la page `sql`.** Le champ est un `<textarea>` mono-espace
  de 7 lignes (`.verif-saisie textarea`, `Ctrl`+`Entrée` pour valider) :
  `extraireNifDepuisRequete()` y retient le **premier NIF à 10 chiffres**,
  éventuellement suivi d'une clé, et signale en avertissement s'il en trouve
  plusieurs. Un NIF seul reste accepté.
* **`SELECT` de liste rendu en tableau.** Quand la saisie commence par
  `SELECT`, ne contient aucun NIF à 10 chiffres et porte la table
  `contribuables`, `analyserSelectListe()` puis `executerSelectListe()`
  exécutent réellement la requête via `getContribuables({ limit, search })` :
  la projection est mappée sur les colonnes servies par l'API (`nif`,
  `raison_sociale`, `centre`, `secteur`, `regime`, `statut`,
  `nb_declarations` et leurs synonymes), `SELECT *` rend les sept, le premier
  littéral du `WHERE` devient le paramètre `search` (NIF / raison sociale /
  secteur) et `LIMIT n` est borné à 100. Le résultat s'affiche dans
  `.verif-liste` — en-tête « 📋 Résultat de la requête », compteur
  `n ligne(s) sur total · LIMIT k · filtre « … »` et `<table>` en classes
  `.table-wrap`. Une autre table, une projection sans colonne servie ou un
  `SELECT` incomplet remontent dans le journal d'erreurs ; une requête qui
  désigne un NIF garde la carte de vérification.
* **Journal d'erreurs.** [`verification-nif/components/ErreursVerification.jsx`](verification-nif/components/ErreursVerification.jsx)
  rend le bloc `.verif-erreurs` (`role="alert"`, titre + détail par ligne,
  bouton « ✕ Effacer le journal ») sur les trois pages : saisie non reconnue,
  NIF absent des deux sources, appel API en échec, classeur refusé, adresse
  refusée, réponse HTTP ou JSON invalide. Les succès continuent d'emprunter
  `.form-submit-message.success`.
* **API JSON enregistrables (page `json`).** Un formulaire `.datatable-toolbar`
  ajoute une adresse — `http(s)://…` ou un chemin du site à partir de `/`,
  contrôlé par `normaliserUrlApi()` qui refuse tout autre protocole. Chaque
  entrée de la liste (`.verif-api-item`) expose « ⟳ Synchroniser » (fetch,
  mapping tolérant via `normaliserLignesNif`, fusion dans le référentiel,
  horodatage et compteur de NIFs) et « ✕ Retirer ». La réponse attendue est un
  tableau, ou un objet portant `data`, `resultats` ou `referentiel`.

### Structure

* [`verification-nif/utils/verification.utils.js`](verification-nif/utils/verification.utils.js) concentre **toute** la logique
  (référentiel, historique, les trois opérations, les gabarits et les API JSON).
  La carte de synthèse et la page dédiée appellent les mêmes fonctions : elles ne
  peuvent pas diverger.
* [`verification-nif/components/VerificationNifLayout.jsx`](verification-nif/components/VerificationNifLayout.jsx) est le conteneur commun
  des trois pages : garde `role === 'admin'`, `AdminNav`, titre et lien
  « ← Retour à la vérification NIF ».
* [`verification-nif/components/HistoriqueVerification.jsx`](verification-nif/components/HistoriqueVerification.jsx) rend le tableau
  « Trois dernières vérifications » (Date & heure · Opération · Résultat) avec un
  badge `conforme` / `critique` selon `entry.reussi`.

### État local

Tout est en `localStorage`, rien n'est partagé entre agents ni stocké en base :

| Clé | Contenu |
| --- | --- |
| `referentiel_nif_admin` | référentiel complet (5 entrées par défaut + imports) |
| `verif_nif_historique_sql`, `..._excel`, `..._json` | les 3 dernières opérations **par type** (`HISTORIQUE_MAX = 3`) |
| `verif_nif_apis_json` | API JSON enregistrées depuis la page 3 : `{ id, url, label, date, synchroniseeLe?, nbNifs?, total? }` |

`mergeReferentiel()` garde la première occurrence d'un NIF (`Map`), `pushHistorique()`
ajoute l'entrée en tête puis tronque à 3. Les lectures d'historique se font dans
les initialiseurs de `useState` et les resets de page dans les gestionnaires
d'événements — `react-hooks/set-state-in-effect` interdit de le faire dans un
`useEffect`.

Le référentiel de la page de synthèse est enrichi au montage par
`getContribuables({ limit: 100 })` (statut `Certifié (Base SQL)`, source
`PostgreSQL / contribuables`). L'ancien bouton JSON faisait
`fetch('/unitefiscal.json')` : le catalogue vit à la racine du dépôt, pas dans
`frontend/public/`, la requête renvoyait donc `index.html` et levait
« Unexpected token '<' ». L'import en module corrige le problème ; l'ancienne
clé `unites_operationnelles.dge` n'existe pas non plus, c'est
`direction_des_grandes_entreprises`.

Le tableau de synthèse (NIF, raison sociale, centre, statut, source de
vérification) reste filtrable par `filtreTableau` et paginé à 10 lignes.

> L'intitulé du tableau utilise encore « Centre Fiscal Rattaché », alors que le
> reste de l'application a été renommé « centre gestionnaire ».

## `historique/` — journal d'audit

`AdminHistorique` est le conteneur de page (garde `role === 'admin'`, `AdminNav`,
titre) ; il délègue tout le contenu à `HistoriqueUtilisateurs`, qui appelle
`getHistoriqueAgents()` (`GET /api/agents/historique`) et affiche la traçabilité
des actions administratives : date, action, utilisateur ciblé, détails, auteur.

- onglets de filtre par `type_action` : `ACTIVATION`, `BLOCAGE`, `ROLE_CHANGE`,
  `CENTRE_UPDATE`, `IDENTITE_UPDATE`, `MDP_RESET`, `MDP_CHANGEMENT`,
  `RESET_REQUEST`, `SUPPRESSION` (+ `CREATION` gérée par `getActionInfo`) —
  les deux nouveaux types n'ont demandé aucune migration, `type_action` étant une
  simple colonne `varchar` ;
- recherche libre, compteur de lignes et pagination à 10 entrées par page —
  l'onglet, la recherche et le bouton d'actualisation remettent la page à `1` ;
- le filtrage est **entièrement côté client** : la requête API n'est pas
  paramétrée, alors que `GET /api/agents/historique` accepte `search`,
  `type_action` et `limit`.

## Contrat avec l'API

Les écrans de connexion et d'inscription s'appuient sur les routes publiques de
[`../../../backend/src/routes/auth.routes.js`](../../../backend/src/routes/auth.routes.js) :

| Appel | Corps | Codes et effet |
| --- | --- | --- |
| `POST /api/auth/login` | `email`, `password` | `400` si un champ manque ; `401` « Identifiants incorrects » si le compte est inconnu ou le mot de passe erroné ; `403` + `code: COMPTE_EN_ATTENTE` si `statut = en_attente` (l'écran de connexion redirige alors vers `/attente-activation`) ; `403` + `code: COMPTE_BLOQUE` pour tout autre statut non `actif` ; `429` après 5 échecs pour la même adresse (et 20 pour la même IP) pendant 15 minutes ; `200` avec le cookie `fiscal_session` (`httpOnly`, 8 h) et `{ success, user }` |
| `POST /api/auth/reset-request` | `email` | appelé par `/mot-de-passe-oublie` ; `400` si le format est invalide ; `429` au-delà de 10 envois par IP et par fenêtre ; `200` avec un message unique, que le compte existe ou non. Une ligne
`RESET_REQUEST` est ajoutée au journal, signée « Écran de connexion »
(`id_agent_auteur` reste `NULL`), uniquement quand l'adresse correspond à un compte |
| `POST /api/auth/register` | `nom`, `prenom`, `email`, `password` | `400` si un champ manque ou si un format est invalide ; `409` si l'e-mail est déjà utilisé ; `429` au-delà de 10 envois par IP et par fenêtre ; `201` avec un message d'attente |

Contraintes appliquées côté serveur (miroir des attributs HTML) :

- `nom` et `prenom` : non vides, 100 caractères maximum ;
- `email` : 255 caractères maximum, format `xxx@yyy.zzz` ;
- `password` : 4 caractères minimum **et** 72 octets maximum ;
- l'e-mail est normalisé en minuscules par le serveur ;
- le mot de passe est haché avec bcrypt (12 tours) ; le compte est créé avec
  `role = "agent"` et `statut = "en_attente"`.

La page `/admin` consomme les routes protégées de
[`../../../backend/src/routes/agent.routes.js`](../../../backend/src/routes/agent.routes.js),
toutes réservées au rôle `admin` (middleware `requireAdmin`) :

| Méthode et appel | Corps | Effet |
| --- | --- | --- |
| `GET /api/agents` | — | Liste des comptes (sans le mot de passe), chaque ligne portant `id_centre` et `nom_centre` ; filtres facultatifs `search`, `statut`, `role` |
| `PATCH /api/agents/:id/statut` | `{ statut }` (`actif`, `en_attente` ou `inactif`) | Active ou désactive le compte |
| `PATCH /api/agents/:id/role` | `{ role }` parmi `admin`, `chef_centre`, `inspecteur`, `controleur`, `agent`, `contribuable`, `autre` (validé par `AGENT_ROLES`) | Change le rôle / titre |
| `PATCH /api/agents/:id/centre` | `{ id_centre }` (identifiant du centre, `null` pour retirer) | Affecte le centre de rattachement qui borne le périmètre de consultation |
| `PATCH /api/agents/:id/identite` | `{ nom, prenom, email }` (obligatoires, e-mail validé et unique) | Corrige l'identité de l'agent ; `409` si l'e-mail est déjà pris |
| `PATCH /api/agents/:id/password` | `{ password }` | Réenregistre un mot de passe haché |
| `DELETE /api/agents/:id` | — | Supprime le compte (les contrôles et relances liés sont conservés, `id_agent` passe à `NULL`) |
| `GET /api/agents/historique` | — (query `search`, `type_action`, `limit`) | Journal d'audit des actions sur les comptes, consommé par `/admin/historique` |

Chaque mutation (`statut`, `role`, `centre`, `identite`, `password`, suppression)
écrit une ligne d'audit côté serveur — c'est ce qui alimente le journal.

Deux effets immédiats à connaître quand on administre un compte :

- bloquer (`statut = inactif`) ou supprimer un agent **casse sa session en
  cours** : `authenticate` relit le compte à chaque requête protégée, donc la
  prochaine appel du cookie encore valide renvoie `401` et l'écran de connexion
  réapparaît côté frontend ;
- une ligne `RESET_REQUEST` se traite avec `PATCH /api/agents/:id/password` :
  l'administrateur saisit lui-même le nouveau mot de passe temporaire dans la
  pop-up « 🔑 Mot de passe temporaire », le notifie à l'agent hors du système
  (aucun SMTP n'est configuré) et consigne ainsi le `MDP_RESET` correspondant ;
- l'agent reprend ensuite la main lui-même avec « 🔑 Changer mon mot de passe »
  du profil de l'en-tête (`POST /api/auth/change-password`, ligne
  `MDP_CHANGEMENT`). Le jeton déjà émis n'est **pas** révoqué — le projet n'a pas
  de magasin de sessions — donc les autres onglets ouverts de cet agent restent
  valables jusqu'à l'expiration du cookie (8 h) ; blocage ou suppression du
  compte, eux, coupent la session au coup suivant.

Réponses : `403` pour un rôle non administrateur, `404` si le compte n'existe
pas, `400` en cas de valeur invalide ou d'action sur son propre compte ou sur le
dernier administrateur actif.

## Points d'attention

- **Aucun jeton n'est stocké côté frontend** : la session repose sur le cookie
  `fiscal_session` posé par le backend et sur `withCredentials: true` de
  l'instance Axios. Les appels `/auth/*` passent par les fonctions de
  [`../api/auth.js`](../api/auth.js) (`connexion`, `inscrireAgent`, `getMoi`,
  `deconnexion`, `demanderReinitialisationMotDePasse`,
  `changerSonMotDePasse`), importées depuis le barrel `@/api`.
- **Un compte fraîchement créé ne peut pas se connecter** : `register` pose le
  statut `en_attente`, alors que `login` refuse tout statut différent de
  `actif` en renvoyant le même message qu'un mot de passe erroné. L'activation
  se fait désormais depuis la page `/admin` (bouton « Activer ») ; le script
  `npm run agent:create` du backend, lui, crée directement un compte `admin`
  actif.
- **Seuil de mot de passe incohérent** : l'inscription publique accepte 4
  caractères, alors que `scripts/create-agent.js` en exige 12. La chaîne
  « 4 caractères minimum » affichée dans `pages/Signup.jsx` et la règle serveur
  devront être alignées si la politique change.
- Les styles de ces trois écrans (`.login-page`, `.login-brand-panel`,
  `.login-kicker`, `.login-brand-caption`, `.login-panel-rule`,
  `.login-brand-note`, `.login-form-panel`, `.login-form`, `.login-intro`,
  `.login-field`, `.login-submit`, `.login-error`, `.login-success`,
  `.auth-link`, `.login-security-note`) sont définis dans
  [`../App.css`](../App.css).
