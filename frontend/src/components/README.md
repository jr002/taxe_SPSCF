# Composants réutilisables (`/src/components`)

Ce dossier contient les composants d'interface réutilisables, organisés par domaine fonctionnel. Tous les fichiers sont en `.jsx` et utilisent des exports nommés, sauf mention contraire (export par défaut).

---

## 1. `common/` — composants transversaux

* [`common/Header.jsx`](common/Header.jsx) : en-tête de navigation principal. Affiche le logo, les liens de routage, les onglets de sous-modules de collecte et le profil de l'agent connecté. Export par défaut `Header`.
* [`common/UserProfile.jsx`](common/UserProfile.jsx) : pastille ronde portant les initiales de l'agent connecté ; le panneau déroulé affiche l'e-mail, le centre de rattachement, le périmètre du rôle, le bouton « 🔑 Changer mon mot de passe », la bascule du thème clair / sombre et la déconnexion. Export par défaut `UserProfile`.
* [`common/ModaleConfirmation.jsx`](common/ModaleConfirmation.jsx) : modale de confirmation réutilisable — liste les paires « avant → après » d'une ou plusieurs modifications, affiche erreur et succès en son sein, et propose Annuler / Valider (variante `danger` pour blocage, suppression et abandon). Export par défaut `ModaleConfirmation`, utilisée par `AdminUtilisateurs` et `UserProfile`.
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
| `ModaleConfirmation` | `src/backofficeadmin/utilisateurs/pages/AdminUtilisateurs.jsx`, `src/components/common/UserProfile.jsx` |
| `NotificationModal` | `src/frontofficeagent/suivi-fiscal/pages/DeclarationDetail.jsx`, `src/frontofficeagent/collecte/components/TheoreticalForm.jsx` |
| `AmountField`, `IdentityFields`, `ControlResult` | `src/frontofficeagent/collecte/components/` (TheoreticalForm, ReconciliationForm, InsertionDeclaration, CollecterDeductible) |
| `ExcelImportModal` | `src/frontofficeagent/contribuables/pages/Contribuables.jsx` |
| `VolumeChart`, `RegimeChart`, `CurveChart` | `src/frontofficeagent/decisionnel/pages/TableauDecisionnel.jsx` |
| `ContribVolumeChart`, `ContribComparisonChart` | `src/frontofficeagent/contribuables/components/ContribuableOverview.jsx` |
