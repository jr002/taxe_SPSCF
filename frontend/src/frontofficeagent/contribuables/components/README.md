# Composants — Contribuables

Ce dossier contient les composants visuels utilisés par `Contribuables.jsx` (registre et vue Statistique) et par la fiche détaillée `ContribuableDetail.jsx`.

## Vue d'ensemble

```text
Contribuables.jsx
├── ContribuablesFilters
├── ContribuablesTable
├── ContribuablesStatistiques
└── Pagination (commun : ../../components/common/Pagination.jsx)

ContribuableDetail.jsx
├── ContribuableHeader
│   └── ExportFicheButton
├── ContribuableOverview
├── ClassificationPanel
├── DeclarationHistory
├── RecoupementsPanel
├── DroitCommunicationPanel
└── RelancePanel

Pages d'enregistrement (pages/)
├── DeclarationCreate       → DeclarationForm
├── RecoupementCreate       → RecoupementForm
└── DroitCommunicationCreate → DroitCommunicationForm
```

`ContribuableDetail.jsx` rend aussi `RappelOrdreModal`, qui n'est pas dans ce dossier mais dans `../../relance/components/`.

## Liste des contribuables

### `ContribuablesFilters.jsx`

Affiche les outils de filtrage au-dessus de la liste (vue Registre uniquement) :

- les onglets de catégories : Tous, Grand, Moyen et Petit (avec le compteur de chaque catégorie) ;
- le champ de recherche par NIF, raison sociale ou secteur ;
- le nombre de résultats affichés sous la forme `début-fin / total` ;
- les actions d'actualisation, d'import Excel/CSV et d'export Excel des résultats filtrés ;
- le lien « + Ajouter un contribuable » vers `/entreprises/nouveau`.

Propriétés :

| Propriété | Description |
| --- | --- |
| `allCount` | Nombre total de contribuables (onglet Tous). |
| `category` | Catégorie actuellement sélectionnée. |
| `counts` | Nombre de contribuables pour chaque catégorie (`Grand`, `Moyen`, `Petit`). |
| `filter` | Valeur du champ de recherche. |
| `loading` | Désactive le bouton d'actualisation pendant un chargement. |
| `onCategoryChange` | Appelée lors d'un changement de catégorie. |
| `onExport` | Exporte au format Excel tous les résultats correspondant aux filtres actifs. |
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

### `Pagination.jsx` — déplacé

La pagination n'est plus locale à ce dossier : le composant vit désormais dans
[`../../../components/common/Pagination.jsx`](../../../components/common/Pagination.jsx)
et l'aide `getPageNumbers` dans
[`../../../utils/pagination.utils.js`](../../../utils/pagination.utils.js), afin
d'être partagé avec les pages du backoffice administrateur. `Contribuables.jsx`
l'importe sous ce nouvel emplacement ; le comportement est inchangé (15 lignes par
page pour le registre).

### `ContribuablesStatistiques.jsx`

Vue globale du portefeuille affichée par `/contribuables?vue=statistique`. Elle appelle `buildStatistiques(contribuables)` (dans `../utils/statistiques.utils`) en `useMemo`, puis rend quatre KPI (`.kpis`), une ligne d'explication de la déduction VSP/CSP (`.split`) et deux paires `.contrib-chart-grid` composées des composants génériques `Camembert` (montants de redressement) et `Histogramme` (nombre de dossiers, par année puis par nature d'impôt).

Propriété : `contribuables` — la liste déjà enrichie fournie par `useContribuablesList`, y compris les `declarations` de chaque contribuable. Le composant ne fait aucun appel API.

## Fiche contribuable

### `ContribuableHeader.jsx`

En-tête commun de la fiche détaillée. Il affiche :

- le lien de retour vers la liste ;
- la raison sociale, le NIF, le badge de catégorie, le nombre d'années suivies et le centre gestionnaire du contribuable ;
- les six onglets Synthèse, Nature d'impôt, Déclarations, Recoupements, Droits de communication et Relances, qui renvoient vers `/contribuables/:id`, `/classification`, `/declarations`, `/recoupements`, `/droits-communication` et `/relances` ;
- un bouton d'export Excel des données de l'onglet actif (`ExportFicheButton`), masqué sur les onglets Recoupements et Droits de communication.

Les deux boutons sont regroupés dans `.contribuable-heading-actions`, qui passe en pleine largeur sur petit écran.

Propriétés : `activeTab` (met en évidence l'onglet courant), `contribuable`, `declarationsCount`, `exportDisabled` (désactive l'export quand l'onglet n'a aucune ligne), `exportLabel` et `exportTitle` (libellé et infobulle contextuels du bouton d'export), `fiche` (badge de catégorie), `id` (construction des liens d'onglets) et `onExport`. Les anciens props `onToggleDeclarationForm` et `showDeclarationForm` ont disparu : l'ajout d'une déclaration est devenu une page dédiée.

### `ExportFicheButton.jsx`

Bouton d'export Excel placé dans l'en-tête de la fiche. Il ne contient aucune logique métier : le libellé et l'action lui sont fournis par `ContribuableDetail.jsx`, qui s'appuie sur `../utils/exportFicheContribuable`. Son style reprend celui du bouton « 📥 Exporter Excel » de `ContribuablesFilters.jsx`.

