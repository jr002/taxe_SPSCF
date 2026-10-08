# Composants — Contribuables

Ce dossier contient les composants visuels utilisés par les pages `Contribuables.jsx` et `ContribuableDetail.jsx`.

## Vue d'ensemble

```text
Contribuables.jsx
├── ContribuablesFilters
├── ContribuablesTable
└── Pagination

ContribuableDetail.jsx
├── ContribuableHeader
├── ContribuableOverview
├── ClassificationPanel
├── DeclarationForm
├── DeclarationHistory
└── RelancePanel
```

`ContribuableDetail.jsx` rend aussi `RappelOrdreModal`, qui n'est pas dans ce dossier mais dans `../../relance/components/`.

## Liste des contribuables

### `ContribuablesFilters.jsx`

Affiche les outils de filtrage au-dessus de la liste :

- les onglets de catégories : Tous, Grand, Moyen et Petit (avec le compteur de chaque catégorie) ;
- le champ de recherche par NIF, raison sociale ou secteur ;
- le nombre de résultats affichés sous la forme `début-fin / total` ;
- les actions d'actualisation, d'import Excel/CSV et le lien « + Ajouter un contribuable » vers `/entreprises/nouveau`.

Propriétés :

| Propriété | Description |
| --- | --- |
| `allCount` | Nombre total de contribuables (onglet Tous). |
| `category` | Catégorie actuellement sélectionnée. |
| `counts` | Nombre de contribuables pour chaque catégorie (`Grand`, `Moyen`, `Petit`). |
| `filter` | Valeur du champ de recherche. |
| `loading` | Désactive le bouton d'actualisation pendant un chargement. |
| `onCategoryChange` | Appelée lors d'un changement de catégorie. |
| `onFilterChange` | Appelée lors de la saisie d'une recherche, avec la valeur saisie. |
| `onImport` | Ouvre la fenêtre d'import. |
| `onRefresh` | Recharge la liste depuis l'API. |
| `resultCount` | Nombre de résultats après filtrage. |
| `page` | Page courante (pour le calcul de la plage affichée). |
| `pageSize` | Taille de page (pour le calcul de la plage affichée). |

### `ContribuablesTable.jsx`

Affiche la liste paginée sous forme de tableau. Les colonnes sont : contribuable (raison sociale et NIF), dernière année déclarée, années suivies (nombre de déclarations), TVA payée cumulée et action.

Une ligne peut être ouverte avec la souris, la touche **Entrée** ou la barre d'espace ; le bouton « Voir la fiche → » fait de même. Le composant appelle `onOpenDetail(contribuable)` pour ouvrir la fiche.

Propriétés : `allCount`, `contribuables` (page courante) et `onOpenDetail`. `allCount` sert à distinguer le message vide « Aucun contribuable ne correspond à votre recherche. » de « Aucun contribuable enregistré. ».

### `Pagination.jsx`

Affiche les boutons Précédent/Suivant et les numéros de pages. Il utilise `getPageNumbers` du dossier `../utils` afin de réduire l'affichage lorsque le nombre de pages est important. Le composant ne rend rien si `totalPages` est inférieur ou égal à 1.

Propriétés : `currentPage`, `totalPages` et `onPageChange`.

## Fiche contribuable

### `ContribuableHeader.jsx`

En-tête commun de la fiche détaillée. Il affiche :

- le lien de retour vers la liste ;
- la raison sociale, le NIF, le badge de catégorie et le nombre d'années suivies ;
- les onglets Synthèse, Régime fiscal, Déclarations et Relances, qui renvoient vers `/contribuables/:id`, `/classification`, `/declarations` et `/relances` ;
- un bouton qui, dans l'onglet Déclarations, ouvre ou ferme le formulaire, et sinon renvoie vers l'onglet Déclarations.

Propriétés : `activeTab` (met en évidence l'onglet courant), `contribuable`, `declarationsCount`, `fiche` (badge de catégorie), `id` (construction des liens d'onglets), `onToggleDeclarationForm` et `showDeclarationForm` (libellé du bouton).

### `ContribuableOverview.jsx`

Affiche le résumé financier de la fiche : TVA payée cumulée et dernière année déclarée, puis les deux graphiques `ContribVolumeChart` et `ContribComparisonChart` importés de `../../../components/charts/Diagrammes`.

Propriétés : `annualData`, `curveData`, `currentRegime`, `declarations`, `maxBars`, `curveMax` et `totalPaid`. Les données des graphiques sont préparées par `ContribuableDetail.jsx`.

### `ClassificationPanel.jsx`

Présente les règles correspondant à la catégorie fiscale du contribuable :

- régime fiscal et comptable ;
- pénalités de retard (avec la référence d'article) ;
- amendes administratives.

Le composant reçoit une unique propriété `fiche`, généralement construite avec `getFicheCategorie`.

### `DeclarationForm.jsx`

Formulaire d'ajout d'une déclaration. Il demande l'année, le chiffre d'affaires, le bénéfice, la TVA collectée, la TVA déductible et la TVA payée.

| Propriété | Description |
| --- | --- |
| `contribuable` | Contribuable concerné (raison sociale affichée). |
| `form` | Valeurs actuelles du formulaire. |
| `onChange` | Met à jour une valeur saisie à partir de l'événement de changement. |
| `onSubmit` | Crée la déclaration. |
| `submitting` | Désactive le bouton pendant l'enregistrement. |
| `error` | Message d'erreur de validation ou d'API. |

### `DeclarationHistory.jsx`

Affiche l'historique des déclarations : année, chiffre d'affaires, catégorie, TVA collectée, TVA déductible, TVA payée, TVA théorique et statut. Un clic sur une ligne appelle `onOpenDeclaration(declaration)` pour accéder au suivi de cette déclaration.

La catégorie affichée est déduite du chiffre d'affaires :

- **Grand** : à partir de 400 000 000 Ar ;
- **Moyen** : à partir de 100 000 000 Ar ;
- **Petit** : en dessous de 100 000 000 Ar.

Propriétés : `declarations` et `onOpenDeclaration`.

### `RelancePanel.jsx`

Regroupe les actions de recouvrement fiscal : premier rappel, deuxième rappel, mise en demeure et régularisation. Il affiche aussi l'historique des relances du contribuable courant (filtré sur son NIF) ; les documents associés aux rappels peuvent être ouverts avec `onOpenHistoryEntry`.

| Propriété | Description |
| --- | --- |
| `montantDu` | Montant estimé restant à payer. |
| `history` | Historique complet des relances enregistrées localement. |
| `nif` | Sert à filtrer l'historique pour le contribuable affiché. |
| `onIssue` | Émet une relance selon son type (`rappel1`, `rappel2`, `miseEnDemeure`). |
| `onOpenHistoryEntry` | Ouvre l'aperçu du document d'une relance (ignorée pour une régularisation). |
| `onRegularize` | Marque le dossier comme régularisé. |
| `success` | Dernier message de confirmation à afficher. |

## Conventions

- Les composants sont des composants fonctionnels React.
- Les données et appels API restent dans les pages ou hooks ; les composants reçoivent des propriétés et déclenchent des callbacks.
- Les montants sont formatés avec `formatAriary` et convertis avec `toNumber` (`RelancePanel` utilise son propre formatage local via `Intl.NumberFormat`).
- Les classes CSS utilisées ici sont définies dans les styles globaux de l'application.
