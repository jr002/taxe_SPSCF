# Schéma Prisma

Ce dossier contient [`schema.prisma`](schema.prisma), le schéma Prisma utilisé
par l'API SSIF pour accéder à PostgreSQL. Le client généré est utilisé via
[`../src/config/prisma.js`](../src/config/prisma.js).

## Configuration

La connexion est définie dans `backend/.env` avec `DATABASE_URL` :

```env
DATABASE_URL="postgresql://postgres:<mot_de_passe>@localhost:5432/taxe_verification?schema=public"
```

Adaptez l'utilisateur, le mot de passe, l'hôte, le port et le nom de la base à
votre installation. Ne versionnez jamais ce fichier.

## Modèles et relations

| Modèle | Rôle |
| --- | --- |
| `contribuables` | entreprises ou personnes suivies ; `nif` unique |
| `declarations` | données fiscales annuelles et montants de TVA |
| `controles` | historique des contrôles d'une déclaration |
| `agents` | agents qui effectuent les contrôles ; `email` unique |
| `recoupements` | montants issus de sources externes |

Relations principales :

```text
contribuables 1 ──── n declarations 1 ──── n controles n ──── 0..1 agents
       │
       └──────────── n recoupements
```

- Une déclaration peut appartenir à un contribuable.
- Une déclaration est unique par couple `id_contribuable` + `annee`.
- Un contrôle peut être lié à une déclaration et à un agent.
- La suppression d'un contribuable supprime ses déclarations et recoupements.
- La suppression d'une déclaration supprime ses contrôles.

Les montants financiers utilisent `Decimal(15, 2)`. Les dates sont initialisées
automatiquement lorsque le schéma le prévoit. Les modèles sont au pluriel car
ils correspondent aux tables existantes ; utilisez donc par exemple
`prisma.contribuables` et `prisma.declarations`.

## Générer le client Prisma

Depuis `backend/` :

```bash
npm install
npm run prisma:generate
```

Relancez `npm run prisma:generate` après chaque modification de
[`schema.prisma`](schema.prisma), avant de démarrer l'API.

## Migrations Prisma

Le dossier [`migrations/0_init/migration.sql`](migrations/0_init/migration.sql) contient la migration initiale (baseline) correspondant à l'ensemble du schéma actuel (`agents`, `controles`, `declarations`, `recoupements`, `contribuables`, `centres`).

- **Si la base PostgreSQL est déjà existante et à jour**, marquez la migration comme déjà appliquée sans réexécuter le SQL :
  ```bash
  npx prisma migrate resolve --applied 0_init
  ```

- **Si vous partez d'une base vide**, appliquez les migrations directement :
  ```bash
  npx prisma migrate deploy
  # ou pour le développement
  npx prisma migrate dev
  ```

Des scripts SQL historiques ponctuels sont également conservés dans [`../migrations/`](../migrations/) pour référence.

## Sécurité

Le champ `agents.mot_de_passe` contient une donnée sensible. Ne l'exposez
jamais dans une réponse API, un log ou un export. Ne publiez pas non plus
`DATABASE_URL` ni les identifiants PostgreSQL.
