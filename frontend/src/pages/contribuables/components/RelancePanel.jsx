const actions = [
  ['rappel1', 'btn-relance-rappel1', 'relance-action-warning', '📨', '1er Rappel à l’Ordre', 'Délai de régularisation : 8 jours francs'],
  ['rappel2', 'btn-relance-rappel2', 'relance-action-danger', '📨', '2ème Rappel à l’Ordre', 'Délai de régularisation : 8 jours francs'],
  ['miseEnDemeure', 'btn-relance-mise-en-demeure', 'relance-action-critical', '⚖', 'Mise en Demeure de Payer', 'Délai de régularisation : 5 jours francs'],
];

const formatAmount = (amount) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} Ar`;
const severityClasses = { rappel1: 'sev-faible', rappel2: 'sev-moyen', miseEnDemeure: 'sev-critique', regularise: 'sev-ok' };

export default function RelancePanel({ history, montantDu, nif, onIssue, onOpenHistoryEntry, onRegularize, success }) {
  const taxpayerHistory = history.filter((entry) => entry.nif === nif);
  return <div className="relance-panel">
    <div className="relance-panel-header"><div><p className="eyebrow">DGI · Procédure de recouvrement</p><h2>Actions de Relance Fiscale</h2><p className="relance-panel-subtitle">Émettez un rappel à l’ordre officiel, une mise en demeure ou marquez le dossier comme régularisé.{montantDu > 0 && <strong className="relance-panel-du"> Montant dû estimé : {formatAmount(montantDu)}</strong>}</p></div></div>
    {success && <p className="success form-submit-message relance-panel-success" role="status">{success}</p>}
    <div className="relance-panel-actions">
      {actions.map(([type, id, tone, icon, title, detail]) => <button id={id} key={type} type="button" className={`relance-action-btn ${tone}`} onClick={() => onIssue(type)}><span className="relance-action-icon">{icon}</span><span><strong>{title}</strong><small>{detail}</small></span></button>)}
      <button id="btn-relance-regularise" type="button" className="relance-action-btn relance-action-ok" onClick={onRegularize}><span className="relance-action-icon">✓</span><span><strong>Marquer comme Régularisé</strong><small>Enregistre la régularisation du dossier</small></span></button>
    </div>
    {taxpayerHistory.length > 0 && <div className="relance-panel-history"><h3>Historique des relances pour ce contribuable</h3><div className="table-scroll"><table className="register-table relance-table"><thead><tr><th>Date</th><th>Type</th><th>Montant (Ar)</th><th>Statut</th></tr></thead><tbody>{taxpayerHistory.map((entry) => {
      const canPreview = entry.type !== 'regularise';
      const openEntry = () => canPreview && onOpenHistoryEntry(entry);
      return <tr key={entry.id} className={`relance-row${canPreview ? ' clickable-row' : ''}`} onClick={openEntry} onKeyDown={(event) => { if (canPreview && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openEntry(); } }} tabIndex={canPreview ? 0 : undefined} title={canPreview ? 'Afficher ce document' : undefined}><td>{entry.date}</td><td><span className={`relance-severite-badge ${severityClasses[entry.type] || 'sev-ok'}`}>{entry.typeLabel}</span></td><td className="relance-montant">{formatAmount(entry.montant)}</td><td><span className={`relance-statut-badge ${entry.statut === 'Régularisé' ? 'relance-statut-conforme' : 'relance-statut-emis'}`}>{entry.statut}</span></td></tr>;
    })}</tbody></table></div></div>}
  </div>;
}
