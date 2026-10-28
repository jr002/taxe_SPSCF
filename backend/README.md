# Backend SSIF

API REST du **Système de suivi et de contrôle fiscal (SSIF)**. Le backend
utilise Node.js, Express, PostgreSQL et Prisma.

## 1. Prérequis

- Node.js 20.19 ou une version plus récente ;
- pnpm 11 (depuis la racine du workspace) ;
- PostgreSQL 14 ou une version plus récente ;
- une base de données PostgreSQL créée pour le projet.

## 2. Installation

Depuis la racine du projet, après avoir configuré `backend/.env` :

```bash
pnpm run setup:project
```

Le fichier `.env` doit se trouver directement dans `backend/`. Il contient les
paramètres locaux de la base de données et ne doit pas être partagé ou
committé.

Exemple de configuration :

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=taxe_verification
DB_USER=postgres
DB_PASSWORD=<mot_de_passe_postgresql>
DATABASE_URL="postgresql://postgres:<mot_de_passe_postgresql>@localhost:5432/taxe_verification?schema=public"

JWT_SECRET=<secret-aleatoire-long-et-prive>
```

Remarques sur ces variables :

- `DATABASE_URL` est lue directement par Prisma ; les variables `DB_HOST`,
  `DB_PORT`, `DB_NAME`, `DB_USER` et `DB_PASSWORD` n'alimentent que le pool `pg`
  de [`src/config/database.js`](src/config/database.js). Ce module n'est plus
  référencé par l'API, qui passe exclusivement par Prisma.
- `JWT_SECRET` n'est pas obligatoire en développement : sans lui,
  [`src/middlewares/auth.middleware.js`](src/middlewares/auth.middleware.js)
  utilise la valeur de repli `development-only-change-this-secret`. En
  production (`NODE_ENV=production`), son absence fait échouer la signature et
  la vérification des jetons.
- `CORS_ORIGIN` est encore présent dans certains `.env` et exposé par
  [`src/config/env.js`](src/config/env.js) (`config.cors.origin`), mais il n'est
  utilisé par aucune couche de l'application : la liste des origines autorisées
  est codée en dur dans [`src/app.js`](src/app.js) (voir § 7).

La base indiquée par `DATABASE_URL` doit exister avant le démarrage de l'API.

### Migrations SQL additives

Le dossier [`migrations/`](migrations/) contient dix scripts SQL additifs, à
appliquer manuellement et dans l'ordre sur une base antérieure à Prisma :

| Fichier | Objet |
| --- | --- |
| [`001-rename-contribuables.sql`](migrations/001-rename-contribuables.sql) | renomme `entreprises` en `contribuables` et `id_entreprise` en `id_contribuable` |
| [`002-notifications-redressement.sql`](migrations/002-notifications-redressement.sql) | ajoute à `declarations` les colonnes de la procédure contradictoire (dates de notification, prorogation, montants de redressement et de crédit d'impôt) |
| [`003-centres-contribuables.sql`](migrations/003-centres-contribuables.sql) | crée la table `centres`, la colonne `contribuables.id_centre` et sa clé étrangère |
| [`004-telephone-centres.sql`](migrations/004-telephone-centres.sql) | ajoute `centres.telephone_centre` et renseigne quelques numéros |
| [`005-droits-communication.sql`](migrations/005-droits-communication.sql) | crée la table `droits_communication` (module Droits de communication), ses index et ses clés étrangères vers `contribuables` et `agents` |
| [`006-roles-centre-affectation.sql`](migrations/006-roles-centre-affectation.sql) | ajoute `agents.id_centre` (clé étrangère vers `centres` en `ON DELETE SET NULL`, index `idx_agents_centre`) et convertit les rôles hérités `client` en `contribuable` |
| [`007-demande-eclaircissement.sql`](migrations/007-demande-eclaircissement.sql) | remplace la contrainte `relances_type_relance_check` pour y ajouter le type `demande_eclaircissement` ; aucune colonne nouvelle, la demande d'éclaircissements (CPF V-17) réutilise `observations` et `date_emission` |
| [`008-centre-ssif-administrateurs.sql`](migrations/008-centre-ssif-administrateurs.sql) | crée le centre `SSIF` (`type_centre = 'DGE'`, `numero_centre = 'SSIF'`) et rattache les comptes `admin` existants à ce centre. Rejouable : l'insertion est gardée par `NOT EXISTS` et l'`UPDATE` ne touche que les lignes dont l'affiliation diffère |
| [`009-centre-fiscal-ref.sql`](migrations/009-centre-fiscal-ref.sql) | aligne sur le référentiel `unitefiscal.json` l'orthographe de quatre `centres.nom_centre` (`CF Fénérive-Est`, `CF Belon'i Tsiribihina`, `CF Vohémar`, `CF Port-Bergé`) puis dérive `contribuables.centre_fiscal_ref` depuis `id_centre` pour les dossiers déjà rattachés. Rejouable : les renommages sont gardés par l'ancienne orthographe et la dérivation ne touche que les références vides |
| [`010-acces-contribuable.sql`](migrations/010-acces-contribuable.sql) | crée la table `acces_contribuable` des liens du portail contribuable : `token_hash varchar(64)` unique (empreinte SHA-256 du jeton, jamais le jeton), `date_creation` / `date_expiration` / `date_revocation` / `date_dernier_acces`, compteurs `nb_acces` et `nb_echecs`, clé étrangère vers `contribuables` en `ON DELETE CASCADE` et vers `agents` en `ON DELETE SET NULL`, index `idx_acces_contribuable`. Rejouable : table et index créés sous `IF NOT EXISTS`. Nécessite la déclaration du modèle dans `prisma/schema.prisma` puis `pnpm run prisma:generate` |

