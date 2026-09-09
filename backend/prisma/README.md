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

## Migration SQL existante

Ce projet ne contient pas de dossier `prisma/migrations`. La base existante
peut nécessiter le script SQL ponctuel
[`../migrations/001-rename-contribuables.sql`](../migrations/001-rename-contribuables.sql).

Avant de l'exécuter :

1. sauvegardez la base ;
2. lisez et vérifiez le script ;
3. confirmez qu'il n'a pas déjà été appliqué ;
4. exécutez-le une seule fois avec un outil PostgreSQL.

Ce script n'est pas un remplacement de `prisma migrate` pour de nouvelles
évolutions de schéma. Toute modification future doit être validée avec l'équipe
et synchronisée avec la base de développement.

## Sécurité

Le champ `agents.mot_de_passe` contient une donnée sensible. Ne l'exposez
jamais dans une réponse API, un log ou un export. Ne publiez pas non plus
`DATABASE_URL` ni les identifiants PostgreSQL.
