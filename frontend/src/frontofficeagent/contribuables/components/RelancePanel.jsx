import { relanceStatut, relanceType } from '@/frontofficeagent/relance/utils/relance.utils';

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
    type: 'mise_en_demeure',
    id: 'btn-relance-mise-en-demeure',
    className: 'relance-action-critical',
    icon: '⚖',
    title: 'Mise en Demeure de Payer',
    detail: 'Délai de régularisation : 5 jours',
  },
];

function formatAmount(amount) {
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount)} Ar`;
}

function RelanceActionButton({ action, onIssue, disabled }) {
  return (
    <button
      id={action.id}
      type="button"
      className={`relance-action-btn ${action.className}`}
      onClick={() => onIssue(action.type)}
      disabled={disabled}
    >
      <span className="relance-action-icon">{action.icon}</span>
      <span>
        <strong>{action.title}</strong>
        <small>{action.detail}</small>
      </span>
    </button>
  );
}

function RegularizationButton({ onRegularize, disabled }) {
  return (
    <button
      id="btn-relance-regularise"
      type="button"
      className="relance-action-btn relance-action-ok"
      onClick={onRegularize}
      disabled={disabled}
    >
      <span className="relance-action-icon">✓</span>
      <span>
        <strong>Marquer comme Régularisé</strong>
        <small>Enregistre la régularisation du dossier</small>
      </span>
    </button>
  );
}

function RelanceHistoryRow({ relance, onOpenHistoryEntry }) {
  // Seuls ces trois actes ont une lettre imprimable ; la demande d'éclaircissements a son propre document.
  const canPreviewDocument = ['rappel1', 'rappel2', 'mise_en_demeure'].includes(relance.type_relance);

  const openDocument = () => {
    if (canPreviewDocument) {
      onOpenHistoryEntry(relance);
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
      <td>{new Date(relance.date_emission).toLocaleDateString('fr-FR')}</td>
      <td>
        <span className={`relance-severite-badge ${relanceType(relance.type_relance).severity}`}>
          {relanceType(relance.type_relance).label}
        </span>
      </td>
      <td className="relance-montant">{formatAmount(Number(relance.montant_du) || 0)}</td>
      <td>
        <span className={`relance-statut-badge ${relanceStatut(relance.statut).cls}`}>
          {relanceStatut(relance.statut).label}
        </span>
      </td>
    </tr>
  );
}

function RelanceHistory({ relances, onOpenHistoryEntry }) {
  if (!relances.length) {
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
            {relances.map((relance) => (
              <RelanceHistoryRow
                key={relance.id_relance}
                relance={relance}
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
  montantDu,
  onIssue,
  onOpenHistoryEntry,
  onRegularize,
  relances,
  submitting,
  success,
  error,
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

      {error && (
        <p className="error form-submit-message" role="alert">
          ⚠ {error}
        </p>
      )}

      <div className="relance-panel-actions">
        {RELANCE_ACTIONS.map((action) => (
          <RelanceActionButton
            key={action.type}
            action={action}
            disabled={submitting}
            onIssue={onIssue}
          />
        ))}
        <RegularizationButton disabled={submitting} onRegularize={onRegularize} />
      </div>

      <RelanceHistory relances={relances} onOpenHistoryEntry={onOpenHistoryEntry} />
    </div>
  );
}