Ces scripts ne sont pas gérés par Prisma. Les instructions y utilisent
`IF EXISTS` et `IF NOT EXISTS` pour la plupart, mais `001` n'est pas rejouable :
le renommage de colonnes échoue au second passage. Sauvegardez la base et
vérifiez chaque script avant de l'appliquer. Les migrations de référence du
schéma se trouvent dans [`prisma/migrations/`](prisma/migrations/) et
s'appliquent avec `pnpm --filter backend run prisma:deploy` (voir
[`prisma/README.md`](prisma/README.md)).

> **Drift de schéma — à lire avant toute opération de migration.** Le dépôt
> contient deux systèmes de migration qui ont divergé :
> [`prisma/migrations/`](prisma/migrations/) (3 migrations enregistrées :
> `0_init`, `20260922120000_add_relances`, `20261013110000_add_json_fiscal_centre_ref`)
> et [`migrations/`](migrations/) (scripts manuels `001` à `010`). À cause de ce
> drift, `prisma migrate dev` ou `prisma migrate reset` réclamerait un reset
> destructif qui viderait la base `taxe_verification`. **Ne les lancez jamais
> sur une base existante.** Appliquez uniquement du SQL additif via
> `prisma db execute` et tenez `schema.prisma` et la base alignés à la main.
> Le script `010` s'applique ainsi (même procédure pour `006` à `009`) :
>
> ```bash
> pnpm exec prisma db execute --file ./migrations/010-acces-contribuable.sql --schema ./prisma/schema.prisma
> ```
>
> Après chaque colonne ou table ajoutée de cette façon, relancez `pnpm run prisma:generate`
> — le backend en cours d'exécution verrouille le moteur Prisma, il faut donc
> l'arrêter, régénérer le client, puis redémarrer.

## 3. Démarrer le serveur

```bash
# Développement : redémarre automatiquement après une modification
pnpm --filter backend run dev

# Démarrage normal
pnpm --filter backend start
```

Par défaut, l'API écoute sur `http://localhost:5000`.

### Créer le premier compte agent

Les comptes ne sont pas ouverts à l'inscription publique. Après avoir configuré
la base, créez un compte depuis PowerShell :

