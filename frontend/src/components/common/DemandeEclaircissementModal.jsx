import { dateOuNull, formatAriary, montantOuNull, ouAbsent, VALEUR_ABSENTE } from '@/utils';
import { useModalA11y } from '@/hooks';
import RefLegal from '@/components/common/RefLegal';
import { REFERENCES } from '@/data/textesFiscaux.data';

/**
 * Modal d'affichage et d'impression de la Demande d'Éclaircissements et de
 * Justifications : premier acte contradictoire, en amont de la Notification
 * Primitive. Il s'agit de l'article V-02 du Code des procédures fiscales, sous la
 * Section II « Demande d'éclaircissements et de justifications » (p. 87 de
 * l'édition consolidée 2025). La mention « art. V-17 » portée ici jusqu'en 2026 ne
 * désigne pas cet acte : V-17 (p. 90) étend la procédure de rectification
 * contradictoire des articles V-03 à V-07 à la vérification sur place.
 *
 * Deux valeurs de l'acte ne se lisent pas telles quelles dans le texte :
 *
 * - le délai. L'article V-02 assigne « un délai franc de 15 jours » ; l'acte en
 *   accorde 30, ce qui est plus favorable, et ce sont les 30 jours calculés sur la
 *   date d'émission enregistrée. Le document le dit au lieu de laisser croire que
 *   les 30 jours viennent de l'article ;
 * - la suite d'un silence. Ce n'est pas V-02 mais l'article V-38 (p. 93) qui taxe
 *   d'office le contribuable resté sans réponse, ou ayant répondu hors délai.
 *
 * Comme pour les notifications, le document ne porte que des valeurs enregistrées
 * au dossier. Une TVA absente n'y devient pas « 0 Ar », une date d'émission
 * absente n'est pas la date du jour, et le délai de réponse est annoncé comme
 * calculé — la colonne n'existe pas pour une demande d'éclaircissements.
 */
const ACTES = [REFERENCES.eclaircissements, REFERENCES.sanction_eclaircissements];

