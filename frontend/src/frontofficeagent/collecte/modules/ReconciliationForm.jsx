import { useState } from 'react';
import IdentityFields from '@/components/forms/IdentityFields';
import AmountField from '@/components/forms/AmountField';
import ControlResult from '@/components/forms/ControlResult';
import { formatAriary, toNumber } from '@/utils/formatters';

/**
 * Module C : Formulaire de collecte des données de recoupement fiscal avec les tiers
 * Somme Recoupée (SR) = Marchandises + Achats de biens + Tiers + Produits locaux + Débours
 */
export default function ReconciliationForm({ surCollecte, enCours }) {
  const [saisie, setSaisie] = useState({
    nif: '',
    nomSociete: '',
    raisonSociale: '',
    anneeFiscale: String(new Date().getFullYear()),
    adresse: '',
    contact: '',
    email: '',
    marchandisesVendues: '',
    achatsBiens: '',
    sommesTiers: '',
    produitsLocaux: '',
    debours: '',
  });

  const handleChange = (e) => {
    setSaisie({ ...saisie, [e.target.name]: e.target.value });
  };

  const marchandisesVendues = toNumber(saisie.marchandisesVendues);
  const achatsBiens = toNumber(saisie.achatsBiens);
  const sommesTiers = toNumber(saisie.sommesTiers);
  const produitsLocaux = toNumber(saisie.produitsLocaux);
  const debours = toNumber(saisie.debours);

  // Somme Recoupée
  const sommeRecoupee =
    marchandisesVendues + achatsBiens + sommesTiers + produitsLocaux + debours;

  const handleSubmit = (e) => {
    e.preventDefault();
    surCollecte?.({
      table: 'recoupements',
      nif: saisie.nif,
      annee: saisie.anneeFiscale,
      intitule: 'Recoupement fiscal',
      valeurs: {
        merchandise_sold: marchandisesVendues,
        goods_purchased: achatsBiens,
        third_party_payments: sommesTiers,
        local_products: produitsLocaux,
        services_purchased: debours,
        somme_recoupee: sommeRecoupee,
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
          <span className="section-number">C</span>
          <div>
            <h2>Recoupement des déclarations</h2>
            <p>
              Collectez les données de recoupement pour confronter les flux déclarés avec les tiers.
            </p>
          </div>
        </div>

        {/* Champs de calcul de la Somme Recoupée (SR) */}
        <div className="financial-grid">
          <AmountField
            intitule="Marchandises vendues"
            nomChamp="marchandisesVendues"
            valeur={saisie.marchandisesVendues}
            surChangement={handleChange}
          />
          <AmountField
            intitule="Achats de biens"
            nomChamp="achatsBiens"
            valeur={saisie.achatsBiens}
            surChangement={handleChange}
          />
          <AmountField
            intitule="Sommes versées par des tiers"
            nomChamp="sommesTiers"
            valeur={saisie.sommesTiers}
            surChangement={handleChange}
          />
          <AmountField
            intitule="Produits locaux achetés"
            nomChamp="produitsLocaux"
            valeur={saisie.produitsLocaux}
            surChangement={handleChange}
          />
          <AmountField
            intitule="Débours et charges"
            nomChamp="debours"
            valeur={saisie.debours}
            surChangement={handleChange}
          />
          <div className="sum-field">
            <span>Somme recoupée (SR)</span>
            <strong>
              {formatAriary(sommeRecoupee)}
            </strong>
          </div>
        </div>

        <div className="form-actions">
          <button className="primary" type="submit" disabled={enCours}>
            {enCours ? 'Enregistrement…' : <>Ajouter aux données collectées <span>→</span></>}
          </button>
        </div>
      </form>

      {/* Résultat du recoupement */}
      <ControlResult
        title="Somme recoupée prête pour analyse"
        message="Enregistrez cette collecte afin qu'elle soit confrontée aux déclarations officielles de l'entreprise."
        rows={[
          ['Marchandises vendues', marchandisesVendues],
          ['Achats de biens', achatsBiens],
          ['Sommes versées par des tiers', sommesTiers],
          ['Produits locaux', produitsLocaux],
          ['Débours', debours],
          ['Somme recoupée totale', sommeRecoupee],
        ]}
      />
    </div>
  );
}