```powershell
$env:AGENT_EMAIL = "agent@example.com"
$env:AGENT_PASSWORD = "un-mot-de-passe-de-12-caracteres-minimum"
$env:AGENT_FIRST_NAME = "Prenom"
$env:AGENT_LAST_NAME = "Nom"
pnpm --filter backend run agent:create
```

Le script [`scripts/create-agent.js`](scripts/create-agent.js) refuse un mot de
passe de moins de 12 caractères et une adresse e-mail déjà utilisée pour les
comptes administrateur. L'inscription publique accepte un minimum de
4 caractères afin de permettre les comptes de test. Il
enregistre le mot de passe haché (bcrypt, 12 tours) et crée le compte avec
`role = "admin"` et `statut = "actif"`. Supprimez ensuite ces variables de
l'environnement PowerShell.

### Authentification

La session repose sur un cookie, pas sur un jeton transmis par le client :

- `POST /api/auth/login` (public, rate-limited) vérifie l'e-mail et le mot de
  passe, dépose le cookie `fiscal_session` (`httpOnly`, `sameSite=lax`, `secure`
  en production, durée 8 heures) et renvoie l'agent connecté. Cinq échecs
  consécutifs pour une paire IP + e-mail (fenêtre glissante de 15 minutes)
  déclenchent un `429` ; un compte `en_attente` ou bloqué reçoit un message
  qui lui est propre (`403`) ;
- `POST /api/auth/reset-request` (public, rate-limited) enregistre une demande
  de réinitialisation dans le journal d'audit (`type_action = RESET_REQUEST`).
  Aucun e-mail n'est envoyé : la plateforme n'a pas de service SMTP, l'appel
  renvoie toujours le même message et l'administrateur définit lui-même le mot
  de passe avec `PATCH /api/agents/:id/password` ;
- `POST /api/auth/register` (public, rate-limited) enregistre une demande
  d'accès, avec un
  mot de passe haché et un compte `agent` au statut `en_attente` ;
- `POST /api/auth/change-password` (authentifié, limité à 6 tentatives par agent
  et par fenêtre) remplace le mot de passe de l'agent connecté : il exige
  `password_actuel`, vérifié par `bcrypt.compare`, refuse un nouveau mot de passe
  identique à l'actuel, trop court ou diversement confirmé, et consigne une ligne
  `MDP_CHANGEMENT`. Il ne révoque pas le cookie déjà émis — seul le blocage ou la
  suppression du compte coupe la session au coup suivant ;
- `GET /api/auth/me` (authentifié) renvoie l'agent porté par la session ;
- `POST /api/auth/logout` (public) supprime le cookie ;
- `app.use('/api', authenticate, enforceDataScope)` dans [`src/app.js`](src/app.js)
  protège **toutes** les autres routes `/api`, qui répondent `401` sans cookie
  valide et `403` quand le périmètre de l'agent ne couvre pas la demande.

Le jeton JWT est signé avec `JWT_SECRET` et expire au bout de huit heures
(`expiresIn: '8h'`), comme le cookie. `authenticate` ne se contente pas de
vérifier la signature : il relit l'agent en base, donc une session ouverte est
immédiatement invalidée (`401`) si le compte est bloqué ou supprimé entre-temps
et un changement de rôle ou de centre est effectif sans reconnexion.

### Périmètres de données

`authenticate` range le périmètre de l'agent dans `req.dataScope` (règle unique
dans [`src/utils/data-scope.js`](src/utils/data-scope.js)) et
`app.use('/api', authenticate, enforceDataScope)` l'applique à toutes les routes
métier. Le rôle se combine au centre de rattachement enregistré dans
`agents.id_centre` — l'administrateur l'affecte avec
`PATCH /api/agents/:id/centre` :

