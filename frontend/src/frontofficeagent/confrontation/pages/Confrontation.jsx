import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import {
  autoRapprocherContribuable,
  getApercuConfrontation,
  getContribuableById,
  getErrorMessage,
  getRapprochementById,
  getRapprochements,
  getRapprochementStats,
  updateRapprochementStatut,
} from '@/api';
import { useFiltresUrl } from '@/hooks';
import { AideLectureModal, BoutonAide } from '@/frontofficeagent/aide';
import ConfrontationLaunch from '@/frontofficeagent/confrontation/pages/ConfrontationLaunch.jsx';
import RapprochementsList from '@/frontofficeagent/confrontation/pages/RapprochementsList.jsx';
import RapprochementDetail from '@/frontofficeagent/confrontation/pages/RapprochementDetail.jsx';
import Synthese from '@/frontofficeagent/confrontation/pages/Synthese.jsx';
import { statusLabel } from '@/frontofficeagent/confrontation/utils/confrontation.utils.js';

const tabs = [['confrontation', 'Confrontation'], ['synthese', 'Synthèse'], ['liste', 'Rapprochements']];
const VUES = ['confrontation', 'synthese', 'liste', 'detail'];
/** Clé d'URL portant chaque filtre de la liste des rapprochements. */
const CLE_FILTRE = { search: 'q', periode: 'periode', statut: 'statut', type: 'type' };

