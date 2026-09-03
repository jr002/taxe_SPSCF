# 📄 Pages Principales & Écrans Métier (`/src/pages`)

Ce dossier regroupe les composants de vues (pages) associés aux différentes routes de l'application React Router.

---

## 📁 Liste des Pages

| Page / Fichier | Route | Description |
| :--- | :--- | :--- |
| **[`Accueil.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/Accueil.jsx)** | `/` | Tableau de bord d'accueil (Hero, identité visuelle DGI, accès rapides, statut fiscal global). |
| **[`Collecte.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/Collecte.jsx)** | `/collecte` | Écran central de simulation / collecte pilotant les 3 sous-modules dynamiques. |
| **[`PhaseClassement.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/PhaseClassement.jsx)** | `/entreprises/nouveau` | Étape 1 : Sélection de la structure fiscale de rattachement (Centre fiscal, SRE, DGE). |
| **[`FormInformation.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/FormInformation.jsx)** | `/entreprises/nouveau/form` | Étape 2 : Formulaire d'immatriculation d'un nouveau contribuable avec validation en direct. |
| **[`SuiviFiscal.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/SuiviFiscal.jsx)** | `/suivi` | Tableau complet des déclarations avec recherche instantanée, tri multi-colonnes et pagination. |
| **[`DeclarationDetail.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/DeclarationDetail.jsx)** | `/suivi/:id` | Fiche détaillée d'une déclaration fiscale avec analyse d'écart et historique. |
| **[`Contribuables.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/Contribuables.jsx)** | `/contribuables` | Liste consolidée des entreprises avec TVA payée cumulée et nombre d'années suivies. |
| **[`ContribuableDetail.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/ContribuableDetail.jsx)** | `/contribuables/:id` | Fiche d'un contribuable avec analyse multi-annuelle, graphiques d'évolution et historique des paiements. |
| **[`Register.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/Register.jsx)** | `/register` | Registre sous forme de colonnes réparties par centre fiscal (Centre, SRE, DGE). |
| **[`TableauDecisionnel.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/TableauDecisionnel.jsx)** | `/decisionnel` | Tableau de bord décisionnel stratégique avec KPIs clés et graphiques de pilotage. |

---

## 📁 Sous-dossier `modules/` (Sous-formulaires de Collecte)

* **`CollecterDeductible.jsx`** : Module A – Calcul de la TVA nette due (TVA collectée − TVA déductible).
* **`TheoreticalForm.jsx`** : Module B – Calcul de la TVA théorique selon le régime (IS / IR) et calcul automatique des redressements / pénalités.
* **`ReconciliationForm.jsx`** : Module C – Collecte des données de recoupement fiscal avec les tiers (Somme Recoupée).
