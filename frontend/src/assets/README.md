# 🎨 Assets Statiques (`/src/assets`)

Ce dossier est réservé aux ressources multimédias et graphiques locales de l'application (logos, icônes SVG, illustrations, polices) destinées à être importées directement dans les composants React via le bundler Vite.

---

## 📌 Distinction Assets vs Public

* **`src/assets/`** : Fichiers statiques traités, optimisés et hashés par Vite lors du build (ex : `import logo from '../assets/logo.svg'`).
* **`public/`** : Fichiers statiques servis tels quels à la racine du serveur web (ex : `/imgministeradgi.jpg`, `/imgrepublique.jpg`, `favicon.ico`).

---

## 💡 Exemple d'utilisation dans un composant React

```javascript
import logoDgi from '../assets/logo.svg';

export default function LogoComponent() {
  return <img src={logoDgi} alt="Logo DGI" className="h-10 w-auto" />;
}
```
