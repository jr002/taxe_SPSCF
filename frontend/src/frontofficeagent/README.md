# 📄 Front-office agent — pages métier (`/src/frontofficeagent`)

Ce dossier regroupe l'espace de travail fiscal commun à tous les rôles
opérationnels — agent, contrôleur, chef de centre, inspecteur et tout autre rôle
rattaché à un centre — par opposition à [`../backofficeadmin/`](../backofficeadmin/)
réservé à l'administrateur (comptes, rôles, vérification NIF, journal d'audit).
Il structure l'ensemble des écrans métiers selon une **architecture modulaire
par domaine fonctionnel (feature-based)**.

Une seule entorse à cette séparation : le **chef de centre** reçoit dans la sidebar
un lien « Mon équipe » vers `/admin/utilisateurs`, servi en **mode restreint** —
il n'y voit que les comptes de son centre, sans `AdminNav`, et ne peut que
bloquer ou réactiver un contrôleur ou un agent de ce centre (section « Mode
restreint Équipe du centre » de
[`../backofficeadmin/README.md`](../backofficeadmin/README.md)).
Rien d'autre ne lui est ouvert dans le back-office.

Toutes les pages peuvent être importées individuellement ou directement via le point d'entrée unique [`index.js`](index.js).

```javascript
import { Accueil, Collecte, SuiviFiscal, Contribuables } from '@/frontofficeagent';
```

