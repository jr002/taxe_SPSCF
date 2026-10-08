# Graphiques

Composants SVG de visualisation des indicateurs fiscaux. [`Diagrammes.jsx`](Diagrammes.jsx) est le seul fichier du sous-dossier ; il n'exporte que des symboles nommés (aucun export par défaut) et s'appuie sur [`../../utils/formatters.jsx`](../../utils/formatters.jsx) (`formatAxisValue`, `formatCompact`) et [`../../utils/decisionnel.utils.jsx`](../../utils/decisionnel.utils.jsx) (`getRegime`, `getRegimePercentage`).

---

## Moteurs de tracé

### `buildChartPoints(values = [], max = 1, min = 0)`

Convertit un tableau de valeurs en chaîne de points pour un `<polyline>` SVG (`"x,y x,y ..."`), dans un repère `viewBox="0 0 100 100"` : l'abscisse est répartie de 0 à 100 (valeur unique centrée sur 50) et l'ordonnée est ramenée entre 94 et 10. La plage est bornée à `Math.max(max - min, 1)` pour éviter la division par zéro.

### `MiniLine({ data, color, max })`

Sparkline SVG. `data` est un tableau d'objets portant un champ `amount` ; `color` vaut `#2563eb` par défaut et `max` vaut `1`. Le composant porte `role="img"` et un `aria-label` « Évolution annuelle ».

---

## Graphiques du tableau décisionnel

### `VolumeChart({ years })`

Graphique en barres empilées horizontalement par année (`article.panel.wide`), avec trois séries par année : IS, IR et total TVA. Attend des éléments `{ year, is, ir, tva }`. L'axe des ordonnées est gradué avec `formatAxisValue` sur quatre niveaux (maximum, 66 %, 33 %, 0).

### `RegimeChart({ declarations })`

Anneau (« donut ») de répartition IS / IR. Le nombre de dossiers IS est calculé avec `getRegime`, la part IR en déduction, et le pourcentage d'anneau est transmis à la variable CSS `--is`. Les effectifs et pourcentages sont affichés via `getRegimePercentage`.

### `CurveChart({ curve })`

Deux courbes superposées pour un régime donné : attend un objet `{ regime, paid, expected }` où `paid` et `expected` sont des tableaux de points `{ year, amount }`. Le maximum est calculé sur la concaténation des deux séries ; deux `MiniLine` sont tracées (théorique en `#2563eb`, payé en `#f59e0b`).

---

## Graphiques de la fiche contribuable

### `ContribVolumeChart({ annualData, maxBars, currentRegime })`

Barres groupées par année (`article.contrib-chart-panel`) comparant le volume TVA (`item.tva`) et le volume du régime courant (`item.regimeCount`) ; attend des éléments `{ year, tva, regimeCount }`. `maxBars` vaut `1` par défaut et `currentRegime` `'IS'` ; la classe de la seconde barre est dérivée du régime (`bar-is` ou `bar-ir`).

### `ContribComparisonChart({ curveData, curveMax, currentRegime })`

Comparaison par courbes de la TVA théorique et de la TVA payée d'un contribuable. Attend `curveData` sous forme de points `{ year, theoretical, paid }`, `curveMax` pour l'échelle des ordonnées (graduée avec `formatCompact`) et `currentRegime` pour le titre.

---

## Consommateurs

| Composant | Importé par |
| --- | --- |
| `VolumeChart`, `RegimeChart`, `CurveChart` | `src/pages/decisionnel/TableauDecisionnel.jsx` |
| `ContribVolumeChart`, `ContribComparisonChart` | `src/pages/contribuables/components/ContribuableOverview.jsx` |
| `buildChartPoints` | Interne au fichier (`ContribComparisonChart`) |
| `MiniLine` | Interne au fichier (`CurveChart`) |

Les styles associés (`panel`, `bar-chart`, `donut`, `line-chart`, `contrib-chart-panel`, `gap-chart`, etc.) sont définis dans [`../../App.css`](../../App.css).
