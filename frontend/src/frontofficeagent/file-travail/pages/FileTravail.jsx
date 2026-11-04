import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable } from '@/components/common';
import useFileTravail from '@/frontofficeagent/file-travail/hooks/useFileTravail';
import {
  CATEGORIES,
  PRIORITES,
  compterParPriorite,
  libelleEcheance,
} from '@/frontofficeagent/file-travail/utils/fileTravail.utils';
import { formatAriary, readSearchParam, updateSearchParams } from '@/utils';

const PAGE_SIZE = 10;

const valeursRecherchees = (acte) => [
  acte.acte,
  acte.motif,
  acte.contribuable?.nom,
  acte.contribuable?.nif,
];

/**
 * File de travail : les actes à poser, du plus urgent au plus récent.
 * Catégorie, priorité, recherche et page vivent dans l'URL.
 */
export default function FileTravail() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { actes, loading, error, recharger } = useFileTravail();

  const categorie = readSearchParam(searchParams, 'categorie', '');
  const priorite = readSearchParam(searchParams, 'priorite', '');
  const recherche = readSearchParam(searchParams, 'q', '');
  const pageDemandee = Number(searchParams.get('page')) || 1;

  const patchParams = (changes) => {
    setSearchParams(updateSearchParams(searchParams, changes), { replace: true });
  };

  const lignesFiltrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return actes.filter((acte) => {
      if (categorie && acte.categorie !== categorie) return false;
      if (priorite && String(acte.priorite) !== priorite) return false;
      if (!terme) return true;
      return valeursRecherchees(acte).some((valeur) => String(valeur || '').toLowerCase().includes(terme));
    });
  }, [actes, categorie, priorite, recherche]);

  const compteurs = useMemo(() => compterParPriorite(actes), [actes]);
  const totalPages = Math.max(1, Math.ceil(lignesFiltrees.length / PAGE_SIZE));
  const page = Math.min(pageDemandee, totalPages);
  const lignes = lignesFiltrees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const aDesFiltres = categorie !== '' || priorite !== '' || recherche.trim() !== '';

  return (
    <section className="page file-travail-page">
      <div className="page-heading">
        <p className="eyebrow">Pilotage quotidien</p>
        <h1>File de travail</h1>
        <p>
          Les actes à poser sur vos dossiers, du plus urgent au plus récent. Une ligne vaut une
          décision : cliquez pour ouvrir le dossier et agir.
        </p>
      </div>

      {error && (
        <p className="status error" role="alert">{error}</p>
      )}

      <div className="register-toolbar">
        <input
          type="search"
          value={recherche}
          placeholder="Rechercher un contribuable, un NIF ou un acte"
          aria-label="Rechercher dans la file de travail"
          onChange={(event) => patchParams({ q: event.target.value, page: '' })}
        />
        <select
          value={categorie}
          aria-label="Filtrer par catégorie d'acte"
          onChange={(event) => patchParams({ categorie: event.target.value, page: '' })}
        >
          <option value="">Toutes les catégories</option>
          {Object.entries(CATEGORIES).map(([valeur, label]) => (
            <option key={valeur} value={valeur}>{label}</option>
          ))}
        </select>
        <select
          value={priorite}
          aria-label="Filtrer par priorité"
          onChange={(event) => patchParams({ priorite: event.target.value, page: '' })}
        >
          <option value="">Toutes les priorités</option>
          {Object.entries(PRIORITES).map(([valeur, definition]) => (
            <option key={valeur} value={valeur}>{definition.label}</option>
          ))}
        </select>
        <span>
          {lignesFiltrees.length} / {actes.length} acte(s)
        </span>
        {aDesFiltres && (
          <button type="button" onClick={() => patchParams({ q: '', categorie: '', priorite: '', page: '' })}>
            ✕ Effacer
          </button>
        )}
        <button type="button" onClick={recharger}>Actualiser</button>
      </div>

      <div className="file-travail-chips" aria-label="Répartition par priorité">
        {Object.entries(PRIORITES).map(([valeur, definition]) => (
          <button
            key={valeur}
            type="button"
            className={priorite === valeur ? `active ${definition.className}` : definition.className}
            onClick={() => patchParams({ priorite: priorite === valeur ? '' : valeur, page: '' })}
          >
            {definition.label} <strong>{compteurs[valeur] || 0}</strong>
          </button>
        ))}
      </div>

      <DataTable
        ariaLabel="Actes à poser"
        columns={[
          {
            key: 'priorite',
            label: 'Priorité',
            render: (acte) => (
              <span className={`file-priorite ${PRIORITES[acte.priorite].className}`}>
                {PRIORITES[acte.priorite].label}
              </span>
            ),
          },
          {
            key: 'echeance',
            label: 'Échéance',
            className: 'file-echeance',
            render: (acte) => {
              const echeance = libelleEcheance(acte.echeance);
              return (
                <>
                  {echeance.texte}
                  {echeance.detail && <small>{echeance.detail}</small>}
                </>
              );
            },
          },
          {
            key: 'acte',
            label: 'Acte à poser',
            render: (acte) => (
              <>
                <strong>{acte.acte}</strong>
                <small>{acte.motif}</small>
              </>
            ),
          },
          {
            key: 'contribuable',
            label: 'Contribuable',
            render: (acte) => (
              <>
                {acte.contribuable?.nom || '—'}
                <small>{acte.contribuable?.nif || '—'}</small>
              </>
            ),
          },
          {
            key: 'montant',
            label: 'Montant',
            className: 'file-montant',
            render: (acte) => formatAriary(acte.montant),
          },
          {
            key: 'action',
            label: '',
            render: (acte) => (
              <button type="button" className="table-action">{acte.action}</button>
            ),
          },
        ]}
        rows={lignes}
        rowKey={(acte) => acte.id}
        onRowClick={(acte) => navigate(acte.to)}
        loading={loading}
        loadingMessage="Construction de la file de travail…"
        emptyMessage="Votre file est vide : aucun acte n’attend d’être posé."
        filteredEmptyMessage="Aucun acte ne correspond à ces filtres."
        isFiltered={aDesFiltres && actes.length > 0}
        pagination={{ page, totalPages, onPageChange: (valeur) => patchParams({ page: valeur <= 1 ? '' : valeur }) }}
      />
    </section>
  );
}
