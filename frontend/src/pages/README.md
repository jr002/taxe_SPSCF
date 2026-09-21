# 📄 Architecture Modulaire des Pages Métier (`/src/pages`)

Ce dossier structure l'ensemble des pages et écrans métiers de l'application selon une **architecture modulaire par domaine fonctionnel (feature-based)**.

Toutes les pages peuvent être importées individuellement ou directement via le point d'entrée unique [`index.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/index.jsx).

```javascript
import { Accueil, Collecte, SuiviFiscal, Contribuables } from './pages';
```

---

## 📁 Organisation par Domaine Métier

### 1. 🏠 Accueil & Vue Globale (`/accueil`)
* **[`Accueil.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/accueil/Accueil.jsx)** (`/`) : Tableau de bord d'accueil institutionnel (Hero DGI, accès rapides, situation fiscale globale).

### 2. ⚡ Collecte & Simulation Dynamique (`/collecte`)
* **[`Collecte.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/collecte/Collecte.jsx)** (`/collecte`) : Page pivot orchestrant les sous-modules de collecte dynamique.
* **Sous-modules de calcul fiscal (`/collecte/modules`) :**
  * **[`CollecterDeductible.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/collecte/modules/CollecterDeductible.jsx)** : Module A – TVA nette à payer (TVA collectée − TVA déductible).
  * **[`TheoreticalForm.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/collecte/modules/TheoreticalForm.jsx)** : Module B – Simulation TVA théorique (IS / IR), pénalités et calcul du redressement.
  * **[`ReconciliationForm.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/collecte/modules/ReconciliationForm.jsx)** : Module C – Collecte du recoupement fiscal tiers (Somme Recoupée).
  * **[`InsertionDeclaration.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/collecte/modules/InsertionDeclaration.jsx)** : Module B2 – Saisie de déclaration officielle et détection automatique de régime.

### 3. 🏢 Immatriculation & Entreprises (`/entreprises`)
* **[`PhaseClassement.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/entreprises/PhaseClassement.jsx)** (`/entreprises/nouveau`) : Étape 1 – Sélection de la structure fiscale de rattachement (Centre fiscal, SRE, DGE).
* **[`FormInformation.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/entreprises/FormInformation.jsx)** (`/entreprises/nouveau/form`) : Étape 2 – Formulaire complet d'enregistrement d'un contribuable.

### 4. 👥 Portefeuille Contribuables (`/contribuables`)
* **[`Contribuables.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/contribuables/Contribuables.jsx)** (`/contribuables`) : Registre filtrable, compteurs par catégorie (Grand, Moyen, Petit) et import Excel/CSV.
* **[`ContribuableDetail.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/contribuables/ContribuableDetail.jsx)** (`/contribuables/:id`) : Fiche complète d'un contribuable, graphiques d'évolution et historique multi-annuel.

### 5. 📑 Suivi Fiscal & Procédure Contradictoire (`/suivi-fiscal`)
* **[`SuiviFiscal.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/suivi-fiscal/SuiviFiscal.jsx)** (`/suivi`) : Journal des déclarations avec recherche en direct, tri et pagination.
* **[`DeclarationDetail.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/suivi-fiscal/DeclarationDetail.jsx)** (`/suivi/:id`) : Fiche d'une déclaration et gestionnaire du cycle contradictoire.
* **Sous-composants modulaires (`/suivi-fiscal/components`) :**
  * **[`DeclarationSummaryCards.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/suivi-fiscal/components/DeclarationSummaryCards.jsx)** : Cartes de synthèse financière et détails déclaratifs.
  * **[`ProcedureContradictoireTimeline.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/suivi-fiscal/components/ProcedureContradictoireTimeline.jsx)** : Stepper légal, décompte 30 jours et décomposition du redressement.
  * **[`ProcedureActionForms.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/suivi-fiscal/components/ProcedureActionForms.jsx)** : Formulaires pour l'émission primitive, définitive et l'imputation de crédit.

### 6. 🏛️ Centres Fiscaux & Registre (`/centres`)
* **[`Register.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/centres/Register.jsx)** (`/register`) : Registre des centres fiscaux (Centre, SRE, DGE) avec tri et pagination.
* **[`CentreDetail.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/centres/CentreDetail.jsx)** (`/centres/:id`) : Fiche d'un centre fiscal et liste de ses contribuables rattachés.

### 7. 📊 Tableau Décisionnel (`/decisionnel`)
* **[`TableauDecisionnel.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/pages/decisionnel/TableauDecisionnel.jsx)** (`/decisionnel`) : Tableau de bord décisionnel avec KPIs clés et graphiques de pilotage consolidés.
