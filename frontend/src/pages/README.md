# 📄 Architecture Modulaire des Pages Métier (`/src/pages`)

Ce dossier structure l'ensemble des pages et écrans métiers de l'application selon une **architecture modulaire par domaine fonctionnel (feature-based)**.

Toutes les pages peuvent être importées individuellement ou directement via le point d'entrée unique [`index.jsx`](index.jsx).

```javascript
import { Accueil, Collecte, SuiviFiscal, Contribuables } from './pages';
```

---

## 🧭 Routes déclarées (`frontend/src/App.jsx`)

Toutes les routes protégées ci-dessous sont des enfants du layout authentifié (`Header` + `Outlet`). L'application est montée avec `react-router-dom` v7 dans [`App.jsx`](../App.jsx).

| Route | Composant | Fichier |
| --- | --- | --- |
| `/` | `Signin` (ou redirection vers `/acceuil` si la session est active) | [`../users/signin.jsx`](../users/signin.jsx) |
| `/signin` | Redirection vers `/` | — |
| `/acceuil` | `Accueil` | [`accueil/Accueil.jsx`](accueil/Accueil.jsx) |
| `/collecte` | `Collecte` | [`collecte/Collecte.jsx`](collecte/Collecte.jsx) |
| `/entreprises/nouveau` | `PhaseClassement` | [`entreprises/PhaseClassement.jsx`](entreprises/PhaseClassement.jsx) |
| `/entreprises/nouveau/form` | `FormInformation` | [`entreprises/FormInformation.jsx`](entreprises/FormInformation.jsx) |
| `/decisionnel` | `TableauDecisionnel` | [`decisionnel/TableauDecisionnel.jsx`](decisionnel/TableauDecisionnel.jsx) |
| `/register` | `Register` | [`centres/Register.jsx`](centres/Register.jsx) |
| `/centres/:id` | `CentreDetail` | [`centres/CentreDetail.jsx`](centres/CentreDetail.jsx) |
| `/suivi` | `SuiviFiscal` | [`suivi-fiscal/SuiviFiscal.jsx`](suivi-fiscal/SuiviFiscal.jsx) |
| `/suivi/:id` | `DeclarationDetail` | [`suivi-fiscal/DeclarationDetail.jsx`](suivi-fiscal/DeclarationDetail.jsx) |
| `/contribuables` | `Contribuables` | [`contribuables/Contribuables.jsx`](contribuables/Contribuables.jsx) |
| `/contribuables/:id` | `ContribuableDetail` | [`contribuables/ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) |
| `/contribuables/:id/classification` | `ContribuableDetail` | [`contribuables/ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) |
| `/contribuables/:id/declarations` | `ContribuableDetail` | [`contribuables/ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) |
| `/contribuables/:id/relances` | `ContribuableDetail` | [`contribuables/ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) |
| `/relance` | `RelanceFiscale` | [`relance/RelanceFiscale.jsx`](relance/RelanceFiscale.jsx) |
| `*` | Redirection vers `/` | — |

> ⚠️ La route de l'accueil est déclarée `/acceuil` dans [`App.jsx`](../App.jsx) (coquille). Les liens du code doivent utiliser cette orthographe, pas `/accueil`.

---

## 📁 Organisation par Domaine Métier

### 1. 🏠 Accueil & Vue Globale (`accueil/`)
* **[`Accueil.jsx`](accueil/Accueil.jsx)** (`/acceuil`) : Tableau de bord d'accueil institutionnel (Hero DGI, accès rapides, situation fiscale globale). Les raccourcis pointent vers `/collecte`, `/entreprises/nouveau`, `/suivi`, `/register` et `/decisionnel`.

### 2. ⚡ Collecte & Simulation Dynamique (`collecte/`)
* **[`Collecte.jsx`](collecte/Collecte.jsx)** (`/collecte`) : Page pivot orchestrant les sous-modules de collecte dynamique. Elle reçoit `currentModule` depuis `App.jsx` (`sales`, `theoretical`, `reconciliation`, `declaration`) et affiche le module correspondant ; le défaut est `sales`.
* **Sous-modules de calcul fiscal (`collecte/modules/`) :**
  * **[`CollecterDeductible.jsx`](collecte/modules/CollecterDeductible.jsx)** : Module A – TVA nette à payer (TVA collectée − TVA déductible), avec contrôle de l'écart par rapport à la TVA effectivement payée.
  * **[`TheoreticalForm.jsx`](collecte/modules/TheoreticalForm.jsx)** : Module B – Simulation TVA théorique (IS / IR), pénalités et calcul du redressement.
  * **[`ReconciliationForm.jsx`](collecte/modules/ReconciliationForm.jsx)** : Module C – Collecte du recoupement fiscal tiers (Somme Recoupée).
  * **[`InsertionDeclaration.jsx`](collecte/modules/InsertionDeclaration.jsx)** : Module D – Saisie de la déclaration fiscale officielle (CA, bénéfice, impôts payés, TVA déclarée) et affichage du régime fiscal détecté.
  * Chaque module reçoit la propriété `surCollecte` et n'est pas exporté par domaine : tous sont réexportés par [`index.jsx`](index.jsx).

