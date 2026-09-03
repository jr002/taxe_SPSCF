import { useState } from 'react';
import IdentityFields from '../../components/forms/IdentityFields';
import AmountField from '../../components/forms/AmountField';
import ControlResult from '../../components/forms/ControlResult';
import { formatAriary, formatNumber, toNumber } from '../../utils/formatters';

/**
 * Module B : Formulaire de calcul et simulation de la TVA Théorique et des redressements
 * Règles DGI Madagascar :
 * - IS (< 400M Ar) : 5% du Chiffre d'Affaires
 * - IR (>= 400M Ar) : MAX(320 000 + 20% CA, 20% Bénéfice)
 * - Taux d'écart > 50% => Redressement (Principal + 40% Amende + Pénalités de retard)
 */
export default function TheoreticalForm({ surCollecte }) {
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
  });

  const handleChange = (e) => {
    setSaisie({ ...saisie, [e.target.name]: e.target.value });
  };

  const ca = toNumber(saisie.chiffreAffaires);
  const benefice = toNumber(saisie.beneficeFiscal);
  const tvaPayee = toNumber(saisie.tvaPayee);
  const moisRetard = Math.max(0, Math.floor(toNumber(saisie.moisRetard)));

  // Détermination du régime fiscal
  const regimeFiscal = ca < 400000000 ? 'IS' : 'IR';

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
    if (typeof surCollecte === 'function') {
      surCollecte(
        'TVA théorique',
        `Régime ${regimeFiscal} · CA ${formatAriary(ca)} · Bénéfice ${formatAriary(benefice)}`,
        tvaTheorique,
        {
          nif: saisie.nif,
          companyName: saisie.nomSociete,
          legalName: saisie.raisonSociale,
          year: saisie.anneeFiscale,
          address: saisie.adresse,
          contact: saisie.contact,
        }
      );
    }
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
            <b>Régime IS · CA &lt; 400 000 000 Ar</b>
            <span>TVA théorique = CA × 5 %</span>
          </div>
          <div>
            <b>Régime IR · CA &ge; 400 000 000 Ar</b>
            <span>MAX (320 000 + CA × 20 % ; Bénéfice × 20 %)</span>
          </div>
        </div>

        {/* Saisie financière */}
        <div className="financial-grid three">
          <AmountField
            intitule="Chiffre d'affaires déclaré"
            nomChamp="chiffreAffaires"
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
          <button className="primary" type="submit">
            Ajouter aux données collectées <span>→</span>
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
    </div>
  );
}
