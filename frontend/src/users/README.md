# Écrans utilisateur (`/src/users`)

Ce dossier regroupe les écrans liés aux comptes agents : la connexion et la
demande d'inscription (montées **hors du layout protégé**, donc sans `Header`),
et la page d'administration des utilisateurs (`/admin`), rendue à l'intérieur du
layout protégé.

## Fichiers

| Fichier | Composant | Route | État |
| --- | --- | --- | --- |
| [`signin.jsx`](signin.jsx) | `Signin({ onAuthenticated })` | `/` | **utilisé** |
| [`signup.jsx`](signup.jsx) | `Signup()` | `/signup` | **utilisé** |
| [`acceuiladmin.jsx`](acceuiladmin.jsx) | `AccueilAdmin({ currentUser })` | `/admin` | **utilisé** (administrateurs) |
| [`admin.jsx`](admin.jsx) | `Admin({ currentUser })` | `/admin/utilisateurs` | **utilisé** (administrateurs) |
| [`login.jsx`](login.jsx) | `Login({ onAuthenticated })` | aucune | **non importé** (doublon) |

## Routes

| Route | Déclaration dans `App.jsx` | Accès |
| --- | --- | --- |
| `/` | écran de connexion (`Signin`) si `GET /api/auth/me` échoue, sinon redirection vers `/acceuil` | public |
| `/signin` | redirection immédiate vers `/` | public |
| `/signup` | `Signup` | public |
| `/admin` | `AccueilAdmin` — tableau de bord des comptes agents | protégé, réservé aux administrateurs |
| `/admin/utilisateurs` | `Admin` — gestion des comptes | protégé, réservé aux administrateurs |

Les routes protégées sont regroupées dans une route de layout séparée qui, sans
session valide, redirige vers `/` : un agent non connecté ne peut donc pas
atteindre le reste de l'application.

Tant que la vérification `GET /api/auth/me` n'a pas répondu, `App.jsx` affiche
le message « Vérification de la session... » (classe `auth-loading`) à la place
de l'écran de connexion et du layout protégé.

## `signin.jsx` — connexion

Écran affiché sur `/` tant qu'aucune session valide n'est détectée. Il :

- affiche un panneau institutionnel (logo DGI, mention « République de
  Madagascar · DGI », titre TVA•SSIF et rappel du sigle du projet) et un
  formulaire e-mail + mot de passe ;
- conserve les champs et l'état d'envoi avec `useState` ;
- soumet via `api.post('/auth/login', { email, password })` (instance Axios de
  [`../api/api.js`](../api/api.js)) ;
- affiche l'erreur renvoyée par l'API avec `getErrorMessage` dans un paragraphe
  `role="alert"` et désactive le bouton pendant l'envoi ;
- appelle la propriété `onAuthenticated` fournie par `App.jsx`, puis redirige
  vers `/acceuil`, ou vers `/admin` lorsque l'agent connecté est administrateur
  (voir ci-dessous) ;
- propose le lien « S'inscrire » vers `/signup` (composant `Link` de
  `react-router-dom`).

| Propriété | Description |
| --- | --- |
| `onAuthenticated` | Callback appelé après une connexion réussie ; met à jour l'état `isAuthenticated` de `App.jsx`. |

Le bloc « Attendre les autorisations de l'administrateur du site. » rappelle que
les comptes sont activés manuellement (voir la section API ci-dessous).

### Redirection des administrateurs

`signin.jsx` choisit la page d'arrivée à partir du rôle renvoyé par l'API :

```js
const getLandingPath = (user) => (user?.role === 'admin' ? '/admin' : '/acceuil');
```

- **rôle `admin`** → `/admin`, la page de gestion des utilisateurs ;
- **tout autre rôle** → `/acceuil`, le tableau de bord.

Le rôle provient de la réponse de `POST /api/auth/login`, donc d'une session
réellement authentifiée : il n'y a aucun contournement possible. L'espace
administrateur est dédié à la gestion des comptes : le `Header` d'un admin ne
présente que le module « Utilisateurs » (son logo pointe également vers
`/admin`), tandis qu'un agent non administrateur qui ouvrirait `/admin` à la
main verrait le message « réservé aux administrateurs » (`403` côté API).

