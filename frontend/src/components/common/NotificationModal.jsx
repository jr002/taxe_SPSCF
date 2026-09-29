import { useRef } from 'react';
import { formatAriary } from '../../utils/formatters';

/**
 * Modal d'affichage et d'impression du document officiel de Notification (Primitive ou Définitive)
 * Conforme au Code Général des Impôts de Madagascar (LFI 2026) et au Code des Procédures Fiscales (Art. V-19 et suiv.)
 */
export default function NotificationModal({
  isOpen,
  onClose,
  type = 'primitive', // 'primitive' | 'definitive'
  declaration,
  redressementDetails = {},
}) {
  const printRef = useRef(null);

  if (!isOpen || !declaration) return null;

  const isPrimitive = type === 'primitive';

  const dateEmission = isPrimitive
    ? declaration.date_notification_primitive
      ? new Date(declaration.date_notification_primitive).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR')
    : declaration.date_notification_definitive
      ? new Date(declaration.date_notification_definitive).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR');

  const dateLimite = declaration.date_limite_reponse
    ? new Date(declaration.date_limite_reponse).toLocaleDateString('fr-FR')
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('fr-FR');
      })();

  const montantPrincipal = redressementDetails.principal ?? (Number(declaration.montant_redressement) || 0);
  const montantAmende = redressementDetails.amende ?? (montantPrincipal * 0.4);
  const montantPenalites = redressementDetails.penalite ?? 0;
  const totalDette = redressementDetails.total ?? (montantPrincipal + montantAmende + montantPenalites);
  const montantImpute = Number(declaration.montant_impute) || 0;
  const netAPayer = Number(declaration.montant_net_a_payer) || (totalDette - montantImpute);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Barre d'outils du document */}
        <div className="notification-modal-actions no-print">
          <span className="modal-tag">
            {isPrimitive ? 'Proposition de Rectification (CPF V-19)' : 'Décision Exécutoire (CGI 2026)'}
          </span>
          <div className="action-buttons">
            <button type="button" className="print-btn" onClick={handlePrint}>
              🖨️ Imprimer / Exporter PDF
            </button>
            <button type="button" className="close-btn" onClick={onClose}>
              ✕ Fermer
            </button>
          </div>
        </div>

        {/* Corps officiel du document fiscal */}
        <div className="notification-sheet" ref={printRef}>
          {/* En-tête officiel */}
          <div className="sheet-header">
            <div className="header-left">
              <strong>REPOBLIKAN'I MADAGASIKARA</strong>
              <small>Fitiavana - Tanindrazana - Fandrosoana</small>
              <div className="divider-mini"></div>
              <span>MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</span>
              <span>DIRECTION GÉNÉRALE DES IMPÔTS</span>
              <span>DIRECTION DES CONTRÔLES FISCAUX</span>
            </div>
            <div className="header-right">
              <p>
                <strong>Antananarivo, le :</strong> {dateEmission}
              </p>
              <p>
                <strong>Réf Dossier :</strong> DGI/DCF/2026/{declaration.annee}/N°{declaration.id_declaration}
              </p>
              <p>
                <strong>NIF :</strong> {declaration.nif || 'N/A'}
              </p>
            </div>
          </div>

          <div className="sheet-title-box">
            <h1>
              {isPrimitive
                ? 'NOTIFICATION PRIMITIVE DE REDRESSEMENT FISCAL'
                : 'NOTIFICATION DÉFINITIVE DE REDRESSEMENT FISCAL'}
            </h1>
            <p>
              {isPrimitive
                ? 'Proposition de rectification des bases d’imposition en application des articles V-19 et suivants du Code des Procédures Fiscales'
                : 'Clôture de la procédure contradictoire et liquidation exécutoire de la dette fiscale (CGI LFI 2026 - Art. 01.01.15 / 01.02.06)'}
            </p>
          </div>

          {/* Destinataire */}
          <div className="sheet-recipient">
            <strong>À l'attention du Représentant Légal de :</strong>
            <h3>{declaration.raison_sociale || 'Contribuable'}</h3>
            <p>Secteur d'activité : {declaration.secteur_activite || 'Général'}</p>
            <p>Exercice fiscal vérifié : <strong>{declaration.annee}</strong></p>
          </div>

          {/* Exposé des motifs */}
          <div className="sheet-body">
            <h4>1. EXPOSÉ DES CONSTATATIONS ET MOTIFS</h4>
            <p>
              À l'issue de l'examen de vos déclarations souscrites au titre de l'exercice <strong>{declaration.annee}</strong>, 
              le service a relevé un écart substantiel entre la taxe sur la valeur ajoutée (TVA) déclarée/payée ({formatAriary(declaration.tva_payee)}) 
              et la taxe théoriquement due en vertu des dispositions du Code Général des Impôts ({formatAriary(declaration.tva_theorique)}).
            </p>
            {declaration.observations_agent && (
              <div className="observations-box">
                <em>Observations du vérificateur :</em> {declaration.observations_agent}
              </div>
            )}

            <h4>2. DÉCOMPTE FINANCIER DU REDRESSEMENT</h4>
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Élément de taxation</th>
                  <th>Base déclarée</th>
                  <th>Base rectifiée</th>
                  <th>Montant des droits rappelés</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>TVA / Impôt principal rappelé</td>
                  <td>{formatAriary(declaration.tva_payee)}</td>
                  <td>{formatAriary(declaration.tva_theorique)}</td>
                  <td className="amount-cell">{formatAriary(montantPrincipal)}</td>
                </tr>
                <tr>
                  <td>Amende fiscale (40 % des droits en principal)</td>
                  <td>-</td>
                  <td>Taux légal 40 %</td>
                  <td className="amount-cell">{formatAriary(montantAmende)}</td>
                </tr>
                {montantPenalites > 0 && (
                  <tr>
                    <td>Pénalités et majorations de retard</td>
                    <td>-</td>
                    <td>Majoration légale</td>
                    <td className="amount-cell">{formatAriary(montantPenalites)}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td colSpan="3">
                    <strong>TOTAL GÉNÉRAL DE LA DETTE DE REDRESSEMENT</strong>
                  </td>
                  <td className="amount-cell total-cell">{formatAriary(totalDette)}</td>
                </tr>
                {!isPrimitive && (
                  <>
                    <tr className="imputation-row">
                      <td colSpan="3">
                        <span>
                          Imputation légale directe du crédit d'impôt (Art. 01.01.15 IR / Art. 01.02.06 IS) :
                        </span>
                      </td>
                      <td className="amount-cell deduction-cell">
                        - {formatAriary(montantImpute)}
                      </td>
                    </tr>
                    <tr className="net-row">
                      <td colSpan="3">
                        <strong>NET EXÉCUTOIRE RESTANT À PAYER</strong>
                      </td>
                      <td className="amount-cell net-cell">
                        <strong>{formatAriary(netAPayer)}</strong>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* Cadre légal et délais */}
            <h4>3. PROCÉDURE ET DÉLAIS LÉGAUX</h4>
            {isPrimitive ? (
              <div className="legal-notice primitive-notice">
                <p>
                  <strong>DÉLAI LÉGAL DE RÉPONSE : 30 JOURS.</strong>
                </p>
                <p>
                  Conformément aux règles de la procédure contradictoire, vous disposez d'un délai strict 
                  de <strong>30 jours</strong> à compter de la date de notification de la présente pour faire parvenir votre acceptation ou vos observations motivées.
                </p>
                <p>
                  <strong>Date limite impérative de réponse : {dateLimite}</strong>.
                </p>
                <small>
                  * Conformément aux dispositions de l'Administration Fiscale (DGI Madagascar), une demande expresse de prorogation de délai peut être accordée en cas de force majeure justifiée. Aucune compensation ou imputation de crédit d'impôt n'est applicable à ce stade.
                </small>
              </div>
            ) : (
              <div className="legal-notice definitive-notice">
                <p>
                  <strong>DÉCISION EXÉCUTOIRE ET VOIES DE RECOURS :</strong>
                </p>
                <p>
                  La présente notification définitive clôture la phase contradictoire de contrôle. Les montants arrêtés ci-dessus constituent un titre exécutoire valant liquidation définitive des droits dus au Trésor Public.
                </p>
                <p>
                  En cas de contestation, vous pouvez former un recours contentieux devant la commission fiscale compétente ou la juridiction administrative dans les délais de droit commun prévus par le Code des Procédures Fiscales.
                </p>
                <p>
                  <em>
                    Note légale : L'imputation du crédit d'impôt antérieur a été opérée de plein droit en vertu du dernier alinéa de l'article 01.01.15 (IR) et de l'article 01.02.06 (IS) du Code Général des Impôts (LFI 2026).
                  </em>
                </p>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="sheet-signatures">
            <div className="signature-box">
              <span>Le Contribuable ou son mandataire</span>
              <small>(Mention manuscrite « Reçu le ... » et signature)</small>
            </div>
            <div className="signature-box right">
              <span>Pour l'Administration Fiscale</span>
              <small>L'Inspecteur Vérificateur des Impôts</small>
              <div className="stamp-placeholder">[ Cachet de la DGI ]</div>
            </div>
          <div>Pour plus d'information contacte le 034 00 000 00</div>  
          </div>
        </div>
      </div>
    </div>
  );
}
