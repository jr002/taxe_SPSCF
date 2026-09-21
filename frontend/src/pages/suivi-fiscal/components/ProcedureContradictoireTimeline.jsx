import { formatAriary } from '../../../utils/formatters';

/**
 * Visualisation de la timeline de la procédure contradictoire,
 * du compte à rebours légal des 30 jours et de la décomposition financière.
 */
export default function ProcedureContradictoireTimeline({
  declaration,
  ecart,
  isPrimitiveEnvoyee,
  isDefinitiveEnvoyee,
  joursRestants,
  principalRedressement,
  amendeFiscale,
  onOpenModal,
}) {
  return (
    <>
      <div className="procedure-header">
        <div>
          <span className="procedure-tag">CGI LFI 2026 · Procédure Contradictoire</span>
          <h2>Gestion des Notifications Primitives et Définitives</h2>
        </div>
        <div className="procedure-actions">
          {isPrimitiveEnvoyee && (
            <button
              type="button"
              className="secondary"
              onClick={() => onOpenModal('primitive')}
            >
              📄 Voir Notification Primitive
            </button>
          )}
          {isDefinitiveEnvoyee && (
            <button
              type="button"
              className="secondary"
              onClick={() => onOpenModal('definitive')}
            >
              📜 Voir Notification Définitive
            </button>
          )}
        </div>
      </div>

      {/* Stepper des étapes légales */}
      <div className="stepper-wrap">
        <div className={`step-item ${ecart > 0 ? 'completed' : 'active'}`}>
          <span className="step-circle">1</span>
          <div className="step-content">
            <strong>Contrôle & Écart</strong>
            <small>{ecart > 0 ? `Écart ${formatAriary(ecart)}` : 'Conforme'}</small>
          </div>
        </div>
        <div
          className={`step-item ${
            isPrimitiveEnvoyee || isDefinitiveEnvoyee
              ? 'completed'
              : ecart > 0
                ? 'active'
                : ''
          }`}
        >
          <span className="step-circle">2</span>
          <div className="step-content">
            <strong>Notification Primitive</strong>
            <small>
              {declaration.date_notification_primitive
                ? new Date(declaration.date_notification_primitive).toLocaleDateString('fr-FR')
                : 'Délai 30 jours (CPF V-19)'}
            </small>
          </div>
        </div>
      </div>

      {/* Suivi temporel en phase primitive */}
      {isPrimitiveEnvoyee && (
        <div
          className="countdown-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: joursRestants !== null && joursRestants <= 5 ? '#fef2f2' : '#eff6ff',
            border: `1px solid ${
              joursRestants !== null && joursRestants <= 5 ? '#fca5a5' : '#bfdbfe'
            }`,
            margin: '1.25rem 0',
          }}
        >
          <div>
            <strong
              style={{
                color: joursRestants !== null && joursRestants <= 5 ? '#991b1b' : '#1e40af',
                fontSize: '1rem',
              }}
            >
              ⏳ Délai contradictoire en cours :{' '}
              {joursRestants !== null ? `${joursRestants} jour(s) restant(s)` : 'En attente'}
            </strong>
            <p style={{ margin: '0.25rem 0 0', color: '#4b5563', fontSize: '0.82rem' }}>
              Émise le :{' '}
              <strong>
                {declaration.date_notification_primitive
                  ? new Date(declaration.date_notification_primitive).toLocaleDateString('fr-FR')
                  : 'N/A'}
              </strong>{' '}
              · Date limite de réponse :{' '}
              <strong>
                {declaration.date_limite_reponse
                  ? new Date(declaration.date_limite_reponse).toLocaleDateString('fr-FR')
                  : 'N/A'}
              </strong>
              {declaration.prorogation_jours > 0 &&
                ` (dont +${declaration.prorogation_jours}j de prorogation)`}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge surveillance" style={{ fontSize: '0.78rem' }}>
              Compensation de crédits : Non applicable à ce stade
            </span>
          </div>
        </div>
      )}

      {/* Récapitulatif financier du redressement */}
      <div
        className="financial-breakdown"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          padding: '1.25rem',
          borderRadius: '10px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          margin: '1.25rem 0',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Redressement en principal</span>
          <strong
            style={{
              display: 'block',
              fontSize: '1.15rem',
              color: '#0f172a',
              marginTop: '0.2rem',
            }}
          >
            {formatAriary(principalRedressement)}
          </strong>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Amende fiscale (40 %)</span>
          <strong
            style={{
              display: 'block',
              fontSize: '1.15rem',
              color: '#b45309',
              marginTop: '0.2rem',
            }}
          >
            {formatAriary(amendeFiscale)}
          </strong>
        </div>
      </div>
    </>
  );
}