| Rôle           | Périmètre                                             |
| -------------- | ----------------------------------------------------- |
| `admin`        | Back-office **et** tous les centres, en écriture comprise |
| `inspecteur`   | Tous les centres, **consultation seule** (aucune écriture) |
| `chef_centre`  | Uniquement le centre auquel l'agent est rattaché       |
| `controleur`   | Uniquement le centre auquel l'agent est rattaché       |
| `agent`        | Uniquement le centre auquel l'agent est rattaché       |
| `contribuable` | Aucun dossier tant que le compte n'est pas lié à un NIF |
| `autre`        | Aucun dossier                                          |

Conséquences pratiques :

- une liste ou un statistique d'un rôle centré ne renvoie **que** les dossiers de
  son centre (`applyScope` empile le filtre dans le `where` Prisma) ;
- consulter un dossier d'un autre centre — même en devinant son identifiant —
  répond `403` ;
- un rôle centré **sans** `id_centre` est traité comme sans périmètre : `403`
  avec le message « Aucun centre fiscal n'est rattaché à votre compte » ;
- un agent centré qui crée ou modifie un contribuable voit son `id_centre`
  verrouillé sur son propre centre ;
- `req.dataScope.canWrite` sépare le droit de lire du droit d'écrire : sur les
  neuf préfixes métiers, `enforceDataScope` refuse `POST`, `PUT`, `PATCH` et
  `DELETE` d'un scope en lecture seule — seul l'`inspecteur` est dans ce cas,
  avec le message « Le rôle Inspecteur consulte les dossiers de tous les centres
  mais ne peut ni en créer ni en modifier » ;
- `/api/auth` n'étant pas un préfixe métier, un inspecteur y change quand même
  son propre mot de passe ;
- exception unique sur l'écriture en lecture seule : `isShareRoute` ouvre
  `POST /api/contribuables/:id/acces-contribuable` à l'`inspecteur`, car émettre
  un lien de consultation n'altère aucune donnée fiscale. Le contrôle de périmètre
  sur le contribuable (`contribuableInScope`) s'applique toujours, et les rôles
  `contribuable` / `autre` restent refusés (`403`, périmètre vide). Aucune autre
  méthode d'écriture n'est rouverte par cette exception ;
- `/api/agents` et les écritures sur `/api/centres` restent réservées à `admin`.

#### Affiliation automatique des administrateurs au centre `SSIF`

Les comptes `admin` sont rattachés d'office au centre `SSIF` (créé par la
migration `008`, `type_centre = 'DGE'`). Comme `admin` est un rôle national,
cette affectation est **uniquement informative** : `data-scope.js` ne filtre
jamais un administrateur par `id_centre`, l'affiliation n'ouvre ni ne ferme
aucun dossier. Elle est posée automatiquement par `PATCH /api/agents/:id/role`
(entrée dans le rôle) et par `scripts/create-agent.js`, qui crée toujours un
compte `admin` ; l'inscription publique `POST /api/auth/register` crée un compte
`agent` et reste donc hors centre jusqu'à l'affectation par l'administrateur. La
sortie du rôle `admin` libère le centre.
`AgentModel.findIdCentreAdministrateurs()` lit le centre par
`(nom_centre = 'SSIF', type_centre = 'DGE')` ; s'il manque, le rôle change
quand même et l'affiliation existante reste inchangée. La suppression du centre
`SSIF` est refusée (`400`) parce que `agents_id_centre_fkey` est en
`ON DELETE SET NULL` et effacerait silencieusement l'affiliation de tous les
administrateurs.

Vérifier que le serveur fonctionne :

```text
GET http://localhost:5000/health
```

Cette route est publique, comme `/api-docs` et `/api-docs/swagger.json`. Une
réponse correcte contient notamment `"status": "OK"`.

## 4. Documentation de l'API

La documentation interactive Swagger est disponible après le démarrage :

- interface : `http://localhost:5000/api-docs`
- spécification JSON : `http://localhost:5000/api-docs/swagger.json`

Le contenu de cette spécification est défini dans
[`src/config/swagger.js`](src/config/swagger.js).

