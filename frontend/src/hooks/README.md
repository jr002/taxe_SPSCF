# 🪝 Custom Hooks (`/src/hooks`)

Ce dossier regroupe les hooks React personnalisés réutilisables à travers l'application.

---

## 📁 Fichiers

* **[`useDecisionnelData.js`](file:///c:/Users/PC/Desktop/ssif/rendu/version4/frontend/src/hooks/useDecisionnelData.js)** :
  * Hook de chargement et de synchronisation des données décisionnelles.
  * Effectue en parallèle la récupération des statistiques globales (`getDeclarationStats`) et de l'ensemble des déclarations (`getDeclarations`).
  * Gère les états `loading`, `error`, `stats` et `declarations`.
  * Fournit une fonction `reloadData()` pour forcer le rafraîchissement des données à la demande.

---

## 💡 Exemple d'utilisation

```javascript
import useDecisionnelData from '../hooks/useDecisionnelData';

export default function MonComposant() {
  const { stats, declarations, loading, error, reloadData } = useDecisionnelData();

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <p>Total Déclarations : {stats?.total}</p>
      <button onClick={reloadData}>Actualiser</button>
    </div>
  );
}
```
