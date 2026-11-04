import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContribuables } from '@/api';
import { AccesRefuse, Pagination } from '@/components/common';
import { useTablePagination, useFiltresUrl } from '@/hooks';
import AdminNav from '@/backofficeadmin/components/AdminNav';
import {
  estNifConfirme,
  formatDateHeure,
  loadHistorique,
  loadReferentiel,
  mergeReferentiel,
  nifsDepuisContribuables,
} from '@/backofficeadmin/verification-nif/utils/verification.utils';

/** Les trois voies de vérification, chacune ouverte sur sa page dédiée. */
const MODULES = [
  {
    id: 'sql',
    to: '/admin/verification-nif/sql',
    couleur: '#2563eb',
    titre: '🔍 1. Vérification par Requête SQL',
    description:
      "Interrogez la base contribuable par son API pour authentifier un NIF, ou écrivez un SELECT de liste. Sans réponse de la base, le référentiel local sert de repli et le signale.",
  },
  {
    id: 'excel',
    to: '/admin/verification-nif/excel',
    couleur: '#10b981',
    titre: '📊 2. Liaison via Fichier Excel (.xlsx)',
    description:
      'Enrichissez le référentiel avec un fichier Excel de NIFs. Les lignes portent le statut « Déclaré par le fichier » : un fichier ne certifie rien, il affirme ce que son auteur y a écrit.',
  },
  {
    id: 'json',
    to: '/admin/verification-nif/json',
    couleur: '#8b5cf6',
    titre: '🌐 3. Synchronisation Base JSON',
    description:
      'Liez le référentiel à un fichier JSON déposé dans le dossier public ou à une API distante. Le catalogue des unités fiscales (unitefiscal.json) ne contient aucun NIF de contribuable.',
  },
];

const chargerHistorique = () =>
  MODULES.reduce((accumulateur, module) => {
    accumulateur[module.id] = loadHistorique(module.id);
    return accumulateur;
  }, {});

/**
 * Ce que la base contribuable a répondu au dernier essai. Le référentiel affiché
 * est un cache du navigateur : sans lecture réussie, aucune de ses lignes n'a été
 * confirmée, et il faut le dire plutôt que de rendre un `✓ Certifié` muet.
 */
const ETAT_BASE = {
  inconnu: 'inconnu',
  connectee: 'connectee',
  vide: 'vide',
  injouable: 'injouable',
};

export default function AdminVerificationNIF({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';

  const { lire, patch, page } = useFiltresUrl();
  const [referentiel, setReferentiel] = useState(() => loadReferentiel());
  const [etatBase, setEtatBase] = useState(ETAT_BASE.inconnu);
  const [lectureBaseLe, setLectureBaseLe] = useState(null);
  const filtreTableau = lire('q', '');
  // Relu à chaque montage : revenir d'une page dédiée affiche ses nouvelles opérations.
  const [historique] = useState(chargerHistorique);

  useEffect(() => {
    let isMounted = true;

    // Le référentiel s'enrichit des contribuables réellement présents en base.
    getContribuables({ limit: 100 })
      .then((data) => {
        if (!isMounted) return;
        const entrees = nifsDepuisContribuables(data);
        setReferentiel(entrees.length ? mergeReferentiel(entrees) : loadReferentiel());
        setEtatBase(entrees.length ? ETAT_BASE.connectee : ETAT_BASE.vide);
        setLectureBaseLe(new Date());
      })
      .catch(() => {
        if (!isMounted) return;
        setReferentiel(loadReferentiel());
        setEtatBase(ETAT_BASE.injouable);
        setLectureBaseLe(null);
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

  const pages = useTablePagination(nifsFiltres, 10, {
    page,
    onPageChange: (valeur) => patch({ page: valeur <= 1 ? '' : valeur }),
  });

  const confirmes = referentiel.filter(estNifConfirme).length;

  if (!isAdmin) {
    return (
      <AccesRefuse
        currentUser={currentUser}
        titre="Vérification NIF non accessible"
        message="Contrôler un NIF, importer un référentiel ou interroger la liaison à la base relèvent de l'administrateur. Les rôles opérationnels lisent le NIF enregistré sur la fiche du contribuable."
      />
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

      <div className="verif-modules">
        {MODULES.map((module) => {
          const derniere = historique[module.id]?.[0];

          return (
            <div
              key={module.id}
              className="panel verif-module"
              style={{ '--verif-accent': module.couleur }}
            >
              <h2>{module.titre}</h2>
              <p>{module.description}</p>
              <p className="status" role="status">
                {derniere
                  ? `Dernière opération : ${derniere.label} · ${formatDateHeure(derniere.date)}`
                  : 'Aucune opération enregistrée sur ce navigateur.'}
              </p>
              <Link to={module.to} className="admin-secondary-button">
                Ouvrir cette vérification →
              </Link>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <h2>Référentiel NIF</h2>

        {/* Le référentiel est un cache du navigateur : ce qu'il dit de chaque NIF
            dépend entièrement de la dernière lecture de la base contribuable. */}
        {etatBase === ETAT_BASE.connectee ? (
          <p className="status" role="status">
            {confirmes} NIF confirmé(s) par la base contribuable · dernière lecture{' '}
            {formatDateHeure(lectureBaseLe)}. Les autres lignes viennent d’un fichier ou d’une API
            déclarée ici : elles sont déclarées, pas certifiées.
          </p>
        ) : etatBase === ETAT_BASE.injouable ? (
          <p className="error" role="alert">
            Base contribuable injoignable : rien de ce tableau n’a été confirmé par la base. Seules
            les sources liées sur ce navigateur (fichier Excel, API JSON) peuvent s’afficher ici.
          </p>
        ) : etatBase === ETAT_BASE.vide ? (
          <p className="error" role="alert">
            La base contribuable ne renvoie encore aucun NIF et aucune source n’a été liée sur ce
            navigateur : le référentiel est vide.
          </p>
        ) : null}

        <div className="datatable-toolbar">
          <input
            value={filtreTableau}
            onChange={(event) => patch({ q: event.target.value, page: '' })}
            placeholder="Rechercher un NIF : numéro, raison sociale, centre ou source..."
            aria-label="Rechercher dans le référentiel NIF"
          />
          <span>
            {nifsFiltres.length} NIF sur {referentiel.length} · {confirmes} confirmé(s)
          </span>
          <button
            type="button"
            onClick={() => patch({ q: '', page: '' })}
            disabled={!filtreTableau}
          >
            ✕ Effacer la recherche
          </button>
        </div>

        <div className="table-wrap">
          <table aria-label="Vérifications de NIF enregistrées">
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
                    <code className="verif-nif">{item.nif}</code>
                  </td>
                  <td>
                    <strong>{item.raison_sociale}</strong>
                  </td>
                  <td>
                    <span className="badge conforme">{item.centre}</span>
                  </td>
                  <td>
                    {estNifConfirme(item) ? (
                      <span className="verif-certifie">✓ {item.statut}</span>
                    ) : (
                      <span className="badge surveillance">{item.statut || 'Statut inconnu'}</span>
                    )}
                  </td>
                  <td>
                    <small>{item.source}</small>
                  </td>
                </tr>
              ))}

              {!nifsFiltres.length && (
                <tr>
                  <td colSpan="5" className="empty">
                    {referentiel.length
                      ? 'Aucun NIF ne correspond à cette recherche dans le référentiel.'
                      : 'Référentiel vide : aucune ligne confirmée par la base et aucune source liée sur ce navigateur.'}
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
