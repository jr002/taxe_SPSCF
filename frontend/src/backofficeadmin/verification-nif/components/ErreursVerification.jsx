/**
 * Journal des échecs d'une vérification NIF : une ligne par erreur, titre et
 * détail. Rendu nul quand le journal est vide, pour que la page garde sa hauteur.
 */
export default function ErreursVerification({ entries, onClear }) {
  if (!entries?.length) return null;

  return (
    <div className="verif-erreurs" role="alert">
      <div className="verif-erreurs-head">
        <h3>⛔ Erreurs relevées ({entries.length})</h3>
        {onClear && (
          <button type="button" onClick={onClear}>
            ✕ Effacer le journal
          </button>
        )}
      </div>

      <ol>
        {entries.map((erreur) => (
          <li key={erreur.id || erreur.message}>
            <strong>{erreur.titre}</strong>
            {erreur.message}
          </li>
        ))}
      </ol>
    </div>
  );
}
