# Module Contribuables

Ce dossier regroupe le registre fiscal des contribuables : la liste et sa vue statistique, l'accueil plein écran d'un dossier et ses rubriques (synthèse, nature d'impôt, déclarations, recoupements, droits de communication, relances), la page de confrontation et les pages dédiées d'enregistrement.

## Organisation

```text
contribuables/
├── Contribuables.jsx          # Registre (liste) + vue Statistique
├── ContribuableDetail.jsx     # Accueil et rubriques d'un dossier contribuable
├── components/                # Composants d'interface des pages
│   ├── ContribuablesFilters.jsx / ContribuablesTable.jsx
│   ├── ContribuablesStatistiques.jsx
│   ├── ContribuableHeader.jsx / ContribuableAccueil.jsx / ContribuableSituation.jsx
│   ├── ExportFicheButton.jsx / ContribuableOverview.jsx
│   ├── ClassificationPanel.jsx / DeclarationHistory.jsx / RelancePanel.jsx
│   ├── RecoupementsPanel.jsx / DroitCommunicationPanel.jsx
│   ├── LienAccesModal.jsx      # émission du lien du portail contribuable
│   ├── DeclarationForm.jsx / RecoupementForm.jsx / DroitCommunicationForm.jsx
│   └── README.md
├── hooks/
│   └── useContribuablesList.jsx
├── pages/                     # Pages plein écran montées par App.jsx
│   ├── Confrontation.jsx            # /contribuables/:id/confrontation
│   ├── DeclarationCreate.jsx        # /contribuables/:id/declarations/nouveau
│   ├── RecoupementCreate.jsx        # /contribuables/:id/recoupements/nouveau
│   ├── DroitCommunicationCreate.jsx # /contribuables/:id/droits-communication/nouveau
│   └── confrontation/               # sous-composants de la page de confrontation
└── utils/
    ├── exportFicheContribuable.js
    ├── statistiques.utils.js
    └── amoutsArrondi.jsx

# Les survols et la modale « Aide à la lecture » utilisés ici viennent du
# domaine voisin ../aide/ (registre `aideAgent.data.js` propre à l'espace agent).
```

## Contribuables.jsx — deux vues

La page `/contribuables` présente un sélecteur de vue (`nav.contribuable-tabs`) entre :

- **Registre** (défaut) : filtres par catégorie, recherche textuelle, tableau paginé, export Excel des résultats filtrés et import Excel/CSV de **contribuables** via `ExcelImportModal` (mode registre, voir plus bas le mode dossier de la fiche). Les colonnes de l'export sont, dans l'ordre : NIF, Secteur d'activité, Adresse, Téléphone, E-mail, Centre gestionnaire, Nature d'impôt ; une légende « Catégories » survolable ferme la barre d'onglets, et les en-têtes « Dernière année », « Années suivies » et « TVA payée cumulée » s'expliquent au survol ;
- **Statistique** : vue globale et agrégée du portefeuille, sans tableau ni pagination.

La vue est portée par l'URL (`/contribuables?vue=statistique`, lu avec `useSearchParams`), donc elle est partageable et le bouton « Retour » du navigateur fonctionne. Les deux vues consomment la même source de données (`useContribuablesList`, limite 10 000) ; aucun appel API supplémentaire n'est nécessaire puisque `GET /api/contribuables` inclut déjà les `declarations` de chaque contribuable.

### `ContribuablesStatistiques.jsx`

Quatre indicateurs (déclarations suivies, dossiers en VSP, dossiers en CSP, redressements cumulés) puis quatre graphiques :

| Graphique | Type | Mesure |
| --- | --- | --- |
| Déclarations : redressements VSP / CSP | camembert | montant notifié |
| Déclarations VSP / CSP par année | histogramme | nombre de dossiers |
| Redressements par nature d'impôt et procédure | camembert | montant notifié |
| Dossiers par nature d'impôt et procédure | histogramme | nombre de dossiers |

Les données viennent de `buildStatistiques(contribuables)` ([`utils/statistiques.utils.js`](utils/statistiques.utils.js)) et les graphiques des composants génériques `Camembert` et `Histogramme` de `../../components/charts/Diagrammes`.

**VSP / CSP n'existe pas en base.** La procédure est *déduite* côté frontend par `isVSP(declaration)` : une déclaration est tenue pour VSP (vérification sur place) si elle porte une `date_notification_primitive` ou une `date_notification_definitive`, ou si `montant_redressement > 0` ; toutes les autres sont suivies en CSP (contrôle sur pièces). La ventilation « nature d'impôt » reprend `regime_fiscal` du contribuable : `IS` et `IR` forment leur propre catégorie, tout le reste (`RS`, `RNS`, valeur absente) est agrégé sous `TVA`. Cette déduction est volontairement sans migration de schéma ; si la base stocke un jour le type de contrôle, c'est dans ce module qu'il faut remplacer la règle.

## ContribuableDetail.jsx — l'accueil et les rubriques du dossier

Le composant est monté par sept routes déclarées dans `App.jsx` ; la rubrique active est déduite du chemin par `getActiveTab` :

| Route | Onglet |
| --- | --- |
| `/contribuables/:id` | Accueil (`home`) |
| `/contribuables/:id/synthese` | Synthèse (`overview`) |
| `/contribuables/:id/classification` | Nature d'impôt |
| `/contribuables/:id/declarations` | Déclarations |
| `/contribuables/:id/recoupements` | Recoupements |
| `/contribuables/:id/droits-communication` | Droits de communication |
| `/contribuables/:id/relances` | Relances |

Trois pages s'ajoutent sous le même préfixe `/contribuables/:id` mais rendent un composant distinct :

| Route | Composant | Rôle |
| --- | --- | --- |
| `/contribuables/:id/confrontation` | `pages/Confrontation.jsx` | page unique de confrontation déclarations / recoupements (onglets internes, un seul point d'accès) |
| `/contribuables/:id/declarations/nouveau` | `pages/DeclarationCreate.jsx` | enregistrement d'une déclaration |
| `/contribuables/:id/recoupements/nouveau` | `pages/RecoupementCreate.jsx` | enregistrement d'un recoupement |
| `/contribuables/:id/droits-communication/nouveau` | `pages/DroitCommunicationCreate.jsx` | enregistrement d'un droit de communication |

L'Accueil est la page d'entrée plein écran du dossier. Elle affiche la situation enregistrée et des cartes qui ouvrent directement chacune des six rubriques ; la Synthèse conserve les graphiques historiques sous `/synthese`. Le bouton « ⚖️ Ouvrir la confrontation » est proposé depuis l'Accueil. Chaque page d'enregistrement charge le contribuable par `getContribuableById(id)`, réutilise le formulaire partagé, valide, poste via l'API puis revient à la rubrique de liste ; elle se termine par un lien « ⚖️ Retour à la confrontation ».

`ContribuableHeader` affiche l'e-mail du dossier sur sa ligne d'identification (`NIF : … · n année(s) suivie(s) · E-mail : …`, `N/A` quand le champ est vide). Tout rôle opérationnel qui ouvre la fiche le voit donc depuis l'Accueil comme depuis les autres rubriques : `GET /api/contribuables` renvoie déjà `email` et l'export Excel du registre le contenait déjà, aucune autorité supplémentaire n'est impliquée.

`DroitCommunicationCreate` applique la règle « un seul droit de communication par contribuable et par année civile » : la page charge les droits déjà enregistrés du dossier, et si l'année de la `date_demande` saisie est déjà couverte, elle affiche un message d'avertissement et désactive l'envoi. Le contrôle reste aussi côté serveur (`409`, voir [`ROUTES_AND_API.md`](../../../../ROUTES_AND_API.md)) : l'avertissement de la page est une anticipation de confort, pas la garantie.

Contenu des rubriques :

- **Accueil** : statut du dernier contrôle enregistré, TVA payée, écart à examiner, relances émises, repère de pénalités non liquidées et cartes de navigation vers les rubriques ;
- **Synthèse** : TVA payée cumulée, dernière déclaration enregistrée, graphiques `ContribVolumeChart` et `ContribComparisonChart` ;
- **Nature d'impôt** : catégorie déduite du dernier chiffre d'affaires déclaré (`getCaReference` + `getFicheCategorie(categorie, ca)`), nature d'impôt du dossier confrontée à celle de la catégorie, pénalités et amendes ;
- **Déclarations** : historique cliquable (vers `/suivi/:id`) et barre d'actions « + Ajouter une déclaration » / retour confrontation ;
- **Recoupements** : `RecoupementsPanel`, liste auto-suffisante (`getRecoupements({ id_contribuable, limit: 100 })`) avec bouton d'enregistrement ;
- **Droits de communication** : `DroitCommunicationPanel`, même logique sur `getDroitsCommunication`, statuts rendus en badges (`demande`, `reponse`, `partiel`, `relance`, `sans_suite`) ; la règle « un seul droit par année civile » y est énoncée dans la phrase d'introduction et appliquée côté serveur (`409`) ;
- **Relances** : actions de rappel, mise en demeure, régularisation, historique et aperçu imprimable `RappelOrdreModal`.

Les relances sont persistées en base par `POST /api/relances` (`createRelance`) et relues par `GET /api/contribuables/:id/relances` (`getRelancesByContribuable`) : la liste est déjà filtrée sur le centre de l'agent par le middleware `data-scope`, le panneau n'a donc plus besoin de clé NIF. L'émission ouvre la lettre imprimable **seulement après** le retour 201 de l'API, et « Marquer comme Régularisé » fait un `PUT /api/relances/:id` (`statut: 'regularisee'`, `date_regularisation`) sur la relance la plus récente encore `emise`. Les erreurs de ces deux appels s'affichent dans un `.form-submit-message` (`role="alert"`), la confirmation dans un `.form-submit-message.success` (`role="status"`). Aucun historique ne passe plus par `localStorage`.

### Aide à la lecture (`../aide/`)

Chaque écran de la fiche s'explique lui-même, sans que l'agent ait à quitter la page :

- Le bouton `? Aide` de `ContribuableHeader` ouvre [`AideLectureModal`](../aide/components/AideLectureModal.jsx) avec `ecran={activeTab}`. Les clés du registre (`overview`, `classification`, `declarations`, `recoupements`, `droits`, `relances`) étant celles des onglets, aucune correspondance n'est à maintenir ; la modale liste les rubriques de l'onglet puis « Les mots de cet écran », un glossaire **déduit** des termes cités par ces rubriques.
- Les termes sont survolables via [`AideTerme`](../aide/components/AideTerme.jsx) : badge de catégorie et ligne NIF / centre gestionnaire de l'en-tête, indicateur « TVA payée cumulée », en-têtes de colonnes de l'historique des déclarations (propriété `header` de `DataTable`, qui prime sur `label`), seuils et chefs de l'onglet Nature d'impôt, colonnes des panneaux Recoupements — dont « Période », qui porte la cadence mensuelle (TVA, 12 fois par an) et annuelle (IR / IS) du recoupement — et Droits de communication, colonnes et encadré « Montant dû estimé » du panneau Relances.
- Trois panneaux ouvrent leur propos par une phrase `.aide-ecran-intro` qui dit ce que la liste montre avant la première ligne (Recoupements, Droits de communication, historique des déclarations).
- **Un `AideTerme` rend un `<button>`** : il n'est donc jamais posé dans un bouton existant. Les boutons d'action de relance (rappel, mise en demeure, régularisation) ne portent pas de survol ; leurs délais sont rappelés dans le détail de l'action et expliqués dans la modale.
- La page `/contribuables/:id/confrontation` est câblée de la même façon (`BoutonAide` + `AideLectureModal ecran="confrontation"`, survols des colonnes Type, CA déclaré, Recoupé (TTC), Écart et Statut de la table des rapprochements).

### Export Excel des données listées

`ContribuableHeader` affiche un bouton « 📥 Exporter … » sur les onglets Synthèse, Nature d'impôt, Déclarations et Relances (masqué sur Recoupements et Droits de communication). Le classeur `.xlsx` contient une feuille `Identification` (raison sociale, NIF, secteur, adresse, contacts, centre gestionnaire, nature d'impôt, catégorie, années suivies, TVA payée cumulée) puis la feuille de l'onglet actif :

| Onglet | Feuille | Colonnes |
| --- | --- | --- |
| Synthèse | `Synthèse` | Année, déclarations déposées, TVA payée, TVA théorique, écart |
| Nature d'impôt | `Nature d'impôt` | Catégorie, seuil, régimes fiscal et comptable, pénalités de retard, amendes, référence légale |
| Déclarations | `Déclarations` | Année, chiffre d'affaires, catégorie, TVA collectée, TVA déductible, TVA payée, TVA théorique, statut |
| Relances | `Relances` | Date, type, montant, statut (relances en base du contribuable, libellés de `frontofficeagent/relance/utils/relance.utils.js`) |

Le bouton est désactivé quand l'onglet n'a aucune ligne exportable (`countExportRows`). Le fichier est nommé `contribuable-<NIF>-<onglet>-<AAAA-MM-JJ>.xlsx` et les montants sont écrits en valeurs numériques au format Excel `#,##0 "Ar"`.

### Import Excel des déclarations du dossier

Sur les onglets **Synthèse** et **Déclarations**, `ContribuableHeader` affiche un
bouton `secondary` « Importer Excel » (prop `onImporter`). Il ouvre le même
`ExcelImportModal` que le registre, mais avec la prop `contribuable` : la modale
bascule alors en **mode dossier** et alimente la table `declarations`, jamais la
fiche. Le détail de la lecture, du mappage et des garde-fous est dans
[`../../components/forms/README.md`](../../components/forms/README.md) ; ce que la
fiche en attend :

- **Colonnes** : une ligne = un exercice, avec NIF, Exercice (`2024` ou `2024-03`), Chiffre d'affaires, Bénéfice, TVA collectée, TVA déductible, TVA payée, TVA théorique. Ce sont les colonnes réellement enregistrables ; les autres sont ignorées, et le modèle téléchargeable (`Modele_Import_Declarations_DGI.xlsx`) porte le NIF du dossier prérempli.
- **Rapprochement par exercice** : avant la première écriture, les déclarations TVA déjà au dossier sont relues (`GET /api/declarations?search=<NIF>`) et l'aperçu annonce pour chaque ligne « mise à jour » ou « création ». Si cette lecture échoue, l'import s'arrête : la modale refuse d'écrire sans savoir ce qu'elle écrase.
- **Un exercice par ligne** : la base impose l'unicité `id_contribuable + periode + type_declaration` ; deux lignes du même classeur portant le même exercice voient la seconde refusée (« Non importée »), et un NIF étranger au dossier est refusé ligne par ligne.
- **Rien n'est suppléé** : une case vide reste vide. Une mise à jour est partielle (`PUT /api/declarations/:id` avec les seuls montants lisibles), la valeur enregistrée survit ; une création garde le montant non renseigné. Le bilan final énumère, exercice par exercice, ce qui n'a pas été apporté par le classeur.
- **Le statut n'est pas deviné** : `PUT` ne recalcule pas le statut côté serveur et `POST` en calcule un (TVA théorique = CA × 5 % par défaut). Le statut n'est donc écrit que si la TVA théorique **et** la TVA payée sont lisibles, avec les seuils partagés de [`../../utils/fiscal.utils.js`](../../utils/fiscal.utils.js) ; quand le classeur n'apportait pas la TVA théorique, la déclaration créée est immédiatement remise à `tva_theorique: null, statut: null`, et l'incident le dit (« à établir après contrôle »).
- **Écran** : les montants absents s'affichent « Absente du fichier », le badge d'une ligne résume le nombre d'absences, et `onSuccess` rend le bilan (`N créée(s) · M mise(s) à jour · K incident(s)`) que `ContribuableDetail` affiche dans un `.form-submit-message.success` puis recharge la fiche depuis la base (`rechargerFiche`) — l'agent voit les valeurs stockées, pas l'ancien état en mémoire.

### Lien de consultation du portail contribuable

`ContribuableHeader` affiche aussi, hors du contexte d'un onglet, un bouton
`secondary` « Lien contribuable ». Il bascule l'état `lienAccesOpen` de
`ContribuableDetail.jsx`, qui monte alors `LienAccesModal` — monté
conditionnellement, donc jamais deux fois avec le même jeton affiché.

La modale choisit une durée (7, 14 ou 30 jours) et appelle
`genererAccesContribuable(id_contribuable, { duree_jours })`, c'est-à-dire
`POST /api/contribuables/:id/acces-contribuable`. Elle affiche alors l'URL complète
du portail (`/espace-contribuable/<jeton>`), son échéance et l'e-mail masqué du
dossier, avec le rappel que le lien actif précédent a été révoqué et qu'aucune
note interne n'est visible du contribuable.

L'agent n'a rien à retenir : le jeton n'est stocké ni dans le `localStorage` ni
dans un cookie, il ne transite que par le presse-papiers ou le champ sélectionné.
Un dossier sans e-mail enregistré refuse l'émission (`400` tant côté API que dans
la modale), car cet e-mail est l'un des deux facteurs de confirmation du portail.
Le détail du parcours côté contribuable est dans
[`../../accountcontribuable/README.md`](../../accountcontribuable/README.md).

