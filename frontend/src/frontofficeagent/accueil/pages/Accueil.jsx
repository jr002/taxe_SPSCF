import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoDgi from '@/assets/logodgi.jpg';
import { DataTable } from '@/components/common';
import {
  getDeclarationStats,
  getErrorMessage,
  getRelanceStats,
  getRapprochementStats,
} from '@/api';
import useFileTravail from '@/frontofficeagent/file-travail/hooks/useFileTravail';
import {
  PRIORITES,
  compterParPriorite,
  libelleEcheance,
} from '@/frontofficeagent/file-travail/utils/fileTravail.utils';
import { formatAriary, toNumber } from '@/utils';

const dateDuJour = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const statutRelance = (relances, statut) =>
  toNumber(relances?.par_statut?.find((entree) => entree.statut === statut)?.total);

/**
 * Accueil agent : un poste de travail, pas une vitrine.
 *
 * La page répond d'abord à « qu'est-ce que je dois traiter ? » (compteurs,
 * priorités, premiers actes de la file), puis offre les accès rapides.
 */
export default function Accueil({ currentUser = null }) {
  const navigate = useNavigate();
  const file = useFileTravail();
  const [stats, setStats] = useState({ declarations: null, rapprochements: null, relances: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let monte = true;

    const charger = async () => {
      const resultats = await Promise.allSettled([
        getDeclarationStats(),
        getRapprochementStats(),
        getRelanceStats(),
      ]);
      if (!monte) return;
      const valeur = (index) => (resultats[index].status === 'fulfilled' ? resultats[index].value : null);
      setStats({
        declarations: valeur(0),
        rapprochements: valeur(1),
        relances: valeur(2),
      });
      if (resultats.every((resultat) => resultat.status === 'rejected')) {
        setError(getErrorMessage(resultats[0].reason));
      }
      setLoading(false);
    };

    void charger();
    return () => {
      monte = false;
    };
  }, []);

  const { declarations, rapprochements, relances } = stats;
  const compteurs = useMemo(() => compterParPriorite(file.actes), [file.actes]);
  const prochainsActes = file.actes.slice(0, 5);

  const compteursGlobaux = useMemo(() => ({
    aVerifier: toNumber(rapprochements?.a_verifier) + toNumber(rapprochements?.ecart),
    relancesSansReponse: statutRelance(relances, 'emise'),
    montantDu: toNumber(relances?.montant_total_du),
  }), [rapprochements, relances]);

  const aTraiter = file.actes.length;
  const prenom = currentUser?.prenom || '';
  const perimetre = currentUser?.nom_centre || 'Administration centrale';
  const mention = loading || file.loading
    ? 'Préparation de vos dossiers à traiter…'
    : aTraiter === 0
      ? 'Aucun acte en attente : votre périmètre est à jour.'
      : `${aTraiter} acte(s) à poser dans votre périmètre.`;

  return (
    <div className="home-page workbench">
      <section className="workbench-brief">
        <div className="workbench-brief-identite">
          <img
            className="workbench-brief-logo"
            src={logoDgi}
            alt="Logo de la Direction Générale des Impôts"
            width="48"
            height="48"
          />
          <div className="workbench-brief-copy">
            <p className="workbench-brief-institution">République de Madagascar · DGI</p>
            <p className="eyebrow">Espace agent · {perimetre}</p>
            <h1>{prenom ? `Bonjour, ${prenom}.` : 'Bonjour.'}</h1>
            <p className="workbench-mention">{mention}</p>
          </div>
        </div>
        <p className="workbench-date">{dateDuJour.format(new Date())}</p>
      </section>

      {(error || file.error) && (
        <p className="status error" role="alert">{error || file.error}</p>
      )}

      <section className="kpis" aria-label="Indicateurs du périmètre">
        <article>
          <span>TVA déclarée</span>
          <strong>{loading ? '—' : formatAriary(declarations?.tva_totale)}</strong>
          <small>{toNumber(declarations?.total)} déclaration(s) suivie(s)</small>
        </article>
        <article>
          <span>Écart de TVA</span>
          <strong>{loading ? '—' : formatAriary(declarations?.ecart_total)}</strong>
          <small>TVA théorique − TVA payée</small>
        </article>
        <article>
          <span>Rapprochements à traiter</span>
          <strong>{loading ? '—' : compteursGlobaux.aVerifier}</strong>
          <small>{toNumber(rapprochements?.actifs)} rapprochement(s) actif(s)</small>
        </article>
        <article>
          <span>Relances sans réponse</span>
          <strong>{loading ? '—' : compteursGlobaux.relancesSansReponse}</strong>
          <small>{formatAriary(compteursGlobaux.montantDu)} de montant dû</small>
        </article>
      </section>

      <section className="workbench-grid" aria-label="Priorités">
        <Link className="workbench-card workbench-card-alert" to="/file-de-travail?priorite=1">
          <span className="workbench-card-count">{file.loading ? '—' : compteurs[1]}</span>
          <strong>Actes en retard</strong>
          <small>Un délai est échu : la suite de la procédure doit être engagée.</small>
          <span className="workbench-card-link">Ouvrir la file de travail →</span>
        </Link>
        <Link className="workbench-card" to="/file-de-travail?priorite=2">
          <span className="workbench-card-count">{file.loading ? '—' : compteurs[2]}</span>
          <strong>À traiter cette semaine</strong>
          <small>Échéance proche ou écart confirmé : à préparer avant la fin de la semaine.</small>
          <span className="workbench-card-link">Voir les actes concernés →</span>
        </Link>
      </section>

      <section className="panel workbench-panel">
        <header className="workbench-panel-header">
          <div>
            <p className="eyebrow">File de travail</p>
            <h2>Les actes les plus urgents</h2>
          </div>
          <Link to="/file-de-travail">Toute la file →</Link>
        </header>

        <DataTable
          ariaLabel="Actes les plus urgents"
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
          rows={prochainsActes}
          rowKey={(acte) => acte.id}
          onRowClick={(acte) => navigate(acte.to)}
          loading={file.loading}
          loadingMessage="Construction de la file de travail…"
          emptyMessage="Aucun acte en attente dans votre périmètre."
        />
      </section>

      <section className="workbench-actions" aria-label="Accès rapides">
        <Link to="/collecte">
          <strong>Nouvelle collecte</strong>
          <span>Saisir une déclaration et calculer la TVA</span>
        </Link>
        <Link to="/entreprises/nouveau">
          <strong>Nouveau contribuable</strong>
          <span>Créer une fiche assujettie à la TVA</span>
        </Link>
        <Link to="/register">
          <strong>Registre</strong>
          <span>Parcourir les contribuables par centre</span>
        </Link>
      </section>
    </div>
  );
}
