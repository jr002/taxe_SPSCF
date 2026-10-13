import { Link } from 'react-router-dom';

import ExportFicheButton from './ExportFicheButton';

const tabs = [
  ['overview', 'Synthèse', ''],
  ['classification', 'Régime fiscal', '/classification'],
  ['declarations', 'Déclarations', '/declarations'],
  ['relances', 'Relances', '/relances'],
];

export default function ContribuableHeader({ activeTab, contribuable, declarationsCount, exportDisabled, exportLabel, exportTitle, fiche, id, onExport, onToggleDeclarationForm, showDeclarationForm }) {
  return <>
    <Link className="detail-back-link" to="/contribuables">← Retour aux contribuables</Link>
    <div className="page-heading declaration-page-heading">
      <p className="eyebrow">Fiche contribuable</p>
      <div className="contribuable-heading-row">
        <h1>{contribuable.raison_sociale || 'Contribuable'}<span className="categorie-badge-inline" style={{ background: fiche.background, color: fiche.couleur }}>{fiche.label}</span></h1>
        <div className="contribuable-heading-actions">
          <ExportFicheButton
            disabled={exportDisabled}
            label={exportLabel}
            onExport={onExport}
            title={exportTitle}
          />
          {activeTab === 'declarations' ? <button type="button" className="primary add-declaration-button" onClick={onToggleDeclarationForm}>{showDeclarationForm ? 'Annuler' : '+ Ajouter une déclaration'}</button> : <Link className="primary add-declaration-button" to={`/contribuables/${id}/declarations`}>Voir les déclarations</Link>}
        </div>
      </div>
      <p>NIF : {contribuable.nif || 'N/A'} · {declarationsCount} année(s) suivie(s)</p>
    </div>
    <nav className="contribuable-tabs" aria-label="Sections de la fiche contribuable">
      {tabs.map(([tab, label, suffix]) => <Link className={activeTab === tab ? 'active' : ''} key={tab} to={`/contribuables/${id}${suffix}`}>{label}</Link>)}
    </nav>
  </>;
}