### Routes principales

Douze domaines sont montés par [`src/app.js`](src/app.js). Tous exigent le cookie `fiscal_session`, sauf
`/api/auth` et `/api/acces-contribuable`.

| Préfixe | Rôle | Auth |
| --- | --- | --- |
| `/api/auth` | connexion, inscription, session courante, déconnexion | publique, sauf `GET /api/auth/me` |
| `/api/acces-contribuable` | portail « Ma situation fiscale » du contribuable : état du lien puis ouverture après confirmation NIF + e-mail | publique, gardée par le jeton d'URL ; monté **avant** `authenticate` |
| `/api/contribuables` | créer, consulter et modifier les contribuables | requise |
| `/api/declarations` | gérer les déclarations, leurs statistiques et la procédure contradictoire | requise |
| `/api/controles` | effectuer un contrôle et consulter son historique | requise |
| `/api/recoupements` | enregistrer et analyser des données de recoupement | requise |
| `/api/droits-communication` | enregistrer et suivre les droits de communication adressés aux tiers | requise |
| `/api/rapprochements` | confronter déclarations et recoupements, suivre les écarts | requise |
| `/api/etat-contribuable` | historique et dernier état d'activité et de conformité | requise |
| `/api/relances` | relances et recouvrement | requise |
| `/api/centres` | gérer les centres fiscaux (lecture selon le périmètre, écritures réservées à `admin`) | requise |
| `/api/agents` | administrer les comptes agents (activation, rôle, centre de rattachement, mot de passe, suppression) | requise **+ rôle `admin`** |

Les lignes métier ci-dessus sont aussi filtrées selon le périmètre de l'agent :
tous les centres pour `admin` (avec l'écriture) et `inspecteur` (consultation
seule), le centre de rattachement pour `chef_centre`, `controleur` et `agent`,
rien du tout pour `contribuable` et `autre` (voir « Périmètres de données » plus
haut).

Il n'existe **aucun** préfixe `/api/entreprises` : les contribuables sont exposés
sous `/api/contribuables` depuis la migration `001-rename-contribuables.sql`.

Exemples :

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/reset-request
POST /api/auth/change-password
GET  /api/auth/me
POST /api/auth/logout

GET  /api/contribuables
GET  /api/contribuables/:id
POST /api/contribuables
PUT  /api/contribuables/:id
POST /api/contribuables/:id/acces-contribuable   (émet le lien du portail)

GET  /api/acces-contribuable/:token              (public)
POST /api/acces-contribuable/:token/ouvrir       (public, NIF + e-mail)

GET  /api/declarations
GET  /api/declarations/stats
GET  /api/declarations/:id
POST /api/declarations
POST /api/declarations/:id/notification-primitive
POST /api/declarations/:id/notification-definitive
POST /api/declarations/:id/imputer-credit

GET  /api/controles/stats
POST /api/controles/:id_declaration/effectuer
GET  /api/controles/:id_declaration/historique

POST /api/recoupements
GET  /api/recoupements/:id_contribuable/analyser
GET  /api/recoupements/stats/sources

GET  /api/droits-communication
GET  /api/droits-communication/stats/statuts
GET  /api/droits-communication/:id
POST /api/droits-communication
PUT  /api/droits-communication/:id
DELETE /api/droits-communication/:id

GET    /api/centres
GET    /api/centres/:id
POST   /api/centres              (rôle `admin`)
PUT    /api/centres/:id          (rôle `admin`)
DELETE /api/centres/:id          (rôle `admin`)