## Composants

Les propriétés détaillées de chaque composant figurent dans le [`README`](components/README.md) du dossier `components`.

## Hook et utilitaires

### `hooks/useContribuablesList.jsx`

Centralise l'état de la liste : récupération (`getContribuables`, limite 10 000), filtre texte, filtre de catégorie, pagination de 15 éléments, chargement et erreurs. **Le filtre texte (`q`), la catégorie (`categorie`) et la page (`page`) vivent dans l'URL** au moyen de `useSearchParams` et des helpers `readSearchParam` / `updateSearchParams` de [`../../utils/searchParams.utils.js`](../../utils/searchParams.utils.js) : une liste filtrée est donc partageable par lien, le bouton « Actualiser » et les pages précédent/suivant conservent l'état, et `replace: true` évite d'engorger l'historique à chaque frappe. Les paramètres vides sont supprimés de l'URL et les paramètres non gérés (comme `vue=statistique`) sont conservés. La page demandée est écrasée à `totalPages` à l'affichage, sans effet de rattrapage. `clearFilters()` (bouton « ✕ Effacer les filtres » de `ContribuablesFilters`, désactivé tant qu'aucun filtre n'est actif) remet `q`, `categorie` et `page` à zéro.

Il enrichit chaque contribuable d'une clé (`key`), de ses `declarations` et de sa catégorie, calcule les compteurs par catégorie et expose les données filtrées (`allContribuables`, `filteredContribuables`, `paginatedContribuables`, `counts`, `totalPages`, `hasActiveFilters`, `clearFilters`, `loadData`, etc.). `allContribuables` alimente aussi la vue Statistique.

