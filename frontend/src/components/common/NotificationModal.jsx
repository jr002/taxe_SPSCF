import { useRef } from 'react';
import RefLegal from '@/components/common/RefLegal';
import { REFERENCES } from '@/data/textesFiscaux.data';
import { dateOuNull, formatAriary, MONTANT_ABSENT, montantOuNull, ouAbsent, VALEUR_ABSENTE } from '@/utils';
import { useModalA11y } from '@/hooks';

const DATE_ABSENTE = 'Date non enregistrée au dossier';

/**
 * Les articles qui organisent chaque acte, tels qu'ils ont été relus dans les
 * textes officiels (1er novembre 2026). La barre d'outils — jamais le document
 * imprimé — en donne le lien : l'agent peut ouvrir le PDF de la DGI pendant
 * qu'il relit l'acte.
 */
const ACTES = {
  primitive: [REFERENCES.proposition_rectification, REFERENCES.notification_primitive],
  definitive: [REFERENCES.notification_definitive, REFERENCES.amende_40, REFERENCES.imputation_credit],
};

/**
 * Modal d'affichage et d'impression du document officiel de Notification
 * (Primitive ou Définitive).
 *
 * Règle de fidélité : le document ne porte **que des valeurs enregistrées au
 * dossier**. Les amendes, pénalités et intérêts ne sont pas liquidés par le
 * système — aucune colonne ne les stocke — et ils ne sont donc pas calculés ici
 * non plus : la ligne correspondante affiche « Non liquidé au dossier » et entre
 * au total. Une date d'émission manquante n'est pas remplacée par la date du
 * jour, un contact manquant n'est pas inventé, et une simulation n'est pas
 * présentée comme un acte notifié.
 *
 * Les références d'articles citées sur l'acte sont celles du code des procédures
 * fiscales et du code des impôts, éditions consolidées 2025 : la primitive est
 * régie par les articles V-03 et V-04, la définitive par l'article V-07, et
 * l'imputation du crédit par les articles 01.01.15 et 01.02.06 du code des
 * impôts. Les mentions « V-19 » et « CGI LFI 2026 » qui figuraient ici
 * précédemment ne correspondent à aucun de ces articles.
 *
 * Deux exceptions contrôlées :
 *  - `estimations` : le simulateur de collecte peut transmettre ses calculs. Ils
 *    ne sortent jamais d'un document d'acte — seulement d'une simulation, avec un
 *    libellé qui dit l'origine et le caractère non enregistré du chiffre.
 *  - `simulation` : le bandeau et l'étiquette du document disent que l'acte n'a
 *    pas été émis.
 */