GET    /api/agents
PATCH  /api/agents/:id/statut
PATCH  /api/agents/:id/role
PATCH  /api/agents/:id/centre
PATCH  /api/agents/:id/password
PATCH  /api/agents/:id/identite
DELETE /api/agents/:id
```

Le détail des corps attendus, des codes HTTP et du mapping avec le client
React est regroupé dans [`../ROUTES_AND_API.md`](../ROUTES_AND_API.md).

### Validation, bornes et contrat d'erreur

Les corps de requête sont contrôlés par
[`src/middlewares/validation.middleware.js`](src/middlewares/validation.middleware.js)
(`express-validator`), branché route par route avant le contrôleur. Les bornes
reproduisent le schéma PostgreSQL : une valeur qui les dépasse est refusée net
au lieu de faire échouer l'insertion côté base.

| Famille | Borne appliquée |
| --- | --- |
| montants en `numeric(15,2)` — `ca`, `benefice`, `tva_collectee`, `tva_deductible`, `tva_payee`, `tva_theorique`, `montant_redressement`, `credit_impot`, `montant_impute`, `montant_net_a_payer`, `montant_reclame`, `somme_recoupee`, `montant_declare`, `montant_tva` | `0` à `9 999 999 999 999,99` (constante `MONTANT_MAX`) |
| `score` en `numeric(5,2)` | `0` à `100` |
| `annee` | `2000` à `2100` |
| `prorogation_jours` | `0` à `3650` |
| `periode` | 7 caractères au plus (`2024-01`) |
| `observations_agent`, `observations`, `motif` | 2000 caractères au plus |
| chaînes `VarChar` d'un contribuable | `nif` de 10 à 50 caractères, `raison_sociale` de 2 à 255, `secteur_activite` 100, `telephone` 20, `email` 100 — appliqué aussi à `PUT /api/contribuables/:id` (`contribuableUpdateValidators`) |
| dates (`date_notification_primitive`, `date_notification_definitive`, `date_limite_reponse`, `date_demande`, `date_reponse`, `date_emission`) | ISO 8601 |
| listes fermées | `STATUTS_ACTIVITE` et `STATUTS_CONFORMITE`, `TYPES_RELANCE` et `STATUTS_RELANCE`, `TYPES_RAPPROCHEMENT` et `STATUTS_RAPPROCHEMENT`, `CENTRE_TYPES`, statuts de déclaration et de droit de communication. Chaque liste est exportée par son modèle et consommée telle quelle : le middleware n'en recopie aucune |

Un échec renvoie `400` avec l'enveloppe :

```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [{ "field": "ca", "message": "Le CA doit être compris entre 0 et 9 999 999 999 999,99" }]
}
```

Codes renvoyés par les contrôleurs :

| Situation | Code |
| --- | --- |
| champ manquant, hors borne ou hors liste | `400` |
| `POST` / `PUT` sans corps JSON | `400` sur les champs obligatoires — jamais `500` |
| identifiant non numérique ou ligne inexistante | `404` |
| ligne existante mais rattachée à un autre centre (ou à aucun centre) | `403` |
| périmètre vide (rôle sans dossier fiscal, rôle centré sans centre) ou écriture tentée par un inspecteur | `403` |
| doublon sur `declarations(id_contribuable, periode, type_declaration)` | `409` |
| `numero_centre` déjà utilisé | `409` |
| `id_centre` qui ne correspond à aucun centre | `400` |
| suppression du centre `SSIF`, affiliation des administrateurs | `400` |
| exception non maîtrisée remontée par `next(error)` | `500` « Erreur interne du serveur » |

Les réponses d'erreur ne contiennent plus le détail de l'exception (aucune clé
`error`) : le client reçoit un message générique, la cause technique reste
journalisée côté serveur par `console.error`.
[`src/middlewares/error.middleware.js`](src/middlewares/error.middleware.js)
complète ce masquage : comme aucun `next(error)` du code ne pose `statusCode`,
toute erreur qui arrive jusqu'au gestionnaire central — authentification,
périmètre de données, exception Prisma, JWT ou bcrypt — ressort en `500` avec le
message générique, sans jamais révéler la requête ou la pile d'origine. Le champ
`stack` n'est ajouté à la réponse qu'avec `NODE_ENV=development`.

Les mises à jour acceptent un corps partiel — seuls les champs fournis sont
écrits — sur `PUT /api/declarations/:id` (`id_contribuable` exclu : un dossier
ne change pas de contribuable), `PUT /api/relances/:id` et
`PUT /api/droits-communication/:id`. `PATCH /api/rapprochements/:id/statut`
exige en revanche `statut`.

### Rattachement fiscal d'un contribuable

`contribuables.id_centre` (table `centres`, colonne portée par le périmètre des
agents) et `contribuables.centre_fiscal_ref` (référentiel
[`../unitefiscal.json`](../unitefiscal.json), format `cle:nom` avec `cle` valant
`centres_fiscaux`, `sre` ou `dge`) décrivent le même rattachement : le premier
borne ce qu'un agent peut voir, le second alimente les pages « unité fiscale ».
[`src/models/contribuable.model.js`](src/models/contribuable.model.js) les tient
alignés à chaque écriture :

- `id_centre` fourni → la référence textuelle est dérivée du centre ; un centre
  sans équivalent dans le référentiel (`SSIF`) donne une référence nulle ;
- `centre_fiscal_ref` fourni seul → le centre correspondant est recherché en
  base et `id_centre` renseigné quand il existe ;
- les deux fournis → `id_centre` l'emporte, puisque `forceCentreOnWrite`
  l'impose déjà à un agent centré.

La référence reste soumise à `isValidCentreFiscalRef`
([`src/utils/unite-fiscale.utils.js`](src/utils/unite-fiscale.utils.js)) : un nom
absent du référentiel est refusé en `400`, y compris en filtre de
`GET /api/contribuables`. L'existant a été rattrapé par la migration
[`009-centre-fiscal-ref.sql`](migrations/009-centre-fiscal-ref.sql).

## 5. Organisation du code

Le traitement d'une requête suit généralement le chemin :
**route → controller → service/model → PostgreSQL**.

```text
backend/
├── server.js                 # démarre le serveur HTTP
├── src/
│   ├── app.js                # Express, middlewares et routes
│   ├── config/
│   │   ├── env.js            # variables d'environnement
│   │   ├── prisma.js         # client Prisma
│   │   ├── database.js       # pool pg (module non utilisé par l'API)
│   │   └── swagger.js        # documentation OpenAPI
│   ├── routes/               # définition des URL de l'API
│   ├── controllers/          # lecture de la requête et réponse HTTP
│   ├── services/             # logique métier et calculs fiscaux
│   ├── models/               # accès aux données via Prisma
│   ├── middlewares/          # authentification, validation, gestion des erreurs
│   └── utils/                # périmètre de données et références fiscales
├── scripts/create-agent.js   # création d'un compte agent
├── prisma/schema.prisma      # modèles et relations de la base
├── prisma/migrations/        # migrations gérées par Prisma
└── migrations/               # scripts SQL ponctuels (hors Prisma)
```

Pour ajouter une fonctionnalité, créer ou modifier les éléments dans cet ordre :

1. définir la route ;
2. ajouter la validation nécessaire dans
   [`src/middlewares/validation.middleware.js`](src/middlewares/validation.middleware.js) ;
3. implémenter le controller ;
4. placer la logique métier dans un service ;
5. utiliser le modèle Prisma pour accéder à PostgreSQL.

## 6. Modèle de données

Les modèles Prisma sont :

- `contribuables` : entreprises ou personnes suivies ;
- `declarations` : données fiscales annuelles et montants de TVA ;
- `controles` : contrôles réalisés sur les déclarations ;
- `agents` : agents qui réalisent les contrôles (mot de passe haché, `role` et
  `id_centre` qui bornent leur périmètre de consultation) ;
- `recoupements` : données provenant de sources externes ;
- `droits_communication` : demandes de communication adressées aux tiers (un
  contribuable, un agent instructeur, un statut `demande`/`reponse`/`partiel`/`relance`/`sans_suite`) ;
- `centres` : centres fiscaux rattachés aux contribuables ;
- `rapprochements` : confrontations entre une déclaration, un recoupement et un contrôle ;
- `etat_contribuable` : historique des statuts d'activité et de conformité ;
- `relances` : relances émises, exposées par `/api/relances`.

Les relations et contraintes sont détaillées dans
[`prisma/schema.prisma`](prisma/schema.prisma) et
[`prisma/README.md`](prisma/README.md). Après une modification du schéma,
régénérer le client :

```bash
pnpm --filter backend run prisma:generate
```

## 7. Sécurité et dépannage

- Ne jamais exposer `DB_PASSWORD`, `DATABASE_URL` ou les mots de passe des
  agents dans le code, les logs ou les réponses JSON.
- Le CORS est limité à une liste codée en dur dans [`src/app.js`](src/app.js),
  avec `credentials: true` : `http://localhost:3000`, `http://localhost:5173`,
  `http://localhost:5174`, `http://localhost:5175` et les mêmes adresses en
  `127.0.0.1`. Les requêtes sans en-tête `Origin` sont acceptées. Modifier
  `CORS_ORIGIN` dans le `.env` n'a aucun effet.
