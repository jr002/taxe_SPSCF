# Utilitaires et fonctions pures (`/src/utils`)

Ce dossier regroupe les formateurs et les algorithmes de calcul métier du frontend. Aucun fichier n'importe React : ce sont des modules de fonctions pures, à l'exception notable de leur extension de fichier `.jsx` (voir la remarque en fin de page).

---

## Fichiers

### 1. [`formatters.jsx`](formatters.jsx)

Fonctions de formatage des montants et des nombres, fondées sur un `Intl.NumberFormat('fr-FR')` commun (`maximumFractionDigits: 0`).

* `formatAriary(val)` : formate un montant en Ariary, ex. `"50 000 000 Ar"`.
* `formatNumber(val)` : formate un nombre sans symbole monétaire.
* `formatCompact(val)` : format compact signé, ex. `"1.2 Md"` (≥ 1 milliard), `"350 M"` (≥ 1 million), `"50 k"` (≥ 1 000).
* `formatAxisValue(value)` : format compact des graduations d'axes, sur le même principe mais arrondi à l'entier (`"2 Md"`, `"3 M"`, `"5 k"`).
* `toNumber(val)` : conversion défensive en nombre, `0` si la conversion échoue.

### 2. [`contribuable.utils.jsx`](contribuable.utils.jsx) — au singulier

Classification des contribuables selon les seuils du CGI malgache. Dépend de `toNumber` importé depuis `./formatters`.

* `SEUIL_GRAND` : `400_000_000` Ar.
* `SEUIL_MOYEN` : `100_000_000` Ar.
* `getCategorie(contribuable)` : renvoie `'Grand'`, `'Moyen'` ou `'Petit'` à partir du chiffre d'affaires de la déclaration la plus récente ; `'Petit'` si le contribuable n'a aucune déclaration.
* `getFicheCategorie(categorie)` : renvoie la fiche réglementaire de la catégorie (`label`, `seuil`, `couleur`, `background`, `regime`, `penaliteRetard`, `amendes`, `refArticle`). La catégorie `Petit` sert de repli pour toute valeur inconnue.

C'est le module réellement importé par les pages : `src/frontofficeagent/contribuables/ContribuableDetail.jsx` (`getCategorie`, `getFicheCategorie`) et `src/frontofficeagent/contribuables/hooks/useContribuablesList.jsx` (`getCategorie`).

### 3. [`contribuables.utils.jsx`](contribuables.utils.jsx) — au pluriel

Regroupement de déclarations par contribuable.

* `getContribuableKey(declaration)` : clé d'identification calculée par `String(declaration.id_contribuable || declaration.nif || declaration.raison_sociale || 'inconnu')`.
* `getContribuables(declarations)` : regroupe les déclarations par clé dans une `Map`, conserve les métadonnées (`nif`, `raison_sociale`, `secteur_activite`) de l'année la plus récente et trie l'historique de chaque contribuable par année décroissante.

Ce module n'est importé par aucun autre fichier du projet. À ne pas confondre avec la fonction homonyme `getContribuables` exportée par [`../api/api.js`](../api/api.js), qui interroge l'API et est, elle, largement utilisée.

### 4. [`decisionnel.utils.jsx`](decisionnel.utils.jsx)

Agrégations du tableau décisionnel. Dépend de `toNumber` importé depuis `./formatters`.

* `getRegime(declaration)` : renvoie `'IR'` si le CA est inférieur à 400 000 000 Ar **et** que `regime_fiscal` vaut `'IR'`, sinon `'IS'`.
* `regime` : alias de `getRegime` (« pour compatibilité »), exporté mais jamais importé.
* `value` : alias de `toNumber`, exporté mais jamais importé.
* `buildYears(declarations)` : construit 5 entrées annuelles (année courante moins 4 jusqu'à l'année courante) avec le nombre de dossiers `is`, `ir` et `tva`.
* `buildCurves(years, declarations)` : renvoie, pour chaque régime `IS` puis `IR`, les séries `paid` (`tva_payee` cumulée) et `expected` (`tva_theorique` cumulée) par année.
* `getRegimePercentage(count, total)` : pourcentage arrondi, avec `Math.max(total, 1)` pour éviter la division par zéro.

### 5. [`session.utils.js`](session.utils.js)

Ce qui concerne la session de l'agent connecté, unique source de vérité partagée
par `App.jsx` (route `/`), `backofficeadmin/auth/signin.jsx` et les affichages du
profil :