Chaque domaine suit la même grille : `pages/` pour les écrans branchés sur une
route, `components/` pour les vues internes, `hooks/` et `utils/` pour ce qui ne
sert qu'à lui, et un [`index.js`](accueil/index.js) qui ne ré-exporte que ses
pages. La règle complète est dans
[`../README.md`](../README.md#comment-le-code-est-organisé).

---

## 🧭 Routes déclarées (`frontend/src/App.jsx`)

Toutes les routes protégées ci-dessous sont des enfants du layout authentifié. Pour les rôles opérationnels, `App.jsx` associe `Header`, [`AgentSidebar`](../components/common/AgentSidebar.jsx) et `Outlet` dans `.agent-layout` : la sidebar est réductible sur desktop et devient un tiroir avec backdrop, Échap et gestion du focus à 1024 px et moins. Le bouton « Modules » et les onglets de Collecte restent dans le header. L'administrateur conserve uniquement `Header` + `Outlet`, sans sidebar. L'application est montée avec `react-router-dom` v7 dans [`../App.jsx`](../App.jsx).

| Route | Composant | Fichier |
| --- | --- | --- |
| `/` | `Signin` (ou redirection vers l'accueil du rôle — `/admin` pour un administrateur, `/accueil` sinon — si la session est active) | [`../backofficeadmin/auth/pages/Signin.jsx`](../backofficeadmin/auth/pages/Signin.jsx) |
| `/signin` | Redirection vers `/` | — |
| `/signup` | `Signup` (demande de création de compte) | [`../backofficeadmin/auth/pages/Signup.jsx`](../backofficeadmin/auth/pages/Signup.jsx) |
| `/attente-activation` | `AttenteActivation` (statut d'un compte en attente) | [`../backofficeadmin/auth/pages/AttenteActivation.jsx`](../backofficeadmin/auth/pages/AttenteActivation.jsx) |
| `/mot-de-passe-oublie` | `MotDePasseOublie` (demande de réinitialisation du mot de passe) | [`../backofficeadmin/auth/pages/MotDePasseOublie.jsx`](../backofficeadmin/auth/pages/MotDePasseOublie.jsx) |
| `/accueil` | `Accueil` | [`accueil/pages/Accueil.jsx`](accueil/pages/Accueil.jsx) |
| `/collecte` | `Collecte` | [`collecte/pages/Collecte.jsx`](collecte/pages/Collecte.jsx) |
| `/entreprises/nouveau` | `PhaseClassement` | [`entreprises/pages/PhaseClassement.jsx`](entreprises/pages/PhaseClassement.jsx) |
| `/entreprises/nouveau/form` | `FormInformation` | [`entreprises/pages/FormInformation.jsx`](entreprises/pages/FormInformation.jsx) |
| `/decisionnel` | `TableauDecisionnel` | [`decisionnel/pages/TableauDecisionnel.jsx`](decisionnel/pages/TableauDecisionnel.jsx) |
| `/register` | `Register` | [`centres/pages/Register.jsx`](centres/pages/Register.jsx) |
| `/centres/:id` | `CentreDetail` | [`centres/pages/CentreDetail.jsx`](centres/pages/CentreDetail.jsx) |
| `/centres-fiscaux` | `CentreListe` | [`centres/pages/CentreListe.jsx`](centres/pages/CentreListe.jsx) |
| `/centres-fiscaux/:type/:index` | `UniteFiscaleDetail` | [`centres/pages/UniteFiscaleDetail.jsx`](centres/pages/UniteFiscaleDetail.jsx) |
| `/suivi` | `SuiviFiscal` | [`suivi-fiscal/pages/SuiviFiscal.jsx`](suivi-fiscal/pages/SuiviFiscal.jsx) |
| `/suivi/:id` | `DeclarationDetail` | [`suivi-fiscal/pages/DeclarationDetail.jsx`](suivi-fiscal/pages/DeclarationDetail.jsx) |
| `/contribuables` | `Contribuables` — vue « Registre », ou « Statistique » avec `?vue=statistique` | [`contribuables/pages/Contribuables.jsx`](contribuables/pages/Contribuables.jsx) |
| `/contribuables/:id` | `ContribuableDetail` | [`contribuables/pages/ContribuableDetail.jsx`](contribuables/pages/ContribuableDetail.jsx) |
| `/contribuables/:id/classification` | `ContribuableDetail` | [`contribuables/pages/ContribuableDetail.jsx`](contribuables/pages/ContribuableDetail.jsx) |
| `/contribuables/:id/declarations` | `ContribuableDetail` | [`contribuables/pages/ContribuableDetail.jsx`](contribuables/pages/ContribuableDetail.jsx) |
| `/contribuables/:id/declarations/nouveau` | `DeclarationCreate` | [`contribuables/pages/DeclarationCreate.jsx`](contribuables/pages/DeclarationCreate.jsx) |
| `/contribuables/:id/recoupements` | `ContribuableDetail` | [`contribuables/pages/ContribuableDetail.jsx`](contribuables/pages/ContribuableDetail.jsx) |
| `/contribuables/:id/recoupements/nouveau` | `RecoupementCreate` | [`contribuables/pages/RecoupementCreate.jsx`](contribuables/pages/RecoupementCreate.jsx) |
| `/contribuables/:id/droits-communication` | `ContribuableDetail` | [`contribuables/pages/ContribuableDetail.jsx`](contribuables/pages/ContribuableDetail.jsx) |
| `/contribuables/:id/droits-communication/nouveau` | `DroitCommunicationCreate` | [`contribuables/pages/DroitCommunicationCreate.jsx`](contribuables/pages/DroitCommunicationCreate.jsx) |
| `/contribuables/:id/relances` | `ContribuableDetail` | [`contribuables/pages/ContribuableDetail.jsx`](contribuables/pages/ContribuableDetail.jsx) |
| `/contribuables/:id/confrontation` | `Confrontation` | [`confrontation/pages/Confrontation.jsx`](confrontation/pages/Confrontation.jsx) |
| `/relance` | `RelanceFiscale` — entrée « Relances » du `Header` | [`relance/pages/RelanceFiscale.jsx`](relance/pages/RelanceFiscale.jsx) |
| `/admin` | `AccueilAdmin` | [`../backofficeadmin/dashboard/pages/AdminDashboard.jsx`](../backofficeadmin/dashboard/pages/AdminDashboard.jsx) |
| `/admin/utilisateurs` | `Admin` | [`../backofficeadmin/utilisateurs/pages/AdminUtilisateurs.jsx`](../backofficeadmin/utilisateurs/pages/AdminUtilisateurs.jsx) |
| `/admin/roles` | `AdminRoles` | [`../backofficeadmin/roles/pages/AdminRoles.jsx`](../backofficeadmin/roles/pages/AdminRoles.jsx) |
| `/admin/verification-nif` | `AdminVerificationNIF` — synthèse des 3 types + référentiel | [`../backofficeadmin/verification-nif/pages/AdminVerificationNIF.jsx`](../backofficeadmin/verification-nif/pages/AdminVerificationNIF.jsx) |
| `/admin/verification-nif/sql` | `VerificationNifSql` — vérification par requête | [`../backofficeadmin/verification-nif/pages/VerificationNifSql.jsx`](../backofficeadmin/verification-nif/pages/VerificationNifSql.jsx) |
| `/admin/verification-nif/excel` | `VerificationNifExcel` — liaison Excel | [`../backofficeadmin/verification-nif/pages/VerificationNifExcel.jsx`](../backofficeadmin/verification-nif/pages/VerificationNifExcel.jsx) |
| `/admin/verification-nif/json` | `VerificationNifJson` — synchronisation catalogue JSON | [`../backofficeadmin/verification-nif/pages/VerificationNifJson.jsx`](../backofficeadmin/verification-nif/pages/VerificationNifJson.jsx) |
| `/admin/historique` | `AdminHistorique` | [`../backofficeadmin/historique/pages/AdminHistorique.jsx`](../backofficeadmin/historique/pages/AdminHistorique.jsx) |
| `*` | Redirection vers `/` | — |

> ✅ L'accueil agent est routé `/accueil` dans [`../App.jsx`](../App.jsx).
> L'ancienne coquille `/acceuil` n'est plus qu'une redirection `Navigate` vers
> `/accueil`, pour ne casser aucun lien déjà partagé ; les liens du code
> (`NAVIGATION_LINKS` d'`AgentSidebar`, `homePath`, `getLandingPath`) écrivent
> `/accueil`.

> ⚠️ Terminologie : les écrans « Contribuables » parlent de **centre gestionnaire**
> et de **nature d'impôt**, mais le formulaire d'immatriculation
> [`entreprises/pages/FormInformation.jsx`](entreprises/pages/FormInformation.jsx#L391-L424)
> affiche encore « Régime fiscal » et « Centre de rattachement », et
> [`centres/pages/UniteFiscaleDetail.jsx`](centres/pages/UniteFiscaleDetail.jsx#L191) une
> colonne « Régime fiscal ». Le nom de colonne attendu à l'import Excel est
> « Centre gestionnaire » ; un ancien fichier « Centre de rattachement » n'est
> plus reconnu.

---

## 📁 Organisation par Domaine Métier

### 1. 🏠 Accueil & Vue Globale (`accueil/`)
* **[`accueil/pages/Accueil.jsx`](accueil/pages/Accueil.jsx)** (`/accueil`) : Poste de travail de l'agent, pas une vitrine. Le bandeau d'entrée (`.workbench-brief`) porte le **logo DGI** (`@/assets/logodgi.jpg`, le même que l'en-tête et la connexion, `alt` explicite), la mention « République de Madagascar · DGI », l'`eyebrow` « Espace agent · {nom du centre ou Administration centrale} », la salutation et la phrase d'état de la file ; la date du jour reste alignée à droite, et le tout passe en colonne sous 640 px avec un logo réduit à 2.4 rem. Suivent quatre indicateurs (TVA déclarée, écart de TVA, rapprochements à traiter, relances sans réponse) servis par `getDeclarationStats`, `getRapprochementStats` et `getRelanceStats` en `Promise.allSettled`, les deux cartes de priorité de la [file de travail](file-travail/) (`/file-de-travail?priorite=1|2`), les cinq actes les plus urgents dans un `DataTable` (ligne cliquable → l'écran de l'acte) et trois accès rapides : `/collecte`, `/entreprises/nouveau`, `/register`. Les CSS `.workbench-*` sont regroupés dans [`../App.css`](../App.css) avec leurs variantes `.dark-theme`.

### 2. ⚡ Collecte & Simulation Dynamique (`collecte/`)
* **[`collecte/pages/Collecte.jsx`](collecte/pages/Collecte.jsx)** (`/collecte`) : Page pivot orchestrant les sous-modules de collecte dynamique. Elle reçoit `currentModule` depuis `App.jsx` (`sales`, `theoretical`, `reconciliation`, `declaration`) et affiche le module correspondant ; le défaut est `sales`. `handleCollect` passe désormais par [`collecte/utils/enregistrerCollecte.js`](collecte/utils/enregistrerCollecte.js) : l'enregistrement est réel, le retour à l'agent s'affiche dans un `.form-submit-message` (`role="status"` en succès, `role="alert"` en erreur) et le bouton d'envoi est désactivé pendant l'appel (`enCours`).
* **Sous-modules de calcul fiscal (`collecte/components/`) :**
  * **[`collecte/components/CollecterDeductible.jsx`](collecte/components/CollecterDeductible.jsx)** : Module A – TVA nette à payer (TVA collectée − TVA déductible), avec contrôle de l'écart par rapport à la TVA effectivement payée.
  * **[`collecte/components/TheoreticalForm.jsx`](collecte/components/TheoreticalForm.jsx)** : Module B – Simulation TVA théorique (IS / IR), pénalités et calcul du redressement. Le panneau de résultat porte quatre puces [`../components/common/RefLegal.jsx`](../components/common/RefLegal.jsx) — `ControlResult` rend ses `children` dans un `.procedure-tags.result-references` — et l'encadré « Cadre légal contradictoire » ne cite plus que des articles relus dans les textes officiels : articles V-03 à V-07 du code des procédures fiscales pour la rectification, articles 01.01.15 (IR) et 01.02.06 (IS) du code des impôts pour l'imputation. Côté montants, l'amende de 40 % (code des impôts, art. 20.01.54) et les pénalités mensuelles de retard (art. 20.01.53) sont conformes ; la TVA théorique et le seuil d'écart de 50 % qui déclenche la proposition **ne se lisent dans aucun article** : le lien est gardé vers l'article le plus proche (06.01.12 pour le taux normal de TVA, V-03 pour la notification de redressement), la puce passe en couleur prudente et la phrase d'écart s'affiche sous la puce.
  * **[`collecte/components/ReconciliationForm.jsx`](collecte/components/ReconciliationForm.jsx)** : Module C – Collecte du recoupement fiscal tiers (Somme Recoupée).
  * **[`collecte/components/InsertionDeclaration.jsx`](collecte/components/InsertionDeclaration.jsx)** : Module D – Saisie de la déclaration fiscale officielle (CA, bénéfice, impôts payés, TVA déclarée) et affichage du régime fiscal détecté.
  * Chaque module reçoit `surCollecte` (asynchrone) et `enCours` (booléen de mise en attente du bouton) et n'est pas exporté par domaine : tous sont réexportés par [`index.js`](index.js). `surCollecte` reçoit un seul objet `{ table, nif, annee, intitule, valeurs }` où `valeurs` contient des colonnes déjà nommées côté base.

`enregistrerCollecte` résout d'abord le contribuable avec `getContribuableByNif` — le registre reste la source d'autorité et **aucune fiche n'est créée** si le NIF est inconnu, le message renvoie vers « + Ajouter un contribuable » — puis écrit :

| Module | Cible | Colonnes alimentées |
| --- | --- | --- |
| A `CollecterDeductible` | `declarations` | `tva_collectee`, `tva_deductible`, `tva_payee`, `tva_theorique` (= TVA à payer calculée) |
| B `TheoreticalForm` | `declarations` | `ca`, `benefice`, `tva_payee`, `tva_theorique` + `observations_agent` (régime et écart) |
| C `ReconciliationForm` | `recoupements` | `merchandise_sold`, `goods_purchased`, `third_party_payments`, `local_products`, `services_purchased` (débours), `somme_recoupee` |
| D `InsertionDeclaration` | `declarations` | `ca`, `benefice`, `tva_payee` (= TVA déclarée) + `observations_agent` (impôts payés, autres charges, référence) |

Une collecte portant sur un NIF et une année déjà déclarés **met à jour** la ligne (`PUT /api/declarations/:id`) au lieu d'en créer une seconde ; le statut d'écart (`conforme` / `alerte` / `critique`, seuils 25 % et 50 % repris de `FiscalService.determinerStatut`) est recalculé sur les valeurs réellement stockées, car la mise à jour serveur ne le recalcule pas. À la création, le message affiche le statut renvoyé par `POST /api/declarations` (`analyse.statut`). La période enregistrée est l'année (`periode = '2019'`), le format `AAAA-MM` restant réservé aux déclarations saisies depuis la fiche du contribuable.

### 3. 🏢 Immatriculation & Entreprises (`entreprises/`)
* **[`entreprises/pages/PhaseClassement.jsx`](entreprises/pages/PhaseClassement.jsx)** (`/entreprises/nouveau`) : Étape 1 – Sélection de la structure fiscale de rattachement (Centre fiscal < 2 Md Ar, SRE 2–4 Md Ar, DGE > 4 Md Ar). Chaque choix renvoie vers le formulaire avec `?structure=`.
* **[`entreprises/pages/FormInformation.jsx`](entreprises/pages/FormInformation.jsx)** (`/entreprises/nouveau/form`) : Étape 2 – Formulaire complet d'enregistrement d'un contribuable (NIF, société, secteur, CA, structure fiscale, centre de rattachement, contacts). Redirige vers `/contribuables` après succès.

### 4. 👥 Portefeuille Contribuables (`contribuables/`)
* **[`contribuables/pages/Contribuables.jsx`](contribuables/pages/Contribuables.jsx)** (`/contribuables`) : Registre filtrable, compteurs par catégorie (Grand, Moyen, Petit) et import Excel/CSV. L'en-tête de page porte un bouton `? Aide` qui ouvre l'aide à la lecture « registre » (voir [§ 9](#9--aide-la-lecture-`aide/`)), et la barre d'onglets affiche une légende « Catégories » explicable au survol.
* **[`contribuables/pages/ContribuableDetail.jsx`](contribuables/pages/ContribuableDetail.jsx)** (`/contribuables/:id`, `/classification`, `/declarations`, `/relances`) : Fiche complète d'un contribuable, graphiques d'évolution et historique multi-annuel. Les quatre routes partagent le même composant, qui déduit l'onglet actif du chemin ; chaque onglet peut être exporté au format Excel. Chaque onglet est aussi explicable : [`contribuables/components/ContribuableHeader.jsx`](contribuables/components/ContribuableHeader.jsx) pose le bouton `? Aide` qui ouvre la modale de **l'onglet affiché** (`ecran={activeTab}`), et les termes du tableau de bord, de l'historique et des panneaux sont survolables grâce à [`aide/components/AideTerme.jsx`](aide/components/AideTerme.jsx).
* **Accès réservé aux rôles opérationnels** : les onze routes `/contribuables…` sont enveloppées dans [`../components/common/EspaceOperateurs.jsx`](../components/common/EspaceOperateurs.jsx), qui remplace la page par un écran « Contribuables non accessible » quand `currentUser.role === 'admin'`. Le portefeuille contribuable appartient à l'espace des agents ; l'administrateur garde ses cinq écrans et ses outils de vérification NIF, qui continuent de lire `GET /api/contribuables` pour leur propre référentiel.
* Détails dans le [`README`](contribuables/README.md) du domaine.

### 5. 📑 Suivi Fiscal & Procédure Contradictoire (`suivi-fiscal/`)
* **[`suivi-fiscal/pages/SuiviFiscal.jsx`](suivi-fiscal/pages/SuiviFiscal.jsx)** (`/suivi`) : vue consolidée « Dossier fiscal » avec quatre indicateurs de tête (déclarations suivies, contribuables concernés, écarts au-delà du seuil, écart de TVA cumulé), un rappel des seuils de lecture et le journal des déclarations (recherche en direct, filtre de statut, tri par contribuable/année/statut, pagination de 20 lignes). La colonne « Écart de TVA » rappelle le pourcentage rapporté à la TVA théorique, ce qui rend les lignes comparables entre elles. Le badge de contrôle rendu par `getControleStatus` affiche **Rien à signaler** (vert, `className conforme` ; écart nul ou ≤ 25 %), **Risque moyen** (orange, `surveillance` ; écart ≤ 50 %) ou **À risque** (rouge, `critique`), et garde **Primitive envoyée (30j)** / **Définitive envoyée** quand la déclaration est déjà engagée. La recherche porte sur `row.statut` brut (`conforme`, `non_conforme`, …), pas sur ces libellés. Recherche (`q`), filtre (`statut`), tri (`tri` + `ordre`) et page (`page`) sont portés par l'URL grâce à [`../utils/searchParams.utils.js`](../utils/searchParams.utils.js) : un lien partage une vue précise, et revenir au tri par défaut (année décroissante) retire `tri`/`ordre` de l'URL. Un bouton « ✕ Effacer » n'apparaît que si un filtre est actif et ne touche pas au tri.
* **[`suivi-fiscal/pages/DeclarationDetail.jsx`](suivi-fiscal/pages/DeclarationDetail.jsx)** (`/suivi/:id`) : dossier de contrôle d'une déclaration — badge de statut lisible (les codes `non_conforme`, `PRIMITIVE_ENVOYÉE`… ne sont jamais affichés), phrase de lecture rapide de l'écart, puis gestionnaire du cycle contradictoire (demande d'éclaircissements, notification primitive, définitive, imputation du crédit d'impôt).
* **Sous-composants modulaires (`suivi-fiscal/components/`) :**
  * **[`suivi-fiscal/components/DeclarationSummaryCards.jsx`](suivi-fiscal/components/DeclarationSummaryCards.jsx)** : deux cartes de synthèse — statut du dossier avec son libellé et son explication, écart de TVA avec son pourcentage — suivies des détails déclaratifs.
  * **[`suivi-fiscal/components/ProcedureContradictoireTimeline.jsx`](suivi-fiscal/components/ProcedureContradictoireTimeline.jsx)** : déroulé en quatre étapes (contrôle et écart, éclaircissements facultatifs, notification primitive, notification définitive), décompte des 30 jours et décomposition du redressement. Affiche aussi l'encadré « Demande d'Éclaircissements émise le … » (date de réponse limite = émission + 30 jours, rappel des points posés) et le bouton `📄 Voir Demande d'Éclaircissements` qui ouvre le document imprimable. Le décompte sépare ce qui est enregistré de ce qui ne l'est pas : le principal est marqué « proposé » tant qu'aucune valeur n'est au dossier et l'amende de 40 % est présentée comme une **estimation** — aucune colonne d'amende n'existe en base et aucun service ne la liquide, la note sous le tableau le dit.
  * **Références cliquables** : les articles cités par la timeline et par les formulaires d'acte ne sont plus écrits en dur, ils viennent du registre [`../data/textesFiscaux.data.js`](../data/textesFiscaux.data.js) et sont rendus par [`../components/common/RefLegal.jsx`](../components/common/RefLegal.jsx), dans un conteneur `.procedure-tags`. Chaque puce ouvre le PDF de la DGI à la page imprimée de l'article (V-02 pour les éclaircissements, V-03 et V-04 pour la primitive, V-07 pour la définitive, 01.01.15 et 01.02.06 du code des impôts pour l'imputation, 20.01.54 pour l'amende, 20.01.53 pour les pénalités). Les mentions « V-17 » et « V-19 » portées jusqu'ici désignent d'autres dispositifs et ont été retirées.
  * **[`suivi-fiscal/components/ProcedureActionForms.jsx`](suivi-fiscal/components/ProcedureActionForms.jsx)** : un bloc « Prochaine étape » met en avant la seule action qui fait avancer le dossier (primitive, définitive puis imputation) ; les autres actes sont repliés dans « Autres actions du dossier », chacun ouvrant son formulaire pliable. L'imputation est expliquée comme verrouillée tant que la notification définitive n'a pas été émise, et son formulaire signale l'absence de crédit disponible. La demande est bloquée une fois la notification définitive émise, et un second envoi est impossible tant que la première demande figure en base.
  * Bornes des montants : tous les champs monétaires portent `min="0"`, « Montant à imputer » est `required` et `max=` **`min(crédit déclaré, principal du redressement)`**, c'est-à-dire la borne appliquée par `DeclarationModel.imputerCreditImpot` côté serveur (`backend/src/models/declaration.model.js`), et non la dette totale qui inclut l'amende. Au-delà, un `.form-submit-message.error` nomme les deux plafonds et le bouton d'envoi est désactivé ; `DeclarationDetail.handleImputerCredit` refuse le même cas avant d'appeler l'API.

Les composants sont rendus en classes CSS et non plus en styles en ligne :
`.procedure-buttons`, `.procedure-form` (+ `-definitive`, `-eclaircissement`,
`-imputation`), `.procedure-form-grid`, `.procedure-form-actions`,
`.procedure-countdown` (+ `-urgent`), `.procedure-eclaircissement` et
`.procedure-breakdown`, `.procedure-next`, `.procedure-more` (+ `summary`),
`.procedure-locked`, `.procedure-note`, `.procedure-tags`, `.dossier-lecture`,
`.summary-hint` et
`.step-optional` sont définies dans [`../App.css`](../App.css), chacune
avec sa variante `.dark-theme` ; les accents des boutons portent `btn-violet`,
`btn-teal` et `btn-green`. Les puces de référence posées dans ces conteneurs
prennent `.ref-legale` (et `.ref-legale-prudent` quand l'article ne dit pas la
valeur affichée).

La demande d'éclaircissements (code des procédures fiscales, art. V-02) est
persistée dans la table
`relances` — `type_relance = 'demande_eclaircissement'`, `observations` pour les
points posés, `date_emission` pour l'horodatage — via `createRelance` /
`getRelances` (fonctions de [`../api/relances.js`](../api/relances.js), importées depuis `@/api`). Aucun acte de la procédure n'a
son propre formulaire de délai : les 30 jours sont une valeur fixe de
l'application, calculée à l'affichage. Pour la notification primitive, c'est
bien le délai de l'article V-04 ; pour la demande d'éclaircissements, l'article
V-02 ne fixe qu'un délai franc de 15 jours et l'acte en accorde 30 — la puce de
référence le signale. Le document imprimable est
[`../components/common/DemandeEclaircissementModal.jsx`](../components/common/DemandeEclaircissementModal.jsx).

### 6. 🏛️ Centres Fiscaux & Registre (`centres/`)
* **[`centres/pages/Register.jsx`](centres/pages/Register.jsx)** (`/register`) : Registre des centres fiscaux (Centre Fiscal, SRE, DGE, autre) avec recherche, filtre par type, tri et pagination de 10 lignes.
* **[`centres/pages/CentreDetail.jsx`](centres/pages/CentreDetail.jsx)** (`/centres/:id`) : Fiche d'un centre fiscal et liste de ses contribuables rattachés.
* **[`centres/pages/CentreListe.jsx`](centres/pages/CentreListe.jsx)** (`/centres-fiscaux`) : Annuaire des unités opérationnelles (DGE, SRE, Centres fiscaux) issu de `unitefiscal.json`.
* **[`centres/pages/UniteFiscaleDetail.jsx`](centres/pages/UniteFiscaleDetail.jsx)** (`/centres-fiscaux/:type/:index`) : Fiche détaillée d'une unité opérationnelle territoriale.
* Détails dans le [`README`](centres/README.md) du domaine.

### 7. 📊 Tableau Décisionnel (`decisionnel/`)
* **[`decisionnel/pages/TableauDecisionnel.jsx`](decisionnel/pages/TableauDecisionnel.jsx)** (`/decisionnel`) : Tableau de bord décisionnel avec KPIs clés (déclarations traitées, dossiers à risque, écart total, TVA théorique totale) et graphiques de pilotage consolidés sur 5 ans.

### 8. 📨 Relance Fiscale & Recouvrement (`relance/`)
* **[`relance/pages/RelanceFiscale.jsx`](relance/pages/RelanceFiscale.jsx)** (`/relance`) : Suivi des arriérés et des contribuables non en règle, avec onglets (retards de paiement, non en règle, historique des relances), filtres et pagination de 15 lignes. Chaque dossier renvoie vers la fiche du contribuable, où les relances sont émises.
  * L'onglet « Historique des relances » est alimenté par `getRelances({ limit: 10000 })` (`GET /api/relances`, déjà restreint au centre de l'agent par `data-scope`) ; plus aucun `localStorage`. Le KPI « Relances émises » compte les relances non annulées, et chaque ligne est cliquable vers la fiche du contribuable grâce à la jointure `contribuables` renvoyée par l'API.
  * L'état vit dans l'URL via [`../utils/searchParams.utils.js`](../utils/searchParams.utils.js) : `onglet` (absent = `retards`), `q` (recherche NIF / raison sociale / secteur), `severite` (sans effet hors de l'onglet retards, où il est levé au changement d'onglet) et `page`. Un bouton « ✕ Effacer les filtres », désactivé quand aucun filtre n'est actif, remet `q`, `severite` et `page` à zéro en conservant `onglet`.
* **Sous-composants (`relance/components/`) :**
  * **[`relance/components/RelanceKPICards.jsx`](relance/components/RelanceKPICards.jsx)** : Quatre indicateurs de recouvrement, recevant la propriété `stats`.
  * **[`relance/components/RappelOrdreModal.jsx`](relance/components/RappelOrdreModal.jsx)** : Modale d'aperçu et d'impression de la lettre officielle de rappel à l'ordre / mise en demeure. `role="dialog"`, `aria-modal` et `aria-labelledby` sont portés par `.rappel-modal-container` (et non plus par l'arrière plan), et le hook [`../hooks/useModalA11y.js`](../hooks/useModalA11y.js) gère Échap ainsi que l'entrée et la restitution du focus. Utilisée par [`contribuables/pages/ContribuableDetail.jsx`](contribuables/pages/ContribuableDetail.jsx) ; [`relance/pages/RelanceFiscale.jsx`](relance/pages/RelanceFiscale.jsx) ne l'importe pas (il délègue l'émission des relances à la fiche contribuable).

### 9. 📖 Aide à la lecture (`aide/`)
L'espace agent explique son propre vocabulaire, sans jamais dépendre du portail contribuable : les deux espaces restent étanches et n'importent pas le registre l'autre.

* **[`aide/data/aideAgent.data.js`](aide/data/aideAgent.data.js)** — source unique. `TERMES` associe un id de terme à `{ terme, sens }` (33 entrées : NIF, centre gestionnaire, catégorie, TVA collectée / déductible / payée / théorique, recoupement, droit de communication, rapprochement, écart, tolérance, relance, rappel, mise en demeure, demande d'éclaircissement, jours francs, montant dû estimé, pénalités de retard, amende administrative…). Chaque `sens` est écrit d'après le code qui l'applique — seuils de catégorie de [`contribuables/utils/classificationCgi.utils.js`](contribuables/utils/classificationCgi.utils.js), chaîne de délais de [`relance/utils/relance.utils.js`](relance/utils/relance.utils.js), formule du « montant dû estimé » de la fiche — donc une définition ne peut pas dériver du comportement réel. `AIDES` décrit 8 écrans (`registre`, `overview`, `classification`, `declarations`, `recoupements`, `droits`, `relances`, `confrontation`), chacun avec un titre, une introduction, des rubriques et la liste des termes qu'elles citent. Les clés des onglets de la fiche sont **identiques** aux valeurs d'`activeTab` : la modale reçoit `ecran={activeTab}` sans table de correspondance. Accesseurs : `terme(id)` et `aideEcran(ecran)` ; un id inconnu rend le texte nu, un écran absent rend rien.
* **[`aide/components/AideTerme.jsx`](aide/components/AideTerme.jsx)** — survol d'un terme. Un `<button class="aide-term-cible">` (pointillés sous le libellé, `cursor: help`) est relié par `aria-describedby` à une bulle `role="tooltip"` masquée en `opacity: 0`, visible au survol, au focus clavier et à l'état `.ouvert`. Le tap ouvre et referme (écrans tactiles), Échap referme et rend le focus. **Écriture à savoir** : la cible est un bouton, donc un `AideTerme` ne se pose jamais dans un autre bouton — les actions de relance sont volontairement exclues, les survols vont dans les `<th>`, les libellés et les phrases d'introduction.
* **[`aide/components/AideLectureModal.jsx`](aide/components/AideLectureModal.jsx)** — modale « Aide à la lecture » de l'écran courant. Elle reprend la coquille de [`components/common/ModaleConfirmation.jsx`](../components/common/ModaleConfirmation.jsx) (superposition, en-tête avec croix, pied « Fermer », `useModalA11y`) : aucun nouveau dialogue, aucune nouvelle couleur. Elle affiche les rubriques du registre puis « Les mots de cet écran », glossaire **déduit** des termes cités par ces rubriques (dédoublonné) — le survol et la modale montrent donc littéralement le même texte.
* **[`aide/components/BoutonAide.jsx`](aide/components/BoutonAide.jsx)** — `? Aide` (`className="secondary bouton-aide"`) posé dans les `.page-heading-aide` de `/contribuables`, de la fiche contribuable et de `/contribuables/:id/confrontation`. Renvoie `null` sans `onOuvrir`.
* Écrans câblés : en-tête de fiche (NIF, centre gestionnaire, badge de catégorie), tableau de bord, historique des déclarations (en-têtes de colonnes, via la propriété `header` de [`components/common/DataTable.jsx`](../components/common/DataTable.jsx) qui prime sur `label`), panneau « Nature d'impôt », recoupements, droits de communication, relances, table des rapprochements de la confrontation, et le registre (`ContribuablesTable`, `ContribuablesFilters`). Les panneaux concernés portent une phrase d'introduction `.aide-ecran-intro` qui dit ce que la liste montre avant la première ligne.
* CSS : bloc « Front-office agent : aide à la lecture » de [`../../App.css`](../../App.css). La bulle s'écrit en **trois classes** (`.page .aide-term .aide-term-tip`) parce que les libellés des cartes agent sont grisés par des règles de conteneur (`.declaration-summary span`, `.sum-field span`…) qui voleraient sa couleur à une règle plus courte. Variantes sombres, écrans tactiles (`@media (hover: none)`), 760/520 px et `@media print` (bulle, bouton et modale retirés de l'impression) y sont traités comme pour les infobulles du portail.
