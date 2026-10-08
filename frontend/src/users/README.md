# Écrans utilisateur (`/src/users`)

Ce dossier contient les écrans d'authentification des agents. Ils sont rendus
hors du layout protégé : le `Header` et la navigation métier n'y apparaissent
pas.

## Fichiers

### `signin.jsx` — écran de connexion effectivement utilisé

Composant monté par `App.jsx` sur la route `/` lorsque aucune session valide
n'est détectée. Il :

- affiche un panneau institutionnel (logo DGI, mentions République de
  Madagascar / DGI) et un formulaire e-mail + mot de passe ;
- contrôle les champs avec `useState` et soumet via
  `POST /api/auth/login` (client Axios de `../api/api`) ;
- affiche le message d'erreur renvoyé par l'API (`getErrorMessage`) et désactive
  le bouton pendant l'envoi ;
- appelle la propriété `onAuthenticated` fournie par `App.jsx`, puis redirige
  vers `/acceuil`.

| Propriété | Description |
| --- | --- |
| `onAuthenticated` | Callback appelé après une connexion réussie ; met à jour l'état d'authentification de `App.jsx`. |

### `login.jsx` — variante non importée

Écran équivalent (titre « Connexion », mêmes champs et même appel
`POST /api/auth/login`), mais **non importé** : `App.jsx` ne monte que
`signin.jsx`. Le fichier est actuellement un doublon conservé dans le dépôt et
pourra être supprimé ou remis en service après arbitrage.

## Points d'attention

- Le cookie de session `fiscal_session` est posé par le backend ; le frontend
  ne stocke aucun jeton et s'appuie sur `withCredentials` du client Axios.
- Le lien « S'inscrire » de `signin.jsx` pointe vers `/signup`, route qui
  n'existe pas dans `App.jsx` : elle retombe sur la redirection générique vers
  `/`. L'inscription publique n'est pas implémentée côté API ; les comptes
  agents sont créés avec le script `agent:create` du backend.
- Les styles de ces écrans (`.login-page`, `.login-brand-panel`,
  `.login-form`, `.login-submit`, `.login-error`, etc.) sont définis dans
  `../App.css`.
