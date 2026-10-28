import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContribuables } from '@/api/api';
import Pagination from '@/components/common/Pagination';
import { useTablePagination } from '@/hooks/useTablePagination';
import AdminNav from '@/backofficeadmin/components/AdminNav';
import {
  formatDateHeure,
  loadHistorique,
  loadReferentiel,
  mergeReferentiel,
  nifsDepuisContribuables,
} from './verification.utils';

/** Les trois voies de vérification, chacune ouverte sur sa page dédiée. */
const MODULES = [
  {
    id: 'sql',
    to: '/admin/verification-nif/sql',
    couleur: '#2563eb',
    titre: '🔍 1. Vérification par Requête SQL',
    description:
      'Interrogez directement la base de données PostgreSQL pour authentifier un NIF contribuable, avec repli sur le référentiel local.',
  },
  {
    id: 'excel',
    to: '/admin/verification-nif/excel',
    couleur: '#10b981',
    titre: '📊 2. Liaison via Fichier Excel (.xlsx)',
    description:
      'Importez un fichier Excel de contribuables certifiés pour enrichir le référentiel de vérification.',
  },
  {
    id: 'json',
    to: '/admin/verification-nif/json',
    couleur: '#8b5cf6',
    titre: '🌐 3. Synchronisation Base JSON',
    description: 'Liez les NIFs au fichier de référentiel des unités fiscales et centres (unitefiscal.json).',
  },
];

const chargerHistorique = () =>
  MODULES.reduce((accumulateur, module) => {
    accumulateur[module.id] = loadHistorique(module.id);
    return accumulateur;
  }, {});

export default function AdminVerificationNIF({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';

  const [referentiel, setReferentiel] = useState(() => loadReferentiel());
  const [filtreTableau, setFiltreTableau] = useState('');
  // Relu à chaque montage : revenir d'une page dédiée affiche ses nouvelles opérations.
  const [historique] = useState(chargerHistorique);

  useEffect(() => {
    let isMounted = true;

    // Le référentiel s'enrichit des contribuables réellement présents en base.
    getContribuables({ limit: 100 })
      .then((data) => {
        const entrees = nifsDepuisContribuables(data);
        if (!isMounted) return;
        setReferentiel(entrees.length ? mergeReferentiel(entrees) : loadReferentiel());
      })
      .catch(() => {
        if (isMounted) setReferentiel(loadReferentiel());
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const nifsFiltres = useMemo(() => {
    const q = filtreTableau.trim().toLowerCase();
    return referentiel.filter((r) => {
      if (!q) return true;
      return [r.nif, r.raison_sociale, r.centre, r.source].some((v) =>
        String(v || '').toLowerCase().includes(q),
      );
    });
  }, [referentiel, filtreTableau]);

  const pages = useTablePagination(nifsFiltres, 10);

  if (!isAdmin) {
    return (
      <section className="page">
        <p className="error">Cette page est réservée aux administrateurs.</p>
      </section>
    );
  }

  return (
    <section className="page">
      <AdminNav />

      <div className="page-heading">
        <p className="eyebrow">Backoffice Administration</p>
        <h1>Vérification NIF & Liaison Base de Données</h1>
        <p>
          Vérifiez l'existence et l'authenticité d'un NIF en temps réel via requête SQL, import Excel (.xlsx) ou
          synchronisation JSON. Chaque type de vérification s'ouvre sur sa page dédiée.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {MODULES.map((module) => {
          const derniere = historique[module.id]?.[0];

          return (
            <div key={module.id} className="panel" style={{ borderTop: `4px solid ${module.couleur}` }}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 0.5rem' }}>{module.titre}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #666)', margin: '0 0 1rem' }}>
                {module.description}
              </p>
              <p className="status" style={{ fontSize: '0.8rem', margin: '0 0 0.9rem' }}>
                {derniere
                  ? `Dernière opération : ${derniere.label} · ${formatDateHeure(derniere.date)}`
                  : 'Aucune opération enregistrée sur ce navigateur.'}
              </p>
              <Link
                to={module.to}
                className="admin-secondary-button"
                style={{ display: 'block', textAlign: 'center', padding: '0.6rem 0.85rem', fontWeight: 600 }}
              >
                Ouvrir cette vérification →
              </Link>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.15rem' }}>
          Base de Données du Référentiel NIF Certifié
        </h2>

        <div className="datatable-toolbar">
          <input
            value={filtreTableau}
            onChange={(event) => {
              setFiltreTableau(event.target.value);
              pages.setCurrentPage(1);
            }}
            placeholder="Rechercher un NIF : numéro, raison sociale, centre ou source..."
            aria-label="Rechercher dans le référentiel NIF"
          />
          <span>
            {nifsFiltres.length} NIF sur {referentiel.length}
          </span>
          <button
            type="button"
            onClick={() => {
              setFiltreTableau('');
              pages.setCurrentPage(1);
            }}
            disabled={!filtreTableau}
          >
            ✕ Effacer la recherche
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Numéro NIF</th>
                <th>Raison Sociale</th>
                <th>Centre Fiscal Rattaché</th>
                <th>Statut</th>
                <th>Source de Vérification</th>
              </tr>
            </thead>
            <tbody>
              {pages.pageItems.map((item, idx) => (
                <tr key={`${item.nif}-${idx}`} className="admin-row">
                  <td>
                    <code style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e3a8a' }}>{item.nif}</code>
                  </td>
                  <td>
                    <strong>{item.raison_sociale}</strong>
                  </td>
                  <td>
                    <span className="badge conforme">{item.centre}</span>
                  </td>
                  <td>
                    <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.85rem' }}>✓ Certifié</span>
                  </td>
                  <td>
                    <small style={{ color: 'var(--text-muted, #666)' }}>{item.source}</small>
                  </td>
                </tr>
              ))}

              {!nifsFiltres.length && (
                <tr>
                  <td colSpan="5" className="empty" style={{ textAlign: 'center', padding: '2rem' }}>
                    Aucun NIF ne correspond à cette recherche dans le référentiel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={pages.currentPage}
          onPageChange={pages.setCurrentPage}
          totalPages={pages.totalPages}
          showSinglePage={Boolean(nifsFiltres.length)}
        />
      </div>
    </section>
  );
}
