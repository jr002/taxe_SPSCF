/**
 * RelanceKPICards — Indicateurs clés de recouvrement / relance fiscale
 * Affiche les 4 métriques de suivi des arriérés et des relances émises.
 */
export default function RelanceKPICards({ stats }) {
  const { totalImpaye, nbRetards, nbNonEnRegle, nbRelancesEmises } = stats;

  const cards = [
    {
      id: 'kpi-impaye',
      icon: '⚠',
      label: 'Total arriérés',
      value: totalImpaye,
      isMonetary: true,
      color: 'danger',
      description: 'Restes à recouvrer (MGA)',
    },
    {
      id: 'kpi-retards',
      icon: '🕐',
      label: 'Dossiers en retard',
      value: nbRetards,
      isMonetary: false,
      color: 'warning',
      description: 'Paiements non réglés à l\'échéance',
    },
    {
      id: 'kpi-non-regle',
      icon: '✗',
      label: 'Non en règle',
      value: nbNonEnRegle,
      isMonetary: false,
      color: 'critical',
      description: 'Écarts critiques / notifications sans réponse',
    },
    {
      id: 'kpi-relances',
      icon: '📨',
      label: 'Relances émises',
      value: nbRelancesEmises,
      isMonetary: false,
      color: 'info',
      description: 'Rappels et mises en demeure envoyés',
    },
  ];

  const fmt = (v) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(v) || 0);

  return (
    <div className="relance-kpi-grid">
      {cards.map((card) => (
        <div key={card.id} id={card.id} className={`relance-kpi-card relance-kpi-${card.color}`}>
          <div className="relance-kpi-icon">{card.icon}</div>
          <div className="relance-kpi-body">
            <span className="relance-kpi-label">{card.label}</span>
            <strong className="relance-kpi-value">
              {card.isMonetary ? `${fmt(card.value)} Ar` : fmt(card.value)}
            </strong>
            <small className="relance-kpi-desc">{card.description}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
