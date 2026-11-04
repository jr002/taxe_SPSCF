# Assets statiques (`/src/assets`)

Ce dossier est réservé aux ressources graphiques locales destinées à être importées dans les composants React : Vite les traite, les optimise et les hashe lors du build.

---

## Contenu réel du dossier

* `logodgi.jpg` : logo de la Direction Générale des Impôts, également utilisé comme favicon dans `public/favicon.jpg`.
* [`README.md`](README.md) : le présent fichier.

Il n'y a ni icône SVG, ni illustration, ni police locale dans ce dossier.

---

## Utilisation dans le code

Le logo est importé par sept modules, tous avec le même chemin d'alias :

* [`../components/common/Header.jsx`](../components/common/Header.jsx)
* [`../frontofficeagent/accueil/pages/Accueil.jsx`](../frontofficeagent/accueil/pages/Accueil.jsx)
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
* `public/` : fichiers servis tels quels à la racine du serveur web et référencés par une URL absolue. `/favicon.jpg` sert d'icône d'onglet, et `referentiel-nif/` contient les catalogues JSON lus par la vérification NIF. Les deux visuels `/imgministeradgi.jpg` et `/imgrepublique.jpg` sont encore servis mais **plus importés par aucun écran** : l'ancien « accueil vitrine » de `src/frontofficeagent/accueil/pages/Accueil.jsx` les affichait dans son héro ; le poste de travail actuel montre le logo DGI de `src/assets/`, le même que l'en-tête et la connexion.

Remarque : `frontend/index.html` déclare `<link rel="icon" type="image/jpeg" href="/favicon.jpg" />` ; ce fichier existe bien dans `public/` (une version antérieure pointait sur un `favicon.svg` qui n'a jamais existé).
