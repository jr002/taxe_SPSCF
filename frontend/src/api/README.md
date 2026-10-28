# Module API client (`/src/api`)

Ce dossier centralise la configuration du client HTTP et les fonctions de communication avec l'API REST backend.

---

## Fichiers

Un module par domaine métier, une instance HTTP commune :

| Fichier | Contenu |
| --- | --- |
| [`client.js`](client.js) | l'instance Axios, exportée par défaut ; c'est le seul fichier à créer le client |
| [`erreurs.js`](erreurs.js) | `getErrorMessage`, seul utilitaire partagé de gestion d'erreur |
| [`auth.js`](auth.js) | `/auth/*` — connexion, inscription, session, mot de passe |
| [`contribuables.js`](contribuables.js), [`declarations.js`](declarations.js), [`controles.js`](controles.js), [`procedure-contradictoire.js`](procedure-contradictoire.js) | registre, déclarations, contrôles et actes de la procédure |
| [`recoupements.js`](recoupements.js), [`droits-communication.js`](droits-communication.js), [`rapprochements.js`](rapprochements.js), [`etats-contribuable.js`](etats-contribuable.js) | données de confrontation et restitutions du dossier |
| [`relances.js`](relances.js), [`centres.js`](centres.js), [`agents.js`](agents.js), [`acces-contribuable.js`](acces-contribuable.js) | recouvrement, référentiel territorial, comptes agents et jetons du portail |
| [`index.js`](index.js) | la porte d'entrée : les écrans importent `@/api` et seulement les fonctions de leur domaine |

Le lecteur appelant les fonctions listées ci-dessous trouve chaque groupe dans le
module du même nom. `@/api` ne ré-exporte pas l'instance brute : un appel ponctuel
`api.get(...)` reste visible et se lit dans `@/api/client`.

---

## Configuration de l'instance

L'instance Axios est exportée par défaut depuis [`client.js`](client.js) et créée avec :

* `baseURL` : `import.meta.env.VITE_API_URL` si la variable est définie, sinon `/api`. En développement, Vite relaie `/api` vers `http://localhost:5000` (voir `server.proxy` dans [`../../vite.config.js`](../../vite.config.js)).
* `timeout` : `10000` ms.
* `withCredentials` : `true` — l'authentification repose sur un cookie de session, **aucun jeton JWT n'est stocké ni envoyé**. Il n'existe ni intercepteur de requête, ni intercepteur de réponse dans ce fichier.

---

## Fonctions exportées

### Utilitaire

* `getErrorMessage(error)` : renvoie `error.response.data.message`, sinon `error.message`, sinon le message générique « Une erreur réseau est survenue. Veuillez vérifier votre connexion. ».

### Déclarations

* `getDeclarations(params = {})` — `GET /declarations` avec `limit: 250` par défaut, surchargeable ; renvoie `res.data.data`.
* `getDeclarationById(id)` — `GET /declarations/:id`.
* `getDeclarationStats()` — `GET /declarations/stats`.
* `createDeclaration(payload)` — `POST /declarations`.
* `updateDeclaration(id, payload)` — `PUT /declarations/:id`.

### Contribuables

* `getContribuables(params = {})` — `GET /contribuables`. La réponse paginée (`{ data, pagination }`) inclut déjà les `declarations` de chaque contribuable, ce dont se sert la vue Statistique du registre.
* `getContribuableById(id)` — `GET /contribuables/:id`.
* `getContribuableByNif(nif)` — `GET /contribuables?search=<nif>&limit=20`, puis recherche de l'élément dont `nif` correspond exactement. Renvoie `undefined` si aucun résultat (désenchaînement `result.data?.data?.data?.find(...)`).
* `createContribuable(payload)` — `POST /contribuables`.

### Accès contribuable (portail)

* `genererAccesContribuable(idContribuable, payload = {})` — `POST /contribuables/:idContribuable/acces-contribuable`, avec `{ duree_jours }` (1 à 30). Route **agent** : appelée par `LienAccesModal.jsx`, elle renvoie le jeton brut, le `chemin`, la `date_expiration` et l'`email_masque`.
* `getStatutAccesContribuable(token)` — `GET /acces-contribuable/:token`. Le jeton est passé par `encodeURIComponent`. Pas de cookie agent attendu : la fonction est appelée par le portail, hors session.
* `ouvrirAccesContribuable(token, { nif, email })` — `POST /acces-contribuable/:token/ouvrir`. Renvoie le dossier complet en lecture seule après confirmation de l'identité.

