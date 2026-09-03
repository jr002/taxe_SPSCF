# 🌐 Module API Client (`/src/api`)

Ce dossier centralise la configuration du client HTTP et toutes les fonctions de communication avec l'API REST backend.

---

## 📁 Fichiers

* **[`api.js`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/api/api.js)** :
  * Instance Axios configurée avec `baseURL` dynamique (`/api` via le proxy Vite en dev ou `VITE_API_URL`).
  * Intercepteur d'authentification pour attacher automatiquement le token JWT (`Bearer <token>`) stocké dans le `localStorage`.
  * Fonctions de mapping d'API :
    * **Déclarations** : `getDeclarations`, `getDeclarationById`, `getDeclarationStats`, `createDeclaration`
    * **Entreprises** : `getEntreprises`, `getEntrepriseById`, `getEntrepriseByNif`, `createEntreprise`
    * **Recoupements** : `createRecoupement`, `getRecoupementsByEntreprise`
    * **Contrôles** : `effectuerControle`, `getControlesDeclaration`
    * **Gestion d'erreurs** : `getErrorMessage(error)` pour formater un message lisible utilisateur.

---

## 💡 Exemple d'utilisation

```javascript
import { getDeclarations, createEntreprise, getErrorMessage } from '../api/api';

// Récupérer la liste des déclarations
try {
  const declarations = await getDeclarations({ limit: 100 });
  console.log(declarations);
} catch (error) {
  console.error(getErrorMessage(error));
}
```
