import { useState } from 'react';
import IdentityFields from '../../../components/forms/IdentityFields';
import AmountField from '../../../components/forms/AmountField';
import ControlResult from '../../../components/forms/ControlResult';
import { formatAriary, toNumber } from '../../../utils/formatters';
import NotificationModal from '../../../components/common/NotificationModal';

/**
 * Module B : Formulaire de calcul et simulation de la TVA Théorique et des redressements
 * Règles DGI Madagascar :
 * - IS : 5% du Chiffre d'Affaires
 * - IR (optionnel sous 400M Ar) : MAX(320 000 + 20% CA, 20% Bénéfice)
 * - Taux d'écart > 50% => Redressement (Principal + 40% Amende + Pénalités de retard)
 */
export default function TheoreticalForm({ surCollecte, enCours }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('primitive');

  const [saisie, setSaisie] = useState({
    nif: '',
    nomSociete: '',
    raisonSociale: '',
    anneeFiscale: String(new Date().getFullYear()),
    adresse: '',
    contact: '',
    email: '',
    chiffreAffaires: '',
    beneficeFiscal: '',
    tvaPayee: '',
    moisRetard: '0',
    regimeIr: false,
  });

  const handleChange = (e) => {
    setSaisie((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const ca = toNumber(saisie.chiffreAffaires);
  const benefice = toNumber(saisie.beneficeFiscal);
  const tvaPayee = toNumber(saisie.tvaPayee);
  const moisRetard = Math.max(0, Math.floor(toNumber(saisie.moisRetard)));

  // Détermination du régime fiscal
  const regimeFiscal = ca < 400000000 && saisie.regimeIr ? 'IR' : 'IS';

  // Calcul TVA théorique
  const tvaTheorique =
    regimeFiscal === 'IS'
      ? ca * 0.05
      : Math.max(320000 + ca * 0.2, benefice * 0.2);

  // Diagnostic d'écart
  const ecart = tvaTheorique - tvaPayee;
  const tauxEcart = tvaTheorique > 0 ? (ecart / tvaTheorique) * 100 : 0;
  const redressementApplicable = tauxEcart > 50;

  // Calculs de redressement et pénalités
  const montantRedressement = redressementApplicable ? Math.max(0, ecart) : 0;
  const tauxPrincipal = regimeFiscal === 'IR' ? 0.2 : 0.05;
  const principal = montantRedressement * tauxPrincipal;
  const amende = principal * 0.4;
  const totalAPayer = principal + amende;

  const categorieContribuable =
    ca >= 400000000
      ? 'Grand contribuable'
      : ca >= 100000000
        ? 'Moyen contribuable'
        : 'Petit contribuable';

  const tauxPenalite =
    ca < 100000000
      ? moisRetard * 0.01
      : moisRetard > 0
        ? (ca >= 400000000 ? 0.03 : 0.02) + (moisRetard - 1) * 0.01
        : 0;

  const montantPenalite = totalAPayer * tauxPenalite;
  const totalAvecPenalite = totalAPayer + montantPenalite;

  const handleSubmit = (e) => {
    e.preventDefault();
    surCollecte?.({
      table: 'declarations',
      nif: saisie.nif,
      annee: saisie.anneeFiscale,
      intitule: 'TVA théorique',
      valeurs: {
        ca,
        benefice,
        tva_payee: tvaPayee,
        tva_theorique: tvaTheorique,
        observations_agent: `Collecte TVA théorique — régime ${regimeFiscal}, écart de ${formatAriary(ecart)}${
          redressementApplicable ? ` (redressement applicable : ${formatAriary(montantRedressement)})` : ''
        }.`,
      },
    });
  };

  return (
    <div className="workspace">
      <form className="form-card" onSubmit={handleSubmit}>
        {/* Module d'identification du contribuable */}
        <IdentityFields donneesIdentification={saisie} surChangement={handleChange} />

        {/* Champ email du responsable fiscal */}
        <div className="grid two" style={{ marginBottom: '1rem' }}>
          <label className="field">
            <span>Adresse e-mail du responsable fiscal</span>
            <div className="input-wrap">
              <input
                type="email"
                name="email"
                value={saisie.email}
                onChange={handleChange}
                placeholder="responsable@entreprise.mg"
                autoComplete="email"
              />
            </div>
          </label>
        </div>

        <div className="section-heading financial">
          <span className="section-number">B</span>
          <div>
            <h2>TVA théorique & Redressement</h2>
            <p>Estimation fiscale selon le chiffre d'affaires et le bénéfice déclaré.</p>
          </div>
        </div>

        {/* Rappel des formules selon régime */}
        <div className="formula-grid">
          <div>
            <b>Régime IS · régime par défaut</b>
            <span>TVA théorique = CA × 5 %</span>
          </div>
          <div>
            <b>Régime IR · option sous 400 000 000 Ar</b>
            <span>MAX (320 000 + CA × 20 % ; Bénéfice × 20 %)</span>
          </div>
        </div>

        {/* Saisie financière */}
        <div className="financial-grid three">
          <AmountField
            intitule="Chiffre d'affaires déclaré"
            nomChamp="chiffreAffaires"
            requis
            valeur={saisie.chiffreAffaires}
            surChangement={handleChange}
          />
          <AmountField
            intitule="Bénéfice fiscal déclaré"
            nomChamp="beneficeFiscal"
            valeur={saisie.beneficeFiscal}
            surChangement={handleChange}
          />
          <AmountField
            intitule="TVA effectivement payée"
            nomChamp="tvaPayee"
            valeur={saisie.tvaPayee}
            surChangement={handleChange}
          />
          {ca < 400000000 && (
            <label className="field">
              <span>Option fiscale</span>
              <div className="input-wrap">
                <label>
                  <input
                    type="checkbox"
                    name="regimeIr"
                    checked={saisie.regimeIr}
                    onChange={(e) =>
                      setSaisie((current) => ({ ...current, regimeIr: e.target.checked }))
                    }
                  />
                  Appliquer le régime IR
                </label>
              </div>
              <small>Disponible uniquement lorsque le CA est inférieur à 400 000 000 Ar.</small>
            </label>
          )}
          <label className="field">
            <span>Mois de retard</span>
            <div className="input-wrap">
              <input
                type="number"
                min="0"
                step="1"
                name="moisRetard"
                value={saisie.moisRetard}
                onChange={handleChange}
                placeholder="0"
              />
              <small>mois</small>
            </div>
          </label>
        </div>

        <div className="form-actions">
          <button className="primary" type="submit" disabled={enCours}>
            {enCours ? 'Enregistrement…' : <>Ajouter aux données collectées <span>→</span></>}
          </button>
        </div>
      </form>

      {/* Diagnostic & Résultat */}
      <ControlResult
        title={`Régime ${regimeFiscal} · ${
          redressementApplicable
            ? 'Redressement requis'
            : ecart > 0
              ? 'Écart à examiner'
              : 'Situation conforme'
        }`}
        alert={ecart > 0}
        message={
          redressementApplicable
            ? `Écart critique de ${tauxEcart.toFixed(1)} % : calcul du redressement et des amendes.`
            : ecart > 0
              ? `TVA payée inférieure de ${formatAriary(ecart)} au montant théorique.`
              : 'La TVA payée est en accord avec le régime fiscal.'
        }
        rows={[
          ['TVA théorique calculée', tvaTheorique],
          ['TVA effectivement payée', tvaPayee],
          ['Écart constaté', Math.abs(ecart)],
          ...(redressementApplicable
            ? [
                ['Base du redressement', montantRedressement],
                [`Principal (${regimeFiscal} ${tauxPrincipal * 100} %)`, principal],
                ['Amende (40 % du principal)', amende],
                [`Total à payer (${regimeFiscal})`, totalAPayer],
                ['Catégorie de contribuable', categorieContribuable],
                ['Mois de retard', moisRetard],
                ['Taux de pénalité', `${(tauxPenalite * 100).toFixed(1)} %`],
                ['Pénalité de retard', montantPenalite],
                ['Total à payer avec pénalités', totalAvecPenalite],
              ]
            : []),
        ]}
      />

      {/* 📜 Procédure Contradictoire & Notifications (CGI LFI 2026) */}
      {redressementApplicable && (
        <div
          className="procedure-card"
          style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #dfe5ed',
            boxShadow: '0 4px 12px rgba(24, 45, 72, 0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span className="procedure-tag" style={{ display: 'inline-block', padding: '0.2rem 0.55rem', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 800 }}>
                CGI LFI 2026 · Cadre Légal Contradictoire
              </span>
              <h3 style={{ margin: '0.35rem 0 0', color: '#0f172a', fontSize: '1.1rem' }}>
                Notifications Primitives & Définitives de Redressement
              </h3>
              <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                Conformément aux Articles V-19 et suiv. du CPF et aux Articles 01.01.15 (IR) et 01.02.06 (IS) du CGI.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setModalType('primitive');
                  setModalOpen(true);
                }}
                style={{
                  border: '1px solid #0284c7',
                  color: '#0284c7',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  padding: '0.5rem 0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                📄 Aperçu Notification Primitive (30j)
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setModalType('definitive');
                  setModalOpen(true);
                }}
                style={{
                  border: '1px solid #7c3aed',
                  color: '#7c3aed',
                  backgroundColor: '#f5f3ff',
                  borderRadius: '8px',
                  padding: '0.5rem 0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                📜 Aperçu Notification Définitive
              </button>
            </div>
          </div>

          {/* Matrice comparative fonctionnelle */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.65rem' }}>Caractéristique</th>
                  <th style={{ padding: '0.65rem', color: '#0369a1' }}>Notification Primitive (Proposition)</th>
                  <th style={{ padding: '0.65rem', color: '#7c3aed' }}>Notification Définitive (Décision Finale)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.65rem', fontWeight: 700 }}>Statut juridique</td>
                  <td style={{ padding: '0.65rem' }}>Proposition temporaire de rectification de base imposable (CPF V-19)</td>
                  <td style={{ padding: '0.65rem' }}>Acte exécutoire et définitif fixant la dette fiscale</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.65rem', fontWeight: 700 }}>Délai de contestation</td>
                  <td style={{ padding: '0.65rem' }}>Ouvre un délai légal de <strong>30 jours</strong> (prorogation DGI possible)</td>
                  <td style={{ padding: '0.65rem' }}>Clôture la phase contradictoire. Voie aux recours de droit commun.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.65rem', fontWeight: 700 }}>Compensation de crédits</td>
                  <td style={{ padding: '0.65rem', color: '#b91c1c' }}>❌ Non applicable à ce stade (droits non arrêtés)</td>
                  <td style={{ padding: '0.65rem', color: '#15803d', fontWeight: 700 }}>
                    🔓 Permet l'imputation légale directe des crédits d'impôts (Art. 01.01.15 & 01.02.06)
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0.65rem', fontWeight: 700 }}>Statut du dossier en base</td>
                  <td style={{ padding: '0.65rem' }}><span className="badge primitive">PRIMITIVE_ENVOYÉE</span></td>
                  <td style={{ padding: '0.65rem' }}><span className="badge definitive">DÉFINITIVE_ENVOYÉE</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ margin: '0.85rem 0 0', color: '#64748b', fontSize: '0.78rem', fontStyle: 'italic' }}>
            💡 Note d'intégration : La date d'émission de la Notification Primitive est horodatée pour calculer exactement l'échéance à 30 jours. Le statut 'DÉFINITIVE_ENVOYÉE' débloque le mécanisme d'imputation légale du crédit d'impôt.
          </p>
        </div>
      )}

      {/* Modal d'affichage et d'impression du document officiel */}
      <NotificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        declaration={{
          annee: Number(saisie.anneeFiscale) || new Date().getFullYear(),
          id_declaration: 'SIM-' + (saisie.nif || '001'),
          nif: saisie.nif || 'Non renseigné',
          raison_sociale: saisie.raisonSociale || saisie.nomSociete || 'Entreprise Assujettie',
          secteur_activite: saisie.adresse || 'Activités commerciales & services',
          tva_payee: tvaPayee,
          tva_theorique: tvaTheorique,
          montant_redressement: principal,
          montant_impute: 0,
          montant_net_a_payer: totalAvecPenalite,
          observations_agent: `Simulation contradictoire de redressement pour l'exercice ${saisie.anneeFiscale}. Régime : ${regimeFiscal}. Retard : ${moisRetard} mois.`,
        }}
        redressementDetails={{
          principal,
          amende,
          penalite: montantPenalite,
          total: totalAvecPenalite,
        }}
      />
    </div>
  );
}
