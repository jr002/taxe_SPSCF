import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoDgi from '@/assets/logodgi.jpg';
import { DataTable } from '@/components/common';
import {
  getDeclarationStats,
  getErrorMessage,
  getRelanceStats,
} from '@/api';
import useFileTravail from '@/frontofficeagent/file-travail/hooks/useFileTravail';
import {
  PRIORITES,
  compterParPriorite,
  libelleEcheance,
} from '@/frontofficeagent/file-travail/utils/fileTravail.utils';
import { formatAriary, formatNumber, toNumber } from '@/utils';

const dateDuJour = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const statutRelance = (relances, statut) =>
  toNumber(relances?.par_statut?.find((entree) => entree.statut === statut)?.total);

const montantRelanceStatut = (relances, statut) =>
  toNumber(relances?.par_statut?.find((entree) => entree.statut === statut)?.montant);

/**
 * Accueil agent : un poste de travail, pas une vitrine.
 *
 * La page met d'abord en évidence les risques, la conformité, les retards et
 * les défaillances, puis les actes prioritaires et les accès rapides.
 */
export default function Accueil({ currentUser = null }) {
  const navigate = useNavigate();
  const file = useFileTravail();
  const [stats, setStats] = useState({ declarations: null, relances: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let monte = true;

    const charger = async () => {
      const resultats = await Promise.allSettled([
        getDeclarationStats(),
        getRelanceStats(),
      ]);
      if (!monte) return;
      const valeur = (index) => (resultats[index].status === 'fulfilled' ? resultats[index].value : null);
      setStats({
        declarations: valeur(0),
        relances: valeur(1),
      });
      const echec = resultats.find((resultat) => resultat.status === 'rejected');
      if (echec) {
        setError(getErrorMessage(echec.reason));
      }
      setLoading(false);
    };

    void charger();
    return () => {
      monte = false;
    };
  }, []);

  const { declarations, relances } = stats;
  const compteurs = useMemo(() => compterParPriorite(file.actes), [file.actes]);
  const prochainsActes = file.actes.slice(0, 5);

  const compteursGlobaux = useMemo(() => ({
    relancesEnCours: statutRelance(relances, 'emise'),
    montantRelancesEnCours: montantRelanceStatut(relances, 'emise'),
  }), [relances]);

  const aTraiter = file.actes.length;
  const declarationsDisponibles = declarations !== null;
  const relancesDisponibles = relances !== null;
  const alertes = toNumber(declarations?.alertes);
  const critiques = toNumber(declarations?.critiques);
  // Même écriture que le profil de la barre : prénom + nom tels qu'en base,
  // l'e-mail en repli quand un des deux manque.
  const identite = currentUser
    ? `${currentUser.prenom ?? ''} ${currentUser.nom ?? ''}`.trim() || currentUser.email || ''
    : '';
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
            <h1>{identite ? `Bonjour, ${identite}.` : 'Bonjour.'}</h1>
            {currentUser?.email && (
              <p className="workbench-compte">{currentUser.email}</p>
            )}
            <p className="workbench-mention">{mention}</p>
          </div>
        </div>
        <p className="workbench-date">{dateDuJour.format(new Date())}</p>
      </section>

      {(error || file.error) && (
        <p className="status error" role="alert">{error || file.error}</p>
      )}

      <section className="workbench-priorites" aria-labelledby="workbench-priorites-title">
        <header className="workbench-priorites-header">
          <div>
            <p className="eyebrow">Vue prioritaire du périmètre</p>
            <h2 id="workbench-priorites-title">Analyse des risques et suivi</h2>
          </div>
          <Link to="/decisionnel">Statistiques détaillées →</Link>
        </header>
        <div className="workbench-grid" aria-label="Risques, conformité, retards et défaillances">
          <Link className="workbench-card workbench-card-alert" to="/suivi">
            <span className="workbench-card-count">
              {loading || !declarationsDisponibles ? '—' : formatNumber(alertes + critiques)}
            </span>
            <strong>Déclarations à risque</strong>
            <small>
              {loading || !declarationsDisponibles
                ? 'Alertes et dossiers critiques'
                : `${formatNumber(alertes)} alertes · ${formatNumber(critiques)} critiques`}
            </small>
            <span className="workbench-card-link">Ouvrir le suivi fiscal →</span>
          </Link>
          <Link className="workbench-card workbench-card-conformity" to="/suivi">
            <span className="workbench-card-count">
              {loading || !declarationsDisponibles ? '—' : formatNumber(toNumber(declarations?.conformes))}
            </span>
            <strong>Déclarations conformes</strong>
            <small>Déclarations enregistrées sans alerte ni statut critique.</small>
            <span className="workbench-card-link">Consulter les dossiers →</span>
          </Link>
          <Link className="workbench-card workbench-card-delay" to="/file-de-travail?priorite=1">
            <span className="workbench-card-count">
              {file.loading ? '—' : formatNumber(compteurs[1])}
            </span>
            <strong>Actes en retard</strong>
            <small>Une échéance est dépassée : une action est attendue.</small>
            <span className="workbench-card-link">Traiter les retards →</span>
          </Link>
          <Link className="workbench-card workbench-card-default" to="/relance">
            <span className="workbench-card-count">
              {loading || !relancesDisponibles ? '—' : formatNumber(compteursGlobaux.relancesEnCours)}
            </span>
            <strong>Relances en cours</strong>
            <small>
              {loading || !relancesDisponibles
                ? 'Défaillances à suivre'
                : `Défaillances à suivre · montant des relances : ${formatAriary(compteursGlobaux.montantRelancesEnCours)}`}
            </small>
            <span className="workbench-card-link">Ouvrir les relances →</span>
          </Link>
        </div>
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
        <Link to="/unites-operationnelles">
          <strong>Unités opérationnelles</strong>
          <span>Ouvrir un centre et ses dossiers rattachés</span>
        </Link>
      </section>
    </div>
  );
}
