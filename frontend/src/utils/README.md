# 🛠️ Utilitaires et Fonctions Pures (`/src/utils`)

Ce dossier regroupe les fonctions utilitaires pures, les formateurs et les algorithmes de calcul métier.

---

## 📁 Fichiers

### 1. [`formatters.js`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/utils/formatters.js)
* `formatAriary(val)` : Formate un montant en devise nationale malgache (ex : `"50 000 000 Ar"`).
* `formatNumber(val)` : Formate un nombre standard avec séparateurs de milliers.
* `formatCompact(val)` : Formate un nombre sous forme compacte (ex : `"1.2 Md"`, `"350 M"`, `"50 k"`).
* `formatAxisValue(val)` : Formate les graduations des axes de graphiques.
* `toNumber(val)` : Convertit une valeur de manière sécurisée en nombre (`0` par défaut).

### 2. [`contribuables.utils.js`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/utils/contribuables.utils.js)
* `getContribuableKey(declaration)` : Génère la clé d'identification unique d'un contribuable.
* `getContribuables(declarations)` : Agrège les déclarations par entreprise, conserve les métadonnées les plus récentes et trie les déclarations par ordre antéchronologique.

### 3. [`decisionnel.utils.js`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/utils/decisionnel.utils.js)
* `getRegime(declaration)` : Détermine le régime fiscal selon le seuil de 400M Ar (`IS` ou `IR`).
* `buildYears(declarations)` : Construit la série de données sur les 5 dernières années.
* `buildCurves(years, declarations)` : Calcule les séries temporelles de TVA théorique et payée pour les graphiques.
* `getRegimePercentage(count, total)` : Calcule le pourcentage de répartition arrondi.
