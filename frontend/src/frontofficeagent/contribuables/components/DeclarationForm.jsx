const FIELDS = [
  ['periode', 'Période (AAAA-MM)', 'month'],
  ['annee', 'Année'],
  ['ca', "Chiffre d'affaires"],
  ['benefice', 'Bénéfice'],
  ['tva_collectee', 'TVA collectée'],
  ['tva_deductible', 'TVA déductible'],
  ['tva_payee', 'TVA payée'],
];

export default function DeclarationForm({
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
          <p className="eyebrow">Nouvelle déclaration</p>
          <h2>Ajouter une déclaration fiscale</h2>
        </div>
        <span>Contribuable : {contribuable.raison_sociale}</span>
      </div>

      {error && (
        <p className="error form-submit-message" role="alert">
          {error}
        </p>
      )}

      <div className="declaration-create-grid">
        {FIELDS.map(([name, label, type]) => (
          <label className="field" htmlFor={`declaration-${name}`} key={name}>
            {label}
            <input
              id={`declaration-${name}`}
              name={name}
              type={type || 'number'}
              min={type ? undefined : '0'}
              step={type ? undefined : name === 'annee' ? '1' : '0.01'}
              value={form[name]}
              onChange={onChange}
              required
            />
          </label>
        ))}
        <label className="field" htmlFor="declaration-type">
          Type de déclaration
          <select
            id="declaration-type"
            name="type_declaration"
            value={form.type_declaration}
            onChange={onChange}
          >
            <option value="TVA">TVA</option>
            <option value="IR">IR</option>
            <option value="IS">IS</option>
            <option value="autre">Autre</option>
          </select>
        </label>
      </div>

      <div className="form-actions">
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement...' : 'Enregistrer la déclaration'}
        </button>
      </div>
    </form>
  );
}