export default function NotificationModal({
  isOpen,
  onClose,
  type = 'primitive', // 'primitive' | 'definitive'
  declaration,
  simulation = false,
  estimations = null,
}) {
  const printRef = useRef(null);
  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen || !declaration) return null;

  const isPrimitive = type === 'primitive';

  const dateEmission = dateOuNull(
    isPrimitive ? declaration.date_notification_primitive : declaration.date_notification_definitive,
  );
  const dateLimite = dateOuNull(declaration.date_limite_reponse);

  const principal = montantOuNull(declaration.montant_redressement);
  const credit = montantOuNull(declaration.credit_impot);
  const impute = montantOuNull(declaration.montant_impute);
  const net = montantOuNull(declaration.montant_net_a_payer);
  const tvaPayee = montantOuNull(declaration.tva_payee);
  const tvaTheorique = montantOuNull(declaration.tva_theorique);

  // Le total porté au document ne peut additionner que des montants enregistrés.
  const totalEnregistre = principal;

  // Estimations du simulateur : jamais un montant enregistré, jamais un acte.
  const estimationAmende = simulation ? montantOuNull(estimations?.amende) : null;
  const estimationPenalites = simulation ? montantOuNull(estimations?.penalites) : null;
  const estimationTotal = simulation ? montantOuNull(estimations?.total) : null;
  const totalAffiche = estimationTotal ?? totalEnregistre;

  const contacts = [declaration.centre_telephone, declaration.centre_email].filter(Boolean);

  let constat;
  if (tvaTheorique === null || tvaPayee === null) {
    constat =
      'Le dossier ne porte pas encore les deux termes de la comparaison (TVA payée et TVA théorique) : ' +
      'aucun écart chiffré ne peut être reporté sur le présent document.';
  } else if (tvaTheorique - tvaPayee <= 0) {
    constat =
      `La TVA enregistrée comme payée (${formatAriary(tvaPayee)}) couvre la TVA attendue (${formatAriary(
        tvaTheorique,
      )}) : le dossier ne fait apparaître aucun rappel de droits en positif.`;
  } else {
    constat =
      `À l'issue de l'examen de vos déclarations souscrites au titre de l'exercice ${declaration.annee}, ` +
      `le service a relevé un écart entre la taxe sur la valeur ajoutée déclarée/payée (${formatAriary(tvaPayee)}) ` +
      `et la taxe théoriquement due (${formatAriary(tvaTheorique)}), soit ${formatAriary(tvaTheorique - tvaPayee)}.`;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div
        className="notification-modal-card"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          simulation
            ? 'Notification en simulation — document non adressé'
            : isPrimitive
              ? 'Notification Primitive'
              : 'Notification Définitive'
        }
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre d'outils du document */}
        <div className="notification-modal-actions no-print">
          <div className="modal-tag-group">
            <span className="modal-tag">
              {simulation
                ? 'Simulation — document non adressé, sans valeur d’acte'
                : isPrimitive
                  ? 'Proposition de rectification (code des procédures fiscales, art. V-03 et V-04)'
                  : 'Décision exécutoire (art. V-07 ; code des impôts, art. 20.01.54)'}
            </span>
            {!simulation &&
              ACTES[isPrimitive ? 'primitive' : 'definitive'].map((source) => (
                <RefLegal
                  key={`${source.texte}-${source.article}`}
                  source={source}
                  className="modal-tag-ref"
                />
              ))}
          </div>
          <div className="action-buttons">
            <button type="button" className="print-btn" onClick={handlePrint}>
              🖨️ Imprimer / Exporter PDF
            </button>
            <button type="button" className="close-btn" onClick={onClose}>
              ✕ Fermer
            </button>
          </div>
        </div>

        {!dateEmission && !simulation && (
          <p className="form-submit-message warning" role="status" style={{ margin: '0' }}>
            ⚠️ Aucune date d’émission n’est enregistrée au dossier : ce document n’est pas encore un acte
            notifié. La date doit rester manuscrite jusqu’à l’émission.
          </p>
        )}

        {/* Corps officiel du document fiscal */}
        <div className="notification-sheet" ref={printRef}>
          {simulation && (
            <p className="notification-simulation" role="alert">
              DOCUMENT DE SIMULATION — non adressé au contribuable, non signé, sans valeur d’acte. Les montants
              ci-dessous sont calculés par l’application à partir des saisies de l’agent et ne sont enregistrés
              dans aucun dossier.
            </p>
          )}

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
                <strong>Antananarivo, le :</strong> {dateEmission || DATE_ABSENTE}
              </p>
              <p>
                <strong>Réf. dossier :</strong>{' '}
                {declaration.id_contribuable
                  ? `Contribuable n° ${declaration.id_contribuable}`
                  : 'Contribuable non rattaché'}
                {declaration.id_declaration ? ` · Déclaration n° ${declaration.id_declaration}` : ''}
                {declaration.annee ? ` · Exercice ${declaration.annee}` : ''}
              </p>
              <p>
                <strong>NIF :</strong> {ouAbsent(declaration.nif)}
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
                ? 'Proposition de rectification des bases d’imposition en application des articles V-03 et V-04 du Code des Procédures Fiscales (édition consolidée 2025)'
                : 'Clôture de la procédure contradictoire en application de l’article V-07 du Code des Procédures Fiscales (édition consolidée 2025) et liquidation de la dette fiscale'}
            </p>
          </div>

          {/* Destinataire */}
          <div className="sheet-recipient">
            <strong>À l'attention du Représentant Légal de :</strong>
            <h3>{ouAbsent(declaration.raison_sociale)}</h3>
            <p>Secteur d'activité : {ouAbsent(declaration.secteur_activite)}</p>
            <p>
              Exercice fiscal vérifié : <strong>{declaration.annee || VALEUR_ABSENTE}</strong>
            </p>
            {declaration.centre_nom && <p>Centre gestionnaire : {declaration.centre_nom}</p>}
          </div>

          {/* Exposé des motifs */}
          <div className="sheet-body">
            <h4>1. EXPOSÉ DES CONSTATATIONS ET MOTIFS</h4>
            <p>{constat}</p>
            {declaration.observations_agent ? (
              <div className="observations-box">
                <em>Observations du vérificateur :</em> {declaration.observations_agent}
              </div>
            ) : (
              <p className="notification-absent">
                Aucune observation n’est enregistrée au dossier pour cet exercice.
              </p>
            )}

            <h4>2. DÉCOMPTE FINANCIER DU REDRESSEMENT</h4>
            <table aria-label="Document de notification" className="sheet-table">
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
                  <td>{tvaPayee === null ? MONTANT_ABSENT : formatAriary(tvaPayee)}</td>
                  <td>{tvaTheorique === null ? MONTANT_ABSENT : formatAriary(tvaTheorique)}</td>
                  <td className="amount-cell">
                    {principal === null ? MONTANT_ABSENT : formatAriary(principal)}
                  </td>
                </tr>
                <tr>
                  <td>
                    Amendes, pénalités et intérêts de retard
                    {estimationAmende !== null || estimationPenalites !== null ? (
                      <small className="amount-source"> (estimation du simulateur)</small>
                    ) : null}
                  </td>
                  <td>-</td>
                  <td>
                    {estimationAmende !== null || estimationPenalites !== null
                      ? 'Calcul hors dossier'
                      : 'Non liquidés par le système'}
                  </td>
                  <td className="amount-cell">
                    {estimationAmende !== null || estimationPenalites !== null
                      ? formatAriary((estimationAmende ?? 0) + (estimationPenalites ?? 0))
                      : MONTANT_ABSENT}
                  </td>
                </tr>
                <tr className="total-row">
                  <td colSpan="3">
                    <strong>
                      {estimationTotal !== null
                        ? 'TOTAL ESTIMÉ PAR LE SIMULATEUR'
                        : 'TOTAL ENREGISTRÉ AU DOSSIER'}
                    </strong>
                  </td>
                  <td className="amount-cell total-cell">
                    {totalAffiche === null ? MONTANT_ABSENT : formatAriary(totalAffiche)}
                  </td>
                </tr>
                {!isPrimitive && (
                  <>
                    <tr className="imputation-row">
                      <td colSpan="3">
                        <span>
                          Imputation du crédit d'impôt (code des impôts, art. 01.01.15 IR / 01.02.06 IS) :
                        </span>
                      </td>
                      <td className="amount-cell deduction-cell">
                        {impute === null
                          ? 'Aucune imputation enregistrée'
                          : `- ${formatAriary(impute)}${credit === null ? '' : ` (crédit porté au dossier : ${formatAriary(credit)})`}`}
                      </td>
                    </tr>
                    <tr className="net-row">
                      <td colSpan="3">
                        <strong>
                          {estimationTotal !== null
                            ? 'NET ESTIMÉ PAR LE SIMULATEUR'
                            : 'NET EXÉCUTOIRE RESTANT À PAYER'}
                        </strong>
                      </td>
                      <td className="amount-cell net-cell">
                        <strong>
                          {net !== null
                            ? formatAriary(net)
                            : estimationTotal !== null
                              ? formatAriary(Math.max(0, estimationTotal - (impute ?? 0)))
                              : MONTANT_ABSENT}
                        </strong>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            <p className="notification-absent">
              {estimationTotal !== null
                ? 'Les amendes, pénalités et le total ci-dessus sont des estimations produites par le simulateur de collecte à partir des saisies de l’agent. Ils ne sont enregistrés dans aucun dossier et n’ont pas la valeur d’un acte notifié.'
                : 'Le total ci-dessus n’additionne que les montants enregistrés au dossier. Les amendes et pénalités de retard prévues par le code des impôts (art. 20.01.53 et 20.01.54) sont liquidées par l’administration dans l’acte imprimé hors application ; leur taux et leur montant ne sont pas calculés par ce document.'}
            </p>

            {/* Cadre légal et délais */}
            <h4>3. PROCÉDURE ET DÉLAIS LÉGAUX</h4>
            {isPrimitive ? (
              <div className="legal-notice primitive-notice">
                <p>
                  <strong>DÉLAI DE RÉPONSE : 30 JOURS.</strong>
                </p>
                <p>
                  En application de l’article V-04 du Code des Procédures Fiscales, vous disposez d'un délai de{' '}
                  <strong>30 jours</strong> à compter de la date de notification de la présente pour faire
                  parvenir votre acceptation ou vos observations motivées.
                </p>
                <p>
                  <strong>Date limite impérative de réponse :</strong>{' '}
                  {dateLimite || 'non fixée au dossier à ce jour'}.
                </p>
                <small>
                  * Un délai supplémentaire peut être demandé à titre gracieux avant l'expiration du délai initial
                  (articles VI-04 et VI-05 du Code des Procédures Fiscales) ; l'autorité décisionnaire peut
                  accorder un nouveau délai qui n'excède pas quinze jours. Aucune imputation de crédit d'impôt
                  n'est applicable à ce stade : la présente reste une proposition.
                </small>
              </div>
            ) : (
              <div className="legal-notice definitive-notice">
                <p>
                  <strong>DÉCISION ET VOIES DE RECOURS :</strong>
                </p>
                <p>
                  La présente notification définitive, établie en application de l'article V-07 du Code des
                  Procédures Fiscales, clôture la phase contradictoire de contrôle. Les montants arrêtés
                  ci-dessus constituent un titre exécutoire valant liquidation des droits dus au Trésor Public.
                </p>
                <p>
                  En cas de contestation, vous pouvez former un recours contentieux devant la commission fiscale
                  compétente ou la juridiction administrative dans les délais de droit commun prévus par le Code
                  des Procédures Fiscales.
                </p>
                <p>
                  <em>
                    Note légale : le crédit d'impôt né d'un trop-perçu peut être imputé sur la dette née de la
                    présente notification, en application de l'article 01.01.15 (IR) et de l'article 01.02.06 (IS)
                    du Code des impôts (édition consolidée 2025), dans la limite des montants enregistrés au
                    dossier.
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
          </div>

          <p className="notification-contact">
            {contacts.length
              ? `Pour plus d'information : ${declaration.centre_nom ? `${declaration.centre_nom} — ` : ''}${contacts.join(' · ')}`
              : `Pour plus d'information, adressez-vous au centre gestionnaire${
                  declaration.centre_nom ? ` : ${declaration.centre_nom}` : '.'
                }`}
          </p>
        </div>
      </div>
    </div>
  );
}
