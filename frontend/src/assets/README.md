# Assets statiques (`/src/assets`)

Ce dossier est réservé aux ressources graphiques locales destinées à être importées dans les composants React : Vite les traite, les optimise et les hashe lors du build.

---

## Contenu réel du dossier

* `logodgi.jpg` : logo de la Direction Générale des Impôts, également utilisé comme favicon dans `public/favicon.jpg`.
* [`README.md`](README.md) : le présent fichier.

Il n'y a ni icône SVG, ni illustration, ni police locale dans ce dossier.

---

## Utilisation dans le code

Le logo est importé par six modules, tous avec le même chemin d'alias :

* [`../components/common/Header.jsx`](../components/common/Header.jsx)
* [`../backofficeadmin/auth/pages/Signin.jsx`](../backofficeadmin/auth/pages/Signin.jsx)
* [`../backofficeadmin/auth/pages/Signup.jsx`](../backofficeadmin/auth/pages/Signup.jsx)
* [`../backofficeadmin/auth/pages/AttenteActivation.jsx`](../backofficeadmin/auth/pages/AttenteActivation.jsx)
* [`../backofficeadmin/auth/pages/MotDePasseOublie.jsx`](../backofficeadmin/auth/pages/MotDePasseOublie.jsx)
* [`../accountcontribuable/pages/EspaceContribuable.jsx`](../accountcontribuable/pages/EspaceContribuable.jsx)

> L'ancien doublon `backofficeadmin/auth/login.jsx` (écran de connexion quasi
> identique à `signin.jsx`, non monté et importé par personne) a été supprimé :
> ses chemins relatifs `'../api/api'` et `'../assets/logodgi.jpg'` ne résolaient
> plus depuis le déplacement du dossier et il aurait cassé le build s'il avait
> été importé.

```javascript
import logoDgi from '@/assets/logodgi.jpg';

export default function LogoComponent() {
  return <img src={logoDgi} alt="Logo de la Direction Générale des Impôts" />;
}
```

---

## Distinction avec `public/`

* `src/assets/` : fichiers importés par le code, donc référencés par un chemin résolu par le bundler (`import ... from '...'`). C'est le cas de `logodgi.jpg`.
* `public/` : fichiers servis tels quels à la racine du serveur web et référencés par une URL absolue. Les seuls fichiers présents sont `/imgministeradgi.jpg` et `/imgrepublique.jpg`, utilisés dans `src/frontofficeagent/accueil/pages/Accueil.jsx`.

Remarque : `frontend/index.html` déclare `<link rel="icon" href="/favicon.svg" />`, mais aucun `favicon.svg` n'existe dans `public/`.