| Propriété | Description |
| --- | --- |
| `disabled` | Désactive le bouton lorsque l'onglet courant n'a aucune ligne exportable. |
| `label` | Libellé affiché (par exemple « 📥 Exporter les déclarations »). |
| `onExport` | Déclenche la génération du fichier `.xlsx`. |
| `title` | Infobulle décrivant le contenu exporté. |

### `ContribuableOverview.jsx`

Affiche le résumé financier de la fiche : TVA payée cumulée et dernière année déclarée, puis les deux graphiques `ContribVolumeChart` et `ContribComparisonChart` importés de `../../../components/charts/Diagrammes`.

Propriétés : `annualData`, `curveData`, `currentRegime`, `declarations`, `maxBars`, `curveMax` et `totalPaid`. Les données des graphiques sont préparées par `ContribuableDetail.jsx`.

### `ClassificationPanel.jsx`

Présente les règles correspondant à la catégorie fiscale du contribuable :

- nature d'impôt et régime comptable ;
- pénalités de retard (avec la référence d'article) ;
- amendes administratives.

Le composant reçoit une unique propriété `fiche`, généralement construite avec `getFicheCategorie`.

### `RecoupementsPanel.jsx`

Liste les recoupements d'un contribuable dans l'onglet éponyme. Le composant est auto-suffisant : il appelle `getRecoupements({ id_contribuable: id, limit: 100 })` dans une fonction `load()` asynchrone déclenchée au montage (avec drapeau `cancelled`), gère son propre état de chargement, son message d'erreur et son état vide (`.empty`).

Une barre d'actions `.register-toolbar` précède le tableau : lien « + Enregistrer un recoupement » vers `/contribuables/:id/recoupements/nouveau`, lien « ⚖️ Retour à la confrontation » et compteur de lignes. Colonnes : Période, Source, Type d'opération, NIF du tiers, Montant déclaré, Montant TVA, Somme recoupée. La source est traduite par une table `SOURCE_LABELS`.

Propriété : `id` — l'`id_contribuable` porté par l'URL.

### `DroitCommunicationPanel.jsx`

Même structure pour les droits de communication, alimenté par `getDroitsCommunication({ id_contribuable: id, limit: 100 })`. Colonnes : Date de demande, Tiers, Type de tiers, Objet, Statut, Date de réponse. Le statut est rendu en badge coloré (`demande` et `partiel` en surveillance, `reponse` en conforme, `relance` et `sans_suite` en critique) et le type de tiers en libellé français (`TYPE_TIER_LABELS`) ; les dates sont passées en format `fr-FR`.

Propriété : `id` — l'`id_contribuable`.

## Formulaires partagés

`DeclarationForm.jsx`, `RecoupementForm.jsx` et `DroitCommunicationForm.jsx` ont la même signature et le même contrat. Ils ne contiennent aucun état ni appel API : l'état du formulaire appartient à la page d'enregistrement qui les monte (`pages/DeclarationCreate.jsx`, `pages/RecoupementCreate.jsx`, `pages/DroitCommunicationCreate.jsx`).

| Propriété | Description |
| --- | --- |
| `contribuable` | Contribuable concerné (raison sociale affichée dans l'en-tête du panneau). |
| `form` | Valeurs actuelles du formulaire. |
| `onChange` | Met à jour une valeur saisie à partir de l'événement de changement. |
| `onSubmit` | Déclenche l'enregistrement (POST) côté page. |
| `submitting` | Désactive le bouton pendant l'enregistrement. |
| `error` | Message d'erreur de validation ou d'API. |

- `DeclarationForm` demande l'année, le chiffre d'affaires, le bénéfice, la TVA collectée, la TVA déductible et la TVA payée.
- `RecoupementForm` couvre la source, la période, la référence, le type d'opération, le NIF du tiers, les dates et montants (déclaré, TVA, TTC) et le détail des marchandises, achats et services.
- `DroitCommunicationForm` propose le tiers, le type de tiers (`banque`, `assurance`, `administration`, `notaire`, `fournisseur`, `client`, `autre`), le NIF du tiers, l'objet, les dates de demande et de réponse, le statut (`demande`, `reponse`, `partiel`, `relance`, `sans_suite`) et trois zones de texte (pièces demandées, documents reçus, observations).

Les trois formulaires partagent la charte existante (`declaration-create-form`, `declaration-create-grid`, `field`, `form-actions`).

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
- Les données et appels API restent dans les pages ou les hooks ; les composants reçoivent des propriétés et déclenchent des callbacks. Seules les listes autonomes de la fiche (`RecoupementsPanel`, `DroitCommunicationPanel`) vont chercher leurs propres lignes, parce que la fiche n'a pas à porter cet état.
- Les montants sont formatés avec `formatAriary` et convertis avec `toNumber` (`RelancePanel` utilise son propre formatage local via `Intl.NumberFormat`).
- Les classes CSS utilisées ici sont définies dans les styles globaux de l'application.
