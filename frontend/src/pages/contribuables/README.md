# Module Contribuables

Ce dossier regroupe les écrans permettant de consulter le registre fiscal des contribuables, d'ouvrir leur fiche détaillée et de suivre leurs déclarations et relances.

## Organisation

```text
contribuables/
├── Contribuables.jsx          # Liste et recherche des contribuables
├── ContribuableDetail.jsx     # Fiche détaillée d'un contribuable
├── components/                # Composants d'interface réutilisés par les pages
├── hooks/                     # Logique métier liée à la liste
└── utils/                     # Fonctions utilitaires locales
```

## Pages

### `Contribuables.jsx`

Page principale du registre fiscal (`/contribuables`). Elle :

- charge la liste avec `useContribuablesList` ;
- affiche les filtres par catégorie et la recherche textuelle ;
- affiche le tableau paginé ;
- ouvre la fiche d'un contribuable sélectionné ;
- permet l'import de contribuables depuis un fichier Excel ou CSV.

### `ContribuableDetail.jsx`

Fiche détaillée d'un contribuable (`/contribuables/:id`). Elle charge les données lorsque nécessaire et affiche l'un des onglets suivants :

- **Synthèse** : montant total de TVA payée et graphiques de suivi ;
- **Régime fiscal** : informations de classification fiscale ;
- **Déclarations** : historique et formulaire d'ajout d'une déclaration ;
- **Relances** : actions de rappel, mise en demeure et historique local des relances.

Les relances créées depuis cette page sont conservées dans le navigateur via `localStorage`, avec la clé `relance_historique`.

## Composants

| Composant | Rôle |
| --- | --- |
| `ContribuablesFilters.jsx` | Onglets de catégories, champ de recherche, boutons d'actualisation et d'import. |
| `ContribuablesTable.jsx` | Tableau de la liste ; chaque ligne ouvre la fiche correspondante. |
| `Pagination.jsx` | Navigation entre les pages de résultats. |
| `ContribuableHeader.jsx` | En-tête de la fiche, navigation par onglets et bouton d'ajout de déclaration. |
| `ContribuableOverview.jsx` | Indicateurs synthétiques et graphiques de TVA. |
| `ClassificationPanel.jsx` | Affiche le régime fiscal, les pénalités et les amendes de la catégorie. |
| `DeclarationForm.jsx` | Formulaire de création d'une déclaration fiscale. |
| `DeclarationHistory.jsx` | Tableau de l'historique des déclarations. |
| `RelancePanel.jsx` | Actions de relance et tableau de l'historique des relances. |

## Hook et utilitaire

### `hooks/useContribuablesList.js`

Centralise l'état de la liste : récupération des données API, filtre texte, filtre de catégorie, pagination, chargement et erreurs. Il fournit à `Contribuables.jsx` les données déjà filtrées et paginées.

### `utils/pagination.js`

Contient `getPageNumbers`, qui produit les numéros de pages à afficher. Quand la liste est longue, des points de suspension remplacent les pages intermédiaires.

## Dépendances principales

- `../../api/api` : appels API pour lire les contribuables et créer une déclaration ;
- `../../utils/contribuable.utils` : calcul de la catégorie et de sa fiche fiscale ;
- `../../utils/decisionnel.utils` : détermination du régime fiscal ;
- `../../utils/formatters` : conversion et affichage des montants ;
- `../relance/components/RappelOrdreModal` : aperçu des documents de relance.

## Flux simplifié

```text
API → useContribuablesList → Contribuables → Tableau / Fiche détaillée
                                            ↓
                               Déclarations, classification et relances
```

## Points d'attention

- Les données de la liste sont demandées avec une limite de 10 000 entrées, puis filtrées côté navigateur.
- Une déclaration ajoutée est immédiatement insérée dans l'état de la fiche ; aucune nouvelle navigation n'est nécessaire.
- L'historique des relances est local au navigateur tant qu'une persistance côté API n'est pas mise en place.
