# Module API client (`/src/api`)

Ce dossier centralise la configuration du client HTTP et les fonctions de communication avec l'API REST backend.

---

## Fichiers

* [`api.js`](api.js) : unique module du dossier. Il n'existe aucun autre fichier (pas de module d'authentification, pas de service séparé).

---

## Configuration de l'instance

L'instance Axios est exportée par défaut (`export default api`) et créée avec :

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

### Contribuables

* `getContribuables(params = {})` — `GET /contribuables`.
* `getContribuableById(id)` — `GET /contribuables/:id`.
* `getContribuableByNif(nif)` — `GET /contribuables?search=<nif>&limit=20`, puis recherche de l'élément dont `nif` correspond exactement. Renvoie `undefined` si aucun résultat (désenchaînement `result.data?.data?.data?.find(...)`).
* `createContribuable(payload)` — `POST /contribuables`.

### Centres

* `getCentres()` — `GET /centres`.
* `getCentreById(id)` — `GET /centres/:id`.
* `createCentre(payload)` — `POST /centres`.
* `updateCentre(id, payload)` — `PUT /centres/:id`.
* `deleteCentre(id)` — `DELETE /centres/:id` (renvoie `res.data`, non déballé).

### Agents (administration)

Réservées au rôle `admin` côté serveur, ces fonctions alimentent la page [`../users/admin.jsx`](../users/admin.jsx) :

* `getAgents(params = {})` — `GET /agents`, filtres facultatifs `search`, `statut`, `role`.
* `updateAgentStatut(id, statut)` — `PATCH /agents/:id/statut` avec `{ statut }` (`actif`, `en_attente` ou `inactif`).
* `updateAgentRole(id, role)` — `PATCH /agents/:id/role` avec `{ role }` (`agent` ou `admin`).
* `resetAgentPassword(id, password)` — `PATCH /agents/:id/password` avec `{ password }`.
* `deleteAgent(id)` — `DELETE /agents/:id` (renvoie `res.data`, non déballé).

### Recoupements

* `createRecoupement(payload)` — `POST /recoupements`.
* `getRecoupementsByContribuable(idContribuable)` — `GET /recoupements/:idContribuable/analyser`.

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

Les routes d'authentification ne sont pas encapsulées dans des fonctions de `api.js` ; elles sont appelées directement via l'instance exportée par défaut :

* `POST /auth/login` — depuis [`../users/signin.jsx`](../users/signin.jsx).
* `GET /auth/me` — depuis [`../App.jsx`](../App.jsx).
* `POST /auth/logout` — depuis [`../App.jsx`](../App.jsx).

---

## Exemple d'utilisation

```javascript
import api, { getDeclarations, createContribuable, getErrorMessage } from '../api/api';

try {
  const declarations = await getDeclarations({ limit: 100 });
  console.log(declarations);
} catch (error) {
  console.error(getErrorMessage(error));
}

// Accès direct à l'instance pour les routes non encapsulées
await api.get('/auth/me');
```