> Aucun compte n'est administrateur par défaut : le premier doit être créé avec
> `npm run agent:create` dans `backend/` (ou promu depuis la base), après quoi
> les rôles se gèrent directement depuis `/admin`.

## `signup.jsx` — demande de création de compte

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
4. en cas de succès, le message renvoyé par l'API (`response.data.message`) est
   affiché dans un paragraphe `role="status"` et les deux champs de mot de passe
   sont vidés (le nom, le prénom et l'e-mail restent saisis) ;
5. en cas d'échec, `getErrorMessage` affiche le message de l'API (par exemple
   « Un compte utilise déjà cette adresse e-mail »).

Le lien « Déjà inscrit ? Se connecter » ramène vers `/`.

## `acceuiladmin.jsx` — tableau de bord de l'administrateur

Page d'accueil de l'espace admin (`/admin`) : c'est là qu'arrive tout
administrateur après sa connexion. Elle présente :

- **quatre indicateurs** — nombre total de comptes, comptes actifs, demandes en attente d'activation et comptes bloqués (le chiffre prend la couleur de l'état) ;
- une **alerte cliquable** lorsqu'il reste des demandes à traiter : le lien ouvre la liste pré-filtrée sur `en_attente` (`state={{ statut: 'en_attente' }}`) ;
- la **répartition des comptes** par statut sous forme de barres avec pourcentages, complétée par le nombre d'administrateurs et d'agents simples ;
- les **cinq derniers comptes créés** (nom, e-mail, statut, date) ;
- deux **accès rapides** vers `/admin/utilisateurs`.

| Propriété | Description |
| --- | --- |
| `currentUser` | Agent connecté (`{ id, email, nom, prenom, role }`) fourni par `App.jsx` ; sert à personnaliser le message d'accueil et à refuser la page aux non-administrateurs. |

Toutes les statistiques sont agrégées dans la page à partir de `getAgents()` :
aucun endpoint de statistiques n'existe côté serveur.

## `admin.jsx` — gestion des utilisateurs

Page de gestion des comptes montée sur `/admin/utilisateurs`, **à l'intérieur du
layout protégé**. C'est l'espace de l'administrateur : quand
`currentUser.role === 'admin'`, le `Header` ne présente que « Accueil »
(`/admin`) et « Utilisateurs » (`/admin/utilisateurs`), et le logo renvoie vers
`/admin` — les modules fiscaux ne sont donc pas proposés à un admin. La page
affiche un lien « ← Retour au tableau de bord ». L'API répond `403` à tout autre
rôle, et si un agent non administrateur ouvre l'URL directement, la page affiche
un message « réservée aux administrateurs » au lieu de la liste.

| Propriété | Description |
| --- | --- |
| `currentUser` | Agent connecté (`{ id, email, nom, prenom, role }`) fourni par `App.jsx` ; sert à afficher le module dans le `Header`, à marquer « votre compte » et à désactiver les actions sur soi-même. |

Fonctionnalités :

- **Liste des comptes** (nom, prénom, e-mail, rôle, statut, date de création) chargée avec `getAgents()` ;
- **onglets de filtre** par statut (Tous, En attente, Actifs, Bloqués) avec compteurs, plus une recherche libre sur le nom, le prénom, l'e-mail ou le rôle ;
- **lignes colorées** selon le statut : vert `actif`, jaune `en_attente`, rouge `inactif` — affiché « Bloqué » (classes `row-conforme`, `row-surveillance`, `row-critique`) ;
- **activer / bloquer** un compte avec `updateAgentStatut(id, 'actif' | 'inactif')` : « Activer » autorise la connexion (c'est l'action qui rend utilisable un compte créé depuis `/signup`), « Bloquer » la refuse ;
- **changer le rôle** par liste déroulante : `updateAgentRole(id, 'agent' | 'admin')` ;
- **réinitialiser le mot de passe** : un formulaire se déplie sous la ligne et appelle `resetAgentPassword(id, password)` (4 caractères minimum, 72 octets maximum) ;
- **supprimer** un compte : une confirmation se déplie sous la ligne avant l'appel à `deleteAgent(id)`.

Garde-fous appliqués des deux côtés : les actions sensibles sont désactivées sur
son propre compte (statut, rôle, suppression) et le serveur refuse de
désactiver, de rétrograder ou de supprimer le dernier administrateur actif.

