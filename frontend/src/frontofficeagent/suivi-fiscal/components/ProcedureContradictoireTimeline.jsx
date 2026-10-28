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
  isEclaircissementEmis,
  dateEclaircissement,
  questionsEclaircissement,
  joursRestants,
  principalRedressement,
  amendeFiscale,
  onOpenModal,
}) {
  const limiteEclaircissement = dateEclaircissement
    ? new Date(new Date(dateEclaircissement).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;
  const dateCourte = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : null);

  return (
    <>
      <div className="procedure-header">
        <div>
          <span className="procedure-tag">CGI LFI 2026 · Procédure contradictoire</span>
          <h2>Déroulé du contrôle et des notifications</h2>
          <p>Chaque étape s’ouvre à partir de la situation du dossier ; l’étape facultative peut être ignorée.</p>
        </div>
        <div className="procedure-actions">
          {isEclaircissementEmis && (
            <button
              type="button"
              className="secondary"
              onClick={() => onOpenModal('eclaircissement')}
            >
              📄 Voir Demande d'Éclaircissements
            </button>
          )}
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

      {isEclaircissementEmis && (
        <div className="procedure-eclaircissement">
          <strong>
            Demande d'Éclaircissements émise le{' '}
            {new Date(dateEclaircissement).toLocaleDateString('fr-FR')}
          </strong>
          <p>
            CPF Art. V-17 · Réponse attendue avant le{' '}
            <strong>
              {limiteEclaircissement ? limiteEclaircissement.toLocaleDateString('fr-FR') : 'N/A'}
            </strong>
            {questionsEclaircissement ? ` · ${questionsEclaircissement}` : ''}
          </p>
        </div>
      )}

      {/* Stepper des étapes légales */}
      <div className="stepper-wrap">
        <div className={`step-item ${ecart > 0 ? 'completed' : ''}`}>
          <span className="step-circle">1</span>
          <div className="step-content">
            <strong>Contrôle &amp; écart</strong>
            <small>{ecart > 0 ? `Écart ${formatAriary(ecart)}` : 'Aucun écart constaté'}</small>
          </div>
        </div>
        <div className={`step-item ${isEclaircissementEmis ? 'completed' : ''}`}>
          <span className="step-circle">2</span>
          <div className="step-content">
            <strong>Éclaircissements <em className="step-optional">facultatif</em></strong>
            <small>
              {isEclaircissementEmis
                ? `Demandés le ${dateCourte(dateEclaircissement)}`
                : 'CPF V-17 · si justifications nécessaires'}
            </small>
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
          <span className="step-circle">3</span>
          <div className="step-content">
            <strong>Notification Primitive</strong>
            <small>
              {dateCourte(declaration.date_notification_primitive)
                || (isPrimitiveEnvoyee || isDefinitiveEnvoyee
                  ? 'Émise (date non conservée)'
                  : 'Délai 30 jours (CPF V-19)')}
            </small>
          </div>
        </div>
        <div
          className={`step-item ${
            isDefinitiveEnvoyee ? 'completed' : isPrimitiveEnvoyee ? 'active' : ''
          }`}
        >
          <span className="step-circle">4</span>
          <div className="step-content">
            <strong>Notification Définitive</strong>
            <small>
              {dateCourte(declaration.date_notification_definitive) || 'Après réponse ou expiration'}
            </small>
          </div>
        </div>
      </div>

      {/* Suivi temporel en phase primitive */}
      {isPrimitiveEnvoyee && (
        <div
          className={`procedure-countdown ${
            joursRestants !== null && joursRestants <= 5 ? 'procedure-countdown-urgent' : ''
          }`}
        >
          <div>
            <strong>
              ⏳ Délai contradictoire en cours :{' '}
              {joursRestants !== null ? `${joursRestants} jour(s) restant(s)` : 'En attente'}
            </strong>
            <p>
              Émise le :{' '}
              <strong>{dateCourte(declaration.date_notification_primitive) || 'N/A'}</strong>{' '}
              · Date limite de réponse :{' '}
              <strong>{dateCourte(declaration.date_limite_reponse) || 'N/A'}</strong>
              {declaration.prorogation_jours > 0 &&
                ` (dont +${declaration.prorogation_jours}j de prorogation)`}
            </p>
          </div>
        </div>
      )}

      {/* Récapitulatif financier du redressement */}
      {principalRedressement > 0 && (
        <>
          <div className="procedure-breakdown">
            <div>
              <span>Redressement en principal</span>
              <strong>{formatAriary(principalRedressement)}</strong>
            </div>
            <div className="procedure-breakdown-amende">
              <span>Amende fiscale (40 %)</span>
              <strong>{formatAriary(amendeFiscale)}</strong>
            </div>
          </div>
          <p className="procedure-note">
            Estimation indicative : l’amende de 40 % n’est exigible qu’après l’émission de la
            notification définitive.
          </p>
        </>
      )}
    </>
  );
}