### 3. 🏢 Immatriculation & Entreprises (`entreprises/`)
* **[`PhaseClassement.jsx`](entreprises/PhaseClassement.jsx)** (`/entreprises/nouveau`) : Étape 1 – Sélection de la structure fiscale de rattachement (Centre fiscal < 2 Md Ar, SRE 2–4 Md Ar, DGE > 4 Md Ar). Chaque choix renvoie vers le formulaire avec `?structure=`.
* **[`FormInformation.jsx`](entreprises/FormInformation.jsx)** (`/entreprises/nouveau/form`) : Étape 2 – Formulaire complet d'enregistrement d'un contribuable (NIF, société, secteur, CA, structure fiscale, centre de rattachement, contacts). Redirige vers `/contribuables` après succès.

### 4. 👥 Portefeuille Contribuables (`contribuables/`)
* **[`Contribuables.jsx`](contribuables/Contribuables.jsx)** (`/contribuables`) : Registre filtrable, compteurs par catégorie (Grand, Moyen, Petit) et import Excel/CSV.
* **[`ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx)** (`/contribuables/:id`, `/classification`, `/declarations`, `/relances`) : Fiche complète d'un contribuable, graphiques d'évolution et historique multi-annuel. Les quatre routes partagent le même composant, qui déduit l'onglet actif du chemin ; chaque onglet peut être exporté au format Excel.
* Détails dans le [`README`](contribuables/README.md) du domaine.

### 5. 📑 Suivi Fiscal & Procédure Contradictoire (`suivi-fiscal/`)
* **[`SuiviFiscal.jsx`](suivi-fiscal/SuiviFiscal.jsx)** (`/suivi`) : Journal des déclarations avec recherche en direct, tri (contribuable, année, statut) et pagination de 20 lignes.
* **[`DeclarationDetail.jsx`](suivi-fiscal/DeclarationDetail.jsx)** (`/suivi/:id`) : Fiche d'une déclaration et gestionnaire du cycle contradictoire (notification primitive, définitive, imputation du crédit d'impôt).
* **Sous-composants modulaires (`suivi-fiscal/components/`) :**
  * **[`DeclarationSummaryCards.jsx`](suivi-fiscal/components/DeclarationSummaryCards.jsx)** : Cartes de synthèse financière, statut juridique et détails déclaratifs.
  * **[`ProcedureContradictoireTimeline.jsx`](suivi-fiscal/components/ProcedureContradictoireTimeline.jsx)** : Stepper légal, décompte 30 jours et décomposition du redressement.
  * **[`ProcedureActionForms.jsx`](suivi-fiscal/components/ProcedureActionForms.jsx)** : Formulaires pour l'émission primitive, définitive et l'imputation de crédit.

### 6. 🏛️ Centres Fiscaux & Registre (`centres/`)
* **[`Register.jsx`](centres/Register.jsx)** (`/register`) : Registre des centres fiscaux (Centre Fiscal, SRE, DGE, autre) avec recherche, filtre par type, tri et pagination de 10 lignes.
* **[`CentreDetail.jsx`](centres/CentreDetail.jsx)** (`/centres/:id`) : Fiche d'un centre fiscal et liste de ses contribuables rattachés.

### 7. 📊 Tableau Décisionnel (`decisionnel/`)
* **[`TableauDecisionnel.jsx`](decisionnel/TableauDecisionnel.jsx)** (`/decisionnel`) : Tableau de bord décisionnel avec KPIs clés (déclarations traitées, dossiers à risque, écart total, TVA théorique totale) et graphiques de pilotage consolidés sur 5 ans.

### 8. 📨 Relance Fiscale & Recouvrement (`relance/`)
* **[`RelanceFiscale.jsx`](relance/RelanceFiscale.jsx)** (`/relance`) : Suivi des arriérés et des contribuables non en règle, avec onglets (retards de paiement, non en règle, historique des relances), filtres et pagination de 15 lignes. Chaque dossier renvoie vers la fiche du contribuable, où les relances sont émises.
* **Sous-composants (`relance/components/`) :**
  * **[`RelanceKPICards.jsx`](relance/components/RelanceKPICards.jsx)** : Quatre indicateurs de recouvrement, recevant la propriété `stats`.
  * **[`RappelOrdreModal.jsx`](relance/components/RappelOrdreModal.jsx)** : Modale d'aperçu et d'impression de la lettre officielle de rappel à l'ordre / mise en demeure. Utilisée par [`ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) ; [`RelanceFiscale.jsx`](relance/RelanceFiscale.jsx) ne l'importe pas (il délègue l'émission des relances à la fiche contribuable).
