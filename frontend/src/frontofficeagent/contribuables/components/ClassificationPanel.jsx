import { formatAriary } from '@/utils/formatters';

export default function ClassificationPanel({ fiche }) {
  return <div className="classification-panel" style={{ borderLeftColor: fiche.couleur }}>
    <div className="classification-panel-header"><span className="classification-panel-badge" style={{ background: fiche.background, color: fiche.couleur }}>{fiche.label}</span><span className="classification-panel-seuil">{fiche.seuil}</span></div>
    <div className="classification-panel-section"><h3>📋 Nature d’impôt &amp; comptable</h3><p>{fiche.regime}</p></div>
    <div className="classification-panel-section"><h3>⏱️ Pénalités de retard de paiement <small>({fiche.refArticle})</small></h3><ul>{fiche.penaliteRetard.map((penalite) => <li key={penalite}>{penalite}</li>)}</ul></div>
    <div className="classification-panel-section"><h3>⚠️ Amendes administratives</h3><div className="amendes-grid">{fiche.amendes.map((amende) => <div key={amende.motif} className="amende-card"><span className="amende-motif">{amende.motif}</span><strong className="amende-montant">{formatAriary(amende.montant)}</strong>{amende.unite && <small className="amende-unite">{amende.unite}</small>}</div>)}</div></div>
  </div>;
}
