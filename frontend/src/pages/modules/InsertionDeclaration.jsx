import { useState } from 'react';
import IdentityFields from '../../components/forms/IdentityFields';
import AmountField from '../../components/forms/AmountField';
import ControlResult from '../../components/forms/ControlResult';
import { formatAriary, toNumber } from '../../utils/formatters';

/**
 * Module B : Insertion des données de la déclaration fiscale officielle
 * Permet de saisir les éléments issus de la déclaration fiscale déposée par l'entreprise :
 *   - Chiffre d'affaires déclaré
 *   - Bénéfice imposable
 *   - Impôts payés
 *   - TVA déclarée
 *   - Date de la déclaration
 */
export default function InsertionDeclaration({ surCollecte }) {
  const [saisie, setSaisie] = useState({
    nif: '',
    nomSociete: '',
    raisonSociale: '',
    anneeFiscale: String(new Date().getFullYear()),
    adresse: '',
    contact: '',
    email: '',
    // Champs de la déclaration fiscale officielle
    chiffreAffaires: '',
    beneficeImposable: '',
    impotsPayes: '',
    tvaDeclaree: '',
    autresCharges: '',
    declarationDate: '',
    referenceDossier: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSaisie((prev) => ({ ...prev, [name]: value }));
  };

  // Calculs dérivés
  const ca = toNumber(saisie.chiffreAffaires);
  const benefice = toNumber(saisie.beneficeImposable);
  const impotsPayes = toNumber(saisie.impotsPayes);
  const tvaDeclaree = toNumber(saisie.tvaDeclaree);
  const autresCharges = toNumber(saisie.autresCharges);

  // Taux d'imposition apparent (IS / IR)
  const tauxApparent = ca > 0 ? (impotsPayes / ca) * 100 : 0;

  // Régime fiscal selon seuil DGI Madagascar
  const regimeFiscal = 'IS';

  // Charge fiscale totale déclarée
  const chargeFiscaleTotale = impotsPayes + tvaDeclaree + autresCharges;

  // Alerte si taux apparent très faible (< 1 %) sur un CA non nul
  const alerteTaux = ca > 0 && tauxApparent < 1;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof surCollecte === 'function') {
      surCollecte(
        'Déclaration fiscale',
        `CA déclaré ${formatAriary(ca)} · Impôts payés ${formatAriary(impotsPayes)}`,
        chargeFiscaleTotale,
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

        {/* ── Section A : Identification du contribuable ── */}
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

        {/* ── Section B : Données de la déclaration fiscale ── */}
        <div className="section-heading financial">
          <span className="section-number">B</span>
          <div>
            <h2>Déclaration fiscale officielle</h2>
            <p>
              Saisissez les éléments issus de la déclaration fiscale officielle déposée
              par l'entreprise auprès de la DGI.
            </p>
          </div>
        </div>

        {/* Champs financiers principaux */}
        <div className="financial-grid three">
          <AmountField
            intitule="Chiffre d'affaires déclaré"
            nomChamp="chiffreAffaires"
            valeur={saisie.chiffreAffaires}
            surChangement={handleChange}
            requis
          />
          <AmountField
            intitule="Bénéfice imposable"
            nomChamp="beneficeImposable"
            valeur={saisie.beneficeImposable}
            surChangement={handleChange}
          />
          <AmountField
            intitule="Impôts payés (IS / IR)"
            nomChamp="impotsPayes"
            valeur={saisie.impotsPayes}
            surChangement={handleChange}
            requis
          />
          <AmountField
            intitule="TVA déclarée"
            nomChamp="tvaDeclaree"
            valeur={saisie.tvaDeclaree}
            surChangement={handleChange}
          />
          <AmountField
            intitule="Autres charges fiscales"
            nomChamp="autresCharges"
            valeur={saisie.autresCharges}
            surChangement={handleChange}
          />
        </div>

        {/* Champs complémentaires : date et référence */}
        <div className="financial-grid">
          <label className="field">
            <span>Date de la déclaration</span>
            <div className="input-wrap">
              <input
                type="date"
                name="declarationDate"
                value={saisie.declarationDate}
                onChange={handleChange}
              />
            </div>
          </label>

          <label className="field">
            <span>Référence du dossier</span>
            <div className="input-wrap">
              <input
                type="text"
                name="referenceDossier"
                value={saisie.referenceDossier}
                onChange={handleChange}
                placeholder="Ex : DGI-2024-00123"
              />
            </div>
          </label>
        </div>

        {/* Indicateur du régime fiscal détecté */}
        <div className="rule-box">
          <strong>Régime fiscal détecté : {ca > 0 ? regimeFiscal : '—'}</strong>
          <span>
            {regimeFiscal === 'IS'
              ? ca >= 400_000_000
                ? 'IS · régime appliqué automatiquement au-dessus de 400 000 000 Ar'
                : 'IS · régime par défaut — Taux appliqué : 5 % du CA'
              : 'IR · option disponible sous 400 000 000 Ar'}
          </span>
        </div>

        <div className="form-actions">
          <button className="primary" type="submit">
            Ajouter aux données collectées <span>→</span>
          </button>
        </div>
      </form>

      {/* ── Résumé récapitulatif ── */}
      <ControlResult
        title={
          alerteTaux
            ? 'Taux d\'imposition anormalement bas'
            : 'Déclaration fiscale enregistrée'
        }
        alert={alerteTaux}
        message={
          alerteTaux
            ? `Le taux apparent d'imposition est de ${tauxApparent.toFixed(2)} % du CA déclaré — à vérifier.`
            : ca > 0
            ? `Régime ${regimeFiscal} · Charge fiscale totale : ${formatAriary(chargeFiscaleTotale)}`
            : 'Renseignez les montants pour voir le récapitulatif.'
        }
        rows={[
          ['Chiffre d\'affaires déclaré', ca],
          ['Bénéfice imposable', benefice],
          ['Impôts payés (IS / IR)', impotsPayes],
          ['TVA déclarée', tvaDeclaree],
          ['Autres charges fiscales', autresCharges],
          ['Charge fiscale totale', chargeFiscaleTotale],
          ['Taux apparent d\'imposition', ca > 0 ? `${tauxApparent.toFixed(2)} %` : '—'],
          ['Régime fiscal', ca > 0 ? regimeFiscal : '—'],
          ['Date de déclaration', saisie.declarationDate || 'Non renseignée'],
          ['Référence dossier', saisie.referenceDossier || 'Non renseignée'],
        ]}
      />
    </div>
  );
}