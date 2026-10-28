# 📄 Front-office agent — pages métier (`/src/frontofficeagent`)

Ce dossier regroupe l'espace de travail fiscal commun à tous les rôles
opérationnels — agent, contrôleur, chef de centre, inspecteur et tout autre rôle
rattaché à un centre — par opposition à [`../backofficeadmin/`](../backofficeadmin/)
réservé à l'administrateur (comptes, rôles, vérification NIF, journal d'audit).
Il structure l'ensemble des écrans métiers selon une **architecture modulaire
par domaine fonctionnel (feature-based)**.

Toutes les pages peuvent être importées individuellement ou directement via le point d'entrée unique [`index.jsx`](index.jsx).

```javascript
import { Accueil, Collecte, SuiviFiscal, Contribuables } from './frontofficeagent';
```

---

## 🧭 Routes déclarées (`frontend/src/App.jsx`)

Toutes les routes protégées ci-dessous sont des enfants du layout authentifié (`Header` + `Outlet`). L'application est montée avec `react-router-dom` v7 dans [`App.jsx`](../App.jsx).

| Route | Composant | Fichier |
| --- | --- | --- |
| `/` | `Signin` (ou redirection vers l'accueil du rôle — `/admin` pour un administrateur, `/acceuil` sinon — si la session est active) | [`../backofficeadmin/auth/signin.jsx`](../backofficeadmin/auth/signin.jsx) |
| `/signin` | Redirection vers `/` | — |
| `/signup` | `Signup` (demande de création de compte) | [`../backofficeadmin/auth/signup.jsx`](../backofficeadmin/auth/signup.jsx) |
| `/attente-activation` | `AttenteActivation` (statut d'un compte en attente) | [`../backofficeadmin/auth/attente-activation.jsx`](../backofficeadmin/auth/attente-activation.jsx) |
| `/mot-de-passe-oublie` | `MotDePasseOublie` (demande de réinitialisation du mot de passe) | [`../backofficeadmin/auth/mot-de-passe-oublie.jsx`](../backofficeadmin/auth/mot-de-passe-oublie.jsx) |
| `/acceuil` | `Accueil` | [`accueil/Accueil.jsx`](accueil/Accueil.jsx) |
| `/collecte` | `Collecte` | [`collecte/Collecte.jsx`](collecte/Collecte.jsx) |
| `/entreprises/nouveau` | `PhaseClassement` | [`entreprises/PhaseClassement.jsx`](entreprises/PhaseClassement.jsx) |
| `/entreprises/nouveau/form` | `FormInformation` | [`entreprises/FormInformation.jsx`](entreprises/FormInformation.jsx) |
| `/decisionnel` | `TableauDecisionnel` | [`decisionnel/TableauDecisionnel.jsx`](decisionnel/TableauDecisionnel.jsx) |
| `/register` | `Register` | [`centres/Register.jsx`](centres/Register.jsx) |
| `/centres/:id` | `CentreDetail` | [`centres/CentreDetail.jsx`](centres/CentreDetail.jsx) |
| `/centres-fiscaux` | `CentreListe` | [`centres/CentreListe.jsx`](centres/CentreListe.jsx) |
| `/centres-fiscaux/:type/:index` | `UniteFiscaleDetail` | [`centres/UniteFiscaleDetail.jsx`](centres/UniteFiscaleDetail.jsx) |
| `/suivi` | `SuiviFiscal` | [`suivi-fiscal/SuiviFiscal.jsx`](suivi-fiscal/SuiviFiscal.jsx) |
| `/suivi/:id` | `DeclarationDetail` | [`suivi-fiscal/DeclarationDetail.jsx`](suivi-fiscal/DeclarationDetail.jsx) |
| `/contribuables` | `Contribuables` — vue « Registre », ou « Statistique » avec `?vue=statistique` | [`contribuables/Contribuables.jsx`](contribuables/Contribuables.jsx) |
| `/contribuables/:id` | `ContribuableDetail` | [`contribuables/ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) |
| `/contribuables/:id/classification` | `ContribuableDetail` | [`contribuables/ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) |
| `/contribuables/:id/declarations` | `ContribuableDetail` | [`contribuables/ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) |
| `/contribuables/:id/declarations/nouveau` | `DeclarationCreate` | [`contribuables/pages/DeclarationCreate.jsx`](contribuables/pages/DeclarationCreate.jsx) |
| `/contribuables/:id/recoupements` | `ContribuableDetail` | [`contribuables/ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) |
| `/contribuables/:id/recoupements/nouveau` | `RecoupementCreate` | [`contribuables/pages/RecoupementCreate.jsx`](contribuables/pages/RecoupementCreate.jsx) |
| `/contribuables/:id/droits-communication` | `ContribuableDetail` | [`contribuables/ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) |
| `/contribuables/:id/droits-communication/nouveau` | `DroitCommunicationCreate` | [`contribuables/pages/DroitCommunicationCreate.jsx`](contribuables/pages/DroitCommunicationCreate.jsx) |
| `/contribuables/:id/relances` | `ContribuableDetail` | [`contribuables/ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) |
| `/contribuables/:id/confrontation` | `Confrontation` | [`contribuables/pages/Confrontation.jsx`](contribuables/pages/Confrontation.jsx) |
| `/relance` | `RelanceFiscale` — entrée « Relances » du `Header` | [`relance/RelanceFiscale.jsx`](relance/RelanceFiscale.jsx) |
| `/admin` | `AccueilAdmin` | [`../backofficeadmin/dashboard/AdminDashboard.jsx`](../backofficeadmin/dashboard/AdminDashboard.jsx) |
| `/admin/utilisateurs` | `Admin` | [`../backofficeadmin/utilisateurs/AdminUtilisateurs.jsx`](../backofficeadmin/utilisateurs/AdminUtilisateurs.jsx) |
| `/admin/roles` | `AdminRoles` | [`../backofficeadmin/roles/AdminRoles.jsx`](../backofficeadmin/roles/AdminRoles.jsx) |
| `/admin/verification-nif` | `AdminVerificationNIF` — synthèse des 3 types + référentiel | [`../backofficeadmin/verification-nif/AdminVerificationNIF.jsx`](../backofficeadmin/verification-nif/AdminVerificationNIF.jsx) |
| `/admin/verification-nif/sql` | `VerificationNifSql` — vérification par requête | [`../backofficeadmin/verification-nif/VerificationNifSql.jsx`](../backofficeadmin/verification-nif/VerificationNifSql.jsx) |
| `/admin/verification-nif/excel` | `VerificationNifExcel` — liaison Excel | [`../backofficeadmin/verification-nif/VerificationNifExcel.jsx`](../backofficeadmin/verification-nif/VerificationNifExcel.jsx) |
| `/admin/verification-nif/json` | `VerificationNifJson` — synchronisation catalogue JSON | [`../backofficeadmin/verification-nif/VerificationNifJson.jsx`](../backofficeadmin/verification-nif/VerificationNifJson.jsx) |
| `/admin/historique` | `AdminHistorique` | [`../backofficeadmin/historique/AdminHistorique.jsx`](../backofficeadmin/historique/AdminHistorique.jsx) |
| `*` | Redirection vers `/` | — |

> ⚠️ La route de l'accueil est déclarée `/acceuil` dans [`App.jsx`](../App.jsx) (coquille). Les liens du code doivent utiliser cette orthographe, pas `/accueil`.

> ⚠️ Terminologie : les écrans « Contribuables » parlent de **centre gestionnaire**
> et de **nature d'impôt**, mais le formulaire d'immatriculation
> [`entreprises/FormInformation.jsx`](entreprises/FormInformation.jsx#L391-L424)
> affiche encore « Régime fiscal » et « Centre de rattachement », et
> [`centres/UniteFiscaleDetail.jsx`](centres/UniteFiscaleDetail.jsx#L191) une
> colonne « Régime fiscal ». Le nom de colonne attendu à l'import Excel est
> « Centre gestionnaire » ; un ancien fichier « Centre de rattachement » n'est
> plus reconnu.

---

## 📁 Organisation par Domaine Métier

### 1. 🏠 Accueil & Vue Globale (`accueil/`)
* **[`Accueil.jsx`](accueil/Accueil.jsx)** (`/acceuil`) : Tableau de bord d'accueil institutionnel (Hero DGI, accès rapides, situation fiscale globale). Les raccourcis pointent vers `/collecte`, `/entreprises/nouveau`, `/suivi`, `/register` et `/decisionnel`. Un `chef_centre` reçoit `currentUser` : la carte d'état « Situation fiscale » cède sa place au total **TVA théorique · DGI** (`stats.tva_theorique_dgi`, agrégat national que seul ce rôle obtient), et la pile en bas à droite affiche le total du centre de rattachement (`stats.tva_theorique_totale`, filtré par `req.dataScope`). Les autres rôles voient la carte d'état et le seul total de leur périmètre.

### 2. ⚡ Collecte & Simulation Dynamique (`collecte/`)
* **[`Collecte.jsx`](collecte/Collecte.jsx)** (`/collecte`) : Page pivot orchestrant les sous-modules de collecte dynamique. Elle reçoit `currentModule` depuis `App.jsx` (`sales`, `theoretical`, `reconciliation`, `declaration`) et affiche le module correspondant ; le défaut est `sales`. `handleCollect` passe désormais par [`collecte/utils/enregistrerCollecte.js`](collecte/utils/enregistrerCollecte.js) : l'enregistrement est réel, le retour à l'agent s'affiche dans un `.form-submit-message` (`role="status"` en succès, `role="alert"` en erreur) et le bouton d'envoi est désactivé pendant l'appel (`enCours`).
* **Sous-modules de calcul fiscal (`collecte/modules/`) :**
  * **[`CollecterDeductible.jsx`](collecte/modules/CollecterDeductible.jsx)** : Module A – TVA nette à payer (TVA collectée − TVA déductible), avec contrôle de l'écart par rapport à la TVA effectivement payée.
  * **[`TheoreticalForm.jsx`](collecte/modules/TheoreticalForm.jsx)** : Module B – Simulation TVA théorique (IS / IR), pénalités et calcul du redressement.
  * **[`ReconciliationForm.jsx`](collecte/modules/ReconciliationForm.jsx)** : Module C – Collecte du recoupement fiscal tiers (Somme Recoupée).
  * **[`InsertionDeclaration.jsx`](collecte/modules/InsertionDeclaration.jsx)** : Module D – Saisie de la déclaration fiscale officielle (CA, bénéfice, impôts payés, TVA déclarée) et affichage du régime fiscal détecté.
  * Chaque module reçoit `surCollecte` (asynchrone) et `enCours` (booléen de mise en attente du bouton) et n'est pas exporté par domaine : tous sont réexportés par [`index.jsx`](index.jsx). `surCollecte` reçoit un seul objet `{ table, nif, annee, intitule, valeurs }` où `valeurs` contient des colonnes déjà nommées côté base.

`enregistrerCollecte` résout d'abord le contribuable avec `getContribuableByNif` — le registre reste la source d'autorité et **aucune fiche n'est créée** si le NIF est inconnu, le message renvoie vers « + Ajouter un contribuable » — puis écrit :

| Module | Cible | Colonnes alimentées |
| --- | --- | --- |
| A `CollecterDeductible` | `declarations` | `tva_collectee`, `tva_deductible`, `tva_payee`, `tva_theorique` (= TVA à payer calculée) |
| B `TheoreticalForm` | `declarations` | `ca`, `benefice`, `tva_payee`, `tva_theorique` + `observations_agent` (régime et écart) |
| C `ReconciliationForm` | `recoupements` | `merchandise_sold`, `goods_purchased`, `third_party_payments`, `local_products`, `services_purchased` (débours), `somme_recoupee` |
| D `InsertionDeclaration` | `declarations` | `ca`, `benefice`, `tva_payee` (= TVA déclarée) + `observations_agent` (impôts payés, autres charges, référence) |

Une collecte portant sur un NIF et une année déjà déclarés **met à jour** la ligne (`PUT /api/declarations/:id`) au lieu d'en créer une seconde ; le statut d'écart (`conforme` / `alerte` / `critique`, seuils 25 % et 50 % repris de `FiscalService.determinerStatut`) est recalculé sur les valeurs réellement stockées, car la mise à jour serveur ne le recalcule pas. À la création, le message affiche le statut renvoyé par `POST /api/declarations` (`analyse.statut`). La période enregistrée est l'année (`periode = '2019'`), le format `AAAA-MM` restant réservé aux déclarations saisies depuis la fiche du contribuable.

### 3. 🏢 Immatriculation & Entreprises (`entreprises/`)
* **[`PhaseClassement.jsx`](entreprises/PhaseClassement.jsx)** (`/entreprises/nouveau`) : Étape 1 – Sélection de la structure fiscale de rattachement (Centre fiscal < 2 Md Ar, SRE 2–4 Md Ar, DGE > 4 Md Ar). Chaque choix renvoie vers le formulaire avec `?structure=`.
* **[`FormInformation.jsx`](entreprises/FormInformation.jsx)** (`/entreprises/nouveau/form`) : Étape 2 – Formulaire complet d'enregistrement d'un contribuable (NIF, société, secteur, CA, structure fiscale, centre de rattachement, contacts). Redirige vers `/contribuables` après succès.

### 4. 👥 Portefeuille Contribuables (`contribuables/`)
* **[`Contribuables.jsx`](contribuables/Contribuables.jsx)** (`/contribuables`) : Registre filtrable, compteurs par catégorie (Grand, Moyen, Petit) et import Excel/CSV.
* **[`ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx)** (`/contribuables/:id`, `/classification`, `/declarations`, `/relances`) : Fiche complète d'un contribuable, graphiques d'évolution et historique multi-annuel. Les quatre routes partagent le même composant, qui déduit l'onglet actif du chemin ; chaque onglet peut être exporté au format Excel.
* Détails dans le [`README`](contribuables/README.md) du domaine.

### 5. 📑 Suivi Fiscal & Procédure Contradictoire (`suivi-fiscal/`)
* **[`SuiviFiscal.jsx`](suivi-fiscal/SuiviFiscal.jsx)** (`/suivi`) : vue consolidée « Dossier fiscal » avec quatre indicateurs de tête (déclarations suivies, contribuables concernés, écarts au-delà du seuil, écart de TVA cumulé), un rappel des seuils de lecture et le journal des déclarations (recherche en direct, filtre de statut, tri par contribuable/année/statut, pagination de 20 lignes). La colonne « Écart de TVA » rappelle le pourcentage rapporté à la TVA théorique, ce qui rend les lignes comparables entre elles. Le badge de contrôle rendu par `getControleStatus` affiche **Rien à signaler** (vert, `className conforme` ; écart nul ou ≤ 25 %), **Risque moyen** (orange, `surveillance` ; écart ≤ 50 %) ou **À risque** (rouge, `critique`), et garde **Primitive envoyée (30j)** / **Définitive envoyée** quand la déclaration est déjà engagée. La recherche porte sur `row.statut` brut (`conforme`, `non_conforme`, …), pas sur ces libellés. Recherche (`q`), filtre (`statut`), tri (`tri` + `ordre`) et page (`page`) sont portés par l'URL grâce à [`../utils/searchParams.utils.js`](../utils/searchParams.utils.js) : un lien partage une vue précise, et revenir au tri par défaut (année décroissante) retire `tri`/`ordre` de l'URL. Un bouton « ✕ Effacer » n'apparaît que si un filtre est actif et ne touche pas au tri.
* **[`DeclarationDetail.jsx`](suivi-fiscal/DeclarationDetail.jsx)** (`/suivi/:id`) : dossier de contrôle d'une déclaration — badge de statut lisible (les codes `non_conforme`, `PRIMITIVE_ENVOYÉE`… ne sont jamais affichés), phrase de lecture rapide de l'écart, puis gestionnaire du cycle contradictoire (demande d'éclaircissements, notification primitive, définitive, imputation du crédit d'impôt).
* **Sous-composants modulaires (`suivi-fiscal/components/`) :**
  * **[`DeclarationSummaryCards.jsx`](suivi-fiscal/components/DeclarationSummaryCards.jsx)** : deux cartes de synthèse — statut du dossier avec son libellé et son explication, écart de TVA avec son pourcentage — suivies des détails déclaratifs.
  * **[`ProcedureContradictoireTimeline.jsx`](suivi-fiscal/components/ProcedureContradictoireTimeline.jsx)** : déroulé en quatre étapes (contrôle et écart, éclaircissements facultatifs, notification primitive, notification définitive), décompte des 30 jours et décomposition du redressement avec la mention « amende exigible après la notification définitive ». Affiche aussi l'encadré « Demande d'Éclaircissements émise le … » (date de réponse limite = émission + 30 jours, rappel des points posés) et le bouton `📄 Voir Demande d'Éclaircissements` qui ouvre le document imprimable.
  * **[`ProcedureActionForms.jsx`](suivi-fiscal/components/ProcedureActionForms.jsx)** : un bloc « Prochaine étape » met en avant la seule action qui fait avancer le dossier (primitive, définitive puis imputation) ; les autres actes sont repliés dans « Autres actions du dossier », chacun ouvrant son formulaire pliable. L'imputation est expliquée comme verrouillée tant que la notification définitive n'a pas été émise, et son formulaire signale l'absence de crédit disponible. La demande est bloquée une fois la notification définitive émise, et un second envoi est impossible tant que la première demande figure en base.
  * Bornes des montants : tous les champs monétaires portent `min="0"`, « Montant à imputer » est `required` et `max=` **`min(crédit déclaré, principal du redressement)`**, c'est-à-dire la borne appliquée par `DeclarationModel.imputerCreditImpot` côté serveur (`backend/src/models/declaration.model.js`), et non la dette totale qui inclut l'amende. Au-delà, un `.form-submit-message.error` nomme les deux plafonds et le bouton d'envoi est désactivé ; `DeclarationDetail.handleImputerCredit` refuse le même cas avant d'appeler l'API.

Les composants sont rendus en classes CSS et non plus en styles en ligne :
`.procedure-buttons`, `.procedure-form` (+ `-definitive`, `-eclaircissement`,
`-imputation`), `.procedure-form-grid`, `.procedure-form-actions`,
`.procedure-countdown` (+ `-urgent`), `.procedure-eclaircissement` et
`.procedure-breakdown`, `.procedure-next`, `.procedure-more` (+ `summary`),
`.procedure-locked`, `.procedure-note`, `.dossier-lecture`, `.summary-hint` et
`.step-optional` sont définies dans [`../App.css`](../App.css), chacune
avec sa variante `.dark-theme` ; les accents des boutons portent `btn-violet`,
`btn-teal` et `btn-green`.

La demande d'éclaircissements (CPF art. V-17) est persistée dans la table
`relances` — `type_relance = 'demande_eclaircissement'`, `observations` pour les
points posés, `date_emission` pour l'horodatage — via `createRelance` /
`getRelances` ([`../api/api.js`](../api/api.js)). Aucun acte de la procédure n'a
son propre formulaire de délai : les 30 jours sont une mention légale fixe,
calculée à l'affichage. Le document imprimable est
[`../components/common/DemandeEclaircissementModal.jsx`](../components/common/DemandeEclaircissementModal.jsx).

### 6. 🏛️ Centres Fiscaux & Registre (`centres/`)
* **[`Register.jsx`](centres/Register.jsx)** (`/register`) : Registre des centres fiscaux (Centre Fiscal, SRE, DGE, autre) avec recherche, filtre par type, tri et pagination de 10 lignes.
* **[`CentreDetail.jsx`](centres/CentreDetail.jsx)** (`/centres/:id`) : Fiche d'un centre fiscal et liste de ses contribuables rattachés.
* **[`CentreListe.jsx`](centres/CentreListe.jsx)** (`/centres-fiscaux`) : Annuaire des unités opérationnelles (DGE, SRE, Centres fiscaux) issu de `unitefiscal.json`.
* **[`UniteFiscaleDetail.jsx`](centres/UniteFiscaleDetail.jsx)** (`/centres-fiscaux/:type/:index`) : Fiche détaillée d'une unité opérationnelle territoriale.
* Détails dans le [`README`](centres/README.md) du domaine.

### 7. 📊 Tableau Décisionnel (`decisionnel/`)
* **[`TableauDecisionnel.jsx`](decisionnel/TableauDecisionnel.jsx)** (`/decisionnel`) : Tableau de bord décisionnel avec KPIs clés (déclarations traitées, dossiers à risque, écart total, TVA théorique totale) et graphiques de pilotage consolidés sur 5 ans.

### 8. 📨 Relance Fiscale & Recouvrement (`relance/`)
* **[`RelanceFiscale.jsx`](relance/RelanceFiscale.jsx)** (`/relance`) : Suivi des arriérés et des contribuables non en règle, avec onglets (retards de paiement, non en règle, historique des relances), filtres et pagination de 15 lignes. Chaque dossier renvoie vers la fiche du contribuable, où les relances sont émises.
  * L'onglet « Historique des relances » est alimenté par `getRelances({ limit: 10000 })` (`GET /api/relances`, déjà restreint au centre de l'agent par `data-scope`) ; plus aucun `localStorage`. Le KPI « Relances émises » compte les relances non annulées, et chaque ligne est cliquable vers la fiche du contribuable grâce à la jointure `contribuables` renvoyée par l'API.
  * L'état vit dans l'URL via [`../utils/searchParams.utils.js`](../utils/searchParams.utils.js) : `onglet` (absent = `retards`), `q` (recherche NIF / raison sociale / secteur), `severite` (sans effet hors de l'onglet retards, où il est levé au changement d'onglet) et `page`. Un bouton « ✕ Effacer les filtres », désactivé quand aucun filtre n'est actif, remet `q`, `severite` et `page` à zéro en conservant `onglet`.
* **Sous-composants (`relance/components/`) :**
  * **[`RelanceKPICards.jsx`](relance/components/RelanceKPICards.jsx)** : Quatre indicateurs de recouvrement, recevant la propriété `stats`.
  * **[`RappelOrdreModal.jsx`](relance/components/RappelOrdreModal.jsx)** : Modale d'aperçu et d'impression de la lettre officielle de rappel à l'ordre / mise en demeure. `role="dialog"`, `aria-modal` et `aria-labelledby` sont portés par `.rappel-modal-container` (et non plus par l'arrière plan), et le hook [`../hooks/useModalA11y.js`](../hooks/useModalA11y.js) gère Échap ainsi que l'entrée et la restitution du focus. Utilisée par [`ContribuableDetail.jsx`](contribuables/ContribuableDetail.jsx) ; [`RelanceFiscale.jsx`](relance/RelanceFiscale.jsx) ne l'importe pas (il délègue l'émission des relances à la fiche contribuable).
