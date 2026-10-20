# Assets statiques (`/src/assets`)

Ce dossier est réservé aux ressources graphiques locales destinées à être importées dans les composants React : Vite les traite, les optimise et les hashe lors du build.

---

## Contenu réel du dossier

* `logodgi.jpg` : logo de la Direction Générale des Impôts, également utilisé comme favicon dans `public/favicon.jpg`.
* [`README.md`](README.md) : le présent fichier.

Il n'y a ni icône SVG, ni illustration, ni police locale dans ce dossier.

---

## Utilisation dans le code

Le logo est importé par deux modules (trois si l'on compte le composant non importé `users/login.jsx`) :

* [`../components/common/Header.jsx`](../components/common/Header.jsx) : `import logoDgi from '../../assets/logodgi.jpg';`
* [`../users/signin.jsx`](../users/signin.jsx) : `import logoDgi from '../assets/logodgi.jpg';`

```javascript
import logoDgi from '../assets/logodgi.jpg';

export default function LogoComponent() {
  return <img src={logoDgi} alt="Logo de la Direction Générale des Impôts" />;
}
```

---

## Distinction avec `public/`

* `src/assets/` : fichiers importés par le code, donc référencés par un chemin résolu par le bundler (`import ... from '...'`). C'est le cas de `logodgi.jpg`.
* `public/` : fichiers servis tels quels à la racine du serveur web et référencés par une URL absolue. Les seuls fichiers présents sont `/imgministeradgi.jpg` et `/imgrepublique.jpg`, utilisés dans `src/pages/accueil/Accueil.jsx`.

Remarque : `frontend/index.html` déclare `<link rel="icon" href="/favicon.svg" />`, mais aucun `favicon.svg` n'existe dans `public/`.
