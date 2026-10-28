# 🏛️ Module Centres Fiscaux & Unités Opérationnelles (`/src/frontofficeagent/centres`)

Ce dossier regroupe les composants responsables de la gestion, de la consultation et de l'affichage des **centres fiscaux** et des **unités opérationnelles** de l'administration fiscale (DGI / SSIF).

---

## 📁 Structure du Dossier

```text
centres/
├── Register.jsx              # Registre administratif interactif des centres (API / BDD)
├── CentreDetail.jsx          # Fiche détaillée d'un centre et contribuables rattachés (API)
├── CentreListe.jsx           # Annuaire territorial des unités opérationnelles (unitefiscal.json)
├── UniteFiscaleDetail.jsx    # Fiche d'une unité opérationnelle territoriale (unitefiscal.json)
└── README.md                 # Documentation du module
```

---

## ⚙️ Architecture & Deux Sources de Données

Le module combine deux approches complémentaires selon les besoins métiers :

1. **Gestion dynamique via API Backend (fonctions de `@/api`)** :
   * Utilisé par [`pages/Register.jsx`](pages/Register.jsx) et [`pages/CentreDetail.jsx`](pages/CentreDetail.jsx).
   * Les données proviennent de la base de données via les endpoints `/api/centres` et `/api/contribuables`.
   * Permet le suivi en temps réel des centres enregistrés et le comptage/listing des contribuables qui leur sont rattachés.

2. **Référentiel structurel et territorial (`unitefiscal.json`)** :
   * Utilisé par [`pages/CentreListe.jsx`](pages/CentreListe.jsx) et [`pages/UniteFiscaleDetail.jsx`](pages/UniteFiscaleDetail.jsx).
   * Les données proviennent du fichier de référence institutionnel à la racine du projet (`unitefiscal.json`), recensant la cartographie fiscale à Madagascar (DGE, SRE, Centres fiscaux par DRI et région).

---

## 🧭 Routes Déclarées dans l'Application (`App.jsx`)

| Route | Composant | Source de données | Description |
| --- | --- | --- | --- |
| `/register` | `Register` | API (`GET /api/centres`) | Tableau de bord et registre paginé des centres fiscaux |
| `/centres/:id` | `CentreDetail` | API (`GET /api/centres/:id` & `/api/contribuables`) | Fiche détaillée d'un centre et liste des contribuables rattachés |
| `/centres-fiscaux` | `CentreListe` | Fichier statique `unitefiscal.json` | Annuaire global des unités réparties par DGE, SRE et Centres fiscaux |
| `/centres-fiscaux/:type/:index` | `UniteFiscaleDetail` | Fichier statique `unitefiscal.json` | Fiche détaillée d'une unité opérationnelle (DRI, régions, contacts) |

Toutes ces pages sont réexportées au niveau du point d'entrée central [`../index.js`](../index.js).

---

## 🔍 Description Détaillée des Composants

### 1. `Register.jsx` (`/register`)
**Rôle :** Registre principal des centres fiscaux enregistrés dans le système.

* **Données & API :**
  * Appelle `getCentres()` pour charger la liste des centres et le décompte de leurs contribuables (`_count.contribuables`).
* **Fonctionnalités :**
  * **Recherche en temps réel** multi-champs (nom, type, numéro, e-mail, téléphone).
  * **Filtre par type de centre** : `Centre Fiscal`, `SRE`, `DGE`, `autre`.
  * **Tri interactif** par colonne (nom, type, numéro, e-mail, téléphone, nombre de contribuables rattachés) en mode ascendant `↑` / descendant `↓`.
  * **Pagination** côté client (10 centres par page).
  * **Navigation interactive** : clic sur une ligne ou validation clavier (`Enter` / `Espace`) pour ouvrir la fiche du centre (`/centres/:id`).
  * Bouton d'actualisation des données et bouton retour vers l'accueil (`/`).

---

