# Tests du backend

Un fichier par domaine, suffixé `.test.js`, découvert par le script
`pnpm --filter backend run test` (motif `tests/**/*.test.js`). Le runner est
[`node:test`](https://nodejs.org/api/test.html), intégré à Node : le projet
n'ajoute ni Jest ni Vitest, et la suite se lance sans PostgreSQL, sans `.env` et
sans serveur démarré.

## Ce qui est couvert

| Fichier | Surface | Nombre de tests |
| --- | --- | --- |
| [`rapprochement.test.js`](rapprochement.test.js) | périmètre de la confrontation, typage de l'écart, montant recoupé de référence, options de confrontation, rattachement automatique | 35 |

## Comment la suite se passe de base de données

`RapprochementService.confronter` lit une déclaration et un recoupement puis
écrit un rapprochement. Les trois modèles sont doublés avant chaque test :

- `DeclarationModel.findById` / `RecoupementModel.findById` rendent les lignes de
  l'énoncé, `null` pour un identifiant inconnu ;
- `DeclarationModel.findByContribuable` / `RecoupementModel.findByContribuable`
  rendent les tableaux du dossier ;
- `RapprochementModel.create` **enregistre le message dans un tableau au lieu
  d'écrire** : le test asserte sur le rapprochement tel qu'il serait stocké ;
- `prisma.rapprochements.findFirst` simule les rapprochements déjà écrits, pour
  vérifier que le rattachement automatique ne duplique rien.

Les doublures sont rendues par `t.after`, donc un test qui échoue ne contamine
pas les suivants. `isPeriodCompatible` se passe de doublure : c'est une fonction
pure.

## Ce qui reste hors de portée

- `apercuContribuable` agrège depuis Prisma avec des requêtes composées : sa
  justesse se vérifie en HTTP, pas en double.
- Les contrôleurs, les middlewares de périmètre et les contraintes `chk_*` de la
  base ne sont testés qu'en appelant l'API réellement — un test unitaire ne prouve
  pas qu'une migration est appliquée.
- Le moteur de rapprochement ne connaît ni le `data-scope` ni les rôles : un
  test d'intégration reste à écrire pour prouver qu'un agent centré ne marie que
  les dossiers de son centre.

## Ajouter un test

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Nom du comportement, pas du fichier', () => {
  it('énonce la règle attendue', () => {
    assert.equal(1 + 1, 2);
  });
});
```

Un test qui n'a jamais échoué sur une erreur volontaire ne prouve rien : après
l'avoir écrit, inversez une borne ou un signe dans le service et vérifiez qu'il
rougit.