export default function Confrontation({ currentUser = null }) {
  const { id } = useParams();
  const location = useLocation();
  const { searchParams, lire, patch, page } = useFiltresUrl();
  const readOnly = currentUser?.role === 'inspecteur';
  const vue = searchParams.get('vue');
  const tab = VUES.includes(vue) ? vue : 'confrontation';
  const activeTab = tab === 'detail' ? 'liste' : tab;
  const detailId = tab === 'detail' ? parseInt(searchParams.get('rapprochement'), 10) || null : null;
  const [contribuable, setContribuable] = useState(location.state?.contribuable || null);
  const [contribuableLoading, setContribuableLoading] = useState(!location.state?.contribuable);
  const [contribuableError, setContribuableError] = useState('');
  const [apercu, setApercu] = useState(null);
  const [apercuLoading, setApercuLoading] = useState(true);
  const [apercuError, setApercuError] = useState('');
  const [periode, setPeriode] = useState('');
  const [launch, setLaunch] = useState({ loading: false, result: null, error: '' });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const filters = {
    search: lire('q', ''),
    periode: lire('periode', ''),
    statut: lire('statut', ''),
    type: lire('type', ''),
  };
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [statsPeriod, setStatsPeriod] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [modal, setModal] = useState(null);
  const [motif, setMotif] = useState('');
  const [aideOuverte, setAideOuverte] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const tabRefs = useRef([]);

  const setTab = useCallback((next, options = {}) => {
    patch({
      vue: next === 'confrontation' ? '' : next,
      rapprochement: next === 'detail' && options.rapprochement ? String(options.rapprochement) : '',
    }, { replace: false });
  }, [patch]);

  const onTabKeyDown = (event, index) => {
    const moves = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = (moves[event.key] + tabs.length) % tabs.length;
    setTab(tabs[next][0]);
    tabRefs.current[next]?.focus();
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (contribuable) return;
    getContribuableById(id)
      .then(setContribuable)
      .catch((error) => setContribuableError(getErrorMessage(error)))
      .finally(() => setContribuableLoading(false));
  }, [contribuable, id]);

  const loadApercu = useCallback(async () => {
    if (!contribuable) return;
    setApercuLoading(true);
    try {
      setApercu(await getApercuConfrontation(id));
      setApercuError('');
    } catch (requestError) {
      setApercu(null);
      setApercuError(getErrorMessage(requestError));
    } finally {
      setApercuLoading(false);
    }
  }, [contribuable, id]);

  useEffect(() => { loadApercu(); }, [loadApercu]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const response = await getRapprochements({
        id_contribuable: id,
        page,
        limit: 15,
        ...(filters.search && { search: filters.search }),
        ...(filters.periode && { periode: filters.periode }),
        ...(filters.statut && { statut: filters.statut }),
        ...(filters.type && { type_rapprochement: filters.type }),
      });
      const items = response?.rapprochements || response?.data || response || [];
      const pagination = response?.pagination || {};
      setRows(Array.isArray(items) ? items : []);
      setTotal(pagination.total ?? response?.total ?? items.length);
      setTotalPages(pagination.pages ?? response?.totalPages ?? 1);
    } catch (error) {
      setListError(getErrorMessage(error));
    } finally {
      setListLoading(false);
    }
  }, [filters.periode, filters.search, filters.statut, filters.type, id, page]);

  useEffect(() => {
    if (tab !== 'liste') return undefined;
    // La recherche part au serveur : on la laisse se stabiliser avant d'interroger.
    const timer = setTimeout(loadList, filters.search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadList, tab, filters.search]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      setStats(await getRapprochementStats({
        id_contribuable: id,
        ...(statsPeriod && { periode: statsPeriod }),
      }));
    } catch (error) {
      setStatsError(getErrorMessage(error));
    } finally {
      setStatsLoading(false);
    }
  }, [id, statsPeriod]);
  useEffect(() => { if (tab === 'synthese') loadStats(); }, [loadStats, tab]);

  useEffect(() => {
    if (!detailId) return;
    setDetailLoading(true);
    setDetailError('');
    getRapprochementById(detailId)
      .then(setDetail)
      .catch((error) => setDetailError(getErrorMessage(error)))
      .finally(() => setDetailLoading(false));
  }, [detailId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const launchConfrontation = async () => {
    setLaunch({ loading: true, result: null, error: '' });
    setActionSuccess('');
    setActionError('');
    try {
      const result = await autoRapprocherContribuable(id, { ...(periode && { periode }) });
      setLaunch({ loading: false, result: { ...result, at: new Date().toISOString() }, error: '' });
      loadApercu();
    } catch (error) {
      setLaunch({ loading: false, result: null, error: getErrorMessage(error) });
    }
  };

  const showList = (options = {}) => {
    patch({
      ...(options.statut !== undefined ? { statut: options.statut } : {}),
      ...(options.periode !== undefined ? { periode: options.periode } : {}),
      page: '',
      vue: 'liste',
      rapprochement: '',
    });
  };

  const openDetail = (row) => {
    setDetail(null);
    setActionSuccess('');
    setActionError('');
    setModal(null);
    setMotif('');
    setTab('detail', { rapprochement: row.id_rapprochement });
  };

  const changeFilter = (key, value) => {
    patch({ [CLE_FILTRE[key]]: value, page: '' });
  };

  /**
   * Une seule écriture d'URL : `patch` applique ses modifications au jeu de
   * paramètres du rendu courant, donc quatre appels successifs dans le même
   * gestionnaire ne laisseraient survivre que le dernier.
   */
  const clearFilters = () => {
    patch({ ...Object.fromEntries(Object.values(CLE_FILTRE).map((cle) => [cle, ''])), page: '' });
  };

  const openModal = (action, label) => {
    setModal({ action, label });
    setMotif('');
    setActionError('');
    setActionSuccess('');
  };

  const confirmAction = async () => {
    if (!modal || !detailId) return;
    if (['rejete', 'annule'].includes(modal.action) && !motif.trim()) {
      setActionError('Le motif est obligatoire pour cette action.');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await updateRapprochementStatut(detailId, { statut: modal.action, motif: motif.trim() || undefined });
      setActionSuccess(`Statut mis à jour : ${statusLabel(modal.action)}`);
      setModal(null);
      setDetail(await getRapprochementById(detailId));
      loadList();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  if (contribuableLoading) return <section className="page"><p className="status" role="status">Chargement du contribuable…</p></section>;
  if (contribuableError || !contribuable) {
    return (
      <section className="page error">
        <h1>Contribuable indisponible</h1>
        <p>{contribuableError || 'Aucune donnée disponible.'}</p>
        <Link className="primary" to="/contribuables">Retour</Link>
      </section>
    );
  }

  return (
    <section className="page declaration-page">
      <div className="page-heading">
        <Link className="detail-back-link" to={`/contribuables/${id}`}>Retour au dossier contribuable</Link>
        <p className="eyebrow">Module de confrontation fiscale</p>
        <h1>Confrontation fiscale</h1>
        <p>
          Comparez le chiffre d’affaires déclaré de <strong>{contribuable.raison_sociale}</strong> avec les
          montants recoupés par les autres sources. La TVA n’est affichée qu’à titre informatif.
        </p>
        <div className="page-heading-aide">
          <BoutonAide ecran="confrontation" onOuvrir={() => setAideOuverte(true)} />
        </div>
      </div>

      <nav className="contribuable-tabs" role="tablist" aria-label="Vues de la confrontation">
        {tabs.map(([key, label], index) => (
          <button
            type="button"
            role="tab"
            id={`cf-tab-${key}`}
            aria-controls={`cf-panel-${key}`}
            aria-selected={activeTab === key}
            tabIndex={activeTab === key ? 0 : -1}
            className={activeTab === key ? 'active' : ''}
            onClick={() => setTab(key)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
            ref={(node) => { tabRefs.current[index] = node; }}
            key={key}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'confrontation' && (
        <div role="tabpanel" id="cf-panel-confrontation" aria-labelledby="cf-tab-confrontation" tabIndex={0}>
          <ConfrontationLaunch
            contribuable={contribuable}
            periode={periode}
            onPeriodeChange={setPeriode}
            {...launch}
            onLaunch={launchConfrontation}
            onShowList={showList}
            apercu={apercu}
            apercuLoading={apercuLoading}
            apercuError={apercuError}
            readOnly={readOnly}
          />
        </div>
      )}
      {tab === 'synthese' && (
        <div role="tabpanel" id="cf-panel-synthese" aria-labelledby="cf-tab-synthese" tabIndex={0}>
          <Synthese
            loading={statsLoading}
            error={statsError}
            stats={stats}
            period={statsPeriod}
            onPeriodChange={setStatsPeriod}
            apercu={apercu}
            onGoToLaunch={() => setTab('confrontation')}
            onShowList={showList}
          />
        </div>
      )}
      {['liste', 'detail'].includes(tab) && (
        <div role="tabpanel" id="cf-panel-liste" aria-labelledby="cf-tab-liste" tabIndex={0}>
          {tab === 'liste' ? (
            <RapprochementsList
              rows={rows}
              total={total}
              totalPages={totalPages}
              page={page}
              loading={listLoading}
              error={listError}
              filters={filters}
              onFilterChange={changeFilter}
              onResetFilters={clearFilters}
              onPageChange={(valeur) => patch({ page: valeur <= 1 ? '' : valeur })}
              onRefresh={loadList}
              onOpenDetail={openDetail}
              onGoToLaunch={() => setTab('confrontation')}
              contribuable={contribuable}
              apercu={apercu}
              readOnly={readOnly}
            />
          ) : (
            <RapprochementDetail
              data={detail}
              loading={detailLoading}
              error={detailError}
              success={actionSuccess}
              actionError={actionError}
              modal={modal}
              motif={motif}
              actionLoading={actionLoading}
              readOnly={readOnly}
              onBack={() => setTab('liste')}
              onOpenModal={openModal}
              onCloseModal={() => setModal(null)}
              onMotifChange={setMotif}
              onConfirm={confirmAction}
            />
          )}
        </div>
      )}

      <AideLectureModal
        ouvert={aideOuverte}
        ecran="confrontation"
        onFermer={() => setAideOuverte(false)}
      />
    </section>
  );
}