### `utils/statistiques.utils.js`

Règle de déduction VSP/CSP (`isVSP`, `getProcedure`), catégorisation `IS` / `IR` / `TVA` (`getCategorieImpot`), palette de couleurs et `buildStatistiques(contribuables)` qui renvoie `{ totalDossiers, totalContribuables, totalRedresse, dossiersRedresses, parProcedure, parAnnee, ventilation, parCategorie }`. Les deux mesures exposées par ligne sont `valeur` (montant de redressement) et `dossiers` (nombre de déclarations).

### `utils/exportFicheContribuable.js`

Construit et télécharge le classeur Excel de la fiche. `countExportRows(props)` renvoie le nombre de lignes que produirait l'export (utilisé pour désactiver le bouton) et `exportFicheContribuable(props)` génère le fichier et renvoie `{ count, label }`. Les deux fonctions attendent le même objet : `{ activeTab, annualData, contribuable, declarations, fiche, history }`. Le module réutilise les seuils `SEUIL_GRAND` et `SEUIL_MOYEN` de `../../frontofficeagent/contribuables/utils/classificationCgi.utils` pour la colonne « Catégorie ».

### Pagination : partagée, plus locale

`getPageNumbers(currentPage, totalPages)` vit dans
[`../../utils/pagination.utils.js`](../../utils/pagination.utils.js) et le
composant de navigation dans
[`../../components/common/Pagination.jsx`](../../components/common/Pagination.jsx)
: jusqu'à 7 pages tous les numéros sont affichés, au-delà des points de suspension
(`'...'`) remplacent les pages intermédiaires. La découpe en page du registre
reste assurée par `useContribuablesList` (15 éléments), alors que les pages
d'administration utilisent le hook générique
[`../../hooks/useTablePagination.js`](../../hooks/useTablePagination.js) (10
éléments) avec le même composant `Pagination`.

