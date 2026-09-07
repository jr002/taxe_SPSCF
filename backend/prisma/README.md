# Schéma Prisma

Ce dossier contient le schéma Prisma utilisé par l'API du SSIF pour accéder à
PostgreSQL :

- [`schema.prisma`](schema.prisma) décrit la structure de la base et génère le
  client Prisma ;
- [`../src/config/prisma.js`](../src/config/prisma.js) expose l'instance
  `PrismaClient` utilisée par les modèles du backend.

## Configuration

Le schéma utilise PostgreSQL et lit la chaîne de connexion dans la variable
`DATABASE_URL` :

```env
DATABASE_URL="postgresql://utilisateur:mot_de_passe@localhost:5432/ssif"
```

La variable doit être définie dans `backend/.env`. Ce fichier ne doit pas être
versionné.

## Modèles

### `contribuables`

Représente les entreprises ou personnes suivies par l'administration fiscale.
Le `nif` est unique. Un contribuable peut avoir plusieurs déclarations et
plusieurs recoupements.

### `declarations`

Stocke les données fiscales annuelles d'un contribuable : chiffre d'affaires,
bénéfice et montants de TVA. Le couple `id_contribuable` + `annee` est unique,
ce qui limite une déclaration par contribuable et par année.

Les champs financiers sont des `Decimal(15, 2)` et sont initialisés à `0`
lorsqu'ils sont omis. Le statut par défaut est `conforme`.

### `controles`

Conserve l'historique des contrôles effectués sur les déclarations et, si
disponible, par un agent. Les écarts sont stockés en `Decimal` et le résultat
du contrôle est enregistré dans `resultat`.

### `agents`

Contient les utilisateurs qui effectuent les contrôles : identité, adresse
électronique, rôle et statut. L'adresse électronique est unique. Le rôle et le
statut prennent respectivement les valeurs par défaut `agent` et `actif`.

### `recoupements`

Stocke les montants issus de sources externes utilisés pour analyser la
cohérence des informations d'un contribuable : marchandises, achats,
prestations, paiements de tiers, produits locaux et importations.

## Relations

```text
contribuables 1 ──── n declarations 1 ──── n controles n ──── 0..1 agents
       │
       └──────────── n recoupements
```

- Une déclaration appartient éventuellement à un contribuable.
- Un contrôle appartient éventuellement à une déclaration et à un agent.
- La suppression d'un contribuable supprime ses déclarations et recoupements
  (`onDelete: Cascade`).
- La suppression d'une déclaration supprime ses contrôles
  (`onDelete: Cascade`).
- Les relations vers les agents et les déclarations utilisent `NoAction` lors
  d'une mise à jour.

Les relations sont également exposées par Prisma avec les propriétés
`declarations`, `recoupements` et `controles`, ce qui permet d'utiliser
`include` ou `select` dans les requêtes.

## Contraintes et index principaux

- Toutes les clés primaires sont des entiers auto-incrémentés.
- `agents.email` et `contribuables.nif` sont uniques.
- Les recherches sont indexées sur les emails, NIF, années, statuts et clés
  étrangères.
- Une déclaration est unique pour un couple contribuable/année.

## Commandes

Depuis le dossier `backend/` :

```bash
npm install
npm run prisma:generate
```

Après toute modification de [`schema.prisma`](schema.prisma), régénérer le
client Prisma avant de démarrer l'API.

La base existante peut aussi nécessiter l'exécution de la migration SQL
[`../migrations/001-rename-contribuables.sql`](../migrations/001-rename-contribuables.sql).
Elle doit être appliquée une seule fois selon l'état de la base.

## Remarques

- Le schéma contient des commentaires de base de données ; la documentation
  Prisma référencée dans [`schema.prisma`](schema.prisma) décrit la
  configuration supplémentaire éventuellement nécessaire pour les migrations.
- Les noms des modèles suivent les tables existantes et sont donc au pluriel
  (`agents`, `declarations`, etc.). Ils doivent être utilisés tels quels dans
  les appels à `prisma`.
- Les champs de mot de passe doivent être traités comme des secrets et ne
  doivent jamais être exposés dans les réponses de l'API.
