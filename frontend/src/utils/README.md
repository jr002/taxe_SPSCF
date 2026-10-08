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

C'est le module réellement importé par les pages : `src/pages/contribuables/ContribuableDetail.jsx` (`getCategorie`, `getFicheCategorie`) et `src/pages/contribuables/hooks/useContribuablesList.jsx` (`getCategorie`).

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

---

## Remarques sur le dossier

* Tous les fichiers portent l'extension `.jsx` alors qu'ils n'exportent aucun JSX. Les imports qui omettent l'extension fonctionnent grâce à la résolution de Vite ; `src/pages/relance/RelanceFiscale.jsx` est le seul fichier à écrire explicitement `'../../utils/formatters.jsx'`.
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