### `utils/amoutsArrondi.jsx`

Exporte `AmountFormatter({ amount })`, qui affiche un montant arrondi et abrégé en français (« mille », « million(s) », « milliard(s) », « mille milliards Ar »). Valeurs nulles ou non numériques rendues par `0 Ar`.

> Le nom du fichier contient une coquille (`amouts` au lieu de `amounts`) et le composant n'est importé nulle part dans `frontend/src` : utilitaire actuellement inutilisé.

## Dépendances principales

- `../../api/api` : `getContribuables`, `getContribuableById`, `createDeclaration`, `getRecoupements`, `createRecoupement`, `getDroitsCommunication`, `createDroitCommunication`, `getErrorMessage` ;
- `../../frontofficeagent/contribuables/utils/classificationCgi.utils` : `getCaReference`, `getCategorie` (liste des contribuables), `getCategorieFromCa` et `getFicheCategorie` (fiche de la fiche contribuable) ;
- `../../frontofficeagent/decisionnel/utils/decisionnel.utils` : `getRegime` ;
- `../../utils/formatters` : `formatAriary`, `formatNumber`, `toNumber` ;
- `../../components/forms/ExcelImportModal` : import Excel/CSV — mode registre (liste) et mode dossier (fiche contribuable) ;
- `../relance/components/RappelOrdreModal` : aperçu des documents de relance ;
- `../../components/charts/Diagrammes` : `ContribVolumeChart`, `ContribComparisonChart`, `Camembert`, `Histogramme` ;
- `xlsx` (SheetJS) : génération des classeurs Excel exportés.

## Flux simplifié

```text
API ─→ useContribuablesList ─→ Contribuables ─┬─→ Registre → tableau → fiche
                                              └─→ Statistique → buildStatistiques → graphiques

Fiche ─→ onglet ─→ page d'enregistrement dédiée ─→ POST API ─→ retour onglet
```

## Points d'attention

- Les données de la liste sont demandées avec une limite de 10 000 entrées, puis filtrées et agrégées côté navigateur ; la vue Statistique ne fait aucun appel supplémentaire.
- Sur les données actuelles, la déduction VSP/CSP est très déséquilibrée (2 dossiers VSP contre 121 CSP) et la totalité des redressements est portée par deux déclarations : les camemberts « montants » sont donc quasi monotones, les histogrammes restent lisibles.
- Les composants de liste (`RecoupementsPanel`, `DroitCommunicationPanel`) vont chercher eux-mêmes leurs lignes : la fiche n'a plus à porter cet état.
- Le montant dû affiché dans l'onglet Relances est recalculé à partir des déclarations (`montant_net_a_payer`, sinon `tva_theorique − tva_payee`).
