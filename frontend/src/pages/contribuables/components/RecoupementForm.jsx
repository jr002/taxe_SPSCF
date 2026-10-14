const AMOUNT_FIELDS = [
  ['merchandise_sold', 'Marchandises vendues'],
  ['goods_purchased', 'Achats de biens'],
  ['services_purchased', 'Services achetés'],
  ['third_party_payments', 'Versements de tiers'],
  ['local_products', 'Produits locaux'],
  ['import_expenses', 'Dépenses d’importation'],
  ['montant_declare', 'Montant déclaré'],
  ['montant_tva', 'Montant TVA'],
  ['montant_ttc', 'Montant TTC'],
];

export default function RecoupementForm({ contribuable, error, form, onChange, onSubmit, submitting }) {
  return (
    <form className="declaration-create-form" onSubmit={onSubmit}>
      <div className="declaration-create-form-heading">
        <div>
          <p className="eyebrow">Nouveau recoupement</p>
          <h2>Ajouter une information de recoupement</h2>
        </div>
        <span>Contribuable : {contribuable.raison_sociale}</span>
      </div>

      {error && <p className="error form-submit-message" role="alert">{error}</p>}

      <div className="declaration-create-grid">
        <label className="field" htmlFor="recoupement-source">
          Source
          <input id="recoupement-source" name="source" value={form.source} onChange={onChange} required maxLength="50" />
        </label>
        <label className="field" htmlFor="recoupement-periode">
          Période
          <input id="recoupement-periode" name="periode" type="month" value={form.periode} onChange={onChange} required />
        </label>
        <label className="field" htmlFor="recoupement-reference">
          Référence
          <input id="recoupement-reference" name="reference" value={form.reference} onChange={onChange} maxLength="100" />
        </label>
        <label className="field" htmlFor="recoupement-operation">
          Type d’opération
          <select id="recoupement-operation" name="type_operation" value={form.type_operation} onChange={onChange}>
            <option value="vente">Vente</option>
            <option value="achat">Achat</option>
            <option value="service">Service</option>
            <option value="autre">Autre</option>
          </select>
        </label>
        <label className="field" htmlFor="recoupement-nif-tiers">
          NIF du tiers
          <input id="recoupement-nif-tiers" name="nif_tiers" value={form.nif_tiers} onChange={onChange} maxLength="50" />
        </label>
        <label className="field" htmlFor="recoupement-date">
          Date d’opération
          <input id="recoupement-date" name="date_operation" type="date" value={form.date_operation} onChange={onChange} />
        </label>
      </div>

      <div className="declaration-create-grid" style={{ marginTop: '1rem' }}>
        {AMOUNT_FIELDS.map(([name, label]) => (
          <label className="field" htmlFor={`recoupement-${name}`} key={name}>
            {label} (Ar)
            <input id={`recoupement-${name}`} name={name} type="number" min="0" step="0.01" value={form[name]} onChange={onChange} />
          </label>
        ))}
        <div className="sum-field">
          <span>Somme recoupée</span>
          <strong>{Number(form.somme_recoupee || 0).toLocaleString('fr-FR')} Ar</strong>
        </div>
      </div>

      <div className="form-actions">
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Enregistrer le recoupement'}
        </button>
      </div>
    </form>
  );
}
