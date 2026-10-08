# Hooks personnalisés (`/src/hooks`)

Ce dossier regroupe les hooks React personnalisés réutilisables à travers l'application.

---

## Fichiers

* [`useDecisionnelData.jsx`](useDecisionnelData.jsx) : unique hook du dossier.

### `useDecisionnelData()` — export par défaut

Charge en parallèle les statistiques globales et la liste complète des déclarations, puis expose les états au composant appelant.

* Appels effectués : `getDeclarationStats()` et `getDeclarations({ limit: 10000 })`, importés depuis [`../api/api.js`](../api/api.js).
* Chargement initial : dans un `useEffect` exécuté une seule fois, avec un drapeau `isMounted` pour ignorer les mises à jour d'état après démontage.
* `reloadData()` : relance la même paire d'appels à la demande et réinitialise `error` et `loading`.
* En cas d'échec, `error` reçoit le message produit par `getErrorMessage(requestError)` ; les erreurs ne sont pas propagées.

Valeur de retour :

| Propriété | Type | Description |
| --- | --- | --- |
| `stats` | `object \| null` | Statistiques renvoyées par `GET /declarations/stats` |
| `declarations` | `Array` | Déclarations renvoyées par `GET /declarations?limit=10000` ; le hook accepte une réponse déjà déballée ou un objet portant `.data` |
| `error` | `string` | Message d'erreur lisible, vide en l'absence d'erreur |
| `loading` | `boolean` | `true` pendant le chargement initial et pendant `reloadData()` |
| `reloadData` | `function` | Rechargement manuel (asynchrone) |

---

## Exemple d'utilisation

```javascript
import useDecisionnelData from '../hooks/useDecisionnelData';

export default function MonComposant() {
  const { stats, declarations, loading, error, reloadData } = useDecisionnelData();

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <p>Total déclarations : {declarations.length}</p>
      <button onClick={reloadData}>Actualiser</button>
    </div>
  );
}
```

Le hook est consommé par deux pages hors de ce dossier : `src/pages/accueil/Accueil.jsx` (qui n'exploite que `stats` et `loading`) et `src/pages/decisionnel/TableauDecisionnel.jsx` (qui exploite `stats`, `declarations`, `error` et `loading`). D'autres hooks existent localement dans les pages, par exemple `src/pages/contribuables/hooks/useContribuablesList.jsx`.
