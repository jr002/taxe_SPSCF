import { useModalA11y } from '../../../hooks/useModalA11y';
import { relanceType } from '../../../utils/relance.utils';

/**
 * RappelOrdreModal
 * Modale de prévisualisation et d'impression de la lettre officielle de rappel à l'ordre / mise en demeure DGI.
 * Inclut : en-tête républicain, décompte fiscal (principal + pénalités + intérêts), délai de régularisation.
 *
 * Props :
 *  - isOpen {boolean}
 *  - onClose {function}
 *  - dossier {object}  — le dossier de retard / non en règle, avec `dateEmission` optionnelle
 *  - type {string}     — clé `type_relance` de la base : 'rappel1' | 'rappel2' | 'mise_en_demeure'
 */
export default function RappelOrdreModal({ isOpen, onClose, dossier, type }) {
  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen || !dossier) return null;

  // Une relance relue depuis la base doit porter sa date d'émission, pas la date du jour.
  const emission = dossier.dateEmission ? new Date(dossier.dateEmission) : new Date();
  const dateFr = emission.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const dateRef = `${String(emission.getMonth() + 1).padStart(2, '0')}/${emission.getFullYear()}`;

  const fmt = (v) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(v) || 0);

  const principal = Number(dossier.montantDu) || 0;
  const penalite = Math.round(principal * 0.1);   // 10 % de pénalité de retard
  const interet = Math.round(principal * 0.01 * Math.max(1, dossier.joursRetard || 1) / 30); // 1 %/mois
  const totalDu = principal + penalite + interet;

  const config = relanceType(type);

  const handlePrint = () => window.print();

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="rappel-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="rappel-modal-container"
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rappel-modal-title"
      >
        {/* Actions no-print */}
        <div className="rappel-modal-actions no-print">
          <span className="rappel-modal-type-badge" style={{ background: config.couleur }}>
            {config.titre}
          </span>
          <div className="rappel-modal-btns">
            <button
              id="btn-print-rappel"
              type="button"
              className="primary"
              onClick={handlePrint}
            >
              🖨 Imprimer / PDF
            </button>
            <button
              id="btn-close-rappel"
              type="button"
              className="rappel-modal-close"
              onClick={onClose}
            >
              ✕ Fermer
            </button>
          </div>
        </div>

        {/* Document imprimable */}
        <div className="notification-sheet rappel-sheet">
          {/* En-tête républicain officiel */}
          <div className="rappel-header">
            <div className="rappel-header-left">
              <div className="rappel-logo-placeholder">🏛</div>
              <div>
                <p className="rappel-repub">REPOBLIKAN'I MADAGASIKARA</p>
                <p className="rappel-devise">Fitiavana — Tanindrazana — Fandrosoana</p>
                <p className="rappel-ministere">MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</p>
                <p className="rappel-dgi">Direction Générale des Impôts (DGI)</p>
              </div>
            </div>
            <div className="rappel-header-right">
              <p><strong>Réf. :</strong> DGI/{config.ref}/{dateRef}/{dossier.nif}</p>
              <p><strong>Antananarivo, le :</strong> {dateFr}</p>
            </div>
          </div>

          <hr className="rappel-sep" />

          {/* Objet */}
          <div className="rappel-objet-box">
            <p className="rappel-objet-label">OBJET :</p>
            <p className="rappel-objet-text" id="rappel-modal-title">
              <strong style={{ color: config.couleur }}>{config.titre}</strong> — Régularisation des obligations fiscales en souffrance — TVA / Année {dossier.annee}
            </p>
          </div>

          {/* Destinataire */}
          <div className="rappel-destinataire">
            <p><strong>À l'attention de :</strong></p>
            <p className="rappel-societe">{dossier.raisonSociale || dossier.raison_sociale}</p>
            <p>NIF : <strong>{dossier.nif}</strong></p>
            <p>Secteur : {dossier.secteur || dossier.secteur_activite || '—'}</p>
          </div>

          {/* Corps */}
          <div className="rappel-corps">
            <p>Madame, Monsieur,</p>

            <p>
              Nous avons l'honneur de vous informer qu'au titre de l'exercice fiscal <strong>{dossier.annee}</strong>,
              votre dossier fiscal accuse un arriéré de paiement enregistré au <strong>{dateFr}</strong>.
              Malgré les délais légaux impartis, le règlement de votre dette fiscale n'a pas encore été effectué.
            </p>

            <p>
              En application des dispositions du <strong>Code Général des Impôts (CGI)</strong> et du
              <strong> Livre des Procédures Fiscales (LPF)</strong>, nous vous mettons en demeure de
              régulariser votre situation dans un délai de <strong>{config.delai}</strong> à compter de
              la réception de la présente.
            </p>

            {/* Décompte fiscal */}
            <table className="rappel-table">
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th>Montant (Ar)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Principal TVA dû — Année {dossier.annee}</td>
                  <td className="rappel-td-right">{fmt(principal)} Ar</td>
                </tr>
                <tr>
                  <td>Pénalité de retard (10 %)</td>
                  <td className="rappel-td-right">{fmt(penalite)} Ar</td>
                </tr>
                <tr>
                  <td>Intérêts moratoires (1 %/mois — {dossier.joursRetard || 0} jours)</td>
                  <td className="rappel-td-right">{fmt(interet)} Ar</td>
                </tr>
                <tr className="rappel-total-row">
                  <td><strong>TOTAL À RÉGLER</strong></td>
                  <td className="rappel-td-right"><strong>{fmt(totalDu)} Ar</strong></td>
                </tr>
              </tbody>
            </table>

            <p>
              À défaut de régularisation dans le délai imparti, la Direction Générale des Impôts
              procédera au recouvrement forcé de la créance fiscale par voies de droit, conformément
              aux dispositions législatives en vigueur, sans qu'il soit besoin d'un nouveau préavis.
            </p>

            <p>
              Nous vous invitons à vous rapprocher de votre Centre Fiscal de rattachement pour tout
              arrangement ou question concernant le présent dossier.
            </p>

            <p>Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.</p>
          </div>

          {/* Signature */}
          <div className="rappel-signature">
            <div className="rappel-sig-block">
              <p>Pour le Directeur Général des Impôts</p>
              <p>L'Agent en charge du dossier,</p>
              <div className="rappel-sig-space" />
              <p>________________________</p>
              <p className="rappel-sig-label">Signature & Cachet DGI</p>
            </div>
          </div>

          {/* Pied de page officiel */}
          <div className="rappel-footer">
            <p>Direction Générale des Impôts — Ministère des Finances — Antananarivo, Madagascar</p>
            <p>Référence : {`DGI/${config.ref}/${dateRef}/${dossier.nif}`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
