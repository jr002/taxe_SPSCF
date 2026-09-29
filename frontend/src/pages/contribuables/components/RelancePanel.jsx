const RELANCE_ACTIONS = [
  {
    type: 'rappel1',
    id: 'btn-relance-rappel1',
    className: 'relance-action-warning',
    icon: '📨',
    title: '1er Rappel à l’Ordre',
    detail: 'Délai de régularisation : 8 jours ',
  },
  {
    type: 'rappel2',
    id: 'btn-relance-rappel2',
    className: 'relance-action-danger',
    icon: '📨',
    title: '2ème Rappel à l’Ordre',
    detail: 'Délai de régularisation : 8 jours ',
  },
  {
    type: 'miseEnDemeure',
    id: 'btn-relance-mise-en-demeure',
    className: 'relance-action-critical',
    icon: '⚖',
    title: 'Mise en Demeure de Payer',
    detail: 'Délai de régularisation : 5 jours',
  },
];

const SEVERITY_CLASSES = {
  rappel1: 'sev-faible',
  rappel2: 'sev-moyen',
  miseEnDemeure: 'sev-critique',
  regularise: 'sev-ok',
};

function formatAmount(amount) {
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount)} Ar`;
}

function getStatusClass(status) {
  return status === 'Régularisé'
    ? 'relance-statut-conforme'
    : 'relance-statut-emis';
}

function RelanceActionButton({ action, onIssue }) {
  return (
    <button
      id={action.id}
      type="button"
      className={`relance-action-btn ${action.className}`}
      onClick={() => onIssue(action.type)}
    >
      <span className="relance-action-icon">{action.icon}</span>
      <span>
        <strong>{action.title}</strong>
        <small>{action.detail}</small>
      </span>
    </button>
  );
}

function RegularizationButton({ onRegularize }) {
  return (
    <button
      id="btn-relance-regularise"
      type="button"
      className="relance-action-btn relance-action-ok"
      onClick={onRegularize}
    >
      <span className="relance-action-icon">✓</span>
      <span>
        <strong>Marquer comme Régularisé</strong>
        <small>Enregistre la régularisation du dossier</small>
      </span>
    </button>
  );
}

function RelanceHistoryRow({ entry, onOpenHistoryEntry }) {
  const canPreviewDocument = entry.type !== 'regularise';

  const openDocument = () => {
    if (canPreviewDocument) {
      onOpenHistoryEntry(entry);
    }
  };

  return (
    <tr
      className={`relance-row${canPreviewDocument ? ' clickable-row' : ''}`}
      onClick={openDocument}
      onKeyDown={(event) => {
        if (
          canPreviewDocument &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          openDocument();
        }
      }}
      tabIndex={canPreviewDocument ? 0 : undefined}
      title={canPreviewDocument ? 'Afficher ce document' : undefined}
    >
      <td>{entry.date}</td>
      <td>
        <span
          className={`relance-severite-badge ${
            SEVERITY_CLASSES[entry.type] || 'sev-ok'
          }`}
        >
          {entry.typeLabel}
        </span>
      </td>
      <td className="relance-montant">{formatAmount(entry.montant)}</td>
      <td>
        <span className={`relance-statut-badge ${getStatusClass(entry.statut)}`}>
          {entry.statut}
        </span>
      </td>
    </tr>
  );
}

function RelanceHistory({ history, nif, onOpenHistoryEntry }) {
  const taxpayerHistory = history.filter((entry) => entry.nif === nif);

  if (!taxpayerHistory.length) {
    return null;
  }

  return (
    <div className="relance-panel-history">
      <h3>Historique des relances pour ce contribuable</h3>
      <div className="table-scroll">
        <table className="register-table relance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Montant (Ar)</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {taxpayerHistory.map((entry) => (
              <RelanceHistoryRow
                key={entry.id}
                entry={entry}
                onOpenHistoryEntry={onOpenHistoryEntry}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RelancePanel({
  history,
  montantDu,
  nif,
  onIssue,
  onOpenHistoryEntry,
  onRegularize,
  success,
}) {
  return (
    <div className="relance-panel">
      <div className="relance-panel-header">
        <div>
          <p className="eyebrow">DGI · Procédure de recouvrement</p>
          <h2>Actions de Relance Fiscale</h2>
          <p className="relance-panel-subtitle">
            Émettez un rappel à l’ordre officiel, une mise en demeure ou marquez
            le dossier comme régularisé.
            {montantDu > 0 && (
              <strong className="relance-panel-du">
                {' '}
                Montant dû estimé : {formatAmount(montantDu)}
              </strong>
            )}
          </p>
        </div>
      </div>

      {success && (
        <p className="success form-submit-message relance-panel-success" role="status">
          {success}
        </p>
      )}

      <div className="relance-panel-actions">
        {RELANCE_ACTIONS.map((action) => (
          <RelanceActionButton key={action.type} action={action} onIssue={onIssue} />
        ))}
        <RegularizationButton onRegularize={onRegularize} />
      </div>

      <RelanceHistory
        history={history}
        nif={nif}
        onOpenHistoryEntry={onOpenHistoryEntry}
      />
    </div>
  );
}
