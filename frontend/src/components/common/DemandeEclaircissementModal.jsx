import { formatAriary } from '../../utils/formatters';
import { useModalA11y } from '../../hooks/useModalA11y';

/**
 * Modal d'affichage et d'impression de la Demande d'Éclaircissements et de
 * Justifications (Code des Procédures Fiscales, Art. V-17) : premier acte
 * contradictoire, en amont de la Notification Primitive.
 */
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

  const emissionDate = dateEmission ? new Date(dateEmission) : null;
  const limite = emissionDate
    ? new Date(emissionDate.getTime() + delaiJours * 24 * 60 * 60 * 1000)
    : null;

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
          <span className="modal-tag">Demande d'Éclaircissements et de Justifications (CPF V-17)</span>
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
                {emissionDate ? emissionDate.toLocaleDateString('fr-FR') : '—'}
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
            <h1>DEMANDE D'ÉCLAIRCISSEMENTS ET DE JUSTIFICATIONS</h1>
            <p>
              Invitation à fournir les éclaircissements et les pièces justificatives prévus aux articles V-17 et
              suivants du Code des Procédures Fiscales, avant toute proposition de rectification.
            </p>
          </div>

          <div className="sheet-recipient">
            <strong>À l'attention du Représentant Légal de :</strong>
            <h3>{declaration.raison_sociale || 'Contribuable'}</h3>
            <p>Secteur d'activité : {declaration.secteur_activite || 'Général'}</p>
            <p>
              Exercice fiscal examiné : <strong>{declaration.annee}</strong>
            </p>
          </div>

          <div className="sheet-body">
            <h4>1. CONTEXTE</h4>
            <p>
              Dans le cadre de l'examen de la situation fiscale d'ensemble au titre de l'exercice{' '}
              <strong>{declaration.annee}</strong>, le service a relevé des éléments appelant votre attention : la
              taxe sur la valeur ajoutée déclarée et payée s'élève à {formatAriary(declaration.tva_payee)} pour une
              taxe théoriquement due de {formatAriary(declaration.tva_theorique)}.
            </p>
            <p>
              La présente demande ne préjuge d'aucune imposition supplémentaire. Elle a pour seul objet de recueillir
              votre position motivée et les justifications correspondantes avant l'engagement éventuel de la
              procédure de rectification.
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
                <strong>
                  Date limite impérative de réponse :{' '}
                  {limite ? limite.toLocaleDateString('fr-FR') : '—'}
                </strong>
                .
              </p>
              <small>
                * À défaut de réponse dans ce délai, l'administration fiscale pourra arrêter d'office les bases
                d'imposition et engager la procédure contradictoire de redressement par notification primitive.
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
        </div>
      </div>
    </div>
  );
}
