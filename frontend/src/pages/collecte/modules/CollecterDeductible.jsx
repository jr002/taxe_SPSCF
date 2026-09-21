import { useState } from 'react';
import IdentityFields from '../../../components/forms/IdentityFields';
import AmountField from '../../../components/forms/AmountField';
import ControlResult from '../../../components/forms/ControlResult';
import { formatAriary, toNumber } from '../../../utils/formatters';

/**
 * Module A : Contrôle de la TVA nette à payer à partir des ventes et achats
 * Formule : TVA à payer = max(0, TVA collectée - TVA déductible)
 */
export default function CollecterDeductible({ surCollecte }) {
  const [saisie, setSaisie] = useState({
    nif: '',
    nomSociete: '',
    raisonSociale: '',
    anneeFiscale: String(new Date().getFullYear()),
    adresse: '',
    contact: '',
    email: '',
    tvaCollectee: '',
    tvaDeductible: '',
    tvaPayee: '',
  });

  const handleChange = (e) => {
    setSaisie({ ...saisie, [e.target.name]: e.target.value });
  };

  // Calculs fiscaux
  const tvaCollectee = toNumber(saisie.tvaCollectee);
  const tvaDeductible = toNumber(saisie.tvaDeductible);
  const tvaDue = Math.max(0, tvaCollectee - tvaDeductible);
  const tvaPayee = toNumber(saisie.tvaPayee);
  const ecart = tvaDue - tvaPayee;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof surCollecte === 'function') {
      surCollecte(
        'Ventes et achats',
        `TVA collectée ${formatAriary(tvaCollectee)} · TVA déductible ${formatAriary(tvaDeductible)}`,
        tvaDue,
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
          <span className="section-number">A</span>
          <div>
            <h2>Contrôle TVA collectée vs déductible</h2>
            <p>Contrôle de la TVA nette à partir des factures clients et des achats éligibles.</p>
          </div>
        </div>

        <div className="rule-box">
          <strong>Formule légale appliquée</strong>
          <span>TVA à payer = TVA collectée − TVA déductible</span>
        </div>

        {/* Grille des montants financiers */}
        <div className="financial-grid three">
          <AmountField
            intitule="TVA collectée sur les ventes"
            nomChamp="tvaCollectee"
            valeur={saisie.tvaCollectee}
            surChangement={handleChange}
          />
          <AmountField
            intitule="TVA déductible sur achats"
            nomChamp="tvaDeductible"
            valeur={saisie.tvaDeductible}
            surChangement={handleChange}
          />
          <AmountField
            intitule="TVA effectivement payée"
            nomChamp="tvaPayee"
            valeur={saisie.tvaPayee}
            surChangement={handleChange}
          />
        </div>

        <div className="form-actions">
          <button className="primary" type="submit">
            Ajouter aux données collectées <span>→</span>
          </button>
        </div>
      </form>

      {/* Résultat et diagnostic de l'écart */}
      <ControlResult
        title={ecart > 0 ? 'Écart de TVA détecté' : 'Situation conforme'}
        alert={ecart > 0}
        message={
          ecart > 0
            ? `Écart de ${formatAriary(ecart)} constaté à régulariser.`
            : 'Le montant payé couvre la TVA calculée.'
        }
        rows={[
          ['TVA à payer calculée', tvaDue],
          ['TVA effectivement payée', tvaPayee],
          ['Écart constaté', Math.abs(ecart)],
        ]}
      />
    </div>
  );
}
