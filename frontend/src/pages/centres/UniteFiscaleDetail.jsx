  import { useEffect, useMemo, useState } from 'react';
  import { Link, useNavigate, useParams } from 'react-router-dom';
  import { getContribuables, getErrorMessage } from '../../api/api';
  import fiscalData from '../../../../unitefiscal.json';

const TYPE_LABELS = {
  dge: 'Direction des Grandes Entreprises',
  sre: 'Service Régional des Entreprises',
  centres_fiscaux: 'Centre Fiscal',
};

const formatTelephone = (telephone) => {
  if (!telephone) return 'Non disponible';
  if (Array.isArray(telephone)) return telephone.join(' / ');
  return telephone;
};

const PAGE_SIZE = 10;

export default function UniteFiscaleDetail() {
  const { type, index } = useParams();
  const navigate = useNavigate();
  const numericIndex = Number(index);
  const unites = fiscalData.unites_operationnelles[type];
  const unite = Number.isInteger(numericIndex) && numericIndex >= 0
    ? unites?.[numericIndex]
    : null;
  const centreFiscalRef = unite ? `${type}:${unite.nom}` : '';
  const [contribuablesResult, setContribuablesResult] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!centreFiscalRef) return undefined;

    let cancelled = false;
    getContribuables({ centre_fiscal_ref: centreFiscalRef, limit: 10000 })
      .then((result) => {
        if (!Array.isArray(result.data)) {
          throw new Error('Format inattendu lors du chargement des contribuables.');
        }
        if (!cancelled) {
          setContribuablesResult({
            reference: centreFiscalRef,
            data: result.data,
            error: '',
          });
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setContribuablesResult({
            reference: centreFiscalRef,
            data: [],
            error: getErrorMessage(requestError),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [centreFiscalRef]);

  const hasCurrentResult = contribuablesResult?.reference === centreFiscalRef;
  const contribuables = useMemo(
    () => (hasCurrentResult ? contribuablesResult.data : []),
    [contribuablesResult, hasCurrentResult],
  );
  const loadingContribuables = Boolean(centreFiscalRef) && !hasCurrentResult;
  const contribuablesError = hasCurrentResult ? contribuablesResult.error : '';

  const filteredContribuables = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr');
    if (!query) return contribuables;

    return contribuables.filter((contribuable) =>
      [
        contribuable.raison_sociale,
        contribuable.nif,
        contribuable.secteur_activite,
        contribuable.regime_fiscal,
        contribuable.email,
        contribuable.telephone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('fr')
        .includes(query)
    );
  }, [contribuables, search]);

  const pageCount = Math.max(1, Math.ceil(filteredContribuables.length / PAGE_SIZE));
  const visibleContribuables = filteredContribuables.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  if (!TYPE_LABELS[type] || !unite) {
    return (
      <section className="page error">
        <h1>Unité fiscale introuvable</h1>
        <p>Cette unité n'existe pas dans unitefiscal.json.</p>
        <Link className="primary detail-back" to="/centres-fiscaux">
          Retour à la liste des centres
        </Link>
      </section>
    );
  }

  const regions = unite.regions_couvertes?.join(', ') || unite.region || 'Non renseignée';

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Fiche du centre · {TYPE_LABELS[type]}</p>
        <h1>{unite.nom}</h1>
        <p>Coordonnées et contribuables rattachés à cette unité fiscale.</p>
      </div>

      <div className="unite-fiscale-summary">
        <div className="unite-fiscale-summary-heading">
          <div>
            <span className="eyebrow">Informations administratives</span>
            <h2>{unite.nom}</h2>
          </div>
          <span className="unite-fiscale-type">{unite.type || TYPE_LABELS[type]}</span>
        </div>
        <dl className="unite-fiscale-details">
          <div><dt>Région(s) couverte(s)</dt><dd>{regions}</dd></div>
          {unite.dri && <div><dt>DRI de rattachement</dt><dd>{unite.dri}</dd></div>}
          <div><dt>Adresse</dt><dd>{unite.adresse || 'Non renseignée'}</dd></div>
          <div><dt>Téléphone</dt><dd>{formatTelephone(unite.telephone)}</dd></div>
          <div><dt>E-mail</dt><dd>{unite.email || 'Non renseigné'}</dd></div>
        </dl>
      </div>

      <div className="unite-fiscale-contribuables">
        <div className="unite-fiscale-table-heading">
          <div>
            <p className="eyebrow">Rattachement</p>
            <h2>Contribuables associés</h2>
            <p>Liste des contribuables rattachés à ce centre.</p>
          </div>
          <span className="unite-fiscale-count">
            {loadingContribuables ? 'Chargement…' : `${filteredContribuables.length} contribuable(s)`}
          </span>
        </div>

        <div className="datatable-toolbar register-toolbar">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par raison sociale, NIF ou secteur..."
            aria-label="Rechercher un contribuable rattaché"
          />
        </div>

        {contribuablesError && <p className="error" role="alert">{contribuablesError}</p>}

        {loadingContribuables ? (
          <p className="status">Chargement des contribuables rattachés...</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="register-table unite-fiscale-contribuables-table">
                <thead>
                  <tr>
                    <th>Raison sociale</th>
                    <th>NIF</th>
                    <th>Secteur d’activité</th>
                    <th>Régime fiscal</th>
                    <th>Téléphone</th>
                    <th>E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleContribuables.map((contribuable) => (
                    <tr
                      key={contribuable.id_contribuable}
                      className="clickable-row"
                      onClick={() => navigate(`/contribuables/${contribuable.id_contribuable}`, {
                        state: { contribuable },
                      })}
                      title="Ouvrir la fiche du contribuable"
                    >
                      <td><strong>{contribuable.raison_sociale}</strong></td>
                      <td>{contribuable.nif}</td>
                      <td>{contribuable.secteur_activite || '—'}</td>
                      <td>{contribuable.regime_fiscal || '—'}</td>
                      <td>{contribuable.telephone || '—'}</td>
                      <td>{contribuable.email || '—'}</td>
                    </tr>
                  ))}
                  {!visibleContribuables.length && (
                    <tr>
                      <td colSpan="6" className="empty">
                        {contribuables.length
                          ? 'Aucun contribuable ne correspond à cette recherche.'
                          : 'Aucun contribuable n’est encore rattaché à ce centre.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredContribuables.length > 0 && (
              <div className="datatable-pagination">
                <span>Page {page} sur {pageCount}</span>
                <div>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                  >
                    ← Précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    disabled={page === pageCount}
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Link className="primary detail-back" to="/centres-fiscaux">
        ← Retour à la liste des centres
      </Link>
    </section>
  );
}
