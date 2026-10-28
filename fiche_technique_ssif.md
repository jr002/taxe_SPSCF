# 📋 Fiche Technique — Projet SSIF / SPSCF

## Titre du projet

> **« Conception et réalisation d'une plateforme de monitoring et de pilotage du contrôle fiscal des entreprises à Madagascar »**
>
> *Système de Pilotage et de Suivi du Contrôle Fiscal — TVA•SSIF (SPSCF)*

---

## 🎯 Objectifs du projet

### Objectif général
Concevoir et développer une application web complète permettant à la **Direction Générale des Impôts (DGI) de Madagascar** de piloter, surveiller et contrôler les obligations fiscales des entreprises assujetties à la TVA, en offrant une vision centralisée et en temps réel de la conformité déclarative.

### Objectifs spécifiques

| # | Objectif |
|---|----------|
| 1 | **Centraliser** les données fiscales des contribuables par unité fiscale (DGE, SRE, Centres fiscaux) |
| 2 | **Automatiser** la collecte et le rapprochement des déclarations de TVA |
| 3 | **Détecter** les anomalies déclaratives (défaut de déclaration, incohérences chiffrées) |
| 4 | **Piloter** les indicateurs de recouvrement et de contrôle via des tableaux de bord décisionnels |
| 5 | **Gérer** les relances officielles auprès des contribuables défaillants |
| 6 | **Sécuriser** l'accès à l'information fiscale par une gestion fine des rôles agents |
| 7 | **Dématérialiser** les procédures de contrôle contradictoire et de vérification |

---

## 🛠️ Technologies utilisées

### 🔵 Backend — API REST

| Technologie | Version | Rôle |
|---|---|---|
| **Node.js** | 20.19+ | Environnement d'exécution serveur |
| **Express.js** | v5.x | Framework API REST |
| **Prisma ORM** | v6.x | Accès et gestion de la base de données |
| **PostgreSQL** | 14+ | Système de gestion de base de données relationnelle |
| **jsonwebtoken (JWT)** | v9.x | Authentification par session sécurisée |
| **bcryptjs** | v3.x | Hachage des mots de passe |
| **Helmet.js** | v8.x | Sécurisation des en-têtes HTTP |
| **CORS** | v2.x | Gestion des politiques d'origines croisées |
| **Swagger UI Express** | v5.x | Documentation interactive de l'API |
| **Multer** | v2.x | Gestion des imports de fichiers (Excel, CSV) |
| **PDFKit** | v0.19.x | Génération de documents PDF (notifications fiscales) |
| **SheetJS (xlsx)** | v0.18.x | Lecture/écriture de fichiers Excel |
| **Morgan** | v1.x | Journalisation des requêtes HTTP |
| **Nodemon** | v3.x | Rechargement à chaud en développement |

### 🟢 Frontend — Interface Web

| Technologie | Version | Rôle |
|---|---|---|
| **React** | v19.x | Framework UI, architecture en composants |
| **Vite** | v8.x | Outil de build et serveur de développement |
| **React Router DOM** | v7.x | Navigation SPA côté client |
| **Axios** | v1.x | Client HTTP pour consommer l'API REST |
| **Tailwind CSS** | v4.x | Framework CSS utilitaire pour le design |
| **SheetJS (xlsx)** | v0.18.x | Import de référentiels NIF depuis Excel/CSV |
| **ESLint** | v10.x | Analyse statique et qualité du code |

### 🗄️ Infrastructure & Outillage

| Technologie | Rôle |
|---|---|
| **pnpm** (v11) + **Workspaces** | Gestionnaire de paquets monorepo (backend + frontend) |
| **Prisma Migrate** | Gestion des migrations de schéma de base de données |
| **dotenv** | Gestion des variables d'environnement |
| **Git** | Contrôle de version |

---

## 🏗️ Architecture du projet

```
spscf/                          ← Racine du monorepo (pnpm workspaces)
├── backend/                    ← API REST (Node.js / Express / Prisma)
│   ├── src/
│   │   ├── routes/             ← Routeurs Express par domaine
│   │   ├── controllers/        ← Logique métier des endpoints
│   │   ├── middleware/         ← Auth JWT, validation, erreurs
│   │   └── app.js              ← Assemblage de l'application Express
│   ├── prisma/
│   │   └── schema.prisma       ← Modèle de données (PostgreSQL)
│   └── scripts/
│       └── create-agent.js     ← Création de comptes agents (CLI)
├── frontend/                   ← Interface Web (React / Vite)
│   └── src/
│       ├── pages/              ← Pages par domaine fonctionnel
│       ├── components/         ← Composants réutilisables
│       ├── backofficeadmin/    ← Espace d'administration
│       ├── api/api.js          ← Client Axios centralisé
│       └── App.jsx             ← Routeur principal React
└── unitefiscal.json            ← Référentiel institutionnel DGI (centres fiscaux)
```

---

## 🔐 Sécurité & Authentification

- **Sessions JWT** transmises via cookie `httpOnly` (durée : 8 heures)
- **Hachage bcrypt** des mots de passe agents
- **Gestion des rôles** : Administrateur · Inspecteur Contrôleur · Agent Fiscal · Client/Contribuable
- **Middleware de protection** sur toutes les routes `/api` (hors `/api/auth` et `/health`)
- **Validation des entrées** via `express-validator`

---

## 📦 Modules fonctionnels principaux

| Module | Description |
|---|---|
| 🔐 **Authentification & Admin** | Connexion sécurisée, gestion des comptes agents, des rôles et des habilitations |
| 🏠 **Tableau de bord d'accueil** | Indicateurs synthétiques : taux de déclaration, recouvrement, alertes |
| 🏢 **Immatriculation Contribuables** | Création et classification des entreprises assujetties par structure fiscale compétente |
| 📊 **Collecte TVA** | Simulation et enregistrement des déclarations (TVA collectée, déductible, rapprochement) |
| 🔍 **Suivi & Contrôle Fiscal** | Suivi des déclarations, détection des anomalies, procédure contradictoire |
| 📈 **Décisionnel & KPIs** | Tableaux de bord avec graphiques, statistiques et indicateurs de pilotage |
| 📩 **Relances Fiscales** | Gestion automatisée des défaillants, génération et envoi des rappels officiels |
| 🗺️ **Cartographie Fiscale** | Registre des centres fiscaux, SRE et DGE sur tout le territoire malgache |
| ✅ **Vérification NIF** | Vérification des Numéros d'Identification Fiscale via API, Excel ou catalogue JSON |

---

## 🌍 Contexte institutionnel

| Champ | Valeur |
|---|---|
| **Pays** | République de Madagascar |
| **Institution** | Direction Générale des Impôts (DGI) — Ministère des Finances |
| **Domaine fiscal** | TVA (Taxe sur la Valeur Ajoutée) |
| **Cadre légal** | Code Général des Impôts (CGI) — Loi de Finances 2026 |
| **Couverture territoriale** | Nationale (DGE, SRE, Centres Fiscaux par Direction Régionale des Impôts) |

---

## ⚙️ Pré-requis de déploiement

| Composant | Version minimale |
|---|---|
| Node.js | 20.19 |
| PostgreSQL | 14 |
| pnpm | 11 |
| Navigateur web moderne | Chrome 110+ / Firefox 110+ |

---

*Document généré automatiquement à partir de l'analyse du code source du projet SSIF/SPSCF.*
