const TYPE_TIERS = [
  ['banque', 'Banque'],
  ['assurance', 'Assurance'],
  ['administration', 'Administration'],
  ['notaire', 'Notaire'],
  ['fournisseur', 'Fournisseur'],
  ['client', 'Client'],
  ['autre', 'Autre'],
];

const STATUTS = [
  ['demande', 'Demande envoyée'],
  ['reponse', 'Réponse reçue'],
  ['partiel', 'Réponse partielle'],
  ['relance', 'Relance émise'],
  ['sans_suite', 'Sans suite'],
];

const TEXT_AREAS = [
  ['pieces_demandees', 'Pièces demandées'],
  ['documents_recus', 'Documents reçus'],
  ['observations', 'Observations'],
];

export default function DroitCommunicationForm({
  contribuable,
  error,
  form,
  onChange,
  onSubmit,
  submitting,
}) {
  return (
    <form className="declaration-create-form" onSubmit={onSubmit}>
      <div className="declaration-create-form-heading">
        <div>
          <p className="eyebrow">Nouveau droit de communication</p>
          <h2>Enregistrer une demande de communication</h2>
        </div>
        <span>Contribuable : {contribuable.raison_sociale}</span>
      </div>

      {error && (
        <p className="error form-submit-message" role="alert">
          {error}
        </p>
      )}

      <div className="declaration-create-grid">
        <label className="field" htmlFor="droit-tier">
          Tiers destinataire
          <input
            id="droit-tier"
            name="tier"
            value={form.tier}
            onChange={onChange}
            maxLength="255"
            required
          />
        </label>
        <label className="field" htmlFor="droit-type-tier">
          Type de tiers
          <select
            id="droit-type-tier"
            name="type_tier"
            value={form.type_tier}
            onChange={onChange}
          >
            {TYPE_TIERS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="droit-nif-tier">
          NIF du tiers
          <input
            id="droit-nif-tier"
            name="nif_tier"
            value={form.nif_tier}
            onChange={onChange}
            maxLength="50"
          />
        </label>
        <label className="field" htmlFor="droit-objet">
          Objet de la demande
          <input
            id="droit-objet"
            name="objet"
            value={form.objet}
            onChange={onChange}
            required
          />
        </label>
        <label className="field" htmlFor="droit-date-demande">
          Date de la demande
          <input
            id="droit-date-demande"
            name="date_demande"
            type="date"
            value={form.date_demande}
            onChange={onChange}
            required
          />
        </label>
        <label className="field" htmlFor="droit-statut">
          Statut
          <select id="droit-statut" name="statut" value={form.statut} onChange={onChange}>
            {STATUTS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="droit-date-reponse">
          Date de réponse
          <input
            id="droit-date-reponse"
            name="date_reponse"
            type="date"
            value={form.date_reponse}
            onChange={onChange}
          />
        </label>
      </div>

      <div className="declaration-create-grid" style={{ marginTop: '1rem' }}>
        {TEXT_AREAS.map(([name, label]) => (
          <label className="field" htmlFor={`droit-${name}`} key={name}>
            {label}
            <textarea
              id={`droit-${name}`}
              name={name}
              rows="3"
              value={form[name]}
              onChange={onChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
              }}
            />
          </label>
        ))}
      </div>

      <div className="form-actions">
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Enregistrer le droit de communication'}
        </button>
      </div>
    </form>
  );
}
