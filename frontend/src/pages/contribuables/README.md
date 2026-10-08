# Module Contribuables

Ce dossier regroupe les écrans permettant de consulter le registre fiscal des contribuables, d'ouvrir leur fiche détaillée et de suivre leurs déclarations et relances.

## Organisation

```text
contribuables/
├── Contribuables.jsx          # Liste et recherche des contribuables
├── ContribuableDetail.jsx     # Fiche détaillée d'un contribuable
├── components/                # Composants d'interface réutilisés par les pages
│   └── README.md
├── hooks/
│   └── useContribuablesList.jsx
└── utils/
    ├── pagination.jsx
    └── amoutsArrondi.jsx
```

## Pages

### `Contribuables.jsx`

Page principale du registre fiscal (`/contribuables`). Elle :

- charge la liste avec `useContribuablesList` ;
- affiche les filtres par catégorie et la recherche textuelle ;
- affiche le tableau paginé ;
- ouvre la fiche d'un contribuable sélectionné (navigation vers `/contribuables/:id` avec le contribuable passé dans `location.state`) ;
- permet l'import de contribuables depuis un fichier Excel ou CSV via `ExcelImportModal`, puis recharge la liste.

### `ContribuableDetail.jsx`

Fiche détaillée d'un contribuable. Le composant est monté par quatre routes distinctes déclarées dans `App.jsx` :

| Route | Onglet affiché |
| --- | --- |
| `/contribuables/:id` | Synthèse (`overview`) |
| `/contribuables/:id/classification` | Régime fiscal |
| `/contribuables/:id/declarations` | Déclarations |
| `/contribuables/:id/relances` | Relances |

L'onglet actif est déduit du chemin par `getActiveTab` ; les quatre routes rendent bien le même composant `ContribuableDetail`, et la navigation entre onglets est assurée par les liens de `ContribuableHeader`. Le détail :

- **Synthèse** : montant total de TVA payée, dernière année déclarée et graphiques de suivi ;
- **Régime fiscal** : informations de classification fiscale issues de `getFicheCategorie` ;
- **Déclarations** : historique et formulaire d'ajout d'une déclaration (visible après clic sur « + Ajouter une déclaration ») ;
- **Relances** : actions de rappel, mise en demeure et historique local des relances, plus l'aperçu imprimable via `RappelOrdreModal`.

Les relances créées depuis cette page sont conservées dans le navigateur via `localStorage`, avec la clé `relance_historique`.

## Composants

| Composant | Rôle |
| --- | --- |
| `ContribuablesFilters.jsx` | Onglets de catégories, champ de recherche, compteur de résultats, boutons d'actualisation et d'import, lien d'ajout d'un contribuable. |
| `ContribuablesTable.jsx` | Tableau de la liste ; chaque ligne ouvre la fiche correspondante. |
| `Pagination.jsx` | Navigation entre les pages de résultats. |
| `ContribuableHeader.jsx` | En-tête de la fiche, navigation par onglets et bouton d'ajout ou d'accès aux déclarations. |
| `ContribuableOverview.jsx` | Indicateurs synthétiques et graphiques de TVA. |
| `ClassificationPanel.jsx` | Affiche le régime fiscal, les pénalités et les amendes de la catégorie. |
| `DeclarationForm.jsx` | Formulaire de création d'une déclaration fiscale. |
| `DeclarationHistory.jsx` | Tableau de l'historique des déclarations. |
| `RelancePanel.jsx` | Actions de relance et tableau de l'historique des relances. |

Les propriétés attendues par chacun de ces composants sont détaillées dans le [`README`](components/README.md) du dossier `components`.

## Hook et utilitaires

### `hooks/useContribuablesList.jsx`

Centralise l'état de la liste : récupération des données API (`getContribuables` avec une limite de 10 000), filtre texte, filtre de catégorie, pagination (15 éléments par page), chargement et erreurs. Il enrichit chaque contribuable d'une clé (`key`) et de sa catégorie, calcule les compteurs par catégorie, et fournit à `Contribuables.jsx` les données déjà filtrées et paginées (`allContribuables`, `filteredContribuables`, `paginatedContribuables`, `counts`, `totalPages`, `loadData`, etc.).

### `utils/pagination.jsx`

Contient `getPageNumbers(currentPage, totalPages)`, qui produit les numéros de pages à afficher. Jusqu'à 7 pages, tous les numéros sont renvoyés ; au-delà, des points de suspension (`'...'`) remplacent les pages intermédiaires.

### `utils/amoutsArrondi.jsx`

Exporte le composant `AmountFormatter({ amount })`, qui affiche un montant arrondi et abrégé en français selon des paliers : « mille » à partir de 10³, « million(s) » à partir de 10⁶ et « milliard(s) » à partir de 10⁹. Au-delà de 10¹², la valeur est divisée par 10¹² et suivie de « mille milliards Ar ». Les valeurs nulles, indéfinies ou non numériques sont rendues par `0 Ar`.

> Le nom du fichier contient une coquille (`amouts` au lieu de `amounts`) et le composant n'est importé nulle part ailleurs dans `frontend/src` : il s'agit d'un utilitaire actuellement inutilisé.

## Dépendances principales

- `../../api/api` : `getContribuables`, `getContribuableById`, `createDeclaration`, `getErrorMessage` ;
- `../../utils/contribuable.utils` : `getCategorie` et `getFicheCategorie` ;
- `../../utils/decisionnel.utils` : `getRegime` (régime fiscal du contribuable ou d'une déclaration) ;
- `../../utils/formatters` : `formatAriary` et `toNumber` ;
- `../../components/forms/ExcelImportModal` : fenêtre d'import Excel/CSV ;
- `../relance/components/RappelOrdreModal` : aperçu des documents de relance ;
- `../../components/charts/Diagrammes` : graphiques utilisés par `ContribuableOverview`.

## Flux simplifié

```text
API → useContribuablesList → Contribuables → Tableau / Fiche détaillée
                                            ↓
                               Déclarations, classification et relances
```

## Points d'attention

- Les données de la liste sont demandées avec une limite de 10 000 entrées, puis filtrées côté navigateur.
- Une déclaration ajoutée est immédiatement insérée dans l'état de la fiche ; aucune nouvelle navigation n'est nécessaire.
- L'historique des relances est local au navigateur tant qu'une persistance côté API n'est pas mise en place ; `RelancePanel` le filtre sur le NIF du contribuable affiché.
- Le montant dû affiché dans l'onglet Relances est recalculé à partir des déclarations (`montant_net_a_payer`, sinon `tva_theorique − tva_payee`).
