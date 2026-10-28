import { Link } from 'react-router-dom';

import ExportFicheButton from './ExportFicheButton';

const tabs = [
  ['overview', 'Synthèse', ''],
  ['classification', 'Nature d’impôt', '/classification'],
  ['declarations', 'Déclarations', '/declarations'],
  ['recoupements', 'Recoupements', '/recoupements'],
  ['droits', 'Droits de communication', '/droits-communication'],
  ['relances', 'Relances', '/relances'],
];

const STRUCTURE_LABELS = {
  centre_fiscal: 'Centre fiscal',
  centres_fiscaux: 'Centre fiscal',
  sre: 'SRE',
  dge: 'DGE',
};

function getOperationalUnit(contribuable) {
  const centreFiscalRef = contribuable.centre_fiscal_ref?.trim();
  if (centreFiscalRef) {
    const separatorIndex = centreFiscalRef.indexOf(':');
    const structureKey = separatorIndex >= 0
      ? centreFiscalRef.slice(0, separatorIndex).trim().toLocaleLowerCase('fr')
      : '';
    const structureLabel = STRUCTURE_LABELS[structureKey];

    return {
      structure: structureLabel || contribuable.centres?.type_centre || '',
      name: structureLabel && separatorIndex >= 0
        ? centreFiscalRef.slice(separatorIndex + 1).trim()
        : centreFiscalRef,
    };
  }

  if (contribuable.centres?.nom_centre) {
    return {
      structure: contribuable.centres.type_centre || '',
      name: contribuable.centres.nom_centre,
    };
  }

  return null;
}

export default function ContribuableHeader({ activeTab, contribuable, declarationsCount, exportDisabled, exportLabel, exportTitle, fiche, id, onExport, onPartager }) {
  const operationalUnit = getOperationalUnit(contribuable);

  return <>
    <Link className="detail-back-link" to="/contribuables">← Retour aux contribuables</Link>
    <div className="page-heading declaration-page-heading">
      <p className="eyebrow">Fiche contribuable</p>
      <div className="contribuable-heading-row">
        <h1>{contribuable.raison_sociale || 'Contribuable'}<span className="categorie-badge-inline" style={{ background: fiche.background, color: fiche.couleur }}>{fiche.label}</span></h1>
        <div className="contribuable-heading-actions">
          <button
            type="button"
            className="secondary"
            onClick={onPartager}
            title="Émettre un lien de consultation en lecture seule pour ce contribuable"
          >
            Lien contribuable
          </button>
          {!['recoupements', 'droits'].includes(activeTab) && (
            <ExportFicheButton
              disabled={exportDisabled}
              label={exportLabel}
              onExport={onExport}
              title={exportTitle}
            />
          )}
        </div>
      </div>
      <p>NIF : {contribuable.nif || 'N/A'} · {declarationsCount} année(s) suivie(s)</p>
      <div className="contribuable-operational-unit" aria-label="Centre gestionnaire du contribuable">
        <span>Centre gestionnaire</span>
        {operationalUnit ? (
          <strong>
            {operationalUnit.structure && <span>{operationalUnit.structure}</span>}
            {operationalUnit.name && <span>{operationalUnit.name}</span>}
          </strong>
        ) : (
          <strong className="operational-unit-empty">Non renseigné</strong>
        )}
      </div>
    </div>
    <nav className="contribuable-tabs" aria-label="Sections de la fiche contribuable">
      {tabs.map(([tab, label, suffix]) => <Link className={activeTab === tab ? 'active' : ''} key={tab} to={`/contribuables/${id}${suffix}`}>{label}</Link>)}
    </nav>
  </>;
}