* `getLandingPath(user)` : renvoie `'/admin'` si `user?.role === 'admin'`, sinon `'/acceuil'`. Le rôle provient toujours de la réponse de `POST /api/auth/login` ou de `GET /api/auth/me`, jamais d'une saisie.
* `initialsOf(user)` : deux initiales (première lettre du prénom + première lettre du nom, en majuscules), repli sur les deux premiers caractères de l'e-mail si l'un des deux manque et `'??'` sans utilisateur. Affichées sur le bouton rond `.user-profile-toggle` de l'en-tête, dans la pastille `.user-profile-avatar` du panneau déroulé et dans la fiche de profil de `AdminUtilisateurs`.

Le helper doit rester partagé : lorsque la route `/` redirigeait seule vers
`/acceuil`, elle écrasait la navigation vers `/admin` déclenchée par l'écran de
connexion et un administrateur atterrissait d'abord sur l'espace agent.

### 6. [`pagination.utils.js`](pagination.utils.js)

Numérotation des pages affichées par le composant commun
[`../components/common/Pagination.jsx`](../components/common/Pagination.jsx).
Déplacé ici depuis `src/frontofficeagent/contribuables/utils/pagination.jsx`, afin d'être
partagé entre le registre des contribuables et les tables du backoffice
administrateur.

* `getPageNumbers(currentPage, totalPages)` : renvoie un tableau de numéros (`number`) entrecoupés de `'...'`. Tous les numéros jusqu'à 7 pages ; `1 2 3 4 5 … n` en début de liste ; `1 … n-4 n-3 n-2 n-1 n` en fin de liste ; sinon `1 … p-1 p p+1 … n`.

---

### 7. [`relance.utils.js`](relance.utils.js)

Vocabulaire partagé des relances fiscales, importé par la fiche contribuable
(`RelancePanel`, `ContribuableDetail`, `exportFicheContribuable`) et par
[`../pages/relance/RelanceFiscale.jsx`](../pages/relance/RelanceFiscale.jsx) ainsi que
[`../pages/relance/components/RappelOrdreModal.jsx`](../pages/relance/components/RappelOrdreModal.jsx).

* `RELANCE_TYPES` : libellés, titre de la lettre, délai réglementaire, suffixe de référence, couleur et badge de sévérité pour les quatre types acceptés par la contrainte `relances_type_relance_check` (`rappel1`, `rappel2`, `mise_en_demeure`, `demande_eclaircissement`).
* `RELANCE_STATUTS` : libellé et classe CSS pour `emise`, `regularisee`, `annulee` (contrainte `relances_statut_check`).
* `relanceType(type)` / `relanceStatut(statut)` : accesseurs avec repli, pour qu'une valeur inconnue ne casse pas l'affichage.
* `formatDateRelance(value)` : date lisible en français (`26/10/2026`) ou `'—'` si la valeur est absente ou illisible.

Les clés sont celles de la base : aucune traduction intermédiaire n'est nécessaire, et le mot `regularise` n'existe pas comme type de relance (c'est un statut).

### 8. [`searchParams.utils.js`](searchParams.utils.js)

Helpers de lecture/écriture de l'état d'une liste dans l'URL, utilisés par
`useContribuablesList`, `SuiviFiscal.jsx` et `RelanceFiscale.jsx` avec
`useSearchParams`.

* `updateSearchParams(current, changes)` : copie le `URLSearchParams` courant, applique les modifications (`null`, `undefined` et `''` suppriment la clé) et **préserve les paramètres non mentionnés** (par exemple `vue=statistique` du registre).
* `readSearchParam(searchParams, key, fallback)` : valeur du paramètre, ou `fallback` lorsqu'il est absent ou vide.

Les pages écrivent toujours avec `{ replace: true }` : une frappe dans un champ de
recherche ne doit pas empiler vingt entrées dans l'historique du navigateur.

---

## Remarques sur le dossier

* Tous les fichiers sauf `session.utils.js` et `pagination.utils.js` portent l'extension `.jsx` alors qu'ils n'exportent aucun JSX. Les imports qui omettent l'extension fonctionnent grâce à la résolution de Vite ; `src/frontofficeagent/relance/RelanceFiscale.jsx` est le seul fichier à écrire explicitement `'../../utils/formatters.jsx'`.
* Deux modules distincts portent un nom très proche et des rôles différents :
  `contribuable.utils.jsx` (classification d'un contribuable) et
  `contribuables.utils.jsx` (regroupement de déclarations par contribuable).
  Seul le premier est réellement importé par les pages.

---

## Exemple d'utilisation

```javascript
import { formatAriary, toNumber } from '../utils/formatters';
import { getRegime } from '../utils/decisionnel.utils';
import { getCategorie, getFicheCategorie } from '../utils/contribuable.utils';

const montant = formatAriary(toNumber(declaration.tva_payee));
const regime = getRegime(declaration);
const fiche = getFicheCategorie(getCategorie(contribuable));
```