- Un `401` sur toutes les routes `/api` (hors `/api/auth/login`,
  `/api/auth/reset-request` et `/api/auth/logout`) signifie que le cookie
  `fiscal_session` est absent, expiré, signé avec un autre `JWT_SECRET`, ou que
  le compte a été bloqué ou supprimé depuis l'ouverture de la session :
  `authenticate` relit systématiquement l'agent en base.
- Un `429` sur `/api/auth/login`, `/api/auth/register` ou
  `/api/auth/reset-request` vient du limiteur en mémoire
  [`src/middlewares/rate-limit.middleware.js`](src/middlewares/rate-limit.middleware.js)
  (5 tentatives par e-mail et 20 par IP pour 15 minutes). Il ne survit pas à un
  redémarrage du serveur et n'est pas partagé entre instances. Le serveur
  n'active pas `trust proxy` : derrière un reverse proxy, `req.ip` serait
  l'adresse du proxy et le compteur par IP serait global — définir
  `app.set('trust proxy', ...)` dans ce cas.
- Une erreur `ECONNREFUSED` indique généralement que PostgreSQL n'est pas
  démarré ou que `DB_HOST`/`DB_PORT` sont incorrects.
- Une erreur Prisma de connexion indique généralement une `DATABASE_URL`
  incorrecte ou une base inexistante.
