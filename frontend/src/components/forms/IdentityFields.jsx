/**
 * Bloc réutilisable d'identification du contribuable (NIF, Société, Année, etc.)
 */
export default function IdentityFields({ donneesIdentification, surChangement }) {
  return (
    <div className="identity-block">
      <div className="section-heading">
        <span className="section-number">01</span>
        <div>
          <h2>Identification du contribuable</h2>
          <p>Renseignez les informations de base de l'entreprise assujettie.</p>
        </div>
      </div>

      <div className="grid two">
        <label className="field">
          <span>Numéro d'Identification Fiscale (NIF)</span>
          <input
            name="nif"
            value={donneesIdentification.nif || ''}
            onChange={surChangement}
            placeholder="Ex: 1000000001"
            maxLength={20}
          />
        </label>

        <label className="field">
          <span>Année fiscale contrôlée</span>
          <input
            type="number"
            min="2000"
            max="2100"
            name="anneeFiscale"
            value={donneesIdentification.anneeFiscale || ''}
            onChange={surChangement}
            placeholder={String(new Date().getFullYear())}
          />
        </label>
      </div>

      <div className="grid two">
        <label className="field">
          <span>Nom commercial / Société</span>
          <input
            name="nomSociete"
            value={donneesIdentification.nomSociete || ''}
            onChange={surChangement}
            placeholder="Nom de l'établissement"
          />
        </label>

        <label className="field">
          <span>Raison sociale</span>
          <input
            name="raisonSociale"
            value={donneesIdentification.raisonSociale || ''}
            onChange={surChangement}
            placeholder="SARL, SA, Entreprise Individuelle..."
          />
        </label>
      </div>

      <div className="grid two">
        <label className="field">
          <span>Adresse d'exploitation</span>
          <input
            name="adresse"
            value={donneesIdentification.adresse || ''}
            onChange={surChangement}
            placeholder="Ville, quartier, rue..."
          />
        </label>

        <label className="field">
          <span>Téléphone</span>
          <input
            name="contact"
            value={donneesIdentification.contact || ''}
            onChange={surChangement}
            placeholder="+261 34 00 000 00"
          />
        </label>

        <label className="field">
          <span>E-mail  </span>
          <input
            name="email"
            value={donneesIdentification.email || ''}
            onChange={surChangement}
            placeholder="+emailadresse@gmail.com"
          />
        </label>

      </div>
    </div>
  );
}
