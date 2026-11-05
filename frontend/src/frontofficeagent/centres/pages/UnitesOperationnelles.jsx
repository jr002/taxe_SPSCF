import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCentres, getErrorMessage } from '@/api';
import { useFiltresUrl } from '@/hooks';
import { cheminUnite, construireUnites } from '@/frontofficeagent/centres/utils/uniteOperationnelle.utils';

const PAGE_SIZE = 10;

/** Rôles voyant tout le registre ; les autres ne voient que leur propre centre. */
const PERIMETRE_COMPLET = ['admin', 'inspecteur'];

const COLONNES = [
  ['nom', 'Unité opérationnelle'],
  ['type', 'Type'],
  ['regions', 'Région(s)'],
  ['dri', 'DRI / rattachement'],
  ['numero', 'N° registre'],
  ['telephone', 'Téléphone'],
  ['email', 'E-mail'],
  ['contribuables', 'Dossiers rattachés'],
];

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('fr');

const getSortableValue = (ligne, field) => {
  if (field === 'contribuables') return ligne.nbContribuables ?? -1;
  if (field === 'numero') return ligne.numero ?? '';
  return ligne[field] ?? '';
};

/**
 * Écran unique des unités opérationnelles : la cartographie institutionnelle
 * (`unitefiscal.json`) et le registre administré (table `centres`) fusionnés
 * ligne à ligne.
 */
export default function UnitesOperationnelles({ currentUser }) {
  const navigate = useNavigate();
  const { lire, patch, page } = useFiltresUrl();
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const search = lire('q', '');
  const typeFilter = lire('type', '');
  const sortField = lire('tri', 'nom');
  const sortDirection = lire('sens', 'asc') === 'desc' ? 'desc' : 'asc';
  const perimetreComplet = PERIMETRE_COMPLET.includes(currentUser?.role);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      setCentres(await getCentres());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const unites = useMemo(() => construireUnites(centres), [centres]);

  const types = useMemo(
    () => [...new Set(unites.map((ligne) => ligne.type).filter(Boolean))].sort(),
    [unites],
  );

  const lignes = useMemo(() => {
    const query = normalizeText(search.trim());

    return unites
      .filter((ligne) => {
        const searchable = normalizeText([
          ligne.nom,
          ligne.type,
          ligne.regions,
          ligne.dri,
          ligne.numero,
          ligne.telephone,
          ligne.email,
        ].filter(Boolean).join(' '));

        return (!query || searchable.includes(query))
          && (!typeFilter || ligne.type === typeFilter);
      })
      .sort((first, second) => {
        const firstValue = getSortableValue(first, sortField);
        const secondValue = getSortableValue(second, sortField);
        const comparison = typeof firstValue === 'number' && typeof secondValue === 'number'
          ? firstValue - secondValue
          : String(firstValue).localeCompare(String(secondValue), 'fr', {
            numeric: true,
            sensitivity: 'base',
          });

        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [search, sortDirection, sortField, typeFilter, unites]);

  const nbEnregistrees = unites.filter((ligne) => ligne.enregistre).length;
  const pageCount = Math.max(1, Math.ceil(lignes.length / PAGE_SIZE));
  const visiblePage = Math.min(page, pageCount);
  const visibleLignes = lignes.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);

  const goToPage = (valeur) => patch({ page: valeur <= 1 ? '' : valeur });

  const changeSort = (field) => {
    const prochainSens = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    patch({
      tri: field === 'nom' ? '' : field,
      sens: prochainSens === 'asc' ? '' : 'desc',
      page: '',
    });
  };

  const sortIndicator = (field) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const renduNumero = (ligne) => {
    if (ligne.numero) return ligne.numero;
    // « non enregistré » ne s'affirme que si l'écran voit l'ensemble du registre.
    if (!perimetreComplet && !ligne.enregistre) return '—';
    return <span className="badge absent">non enregistré</span>;
  };

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Administration fiscale</p>
        <h1>Unités opérationnelles</h1>
        <p>
          {perimetreComplet
            ? `Cartographie institutionnelle et registre administré, sur un seul écran : ${nbEnregistrees} unité(s) enregistrée(s) sur ${unites.length} cartographiée(s).`
            : `Cartographie de ${unites.length} unités ; votre centre y est seul visible du registre.`}
        </p>
      </div>

      <div className="datatable-toolbar register-toolbar">
        <input
          value={search}
          onChange={(event) => patch({ q: event.target.value, page: '' })}
          placeholder="Rechercher une unité, une région, une DRI, un numéro..."
          aria-label="Rechercher une unité opérationnelle"
        />
        <select
          value={typeFilter}
          onChange={(event) => patch({ type: event.target.value, page: '' })}
          aria-label="Filtrer par type d'unité"
        >
          <option value="">Tous les types</option>
          {types.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <button type="button" onClick={loadData} disabled={loading}>Actualiser</button>
        <span>{lignes.length} unité(s)</span>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {loading ? (
        <p className="status" role="status">Chargement des unités opérationnelles...</p>
      ) : (
        <>
          <div className="table-wrap">
            <table aria-label="Unités opérationnelles" className="register-table">
              <thead>
                <tr>
                  {COLONNES.map(([field, label]) => (
                    <th
                      key={field}
                      aria-sort={
                        sortField !== field
                          ? 'none'
                          : sortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                      }
                    >
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() => changeSort(field)}
                      >
                        {label} <span aria-hidden="true">{sortIndicator(field)}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleLignes.map((ligne) => (
                  <tr
                    key={ligne.reference}
                    className="clickable-row"
                    onClick={() => navigate(cheminUnite(ligne))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(cheminUnite(ligne));
                      }
                    }}
                    tabIndex="0"
                    title={`Voir la fiche de ${ligne.nom}`}
                  >
                    <td><strong>{ligne.nom}</strong></td>
                    <td>{ligne.type}</td>
                    <td>{ligne.regions || '—'}</td>
                    <td>{ligne.dri || '—'}</td>
                    <td>{renduNumero(ligne)}</td>
                    <td>{ligne.telephone || '—'}</td>
                    <td>{ligne.email || '—'}</td>
                    <td>{ligne.nbContribuables ?? '—'}</td>
                  </tr>
                ))}
                {!visibleLignes.length && (
                  <tr>
                    <td colSpan={COLONNES.length} className="empty">
                      Aucune unité ne correspond aux filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="datatable-pagination">
            <span>Page {visiblePage} sur {pageCount}</span>
            <div>
              <button
                type="button"
                onClick={() => goToPage(visiblePage - 1)}
                disabled={visiblePage === 1}
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={() => goToPage(visiblePage + 1)}
                disabled={visiblePage === pageCount}
              >
                Suivant →
              </button>
            </div>
          </div>
        </>
      )}

      <div className="home-footer-note">
        <button
          className="detail-close"
          onClick={() => navigate('/accueil')}
          title="Retourner à l'accueil"
        >
          ←
        </button>
        <p><strong>Retourner</strong> à la page d'accueil</p>
      </div>
    </section>
  );
}
