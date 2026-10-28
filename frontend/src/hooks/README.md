# Hooks personnalisés (`/src/hooks`)

Ce dossier ne contient que les hooks réclamés par **plusieurs espaces** de
l'application. Un hook lié à un seul domaine reste dans ce domaine, sous
`<domaine>/hooks/` (par exemple
[`../frontofficeagent/contribuables/hooks/useContribuablesList.jsx`](../frontofficeagent/contribuables/hooks/useContribuablesList.jsx)
ou
[`../frontofficeagent/decisionnel/hooks/useDecisionnelData.jsx`](../frontofficeagent/decisionnel/hooks/useDecisionnelData.jsx)).

---

## Fichiers

| Fichier | Rôle |
| --- | --- |
| [`useTablePagination.js`](useTablePagination.js) | découpage client d'une liste déjà filtrée |
| [`useModalA11y.js`](useModalA11y.js) | ouverture, fermeture et gestion du focus d'une modale |
| [`index.js`](index.js) | porte d'entrée : ré-exporte les deux hooks ci-dessus en export nommé |

Les consommateurs importent depuis le barrel :

```javascript
import { useModalA11y, useTablePagination } from '@/hooks';
```

---

## `useTablePagination(items, pageSize = 10)`

Découpe côté client une liste déjà filtrée, utilisé par les cinq tables du
backoffice administrateur (`/admin`, `/admin/utilisateurs`, `/admin/roles`,
`/admin/verification-nif`, `/admin/historique`) avec `pageSize = 10`.

* La page demandée est bornée au nombre réel de pages (`safePage`), donc une
  liste qui se raccourcit — suppression, changement de filtre — n'affiche jamais
  une page vide.
* `pageItems` est mémoïsé ; la barre de navigation est rendue par le composant
  commun [`Pagination`](../components/common/Pagination.jsx).
* **Le hook ne réinitialise pas la page** quand la liste change : la
  réinitialisation (`setCurrentPage(1)`) est appelée dans les gestionnaires
  d'événement des filtres, onglets, recherches et boutons d'actualisation. Un
  `useEffect` aurait été refusé par la règle ESLint
  `react-hooks/set-state-in-effect`.

Valeur de retour :

| Propriété | Type | Description |
| --- | --- | --- |
| `pageItems` | `Array` | Tranche de `pageSize` éléments de la page courante |
| `currentPage` | `number` | Page réellement affichée (déjà bornée) |
| `setCurrentPage` | `(page: number) => void` | Changeur de page, à appeler aussi sur `1` lors d'un filtre |
| `totalPages` | `number` | `Math.max(1, ceil(items.length / pageSize))` |
| `pageSize` | `number` | Taille de page demandée |
| `isPaginated` | `boolean` | `true` quand la liste dépasse une page |

---

## `useModalA11y(isOpen, onClose)`

Rend une modale utilisable au clavier. Consommé par
[`ModaleConfirmation`](../components/common/ModaleConfirmation.jsx),
[`NotificationModal`](../components/common/NotificationModal.jsx),
[`DemandeEclaircissementModal`](../components/common/DemandeEclaircissementModal.jsx),
[`ExcelImportModal`](../components/forms/ExcelImportModal.jsx),
[`LienAccesModal`](../frontofficeagent/contribuables/components/LienAccesModal.jsx) et
[`RappelOrdreModal`](../frontofficeagent/relance/components/RappelOrdreModal.jsx).

* La touche **Échap** appelle `onClose` tant que la modale est ouverte.
* À l'ouverture, le focus entre dans la boîte de dialogue ; à la fermeture, il
  revient à l'élément qui l'avait déclenchée (si celui-ci est toujours au DOM),
  sinon le Tab suivant repart d'une zone fantôme et l'utilisateur perd sa place.
* L'effet ne dépend que de `isOpen` : `onClose` est presque toujours une flèche
  recréée à chaque rendu du parent, et le mettre dans les dépendances aurait
  relancé l'effet — donc rendu le focus — au moindre changement d'état. La
  valeur est lue dans une référence.
* Le composant appelant pose la référence renvoyée sur l'élément
  `role="dialog"` / `aria-modal="true"` et lui donne `tabIndex={-1}` pour qu'il
  soit focalisable. Le hook ne gère pas le cycle de Tab à l'intérieur de la
  modale.

---

## Hook voisin : `useDecisionnelData()`

`useDecisionnelData` (`export par défaut`) vit dans le domaine décisionnel, pas
ici : [`../frontofficeagent/decisionnel/hooks/useDecisionnelData.jsx`](../frontofficeagent/decisionnel/hooks/useDecisionnelData.jsx).
Il est consommé par deux écrans —
[`../frontofficeagent/accueil/pages/Accueil.jsx`](../frontofficeagent/accueil/pages/Accueil.jsx)
(qui n'exploite que `stats` et `loading`) et
[`../frontofficeagent/decisionnel/pages/TableauDecisionnel.jsx`](../frontofficeagent/decisionnel/pages/TableauDecisionnel.jsx)
(qui exploite `stats`, `declarations`, `error` et `loading`).

Il charge en parallèle `getDeclarationStats()` et `getDeclarations({ limit: 10000 })`
(fonctions de [`../api/declarations.js`](../api/declarations.js), importées depuis `@/api`) :

* Chargement initial dans un `useEffect` exécuté une seule fois, avec un drapeau
  `isMounted` pour ignorer les mises à jour d'état après démontage.
* `reloadData()` relance la même paire d'appels à la demande et réinitialise
  `error` et `loading`.
* En cas d'échec, `error` reçoit le message produit par
  `getErrorMessage(requestError)` ; les erreurs ne sont pas propagées.

| Propriété | Type | Description |
| --- | --- | --- |
| `stats` | `object \| null` | Statistiques renvoyées par `GET /declarations/stats` |
| `declarations` | `Array` | Déclarations renvoyées par `GET /declarations?limit=10000` ; le hook accepte une réponse déjà déballée ou un objet portant `.data` |
| `error` | `string` | Message d'erreur lisible, vide en l'absence d'erreur |
| `loading` | `boolean` | `true` pendant le chargement initial et pendant `reloadData()` |
| `reloadData` | `function` | Rechargement manuel (asynchrone) |