Ces deux dernières fonctions sont les seules du client à viser une route publique
sans `fiscal_session` ; `api.get('/auth/me')` n'est jamais appelé sur une URL
`/espace-contribuable/…` (voir [`../README.md`](../README.md)).

### Centres

* `getCentres()` — `GET /centres`.
* `getCentreById(id)` — `GET /centres/:id`.
* `createCentre(payload)` — `POST /centres`.
* `updateCentre(id, payload)` — `PUT /centres/:id`.
* `deleteCentre(id)` — `DELETE /centres/:id` (renvoie `res.data`, non déballé).

### Agents (administration)

Réservées au rôle `admin` côté serveur, ces fonctions alimentent les pages de [`../backofficeadmin/`](../backofficeadmin/) — `AdminUtilisateurs`, `AdminRoles`, `AdminDashboard` et `HistoriqueUtilisateurs` :

* `getAgents(params = {})` — `GET /agents`, filtres facultatifs `search`, `statut`, `role`.
* `updateAgentStatut(id, statut)` — `PATCH /agents/:id/statut` avec `{ statut }` (`actif`, `en_attente` ou `inactif`).
* `updateAgentRole(id, role)` — `PATCH /agents/:id/role` avec `{ role }` (l'une des sept valeurs du référentiel `backofficeadmin/utils/roles.utils.js`).
* `updateAgentCentre(id, idCentre)` — `PATCH /agents/:id/centre` avec `{ id_centre }` (`null` pour retirer l'affectation). Renvoie `res.data` non déballé pour que la page affiche le message du serveur, qui indique le périmètre effectif.
* `resetAgentPassword(id, password)` — `PATCH /agents/:id/password` avec `{ password }`. Utilisé par la pop-up « 🔑 Mot de passe temporaire » de la fiche admin.
* `updateAgentIdentite(id, { nom, prenom, email })` — `PATCH /agents/:id/identite`. Renvoie l'agent mis à jour ; un `409` (« Un autre compte utilise déjà cette adresse e-mail. ») est affiché par la modale de confirmation plutôt que par la bannière de page.
* `deleteAgent(id)` — `DELETE /agents/:id` (renvoie `res.data`, non déballé).
* `getHistoriqueAgents(params = {})` — `GET /agents/historique`, journal des opérations d'administration.

### Recoupements

* `getRecoupements(params = {})` — `GET /recoupements` ; filtres `page`, `limit`, `search`, `periode`, `source`, `type_operation`, `id_contribuable`. Utilisé par `RecoupementsPanel` de la fiche contribuable.
* `getRecoupementById(id)` — `GET /recoupements/:id`.
* `createRecoupement(payload)` — `POST /recoupements`.
* `updateRecoupement(id, payload)` — `PUT /recoupements/:id`.
* `deleteRecoupement(id)` — `DELETE /recoupements/:id` (renvoie `res.data`, non déballé).
* `getRecoupementsByContribuable(idContribuable)` — `GET /recoupements/:idContribuable/analyser`.
* `getRecoupementSourceStats()` — `GET /recoupements/stats/sources`.

### Droits de communication

Fiche complète d'une demande de communication adressée à un tiers (`tier`, `type_tier`, `nif_tier`, `objet`, `pieces_demandees`, `date_demande`, `date_reponse`, `statut`, `documents_recus`, `observations`) ; le `statut` vaut `demande` (défaut), `reponse`, `partiel`, `relance` ou `sans_suite`. La création horodate `id_agent` depuis la session côté serveur.

* `getDroitsCommunication(params = {})` — `GET /droits-communication` ; filtres `page`, `limit`, `id_contribuable`, `statut`, `search`.
* `getDroitCommunicationById(id)` — `GET /droits-communication/:id`.
* `createDroitCommunication(payload)` — `POST /droits-communication`.
* `updateDroitCommunication(id, payload)` — `PUT /droits-communication/:id`.
* `deleteDroitCommunication(id)` — `DELETE /droits-communication/:id` (renvoie `res.data`, non déballé).

Les statistiques par statut (`GET /droits-communication/stats/statuts`) sont exposées par l'API mais aucun appel n'est encore encapsulé ici.

### Rapprochements (confrontation)

* `getRapprochements(params = {})` — `GET /rapprochements`.
* `getRapprochementById(id)` — `GET /rapprochements/:id`.
* `getRapprochementStats()` — `GET /rapprochements/stats`.
* `createRapprochement(payload)` — `POST /rapprochements`.
* `confronterRapprochement(payload)` — `POST /rapprochements/confronter`.
* `autoRapprocherContribuable(idContribuable, params = {})` — `POST /rapprochements/auto/:idContribuable` (query `periode` facultative).
* `updateRapprochementStatut(id, payload)` — `PATCH /rapprochements/:id/statut`.
* `updateRapprochement(id, payload)` — `PUT /rapprochements/:id`.
* `deleteRapprochement(id)` — `DELETE /rapprochements/:id` (renvoie `res.data`, non déballé).

### État contribuable

* `getEtatsContribuable(params = {})` — `GET /etat-contribuable`.
* `getHistoriqueEtatContribuable(idContribuable)` — `GET /contribuables/:idContribuable/etat`.
* `getDernierEtatContribuable(idContribuable)` — `GET /etat-contribuable/contribuable/:idContribuable/latest`.
* `createEtatContribuable(idContribuable, payload)` — `POST /contribuables/:idContribuable/etat`.
* `getEtatStats()` — `GET /etat-contribuable/stats`.

### Relances

* `getRelances(params = {})` — `GET /relances`.
* `getRelanceById(id)` — `GET /relances/:id`.
* `getRelancesByContribuable(idContribuable)` — `GET /contribuables/:idContribuable/relances`.
* `createRelance(payload)` — `POST /relances`.
* `updateRelance(id, payload)` — `PUT /relances/:id`.
* `getRelanceStats()` — `GET /relances/stats`.

### Contrôles

* `effectuerControle(idDeclaration, payload = {})` — `POST /controles/:idDeclaration/effectuer`.
* `getControlesDeclaration(idDeclaration)` — `GET /controles/:idDeclaration/historique`.

### Procédure contradictoire et redressements (CGI 2026)

* `emettreNotificationPrimitive(idDeclaration, payload = {})` — `POST /declarations/:idDeclaration/notification-primitive`.
* `emettreNotificationDefinitive(idDeclaration, payload = {})` — `POST /declarations/:idDeclaration/notification-definitive`.
* `imputerCreditImpot(idDeclaration, payload = {})` — `POST /declarations/:idDeclaration/imputer-credit`.

Sauf indication contraire ci-dessus et pour `deleteCentre`, chaque fonction renvoie `res.data.data`.

---

## Points d'entrée d'authentification

Les routes d'authentification ne sont pas encapsulées dans des fonctions de `api.js` ; elles sont appelées directement via l'instance exportée par défaut (seule exception : `changeOwnPassword`, voir ci-dessous) :

* `POST /auth/login` — depuis [`../backofficeadmin/auth/pages/Signin.jsx`](../backofficeadmin/auth/pages/Signin.jsx).
* `POST /auth/reset-request` — depuis la page dédiée [`../backofficeadmin/auth/pages/MotDePasseOublie.jsx`](../backofficeadmin/auth/pages/MotDePasseOublie.jsx) (`/mot-de-passe-oublie`), atteinte par le lien « Mot de passe oublié ? » de l'écran de connexion ; un `429` du limiteur backend remonte dans le message affiché par `getErrorMessage`.
* `GET /auth/me` — depuis [`../App.jsx`](../App.jsx).
* `POST /auth/logout` — depuis [`../App.jsx`](../App.jsx).
* `changerSonMotDePasse({ password_actuel, password_nouveau, password_confirmation })` — `POST /auth/change-password`, exporté par `api/auth.js` et appelé par la modale « 🔑 Changer mon mot de passe » de [`../components/common/UserProfile.jsx`](../components/common/UserProfile.jsx). Renvoie `res.data` entier pour que la modale affiche le message du serveur ; un `429` ou un `400` (« Mot de passe actuel incorrect. ») remonte par `getErrorMessage` dans la modale.

---

## Exemple d'utilisation

```javascript
import { getDeclarations, createContribuable, getErrorMessage } from '@/api';

try {
  const declarations = await getDeclarations({ limit: 100 });
  console.log(declarations);
} catch (error) {
  console.error(getErrorMessage(error));
}

// Une route encore non encapsulée passe par l'instance brute
import api from '@/api/client';
await api.get('/nouvelle-route');
```