### 2. `CentreDetail.jsx` (`/centres/:id`)
**Rôle :** Fiche d'identité d'un centre fiscal sélectionné et portefeuille des contribuables qui lui sont affectés.

* **Données & API :**
  * Récupère en parallèle via `Promise.all` :
    * Les informations du centre : `getCentreById(id)` (`GET /api/centres/:id`).
    * La liste globale des contribuables : `getContribuables({ limit: 10000 })`.
  * Filtre côté client les contribuables dont l'attribut `id_centre` correspond à l'identifiant du centre (`String(contribuable.id_centre) === String(id)`).
* **Fonctionnalités :**
  * **Cartouche récapitulatif** : type de centre, numéro, e-mail officiel, téléphone et nombre total de contribuables rattachés.
  * **Tableau des contribuables rattachés** : raison sociale, NIF, secteur d'activité et e-mail.
  * **Navigation croisée** : un clic sur une ligne redirige directement vers la fiche détaillée du contribuable (`/contribuables/:id_contribuable`) en passant l'objet contribuable dans `location.state`.
  * Bouton retour vers `/register`.

---

### 3. `CentreListe.jsx` (`/centres-fiscaux`)
**Rôle :** Annuaire territorial et institutionnel des unités opérationnelles fiscales de Madagascar.

* **Données :**
  * Lit directement `unitefiscal.json` (`unites_operationnelles`).
* **Organisation par catégorie :**
  1. **Direction des Grandes Entreprises (DGE)** : Entreprises de grande envergure (chiffre d'affaires > 4 milliards Ar).
  2. **Services Régionaux des Entreprises (SRE)** : Entreprises de taille intermédiaire (2 à 4 milliards Ar).
  3. **Centres Fiscaux** : Gestion des petites et moyennes entreprises au niveau des arrondissements / districts (< 2 milliards Ar).
* **Fonctionnalités :**
  * Présentation sous forme de cartes d'information avec régions couvertes, DRI (Direction Régionale des Impôts), adresse physique, téléphones (avec formateur de tableau multi-numéros) et e-mails.
  * Chaque bloc est un lien cliquable vers `/centres-fiscaux/${type}/${index}`.

---

### 4. `UniteFiscaleDetail.jsx` (`/centres-fiscaux/:type/:index`)
**Rôle :** Vue détaillée d'une unité opérationnelle issue du référentiel territorial `unitefiscal.json`.

* **Données :**
  * Extrait l'élément correspondant via les paramètres d'URL `type` (`dge`, `sre`, `centres_fiscaux`) et `index` (index numérique dans le tableau JSON).
* **Fonctionnalités :**
  * Validation des paramètres avec écran d'erreur si l'index ou le type n'existe pas.
  * Mapping des libellés (`TYPE_LABELS`) pour un affichage en clair :
    * `dge` ➔ *Direction des Grandes Entreprises*
    * `sre` ➔ *Service Régional des Entreprises*
    * `centres_fiscaux` ➔ *Centre Fiscal*
  * Affichage structuré : régions couvertes, DRI de rattachement, adresse, téléphones et e-mails.
  * Bouton de retour vers `/centres-fiscaux`.

---

## 🔗 Liens & Interactions avec les Autres Modules

* **Lien avec `accueil/` :** Le tableau de bord d'accueil ([`../accueil/pages/Accueil.jsx`](../accueil/pages/Accueil.jsx)) propose un raccourci direct vers le registre (`/register`).
* **Lien avec `contribuables/` :** Depuis [`pages/CentreDetail.jsx`](pages/CentreDetail.jsx), l'utilisateur accède en un clic à la fiche complète du contribuable rattaché ([`../contribuables/pages/ContribuableDetail.jsx`](../contribuables/pages/ContribuableDetail.jsx)).
* **Lien avec `entreprises/` :** Lors de l'immatriculation d'une nouvelle entreprise ([`../entreprises/pages/FormInformation.jsx`](../entreprises/pages/FormInformation.jsx)), les centres fiscaux servent de référence pour le rattachement administratif de l'entreprise.
