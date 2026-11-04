import { formatAriary } from '@/utils';
import RefLegal from '@/components/common/RefLegal';
import { REFERENCES } from '@/data/textesFiscaux.data';

/**
 * Visualisation de la timeline de la procédure contradictoire,
 * du compte à rebours légal des 30 jours et de la décomposition financière.
 *
 * Les actes sont ceux du Code des procédures fiscales, dans l'ordre de son titre V
 * : l'éclaircissement est l'article V-02 (Section II), la proposition de
 * rectification et la notification primitive les articles V-03 et V-04, la
 * notification définitive l'article V-07. Les mentions « V-17 » et « V-19 » portées
 * jusqu'ici désignent d'autres dispositifs (le premier étend la procédure
 * contradictoire à la vérification sur place, le second règle les contrôles sur les
 * prix de transfert). Les puces de référence ouvrent le PDF de l'éditeur à la page
 * imprimée ; celle de l'amende de 40 % prévient que le taux n'est pas liquidé par
 * l'application.
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
  principalEnregistre,
  amendeFiscale,
  onOpenModal,
}) {
  const dateCourte = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : null);
  // Le délai de réponse à une demande d'éclaircissements (30 jours accordés par
  // l'acte, alors que l'article V-02 fixe un délai franc de 15 jours) court depuis
  // la date d'émission de la relance : il n'est stocké dans aucune colonne.
  const limiteEclaircissement = dateEclaircissement
    ? new Date(new Date(dateEclaircissement).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;

  return (
    <>
      <div className="procedure-header">
        <div>
          <span className="procedure-tag">
            Code des procédures fiscales · Procédure contradictoire
          </span>
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
            {dateCourte(dateEclaircissement) || 'date non enregistrée'}
          </strong>
          <p>
            Art. V-02 · Réponse attendue avant le{' '}
            <strong>
              {limiteEclaircissement
                ? `${limiteEclaircissement.toLocaleDateString('fr-FR')} (30 jours calculés depuis l’émission)`
                : 'Date d’émission inconnue : délai non calculable'}
            </strong>
            {questionsEclaircissement ? ` · ${questionsEclaircissement}` : ''}
          </p>
          <RefLegal source={REFERENCES.eclaircissements} detail />
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
                : 'Art. V-02 · si justifications nécessaires'}
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
                  : 'Délai 30 jours (art. V-04)')}
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
              {dateCourte(declaration.date_notification_definitive) || 'Art. V-07 — après réponse ou expiration'}
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
              <strong>{dateCourte(declaration.date_notification_primitive) || 'non enregistrée'}</strong>{' '}
              · Date limite de réponse :{' '}
              <strong>{dateCourte(declaration.date_limite_reponse) || 'non enregistrée'}</strong>
              {declaration.prorogation_jours > 0 &&
                ` (dont +${declaration.prorogation_jours}j de prorogation)`}
            </p>
            <div className="procedure-tags">
              <RefLegal source={REFERENCES.notification_primitive} compact />
              {declaration.prorogation_jours > 0 && (
                <RefLegal source={REFERENCES.prorogation} compact detail />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Récapitulatif financier du redressement */}
      {principalRedressement > 0 && (
        <>
          <div className="procedure-breakdown">
            <div>
              <span>
                {principalEnregistre
                  ? 'Principal enregistré au dossier'
                  : 'Principal proposé (écart de TVA)'}
              </span>
              <strong>{formatAriary(principalRedressement)}</strong>
            </div>
            <div className="procedure-breakdown-amende">
              <span>Amende de 40 % — estimation</span>
              <strong>{formatAriary(amendeFiscale)}</strong>
            </div>
          </div>
          <p className="procedure-note">
            {principalEnregistre
              ? 'Le principal ci-dessus est la valeur enregistrée dans le dossier.'
              : 'Ce principal est une proposition calculée sur l’écart : il n’est pas encore enregistré comme montant de redressement.'}
            {' '}L’amende n’est calculée par aucun service et n’existe dans aucune colonne de la base
            : le chiffre de 40 % n’est qu’une indication de ce qui pourra être liquidé. Les courriers
            imprimés portent « Non liquidé au dossier » tant qu’aucun montant n’est enregistré.
          </p>
          <RefLegal source={REFERENCES.amende_40} detail />
        </>
      )}
    </>
  );
}
