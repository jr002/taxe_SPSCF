# 🧩 Composants Réutilisables (`/src/components`)

Ce dossier contient l'ensemble des composants d'interface utilisateur (UI) réutilisables, subdivisés par domaine fonctionnel.

---

## 📁 Sous-dossiers et Fichiers

### 1. `common/` (Composants Communs et Layout)
* **[`Header.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/components/common/Header.jsx)** :
  * Barre de navigation principale (Header) avec logo de l'administration, liens de routage actifs, onglets des modules de collecte et bouton de bascule du thème clair / sombre (*Dark Mode*).

### 2. `forms/` (Composants de Formulaire & Saisie Fiscale)
* **[`AmountField.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/components/forms/AmountField.jsx)** :
  * Champ de saisie numérique formaté avec libellé et suffixe monétaire en Ariary (`Ar`).
* **[`IdentityFields.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/components/forms/IdentityFields.jsx)** :
  * Bloc de formulaire réutilisable pour identifier l'entreprise (NIF, Société, Année fiscale, Raison sociale, Adresse, Contact).
* **[`ControlResult.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/components/forms/ControlResult.jsx)** :
  * Carte récapitulative affichant le diagnostic du contrôle (Conforme / Alerte / Critique) et la ventilation des montants calculés.
* **[`ExcelImportModal.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/components/forms/ExcelImportModal.jsx)** :
  * Fenêtre modale / Pop-up d'importation par lot de fichiers Excel (`.xlsx`, `.xls`) et `.csv` pour les contribuables et déclarations.
  * Comprend le Drag & Drop, le téléchargement d'un modèle vierge, l'aperçu dynamique avec validation immédiate et la barre de progression.

### 3. `charts/` (Visualisations et Graphiques SVG)
* **[`Diagrammes.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/components/charts/Diagrammes.jsx)** :
  * `VolumeChart` : Graphique en barres multi-séries (dossiers IS, IR, TVA sur 5 ans).
  * `RegimeChart` : Graphique circulaire en Donut (répartition IS / IR).
  * `CurveChart` : Courbes comparatives interactives (TVA théorique vs TVA payée).
  * `ContribVolumeChart` : Graphique en barres pour la fiche individuelle contribuable.
  * `ContribComparisonChart` : Comparaison récente sous forme de courbes SVG pour un contribuable.
  * `MiniLine` & `buildChartPoints` : Moteurs de calcul et tracés vectoriels SVG.
