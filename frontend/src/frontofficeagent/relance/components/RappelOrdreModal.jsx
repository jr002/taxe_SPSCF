import { useModalA11y } from '@/hooks';
import { relanceType } from '@/frontofficeagent/relance/utils/relance.utils';
import { dateOuNull, formatAriary, MONTANT_ABSENT, montantOuNull, ouAbsent } from '@/utils';
import RefLegal from '@/components/common/RefLegal';
import { REFERENCES } from '@/data/textesFiscaux.data';

/**
 * RappelOrdreModal
 * Modale de prévisualisation et d'impression de la lettre officielle de rappel à l'ordre / mise en demeure DGI.
 *
 * Fidélité du document : la lettre reporte le montant réellement enregistré sur la
 * relance (`relances.montant_du`) et l'antériorité réellement stockée
 * (`relances.jours_retard`). Les pénalités et intérêts de retard ne sont liquidés par
 * aucun service et n'occupent aucune colonne : ils sont annoncés « Non liquidé au
 * dossier », et le total reste la somme des montants enregistrés. Une relance sans
 * date d'émission n'est pas datée du jour : la date reste à porter manuscritement.
 *
 * Les codes cités portent leur nom officiel — « code des impôts » et « code des
 * procédures fiscales », pas « CGI » — et les puces de la barre d'outils ouvrent le
 * PDF de la DGI à la page imprimée de l'article. Deux réserves, portées par le
 * registre et non par la lettre : le rythme 8 / 8 / 5 jours francs est une règle du
 * module de relances, aucun article ne l'énonce (la mise en demeure du Code est la
 * lettre de notification du titre de perception, art. VII-33) ; et les poursuites ne
 * sont engagées que quinze jours après cette notification (art. VII-35), ce qui
 * interdit d'écrire qu'aucun nouveau préavis est nécessaire.
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
  const dateFr = dateOuNull(dossier.dateEmission);
  const emissionBrute = dossier.dateEmission ? new Date(dossier.dateEmission) : null;
  const dateRef = emissionBrute
    ? `${String(emissionBrute.getMonth() + 1).padStart(2, '0')}/${emissionBrute.getFullYear()}`
    : 'date non enregistrée';

  const principal = montantOuNull(dossier.montantDu);
  const joursRetard = montantOuNull(dossier.joursRetard);
  const contacts = [dossier.centre_telephone, dossier.centre_email].filter(Boolean);

  const config = relanceType(type);
  // Seul le type 'mise_en_demeure' emploie ce verbe ; un rappel à l'ordre invite,
  // il ne met pas en demeure — au sens du Code, la mise en demeure est la lettre de
  // notification du titre de perception (art. VII-33).
  const miseEnDemeure = type === 'mise_en_demeure';

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
          <div className="modal-tag-group">
            <span className="rappel-modal-type-badge" style={{ background: config.couleur }}>
              {config.titre}
            </span>
            <RefLegal source={REFERENCES.mise_en_demeure} detail />
            <div className="procedure-tags">
              <RefLegal source={REFERENCES.penalites_retard} compact />
              <RefLegal source={REFERENCES.poursuites_recouvrement} compact />
            </div>
          </div>
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
              <p><strong>Réf. :</strong> {`Contribuable ${ouAbsent(dossier.nif)} · ${config.ref} · ${dateRef}`}</p>
              <p>
                <strong>Antananarivo, le :</strong>{' '}
                {dateFr || 'Date d’émission non enregistrée au dossier'}
              </p>
            </div>
          </div>

          <hr className="rappel-sep" />

          {/* Objet */}
          <div className="rappel-objet-box">
            <p className="rappel-objet-label">OBJET :</p>
            <p className="rappel-objet-text" id="rappel-modal-title">
              <strong style={{ color: config.couleur }}>{config.titre}</strong> — Régularisation des obligations fiscales en souffrance — TVA / Année {ouAbsent(dossier.annee)}
            </p>
          </div>

          {/* Destinataire */}
          <div className="rappel-destinataire">
            <p><strong>À l'attention de :</strong></p>
            <p className="rappel-societe">{ouAbsent(dossier.raisonSociale || dossier.raison_sociale)}</p>
            <p>NIF : <strong>{ouAbsent(dossier.nif)}</strong></p>
            <p>Secteur : {ouAbsent(dossier.secteur || dossier.secteur_activite)}</p>
            {dossier.centre_nom && <p>Centre gestionnaire : {dossier.centre_nom}</p>}
          </div>

          {/* Corps */}
          <div className="rappel-corps">
            <p>Madame, Monsieur,</p>

            <p>
              Nous avons l'honneur de vous informer qu'au titre de l'exercice fiscal{' '}
              <strong>{ouAbsent(dossier.annee)}</strong>, votre dossier fiscal porte un arriéré de{' '}
              <strong>{principal === null ? MONTANT_ABSENT : formatAriary(principal)}</strong>
              {dateFr
                ? `, constaté à la date d'émission enregistrée de la présente (${dateFr}).`
                : ", dont la date d'émission n'est pas encore enregistrée au dossier : la date devra être portée manuscritement lors de l'envoi."}
              {' '}Malgré les délais impartis, le règlement de votre dette fiscale n'a pas encore été effectué.
            </p>

            <p>
              En application des dispositions du <strong>code des impôts</strong> et du{' '}
              <strong>code des procédures fiscales</strong>, nous vous {miseEnDemeure ? 'mettons en demeure de' : 'invitons à'}
              régulariser votre situation dans un délai de <strong>{config.delai}</strong> à compter de
              la réception de la présente.
            </p>

            {/* Décompte fiscal */}
            <table aria-label="Rappel à l'ordre" className="rappel-table">
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th>Montant (Ar)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    Principal dû — Année {ouAbsent(dossier.annee)}
                    {joursRetard !== null && ` · ${joursRetard} jour(s) de retard enregistré(s)`}
                  </td>
                  <td className="rappel-td-right">
                    {principal === null ? MONTANT_ABSENT : formatAriary(principal)}
                  </td>
                </tr>
                <tr>
                  <td>Pénalités de retard et intérêts moratoires</td>
                  <td className="rappel-td-right">
                    <span className="rappel-td-absent">{MONTANT_ABSENT}</span>
                  </td>
                </tr>
                <tr className="rappel-total-row">
                  <td><strong>TOTAL ENREGISTRÉ AU DOSSIER</strong></td>
                  <td className="rappel-td-right">
                    <strong>{principal === null ? MONTANT_ABSENT : formatAriary(principal)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="rappel-absent">
              Le total ci-dessus ne reporte que le montant enregistré sur la relance. Les pénalités de
              retard et les intérêts moratoires prévus par le code des impôts sont liquidés par
              l’administration dans un acte distinct : cette application ne les calcule pas et ne les
              additionne pas au présent rappel.
            </p>

            <p>
              À défaut de régularisation dans le délai imparti, le dossier sera transmis au recouvrement
              forcé. Un titre de perception sera décerné, et sa lettre de notification contiendra
              sommation d’avoir à payer sans délai les sommes qu’il énonce ; les poursuites pourront être
              engagées quinze jours après cette notification.
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
            <p>
              {contacts.length
                ? `Pour plus d'information : ${dossier.centre_nom ? `${dossier.centre_nom} — ` : ''}${contacts.join(' · ')}`
                : `Pour plus d'information, adressez-vous au centre gestionnaire${
                    dossier.centre_nom ? ` : ${dossier.centre_nom}` : '.'
                  }`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
