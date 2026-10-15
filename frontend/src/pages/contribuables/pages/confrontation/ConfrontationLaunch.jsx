export default function ConfrontationLaunch({ contribuable, periode, onPeriodeChange, loading, result, error, onLaunch, onShowList }) {
  return <div>
    <div className="cf-ccard">
      <p className="eyebrow">Contribuable sélectionné</p>
      <h2>{contribuable.raison_sociale}</h2>
      <div className="cf-contrib-info"><span>NIF : <strong>{contribuable.nif}</strong></span><span>Régime : <strong>{contribuable.regime_fiscal || '—'}</strong></span><span>Secteur : <strong>{contribuable.secteur_activite || '—'}</strong></span></div>
    </div>
    <div className="cf-form">
      <div className="section-heading"><span className="section-number">1</span><div><h2>Paramètres de la confrontation</h2><p>Sélectionnez la période TVA à analyser.</p></div></div>
      <div className="cf-two-columns">
        <label className="field" htmlFor="cf-periode">Période (AAAA-MM)<input id="cf-periode" type="month" value={periode} onChange={(event) => onPeriodeChange(event.target.value)} required /></label>
        <label className="field" htmlFor="cf-type">Type de déclaration<input id="cf-type" value="TVA" readOnly /></label>
      </div>
      <div className="rule-box"><strong>Comment fonctionne la confrontation ?</strong><span>Le moteur compare les déclarations et recoupements en appliquant les règles exacte, avec tolérance, partielle ou d’écart.</span></div>
      <div className="form-actions"><button className="primary" type="button" onClick={onLaunch} disabled={loading || !periode}>{loading ? 'Analyse en cours…' : 'Lancer la confrontation'}</button></div>
    </div>
    {error && <p className="form-submit-message error" role="alert">{error}</p>}
    {result && <div className="result-card success"><h3>Confrontation terminée</h3><p>{result.count ?? result.total ?? '—'} rapprochement(s) traité(s).</p><button type="button" className="primary" onClick={onShowList}>Voir les rapprochements</button></div>}
  </div>;
}