## Contrat avec l'API

Les écrans de connexion et d'inscription s'appuient sur les routes publiques de
[`backend/src/routes/auth.routes.js`](../../../backend/src/routes/auth.routes.js) :

| Appel | Corps | Codes et effet |
| --- | --- | --- |
| `POST /api/auth/login` | `email`, `password` | `400` si un champ manque ; `401` « Identifiants incorrects » si le mot de passe est faux **ou** si le compte n'est pas au statut `actif` ; `200` avec le cookie `fiscal_session` (`httpOnly`, 8 h) et `{ success, user }` |
| `POST /api/auth/register` | `nom`, `prenom`, `email`, `password` | `400` si un champ manque ou si un format est invalide ; `409` si l'e-mail est déjà utilisé ; `201` avec un message d'attente |

Contraintes appliquées côté serveur (miroir des attributs HTML) :

- `nom` et `prenom` : non vides, 100 caractères maximum ;
- `email` : 255 caractères maximum, format `xxx@yyy.zzz` ;
- `password` : 4 caractères minimum **et** 72 octets maximum ;
- l'e-mail est normalisé en minuscules par le serveur ;
- le mot de passe est haché avec bcrypt (12 tours) ; le compte est créé avec
  `role = "agent"` et `statut = "en_attente"`.

La page `/admin` consomme les routes protégées de
[`backend/src/routes/agent.routes.js`](../../../backend/src/routes/agent.routes.js),
toutes réservées au rôle `admin` (middleware `requireAdmin`) :

| Méthode et appel | Corps | Effet |
| --- | --- | --- |
| `GET /api/agents` | — | Liste des comptes (sans le mot de passe) ; filtres facultatifs `search`, `statut`, `role` |
| `PATCH /api/agents/:id/statut` | `{ statut }` (`actif`, `en_attente` ou `inactif`) | Active ou désactive le compte |
| `PATCH /api/agents/:id/role` | `{ role }` (`agent` ou `admin`) | Change le rôle |
| `PATCH /api/agents/:id/password` | `{ password }` | Réenregistre un mot de passe haché |
| `DELETE /api/agents/:id` | — | Supprime le compte (les contrôles et relances liés sont conservés, `id_agent` passe à `NULL`) |

Réponses : `403` pour un rôle non administrateur, `404` si le compte n'existe
pas, `400` en cas de valeur invalide ou d'action sur son propre compte ou sur le
dernier administrateur actif.

## Points d'attention

- **Aucun jeton n'est stocké côté frontend** : la session repose sur le cookie
  `fiscal_session` posé par le backend et sur `withCredentials: true` de
  l'instance Axios. Aucune fonction d'authentification n'est exportée par
  [`../api/api.js`](../api/api.js), les appels `/auth/*` utilisent
  directement l'instance par défaut.
- **Un compte fraîchement créé ne peut pas se connecter** : `register` pose le
  statut `en_attente`, alors que `login` refuse tout statut différent de
  `actif` en renvoyant le même message qu'un mot de passe erroné. L'activation
  se fait désormais depuis la page `/admin` (bouton « Activer ») ; le script
  `npm run agent:create` du backend, lui, crée directement un compte `admin`
  actif.
- **Seuil de mot de passe incohérent** : l'inscription publique accepte 4
  caractères, alors que `scripts/create-agent.js` en exige 12. La chaîne
  « 4 caractères minimum » affichée dans `signup.jsx` et la règle serveur
  devront être alignées si la politique change.
- **`login.jsx` est un doublon non monté** : le fichier n'est importé par aucun
  module, son titre est « Connexion » (celui de `signin.jsx` est « Sign in ») et
  il ne contient pas le lien vers `/signup`. Il peut être supprimé, ou remis en
  service après mise à jour.
- Les styles de ces trois écrans (`.login-page`, `.login-brand-panel`,
  `.login-kicker`, `.login-brand-caption`, `.login-panel-rule`,
  `.login-brand-note`, `.login-form-panel`, `.login-form`, `.login-intro`,
  `.login-field`, `.login-submit`, `.login-error`, `.login-success`,
  `.auth-link`, `.login-security-note`) sont définis dans
  [`../App.css`](../App.css).
