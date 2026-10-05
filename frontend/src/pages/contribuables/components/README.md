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

## Liste des contribuables

### `ContribuablesFilters.jsx`

Affiche les outils de filtrage au-dessus de la liste :

- les onglets de catégories : Tous, Grand, Moyen et Petit ;
- le champ de recherche par NIF, raison sociale ou secteur ;
- le nombre de résultats affichés ;
- les actions d'actualisation, d'import Excel/CSV et d'ajout d'un contribuable.

Propriétés principales :

| Propriété | Description |
| --- | --- |
| `category` | Catégorie actuellement sélectionnée. |
| `counts` | Nombre de contribuables pour chaque catégorie. |
| `filter` | Valeur du champ de recherche. |
| `onCategoryChange` | Appelée lors d'un changement de catégorie. |
| `onFilterChange` | Appelée lors de la saisie d'une recherche. |
| `onRefresh` | Recharge la liste depuis l'API. |
| `onImport` | Ouvre la fenêtre d'import. |

### `ContribuablesTable.jsx`

Affiche la liste paginée sous forme de tableau. Pour chaque contribuable, il présente :

- la raison sociale et le NIF ;
- la dernière année déclarée ;
- le nombre de déclarations ;
- le total de TVA payée.

Une ligne peut être ouverte avec la souris, la touche **Entrée** ou la barre d'espace. Le composant appelle `onOpenDetail(contribuable)` pour ouvrir la fiche.

### `Pagination.jsx`

Affiche les boutons Précédent/Suivant et les numéros de pages. Il utilise `getPageNumbers` du dossier `../utils` afin de réduire l'affichage lorsque le nombre de pages est important.

Propriétés : `currentPage`, `totalPages` et `onPageChange`.

## Fiche contribuable

### `ContribuableHeader.jsx`

En-tête commun de la fiche détaillée. Il affiche :

- le lien de retour vers la liste ;
- la raison sociale, le NIF et le badge de catégorie ;
- les onglets Synthèse, Régime fiscal, Déclarations et Relances ;
- un bouton pour consulter ou ajouter une déclaration.

`activeTab` permet de mettre en évidence l'onglet en cours. Dans l'onglet Déclarations, `onToggleDeclarationForm` ouvre ou ferme le formulaire.

### `ContribuableOverview.jsx`

Affiche le résumé financier de la fiche : total de TVA payée, dernière déclaration et les deux graphiques fournis par `components/charts/Diagrammes`.

Les données des graphiques sont préparées par `ContribuableDetail.jsx` et transmises par les propriétés `annualData`, `curveData`, `maxBars` et `curveMax`.

### `ClassificationPanel.jsx`

Présente les règles correspondant à la catégorie fiscale du contribuable :

- régime fiscal et comptable ;
- pénalités de retard ;
- amendes administratives.

Le composant reçoit une `fiche`, généralement construite avec `getFicheCategorie`.

### `DeclarationForm.jsx`

Formulaire d'ajout d'une déclaration. Il demande l'année, le chiffre d'affaires, le bénéfice et les montants de TVA.

| Propriété | Description |
| --- | --- |
| `form` | Valeurs actuelles du formulaire. |
| `onChange` | Met à jour une valeur saisie. |
| `onSubmit` | Crée la déclaration. |
| `submitting` | Désactive le bouton pendant l'enregistrement. |
| `error` | Message d'erreur de validation ou d'API. |

### `DeclarationHistory.jsx`

Affiche l'historique des déclarations : année, chiffre d'affaires, catégorie, TVA et statut. Un clic sur une ligne appelle `onOpenDeclaration(declaration)` pour accéder au suivi de cette déclaration.

La catégorie affichée est déduite du chiffre d'affaires :

- **Grand** : à partir de 400 000 000 Ar ;
- **Moyen** : à partir de 100 000 000 Ar ;
- **Petit** : en dessous de 100 000 000 Ar.

### `RelancePanel.jsx`

Regroupe les actions de recouvrement fiscal : premier rappel, deuxième rappel, mise en demeure et régularisation.

Il affiche aussi l'historique des relances du contribuable courant. Les documents associés aux rappels peuvent être ouverts avec `onOpenHistoryEntry`.

| Propriété | Description |
| --- | --- |
| `montantDu` | Montant estimé restant à payer. |
| `history` | Historique complet des relances enregistrées localement. |
| `nif` | Sert à filtrer l'historique pour le contribuable affiché. |
| `onIssue` | Émet une relance selon son type. |
| `onRegularize` | Marque le dossier comme régularisé. |
| `success` | Dernier message de confirmation à afficher. |

## Conventions

- Les composants sont des composants fonctionnels React.
- Les données et appels API restent dans les pages ou hooks ; les composants reçoivent des propriétés et déclenchent des callbacks.
- Les montants sont formatés avec `formatAriary` et convertis avec `toNumber`.
- Les classes CSS utilisées ici sont définies dans les styles globaux de l'application.
