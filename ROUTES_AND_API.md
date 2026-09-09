# 📚 Documentation des Routes Frontend, Backend et API (SP2CF / TVA•SSIF)

Ce document décrit l'ensemble des **routes frontend (React Router)**, des **routes backend (API REST Express)** et du **client API** du projet.

---

## 🧭 1. Routes Frontend (React Router v7)

Toutes les routes sont déclarées dans [`App.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/App.jsx) et protégées par la barre de navigation [`Header.jsx`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/components/common/Header.jsx).

| Route URL | Composant Page | Paramètres / Query | Description & Rôle Métier |
| :--- | :--- | :--- | :--- |
| **`/`** | `Accueil.jsx` | - | **Tableau de bord d'accueil** : Présentation du système SP2CF / DGI, indicateurs de synthèse fiscale annuelle, boutons d'actions rapides. |
| **`/collecte`** | `Collecte.jsx` | Tab `currentModule` | **Simulateur de collecte TVA multi-modules** :<br>• *Module A* : TVA sur ventes et achats.<br>• *Module B* : TVA théorique IS / IR & Redressements.<br>• *Module C* : Recoupement fiscal tiers. |
| **`/entreprises/nouveau`** | `PhaseClassement.jsx` | - | **Étape 1 Immatriculation** : Choix de la structure fiscale compétente (Centre Fiscal `< 2 Md`, SRE `2-4 Md`, DGE `> 4 Md`). |
| **`/entreprises/nouveau/form`** | `FormInformation.jsx` | `?structure=centre_fiscal\|sre\|dge` | **Étape 2 Immatriculation** : Formulaire de création d'un contribuable (NIF 10 chiffres, Raison sociale, CA, Secteur, Contact). |
| **`/decisionnel`** | `TableauDecisionnel.jsx` | - | **Tableau de bord de pilotage stratégique** : KPIs (Total déclarations, Alertes/Critiques, Écart total, TVA théorique) + Graphiques SVG. |
| **`/suivi`** | `SuiviFiscal.jsx` | - | **Tableau d'audit et de suivi des déclarations** : Historique complet, recherche en temps réel, tri dynamique sur les colonnes, pagination. |
| **`/suivi/:id`** | `DeclarationDetail.jsx` | `:id` *(ID de la déclaration)* | **Fiche détaillée d'une déclaration** : Données chiffrées complètes (CA, bénéfice, TVA déductible/payée/théorique), statut de conformité. |
| **`/contribuables`** | `Contribuables.jsx` | - | **Registre des contribuables** : Synthèse par entreprise, cumul des montants payés, nombre d'années suivies. |
| **`/contribuables/:id`** | `ContribuableDetail.jsx` | `:id` *(NIF / Clé contribuable)* | **Fiche détaillée d'un contribuable** : Historique multi-annuel, graphiques de volume sur 5 ans et courbes d'écarts TVA. |
| **`/register`** | `Register.jsx` | - | **Registre fiscal par centre** : Répartition visuelle en 3 colonnes (Centre Fiscal, SRE, DGE) selon le chiffre d'affaires déclaré. |

---

## ⚙️ 2. Routes Backend (API REST Express)

Le backend écoute par défaut sur le port `5000` (`http://localhost:5000`). En développement, Vite relaie automatiquement les requêtes commençant par `/api` via son proxy interne.

### 🛡️ Route de Santé
* **`GET /health`**
  * **Description** : Vérifie la disponibilité de l'API.
  * **Réponse (200 OK)** :
    ```json
    {
      "status": "OK",
      "message": "API de contrôle fiscal en ligne",
      "version": "1.0.0"
    }
    ```

---

### 🏢 Module Entreprises (`/api/entreprises`)

| Méthode | Endpoint | Description | Paramètres / Body | Code HTTP |
| :--- | :--- | :--- | :--- | :--- |
| **`GET`** | `/api/entreprises` | Liste paginée avec recherche | **Query :** `page` (défaut: 1), `limit` (défaut: 20), `search` (NIF ou Raison sociale) | `200 OK` |
| **`GET`** | `/api/entreprises/:id` | Détails d'une entreprise par son ID | **Param :** `id` (ID Entreprise) | `200 OK` / `404 Not Found` |
| **`POST`** | `/api/entreprises` | Créer un nouveau contribuable | **Body JSON :**<br>• `nif` *(string, min 10 chiffres, requis)*<br>• `raison_sociale` *(string, requis)*<br>• `secteur_activite` *(string, requis)*<br>• `regime_fiscal` *(string: 'IS' \| 'IR')*<br>• `adresse` *(string, requis)*<br>• `telephone` *(string, requis)*<br>• `email` *(string, optionnel)* | `201 Created` / `400 Bad Request` |
| **`PUT`** | `/api/entreprises/:id` | Mettre à jour une entreprise | **Param :** `id`<br>**Body JSON :** champs modifiés | `200 OK` / `404 Not Found` |

---

### 📑 Module Déclarations (`/api/declarations`)

| Méthode | Endpoint | Description | Paramètres / Body | Code HTTP |
| :--- | :--- | :--- | :--- | :--- |
| **`GET`** | `/api/declarations` | Liste filtrable des déclarations | **Query :** `page`, `limit`, `search` (NIF/Nom), `statut` (`conforme`\|`alerte`\|`critique`), `annee` | `200 OK` |
| **`GET`** | `/api/declarations/stats` | Statistiques globales & KPIs | **Réponse :** total, conformes, alertes, critiques, ca_moyen, tva_totale, tva_theorique_totale, ecart_total | `200 OK` |
| **`GET`** | `/api/declarations/:id` | Fiche détaillée d'une déclaration | **Param :** `id` (ID Déclaration) | `200 OK` / `404 Not Found` |
| **`POST`** | `/api/declarations` | Enregistrer une déclaration (Calcul automatique TVA théorique, écart et statut) | **Body JSON :**<br>• `id_entreprise` *(number, requis)*<br>• `annee` *(number, requis)*<br>• `ca` *(number, requis)*<br>• `benefice` *(number, requis)*<br>• `tva_collectee` *(number)*<br>• `tva_deductible` *(number)*<br>• `tva_payee` *(number)*<br>• `regime_fiscal` *('IS' \| 'IR')* | `201 Created` |
| **`POST`** | `/api/declarations/:id/notification-primitive` | Émettre la **Notification Primitive** (délai 30j, statut `PRIMITIVE_ENVOYÉE`) | **Param :** `id`<br>**Body :** `date_emission`, `prorogation_jours`, `montant_redressement`, `credit_impot`, `observations_agent` | `200 OK` |
| **`POST`** | `/api/declarations/:id/notification-definitive` | Émettre la **Notification Définitive** (validation agent, dette arrêtée, statut `DÉFINITIVE_ENVOYÉE`, déblocage imputation) | **Param :** `id`<br>**Body :** `date_emission`, `montant_valide`, `credit_impot`, `observations_agent` | `200 OK` |
| **`POST`** | `/api/declarations/:id/imputer-credit` | **Imputer le Crédit d'Impôt** (Articles 01.01.15 et 01.02.06 CGI LFI 2026, autorisé uniquement si `DÉFINITIVE_ENVOYÉE`) | **Param :** `id`<br>**Body :** `credit_impot`, `montant_a_imputer`, `observations_agent` | `200 OK` / `400 Bad Request` |

---

### 🔍 Module Contrôles Fiscaux (`/api/controles`)

| Méthode | Endpoint | Description | Paramètres / Body | Code HTTP |
| :--- | :--- | :--- | :--- | :--- |
| **`POST`** | `/api/controles/:id_declaration/effectuer` | Lancer un contrôle fiscal sur une déclaration | **Param :** `id_declaration`<br>**Body :** `{ "id_agent": 1 }` (optionnel) | `200 OK` |
| **`GET`** | `/api/controles/:id_declaration/historique` | Historique des contrôles d'une déclaration | **Param :** `id_declaration` | `200 OK` |
| **`GET`** | `/api/controles/stats` | Statistiques globales de contrôle | - | `200 OK` |

---

### 🔄 Module Recoupements (`/api/recoupements`)

| Méthode | Endpoint | Description | Paramètres / Body | Code HTTP |
| :--- | :--- | :--- | :--- | :--- |
| **`POST`** | `/api/recoupements` | Enregistrer une collecte de recoupement tiers | **Body JSON :**<br>• `id_entreprise` *(number, requis)*<br>• `source` *(string, défaut: 'tiers_declarant')*<br>• `merchandise_sold` *(number)*<br>• `goods_purchased` *(number)*<br>• `services_purchased` *(number)*<br>• `third_party_payments` *(number)*<br>• `local_products` *(number)*<br>• `import_expenses` *(number)*<br>• `ca_declare` *(number, optionnel)* | `201 Created` |
| **`GET`** | `/api/recoupements/:id_entreprise/analyser` | Analyser la cohérence des recoupements d'un contribuable | **Param :** `id_entreprise` | `200 OK` |
| **`GET`** | `/api/recoupements/stats/sources` | Statistiques groupées par source de recoupement | - | `200 OK` |

---

## 🔌 3. Mapping des Fonctions API Frontend ([`api.js`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/api/api.js))

| Fonction JS | Méthode & Endpoint Backend Correspondant | Rôle |
| :--- | :--- | :--- |
| `getDeclarations(params)` | `GET /api/declarations` | Récupère la liste des déclarations |
| `getDeclarationById(id)` | `GET /api/declarations/:id` | Récupère une déclaration spécifique |
| `getDeclarationStats()` | `GET /api/declarations/stats` | Récupère les agrégats de statistiques pour le tableau décisionnel |
| `createDeclaration(payload)` | `POST /api/declarations` | Enregistre une nouvelle déclaration fiscale |
| `getContribuables(params)` | `GET /api/entreprises` | Récupère la liste des contribuables |
| `getContribuableById(id)` | `GET /api/entreprises/:id` | Récupère les informations d'un contribuable |
| `getContribuableByNif(nif)` | `GET /api/entreprises?search=nif` | Recherche et sélectionne un contribuable par son NIF |
| `createContribuable(payload)` | `POST /api/entreprises` | Crée un nouveau contribuable dans la base |
| `createRecoupement(payload)` | `POST /api/recoupements` | Enregistre les données financières de recoupement |
| `getRecoupementsByContribuable(id)` | `GET /api/recoupements/:id/analyser` | Récupère les recoupements et l'analyse de cohérence |
| `effectuerControle(idDecl, payload)` | `POST /api/controles/:id_declaration/effectuer` | Déclenche un contrôle fiscal formel |
| `getControlesDeclaration(idDecl)` | `GET /api/controles/:id_declaration/historique` | Historique des contrôles |
| `getErrorMessage(error)` | *(Utilitaire local)* | Formate le message d'erreur d'une requête Axios |
