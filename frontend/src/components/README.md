# Composants réutilisables (`/src/components`)

Ce dossier contient les composants d'interface réutilisables, organisés par domaine fonctionnel. Tous les fichiers sont en `.jsx` et utilisent des exports nommés, sauf mention contraire (export par défaut).

---

## 1. `common/` — composants transversaux

* [`common/Header.jsx`](common/Header.jsx) : en-tête de navigation principal. Affiche le logo, les liens de routage, les onglets de sous-modules de collecte et les boutons de thème et de déconnexion. Export par défaut `Header`.
* [`common/NotificationModal.jsx`](common/NotificationModal.jsx) : modale d'affichage et d'impression du document officiel de notification (primitive ou définitive) de redressement fiscal. Export par défaut `NotificationModal`.

Détail : [`common/README.md`](common/README.md).

## 2. `forms/` — saisie et import fiscal

* [`forms/AmountField.jsx`](forms/AmountField.jsx) : champ de saisie monétaire avec libellé et suffixe `Ar`. Export par défaut `AmountField`.
* [`forms/IdentityFields.jsx`](forms/IdentityFields.jsx) : bloc d'identification du contribuable (NIF, année fiscale, société, adresse, contact, e-mail). Export par défaut `IdentityFields`.
* [`forms/ControlResult.jsx`](forms/ControlResult.jsx) : carte de résultat d'un contrôle, avec état `success` ou `alert` et ventilation des montants. Export par défaut `ControlResult`.
* [`forms/ExcelImportModal.jsx`](forms/ExcelImportModal.jsx) : modale d'import par lot de fichiers `.xlsx`, `.xls` et `.csv` (drag & drop, modèle téléchargeable, aperçu validé, barre de progression). Export par défaut `ExcelImportModal`.

Détail : [`forms/README.md`](forms/README.md).

## 3. `charts/` — visualisations SVG

[`charts/Diagrammes.jsx`](charts/Diagrammes.jsx) est le seul fichier du sous-dossier. Il expose des exports nommés :

* `buildChartPoints`, `MiniLine` : moteurs de tracé SVG.
* `VolumeChart`, `RegimeChart`, `CurveChart` : graphiques du tableau décisionnel.
* `ContribVolumeChart`, `ContribComparisonChart` : graphiques de la fiche d'un contribuable.

Détail : [`charts/README.md`](charts/README.md).

---

## Consommateurs

| Composant | Importé par |
| --- | --- |
| `Header` | `src/App.jsx` |
| `NotificationModal` | `src/pages/suivi-fiscal/DeclarationDetail.jsx`, `src/pages/collecte/modules/TheoreticalForm.jsx` |
| `AmountField`, `IdentityFields`, `ControlResult` | `src/pages/collecte/modules/` (TheoreticalForm, ReconciliationForm, InsertionDeclaration, CollecterDeductible) |
| `ExcelImportModal` | `src/pages/contribuables/Contribuables.jsx` |
| `VolumeChart`, `RegimeChart`, `CurveChart` | `src/pages/decisionnel/TableauDecisionnel.jsx` |
| `ContribVolumeChart`, `ContribComparisonChart` | `src/pages/contribuables/components/ContribuableOverview.jsx` |
