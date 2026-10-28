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
| `contribuables` | entreprises ou personnes suivies ; `nif` unique ; rattachement facultatif à un centre |
| `declarations` | données fiscales annuelles, montants de TVA et procédure contradictoire ; unique par `id_contribuable` + `annee` |
| `controles` | historique des contrôles d'une déclaration |
| `agents` | agents qui effectuent les contrôles ; `email` unique ; `mot_de_passe` haché ; `role` (`VarChar(50)`, sept valeurs : `admin`, `chef_centre`, `inspecteur`, `controleur`, `agent`, `contribuable`, `autre`) et `id_centre` (centre de rattachement qui borne son périmètre, voir [`../src/utils/data-scope.js`](../src/utils/data-scope.js)) |
| `recoupements` | montants issus de sources externes |
| `droits_communication` | demandes de communication adressées aux tiers ; rattaché à un `contribuables` (cascade) et à un `agents` instructeur facultatif (`SetNull`) ; `statut` par défaut `demande` |
| `centres` | centres fiscaux ; `numero_centre` unique |
| `relances` | relances émises pour un contribuable ; exposées par `/api/relances` |

Relations principales :

```text
centres 1 ──── n contribuables 1 ──── n declarations 1 ──── n controles n ──── 0..1 agents
    │                 │                      │
    └── n agents      │                      └──── n relances (0..1 declaration, 0..1 agent)
                      └──── n recoupements
```

- Une déclaration peut appartenir à un contribuable.
- Une déclaration est unique par couple `id_contribuable` + `annee`.
- Un contrôle peut être lié à une déclaration et à un agent.
- Un contribuable peut être rattaché à un centre ; la suppression du centre met
  `id_centre` à `NULL` (`onDelete: SetNull`).
- Un agent est rattaché à un centre (`agents.id_centre`, `onDelete: SetNull`) :
  c'est ce rattachement — et lui seul — qui détermine les dossiers qu'il consulte.
- La suppression d'un contribuable supprime ses déclarations, ses recoupements
  et ses relances (`onDelete: Cascade`).
- La suppression d'une déclaration supprime ses contrôles (`onDelete: Cascade`)
  et met `relances.id_declaration` à `NULL`.
- La suppression d'un agent met `relances.id_agent` à `NULL`.
- Un contribuable porte plusieurs `droits_communication` ; la suppression du
  contribuable les supprime (`onDelete: Cascade`).
- La suppression d'un agent met `droits_communication.id_agent` à `NULL`.

Les montants financiers utilisent `Decimal(15, 2)`. Les dates sont initialisées
automatiquement lorsque le schéma le prévoit. Les modèles sont au pluriel car
ils correspondent aux tables existantes ; utilisez donc par exemple
`prisma.contribuables` et `prisma.declarations`.

Certains noms d'index et de contraintes conservent l'ancien vocabulaire
« entreprise » (chantier de renommage inachevé) : `contribuables` porte la clé
primaire mappée sur `entreprises_pkey` et la clé unique `entreprises_nif_key`,
tandis que `declarations` et `recoupements` gardent les index
`idx_declarations_entreprise` et `idx_recoupements_entreprise`, ainsi que la
contrainte `declarations_id_entreprise_fkey`.

## Générer le client Prisma

Depuis `backend/` :

```bash
pnpm --filter backend exec prisma generate
```

Relancez `pnpm --filter backend run prisma:generate` après chaque modification de
[`schema.prisma`](schema.prisma), avant de démarrer l'API.

## Migrations Prisma

Le dossier [`migrations/`](migrations/) contient les migrations versionnées :

| Migration | Contenu |
| --- | --- |
| [`0_init/migration.sql`](migrations/0_init/migration.sql) | migration initiale (baseline) correspondant aux modèles `agents`, `controles`, `declarations`, `recoupements`, `contribuables` et `centres` |
| [`20260922120000_add_relances/migration.sql`](migrations/20260922120000_add_relances/migration.sql) | création de la table `relances`, de ses clés étrangères et de ses index |
| [`20261013110000_add_json_fiscal_centre_ref/migration.sql`](migrations/20261013110000_add_json_fiscal_centre_ref/migration.sql) | ajout du rattachement fiscal textuel `centre_fiscal_ref` |

- **Si la base PostgreSQL est déjà existante et à jour**, marquez la migration
  initiale comme déjà appliquée sans réexécuter le SQL :
  ```bash
  pnpm --filter backend exec prisma migrate resolve --applied 0_init
  ```

- **Si vous partez d'une base vide**, appliquez les migrations directement :
  ```bash
  pnpm --filter backend exec prisma migrate deploy
  # ou pour le développement
  pnpm --filter backend exec prisma migrate dev
  ```

### Dérive entre `prisma/migrations/` et `migrations/*.sql`

Deux systèmes de migration coexistent et ont **divergé** :

- [`migrations/`](migrations/) (ici) : 3 migrations enregistrées auprès de
  Prisma (`0_init`, `20260922120000_add_relances`,
  `20261013110000_add_json_fiscal_centre_ref`) ;
- [`../migrations/`](../migrations/) : scripts SQL manuels `00N-*.sql`
  (`001` à `008`), dont `005-droits-communication.sql` qui crée la table
  `droits_communication` du module Droits de communication,
  `006-roles-centre-affectation.sql` qui ajoute `agents.id_centre` (clé étrangère
  vers `centres` en `ON DELETE SET NULL`, index `idx_agents_centre`) et convertit
  les rôles hérités `client` en `contribuable`,
  `007-demande-eclaircissement.sql` qui élargit la contrainte
  `relances_type_relance_check` au type `demande_eclaircissement` utilisé par la
  fiche de déclaration, et `008-centre-ssif-administrateurs.sql` qui crée le
  centre `SSIF` (`type_centre = 'DGE'`) et y rattache les comptes `admin` déjà en
  base. Ce script ne touche aucune colonne du schéma Prisma — il se rejoue sans
  effet de bord, ses deux instructions étant gardées par `NOT EXISTS` et
  `IS DISTINCT FROM`.

Ces scripts additifs ne sont pas dans l'historique Prisma. À cause de ce drift
de schéma, `prisma migrate dev` ou `prisma migrate reset` détecterait des
modifications non tracées et **réclamerait un reset destructif qui viderait la
base `taxe_verification`**. Ne les lancez donc jamais sur une base existante.

La procédure retenue est d'appliquer uniquement du **SQL additif** via
`prisma db execute` et de garder [`schema.prisma`](schema.prisma) et la base
alignés à la main. `schema.prisma` ne déclarant aucune contrainte sur
`type_relance`, le script `007` n'a nécessité ni régénération du client ni
redémarrage du backend. Le script `006`, qui ajoute une colonne, a dû être
appliqué ainsi :

```bash
pnpm exec prisma db execute --file ./migrations/006-roles-centre-affectation.sql --schema ./prisma/schema.prisma
```

Toute colonne ajoutée de cette façon impose de relancer `pnpm exec prisma generate`
avant de la lire : le client généré valide chaque `select` et refuserait
`agents.id_centre` tant qu'il n'est pas régénéré. Le backend en cours d'exécution
verrouille le moteur Prisma (`EPERM` sur le renommage de la DLL) — il faut donc
l'arrêter, régénérer, puis le redémarrer.

Les scripts SQL additifs `00N-*.sql` sont détaillés dans
[`../README.md`](../README.md).

## Sécurité

Le champ `agents.mot_de_passe` contient une donnée sensible. Ne l'exposez
jamais dans une réponse API, un log ou un export. Ne publiez pas non plus
`DATABASE_URL` ni les identifiants PostgreSQL.
