# Graphiques

Composants SVG de visualisation des indicateurs fiscaux. [`Diagrammes.jsx`](Diagrammes.jsx) est le seul fichier du sous-dossier ; il n'exporte que des symboles nommés (aucun export par défaut), n'utilise aucune bibliothèque de graphiques, et s'appuie sur [`../../utils/formatters.js`](../../utils/formatters.js) (`formatAxisValue`, `formatCompact`), [`../../frontofficeagent/decisionnel/utils/decisionnel.utils.js`](../../frontofficeagent/decisionnel/utils/decisionnel.utils.js) (`getRegime`, `getRegimePercentage`) et [`../../frontofficeagent/aide/components/AideTerme.jsx`](../../frontofficeagent/aide/components/AideTerme.jsx) pour les explications au survol des titres.

---

## Moteurs de tracé

### `buildChartPoints(values = [], max = 1, min = 0)`

Convertit un tableau de valeurs en chaîne de points pour un `<polyline>` SVG (`"x,y x,y ..."`), dans un repère `viewBox="0 0 100 100"` : l'abscisse est répartie de 0 à 100 (valeur unique centrée sur 50) et l'ordonnée est ramenée entre 94 et 10. La plage est bornée à `Math.max(max - min, 1)` pour éviter la division par zéro.

### `MiniLine({ data, color, max, legende })`

Sparkline SVG. `data` est un tableau d'objets portant un champ `amount` ; `color` vaut `#2563eb` par défaut et `max` vaut `1`. `legende` (par défaut `null`) est le nom de la série : fourni, il remplace le `aria-label` « Évolution annuelle » et est répété dans un `<title>` SVG, ce qui rend l'infobulle native du tracé lisible à la souris. Le composant garde `role="img"`.

### `polarToCartesian()` et `describeArc()`

Fonctions internes de géométrie d'anneau : `describeArc(cx, cy, innerRadius, outerRadius, startAngle, endAngle)` renvoie le chemin SVG d'un segment en couronne, avec un angle complet borné à 359,999° pour éviter l'arc nul et un `largeArcFlag` calculé sur l'amplitude. (`src/backofficeadmin/dashboard/components/CamembertUtilisateurs.jsx` porte sa propre copie de ce couple de fonctions.)

### `formatPercentage(value)`

Interne : formate un pourcentage en français avec une décimale maximum.

---

## Graphiques génériques

### `Camembert({ title, hint, slices, formatValue, centerValue, centerLabel })`

Camembert en couronne (`article.panel`) découpé par `describeArc` dans un `viewBox="0 0 200 200"`. Chaque tranche est un objet `{ id, label, valeur, couleur }` ; les tranches de valeur nulle ou négative sont exclues du tracé mais restent dans la légende, ce qui permet d'afficher une catégorie à 0 %. Le total (ou `centerValue` s'il est fourni) est inscrit au centre avec `formatAxisValue`, la légende détaille `label`, la valeur formatée par `formatValue` (default `formatAxisValue`) et la part en pourcentage. Chaque segment porte une infobulle `<title>`. Si toutes les valeurs sont nulles, l'anneau est remplacé par le message `.empty` et la légende affiche 0 %.

### `Histogramme({ title, hint, xLabel, groups, series, formatTick })`

Barres groupées réutilisant intégralement la charte des panneaux existants (`.panel`, `.chart-layout`, `.chart-y-axis`, `.bar-chart`, `.chart-grid-lines`, `.bar-group`, `.bars i`, `.chart-x-axis`, `.legend`). `groups` attend `[{ label, valeurs: { cle: nombre } }]` et `series` `[{ key, label, couleur }]` : une barre par série dans chaque groupe, colorée par style inline (la palette fixe de `.bars i :nth-child()` est ainsi surchargeable). L'échelle est bornée à 1 minimum, graduée sur quatre niveaux (maximum, 66 %, 33 %, 0) et formatée par `formatTick`.

---

## Graphiques du tableau décisionnel

Ces trois graphiques ne sont utilisés que par [`TableauDecisionnel.jsx`](../../frontofficeagent/decisionnel/pages/TableauDecisionnel.jsx). Chacun ouvre son panneau par `.chart-panel-heading` — un `.eyebrow` (la source des données), le titre dans un `AideTerme` `direction="bas"` (l'explication au survol, posée sous le titre car `.dashboard-grid > .panel` est en `overflow: hidden`), et un `<span>` à droite pour l'unité — puis porte `role="img"` et un `aria-label` qui récite point par point ce que le tracé montre en couleurs.

### `VolumeChart({ years })`

Barres groupées par exercice (`article.panel.wide`), trois barres par année : IS, IR et total. Attend des éléments `{ year, is, ir, tva }`. L'axe des ordonnées est gradué avec `formatAxisValue` sur quatre niveaux (maximum, 66 %, 33 %, 0) et la hauteur de chaque barre est rapportée au maximum des trois séries. Chaque `<i>` porte une `title` native du type « IS 2024 : 12 déclarations » (helper interne `titreBarre`). La légende dit « Total (IS + IR) » — la troisième barre est une somme des deux premières, pas une troisième catégorie — et reprend les classes de couleur réellement tracées : `<span />` (le bleu de `.legend span`, comme la barre IS), `<span className="ir" />`, `<span className="tva" />`.

### `RegimeChart({ declarations })`

Anneau (« donut ») de la part des lignes sous régime IS et sous régime IR. Le nombre de lignes IS est calculé avec `getRegime`, la part IR en déduction, et le pourcentage d'anneau est transmis à la variable CSS `--is`. Le centre affiche le nombre de lignes (`strong` + `small`), la légende et le `.split` donnent les effectifs et pourcentages via `getRegimePercentage`. Un régime sans aucune ligne n'a rien à comparer : ses courbes sont filtrées par la page et l'anneau le dit en `.empty` (« régime IR : aucune ligne, comparaison non tracée »).

### `CurveChart({ curve })`

Deux courbes superposées pour un régime donné : attend un objet `{ regime, paid, expected }` où `paid` et `expected` sont des tableaux de points `{ year, amount }`. Le maximum est calculé sur la concaténation des deux séries ; deux `MiniLine` sont tracées (théorique en `#2563eb`, payée en `#f59e0b`), chacune nommée par `legende` (« TVA théorique IS », « TVA payée IS »). L'`aria-label` récite pour chaque année le théorique et le payée en `formatCompact`.

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
| `VolumeChart`, `RegimeChart`, `CurveChart` | `src/frontofficeagent/decisionnel/pages/TableauDecisionnel.jsx` |
| `ContribVolumeChart`, `ContribComparisonChart` | `src/frontofficeagent/contribuables/components/ContribuableOverview.jsx` |
| `Camembert`, `Histogramme` | `src/frontofficeagent/contribuables/components/ContribuablesStatistiques.jsx` |
| `buildChartPoints` | Interne au fichier (`ContribComparisonChart`) |
| `MiniLine` | Interne au fichier (`CurveChart`) |

Les styles associés (`panel`, `bar-chart`, `donut`, `line-chart`, `contrib-chart-panel`, `gap-chart`, etc.) sont définis dans [`../../App.css`](../../App.css).