export default function DemandeEclaircissementModal({
  isOpen,
  onClose,
  declaration,
  questions,
  dateEmission,
  delaiJours = 30,
}) {
  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen || !declaration) return null;

  const emissionDate = dateOuNull(dateEmission);
  // Le délai de réponse à une demande d'éclaircissements n'est stocké dans aucune
  // colonne : il se déduit de la date d'émission enregistrée et des 30 jours
  // accordés par l'acte (l'article V-02 en fixe 15, voir la remarque en tête du
  // fichier). Sans date d'émission, il n'est pas calculable.
  const emissionBrute = dateEmission ? new Date(dateEmission) : null;
  const limite =
    emissionBrute && !Number.isNaN(emissionBrute.getTime())
      ? new Date(emissionBrute.getTime() + delaiJours * 24 * 60 * 60 * 1000)
      : null;
  const tvaPayee = montantOuNull(declaration.tva_payee);
  const tvaTheorique = montantOuNull(declaration.tva_theorique);
  const contacts = [declaration.centre_telephone, declaration.centre_email].filter(Boolean);

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div
        className="notification-modal-card"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Demande d'Éclaircissements et de Justifications"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Barre d'outils du document */}
        <div className="notification-modal-actions no-print">
          <div className="modal-tag-group">
            <span className="modal-tag">
              Demande d’Éclaircissements et de Justifications (code des procédures fiscales, art. V-02)
            </span>
            {ACTES.map((source) => (
              <RefLegal key={`${source.texte}-${source.article}`} source={source} className="modal-tag-ref" />
            ))}
          </div>
          <div className="action-buttons">
            <button type="button" className="print-btn" onClick={() => window.print()}>
              🖨️ Imprimer / Exporter PDF
            </button>
            <button type="button" className="close-btn" onClick={onClose}>
              ✕ Fermer
            </button>
          </div>
        </div>

        {/* Corps officiel du document fiscal */}
        <div className="notification-sheet">
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
                <strong>Antananarivo, le :</strong>{' '}
                {emissionDate || 'Date d’émission non enregistrée au dossier'}
              </p>
              <p>
                <strong>Réf. dossier :</strong> Contribuable n° {declaration.id_contribuable ?? 'non rattaché'} ·
                Déclaration n° {declaration.id_declaration ?? 'non enregistrée'} · Exercice{' '}
                {declaration.annee ?? 'non renseigné au dossier'}
              </p>
              <p>
                <strong>NIF :</strong> {ouAbsent(declaration.nif)}
              </p>
            </div>
          </div>

          <div className="sheet-title-box">
            <h1>DEMANDE D'ÉCLAIRCISSEMENTS ET DE JUSTIFICATIONS</h1>
            <p>
              Invitation à fournir les éclaircissements et les pièces justificatives prévus à l’article V-02 du Code
              des procédures fiscales (Section II — Demande d’éclaircissements et de justifications), avant toute
              proposition de rectification.
            </p>
          </div>

          <div className="sheet-recipient">
            <strong>À l'attention du Représentant Légal de :</strong>
            <h3>{ouAbsent(declaration.raison_sociale)}</h3>
            <p>Secteur d'activité : {ouAbsent(declaration.secteur_activite)}</p>
            <p>
              Exercice fiscal examiné : <strong>{declaration.annee || VALEUR_ABSENTE}</strong>
            </p>
            {declaration.centre_nom && <p>Centre gestionnaire : {declaration.centre_nom}</p>}
          </div>

          <div className="sheet-body">
            <h4>1. CONTEXTE</h4>
            <p>
              Dans le cadre du contrôle sur pièces de vos déclarations au titre de l’exercice{' '}
              <strong>{declaration.annee || VALEUR_ABSENTE}</strong> (articles V-01 et V-02 du Code des procédures
              fiscales), le service a relevé des éléments appelant votre attention :{' '}
              {tvaPayee === null || tvaTheorique === null
                ? 'le dossier ne porte pas les deux termes de la comparaison (TVA payée et TVA théorique), et aucun écart chiffré ne peut être reporté sur la présente.'
                : `la taxe sur la valeur ajoutée déclarée et payée s’y élève à ${formatAriary(tvaPayee)} pour une taxe théoriquement due de ${formatAriary(tvaTheorique)}.`}
            </p>
            <p>
              Aucun montant de droit, d'amende, de pénalité ou d'intérêt n'est arrêté à ce stade : la demande
              d'éclaircissements ne liquide rien et ne préjuge d'aucune imposition supplémentaire. Elle a pour seul
              objet de recueillir votre position motivée et les justifications correspondantes avant l'engagement
              éventuel de la procédure de rectification.
            </p>

            <h4>2. POINTS APPELANT VOS ÉCLAIRCISSEMENTS</h4>
            <div className="observations-box" style={{ whiteSpace: 'pre-line' }}>
              {questions || "Aucun point particulier n'a été précisé par le vérificateur."}
            </div>

            <h4>3. PROCÉDURE ET DÉLAI DE RÉPONSE</h4>
            <div className="legal-notice primitive-notice">
              <p>
                <strong>DÉLAI DE RÉPONSE : {delaiJours} JOURS.</strong>
              </p>
              <p>
                Vous êtes invité à faire parvenir vos éclaircissements et pièces justificatives au service des impôts
                dont vous dépendez dans un délai de <strong>{delaiJours} jours</strong> à compter de la réception de
                la présente.
              </p>
              <p>
                <strong>Date limite impérative de réponse : </strong>
                {limite
                  ? `${limite.toLocaleDateString('fr-FR')} (date calculée à partir de la date d’émission enregistrée)`
                  : 'non calculable — aucune date d’émission n’est enregistrée au dossier'}
                .
              </p>
              <p>
                Remarque : l’article V-02 du Code des procédures fiscales assigne au contribuable, pour répondre à une
                demande écrite, <strong>un délai franc de 15 jours</strong>. Le délai porté sur le présent acte est
                plus long ; c’est lui qui figure au dossier et c’est lui qui vous est accordé.
              </p>
              <small>
                * À défaut de réponse, ou si la réponse parvient après la date limite, l’article V-38 du même code
                expose le contribuable à une imposition d’office, établie après procès-verbal et notification des
                bases, dans les conditions des articles V-42 et suivants. La présente demande ne liquide aucun droit
                et ne préjuge pas de cette suite.
              </small>
            </div>
          </div>

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
