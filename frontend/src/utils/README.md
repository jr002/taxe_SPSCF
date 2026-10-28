# Utilitaires partagés (`/src/utils`)

Ce dossier ne contient que les fonctions pures réclamées par **plusieurs
domaines ou plusieurs espaces**. Un algorithme propre à un écran reste dans son
domaine, sous `<domaine>/utils/` : la liste complète est en bas de page.

Aucun fichier n'importe React ; tous portent l'extension `.js`.

---

## Fichiers

| Fichier | Rôle |
| --- | --- |
| [`formatters.js`](formatters.js) | formatage des montants et des nombres |
| [`session.utils.js`](session.utils.js) | atterrissage selon le rôle et initiales du profil |
| [`pagination.utils.js`](pagination.utils.js) | numérotation des pages affichées |
| [`searchParams.utils.js`](searchParams.utils.js) | état d'une liste lu et écrit dans l'URL |
| [`index.js`](index.js) | porte d'entrée : ré-exporte les fonctions ci-dessus en export nommé |

```javascript
import { formatAriary, getPageNumbers } from '@/utils';
```

---

## [`formatters.js`](formatters.js)

Fondé sur un `Intl.NumberFormat('fr-FR')` commun (`maximumFractionDigits: 0`).

* `formatAriary(val)` : montant en Ariary, ex. `"50 000 000 Ar"`.
* `formatNumber(val)` : nombre sans symbole monétaire.
* `formatCompact(val)` : format compact signé, ex. `"1.2 Md"` (≥ 1 milliard), `"350 M"` (≥ 1 million), `"50 k"` (≥ 1 000).
* `formatAxisValue(value)` : format compact des graduations d'axes, arrondi à l'entier (`"2 Md"`, `"3 M"`, `"5 k"`).
* `toNumber(val)` : conversion défensive en nombre, `0` si la conversion échoue.

## [`session.utils.js`](session.utils.js)

Ce qui concerne la session de l'agent connecté, unique source de vérité partagée
par [`../App.jsx`](../App.jsx) (route `/`),
[`Signin`](../backofficeadmin/auth/pages/Signin.jsx) et les affichages du profil :

* `getLandingPath(user)` : renvoie `'/admin'` si `user?.role === 'admin'`, sinon `'/acceuil'`. Le rôle provient toujours de la réponse de `POST /api/auth/login` ou de `GET /api/auth/me`, jamais d'une saisie.
* `initialsOf(user)` : deux initiales (première lettre du prénom + première lettre du nom, en majuscules), repli sur les deux premiers caractères de l'e-mail si l'un des deux manque et `'??'` sans utilisateur. Affichées sur le bouton rond `.user-profile-toggle` de l'en-tête, dans la pastille `.user-profile-avatar` du panneau déroulé et dans la fiche de profil d'`AdminUtilisateurs`.

Le helper doit rester partagé : lorsque la route `/` redirigeait seule vers
`/acceuil`, elle écrasait la navigation vers `/admin` déclenchée par l'écran de
connexion et un administrateur atterrissait d'abord sur l'espace agent.

## [`pagination.utils.js`](pagination.utils.js)

Numérotation des pages affichées par le composant commun
[`Pagination`](../components/common/Pagination.jsx). Partagée entre le registre
des contribuables et les cinq tables du backoffice administrateur.

* `getPageNumbers(currentPage, totalPages)` : tableau de numéros (`number`) entrecoupés de `'...'`. Tous les numéros jusqu'à 7 pages ; `1 2 3 4 5 … n` en début de liste ; `1 … n-4 n-3 n-2 n-1 n` en fin de liste ; sinon `1 … p-1 p p+1 … n`.

## [`searchParams.utils.js`](searchParams.utils.js)

Helpers de lecture/écriture de l'état d'une liste dans l'URL, utilisés par
`useContribuablesList`, [`SuiviFiscal`](../frontofficeagent/suivi-fiscal/pages/SuiviFiscal.jsx)
et [`RelanceFiscale`](../frontofficeagent/relance/pages/RelanceFiscale.jsx) avec
`useSearchParams`.

* `updateSearchParams(current, changes)` : copie le `URLSearchParams` courant, applique les modifications (`null`, `undefined` et `''` suppriment la clé) et **préserve les paramètres non mentionnés** (par exemple `vue=statistique` du registre).
* `readSearchParam(searchParams, key, fallback)` : valeur du paramètre, ou `fallback` lorsqu'il est absent ou vide.

Les pages écrivent toujours avec `{ replace: true }` : une frappe dans un champ de
recherche ne doit pas empiler vingt entrées dans l'historique du navigateur.

---

## Utilitaires restés dans leur domaine

| Module | Contenu |
| --- | --- |
| [`../frontofficeagent/contribuables/utils/classificationCgi.utils.js`](../frontofficeagent/contribuables/utils/classificationCgi.utils.js) | seuils et fiches de catégorie du CGI malgache (`SEUIL_GRAND`, `SEUIL_MOYEN`, `getCategorie`, `getFicheCategorie`) |
| [`../frontofficeagent/contribuables/utils/statistiques.utils.js`](../frontofficeagent/contribuables/utils/statistiques.utils.js) | agrégats VSP/CSP de l'onglet Statistique du registre |
| [`../frontofficeagent/contribuables/utils/exportFicheContribuable.js`](../frontofficeagent/contribuables/utils/exportFicheContribuable.js) | classeur Excel de la fiche contribuable |
| [`../frontofficeagent/decisionnel/utils/decisionnel.utils.js`](../frontofficeagent/decisionnel/utils/decisionnel.utils.js) | `getRegime`, `buildYears`, `buildCurves`, `getRegimePercentage` |
| [`../frontofficeagent/relance/utils/relance.utils.js`](../frontofficeagent/relance/utils/relance.utils.js) | vocabulaire des relances (`RELANCE_TYPES`, `RELANCE_STATUTS`, `relanceType`, `relanceStatut`, `formatDateRelance`) |
| [`../frontofficeagent/confrontation/utils/confrontation.utils.js`](../frontofficeagent/confrontation/utils/confrontation.utils.js) | lecture des écarts (`periodOptionLabel`, `buildPeriodOptions`, `statusClass`, `matchTypeLabel`) |
| [`../frontofficeagent/centres/utils/uniteFiscale.utils.js`](../frontofficeagent/centres/utils/uniteFiscale.utils.js) | aplatissement du référentiel territorial |
| [`../backofficeadmin/verification-nif/utils/verification.utils.js`](../backofficeadmin/verification-nif/utils/verification.utils.js) | moteur de vérification des NIF |
| [`../backofficeadmin/utils/roles.utils.js`](../backofficeadmin/utils/roles.utils.js) | matrice des rôles et des périmètres |

Deux suppressions ont été faites en même temps que ce rangement :

* `src/utils/contribuables.utils.jsx` (regroupement de déclarations par
  contribuable) n'était importé par aucun fichier ; la fonction homonyme de
  [`../api/contribuables.js`](../api/contribuables.js) — elle, largement
  utilisée — interroge l'API et n'a rien à voir avec ce module.
* les alias `regime` et `value` de `decisionnel.utils` (« pour compatibilité »)
  n'avaient aucun importateur.