- Une erreur CORS signifie que l'adresse du frontend n'est pas autorisée ;
  vérifiez l'origine utilisée par Vite et la liste `allowedOrigins`.
- `app.use('/uploads', ...)` sert des fichiers statiques depuis
  `backend/uploads`, dossier qui n'existe pas dans le dépôt (à créer si des
  pièces jointes sont ajoutées).
- Les dépendances `multer`, `pdfkit`, `xlsx` et `pg-pool` sont déclarées dans
  `package.json` mais ne sont utilisées par aucun fichier du backend.
- `pnpm --filter backend run test` est encore un script placeholder : aucun test automatisé n'est
  actuellement configuré dans le backend.

## Scripts pnpm

| Commande | Utilité |
| --- | --- |
| `pnpm run setup:project` (racine) | installe les dépendances, applique les migrations et génère Prisma |
| `pnpm --filter backend run prisma:generate` | génère le client Prisma |
| `pnpm --filter backend run prisma:migrate` | crée/applique une migration en développement |
| `pnpm --filter backend run prisma:deploy` | applique les migrations puis génère Prisma |
| `pnpm --filter backend run prisma:studio` | ouvre Prisma Studio |
| `pnpm --filter backend run agent:create` | crée un compte agent à partir des variables `AGENT_*` |
| `pnpm --filter backend run dev` | lance le serveur avec nodemon |
| `pnpm --filter backend start` | lance le serveur en mode normal |
| `pnpm --filter backend run test` | placeholder, aucun test configuré |
