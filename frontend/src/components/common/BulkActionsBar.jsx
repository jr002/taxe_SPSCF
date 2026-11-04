/**
 * Barre d'actions affichée dès qu'une ligne est sélectionnée dans une table.
 * Les actions restent invisibles tant que la sélection est vide.
 */
export default function BulkActionsBar({ count, actions = [], onClear }) {
  if (count === 0) return null;

  return (
    <div className="bulk-bar" role="region" aria-label="Actions sur la sélection">
      <span className="bulk-bar-count" role="status">
        {count} ligne{count > 1 ? 's' : ''} sélectionnée{count > 1 ? 's' : ''}
      </span>
      <div className="bulk-bar-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={action.className || 'table-action'}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </button>
        ))}
        <button type="button" className="table-action" onClick={onClear}>Tout désélectionner</button>
      </div>
    </div>
  );
}
