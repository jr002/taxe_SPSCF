import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';

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
import ConfrontationLaunch from '@/frontofficeagent/confrontation/pages/ConfrontationLaunch.jsx';
import RapprochementsList from '@/frontofficeagent/confrontation/pages/RapprochementsList.jsx';
import RapprochementDetail from '@/frontofficeagent/confrontation/pages/RapprochementDetail.jsx';
import Synthese from '@/frontofficeagent/confrontation/pages/Synthese.jsx';
import { statusLabel } from '@/frontofficeagent/confrontation/utils/confrontation.utils.js';

const tabs = [['confrontation', 'Confrontation'], ['synthese', 'Synthèse'], ['liste', 'Rapprochements']];
const VUES = ['confrontation', 'synthese', 'liste', 'detail'];

export default function Confrontation({ currentUser = null }) {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [periode, setPeriode] = useState('');
  const [launch, setLaunch] = useState({ loading: false, result: null, error: '' });
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [filters, setFilters] = useState({ search: '', periode: '', statut: '', type: '' });
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [statsPeriod, setStatsPeriod] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [modal, setModal] = useState(null);
  const [motif, setMotif] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const tabRefs = useRef([]);

  const setTab = useCallback((next, options = {}) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'confrontation') params.delete('vue');
    else params.set('vue', next);
    if (next === 'detail' && options.rapprochement) {
      params.set('rapprochement', String(options.rapprochement));
    } else {
      params.delete('rapprochement');
    }
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

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
    } catch {
      setApercu(null);
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
    setFilters((current) => ({
      ...current,
      ...(options.statut !== undefined ? { statut: options.statut } : {}),
      ...(options.periode !== undefined ? { periode: options.periode } : {}),
    }));
    setPage(1);
    setTab('liste');
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
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
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

  if (contribuableLoading) return <section className="page"><p className="status">Chargement du contribuable…</p></section>;
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
              onPageChange={setPage}
              onRefresh={loadList}
              onOpenDetail={openDetail}
              onGoToLaunch={() => setTab('confrontation')}
              contribuable={contribuable}
              apercu={apercu}
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
      <style>{`.contribuable-tabs button{flex:1 0 auto;padding:.7rem 1rem;border:0;border-radius:7px;color:#657083;background:transparent;font-family:inherit;font-size:.8rem;font-weight:700;cursor:pointer}.contribuable-tabs button:hover{color:#1769aa;background:#eef7ff}.contribuable-tabs button.active{color:#fff;background:#1769aa;box-shadow:0 2px 5px rgba(23,105,170,.2)}.cf-select,.cf-toolbar select{width:100%;min-height:2.7rem;border:1px solid #cbd5e1;border-radius:8px;padding:.65rem .75rem;color:#172033;background:#fbfdff;outline:none}.cf-select:focus,.cf-toolbar select:focus{border-color:#1769aa;box-shadow:0 0 0 3px rgba(23,105,170,.14)}.cf-toolbar select{flex:0 0 auto;width:auto;min-width:200px;max-width:260px}.cf-ccard,.cf-form,.cf-actions{padding:1.25rem;border:1px solid #dfe5ed;border-radius:12px;background:#fff}.cf-ccard{margin-bottom:1.5rem;border-left:4px solid #1769aa}.cf-ccard h2{margin:.25rem 0}.cf-contrib-info,.cf-two-columns,.cf-three-columns{display:grid;gap:1rem}.cf-contrib-info{grid-template-columns:repeat(3,minmax(0,1fr));color:#657083}.cf-two-columns{grid-template-columns:repeat(2,minmax(0,1fr));margin:1rem 0}.cf-three-columns{grid-template-columns:repeat(3,minmax(0,1fr));margin-top:1rem}.cf-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}.cf-kpi{display:grid;gap:.4rem;padding:1rem;border:1px solid #dfe5ed;border-radius:10px;background:#f8fafc}.cf-kpi span{color:#657083;font-size:.75rem}.cf-kpi strong{font-size:1.25rem}.cfb{display:inline-flex;padding:.2rem .6rem;border-radius:999px;font-size:.72rem;font-weight:800}.cfb-g{background:#d1fae5;color:#065f46}.cfb-b{background:#dbeafe;color:#1e40af}.cfb-o{background:#fff3cd;color:#8a5d00}.cfb-r{background:#fee2e2;color:#991b1b}.cfb-x{background:#f1f5f9;color:#475569}.cf-toolbar{flex-wrap:wrap;gap:.5rem}.cf-bars{display:flex;align-items:flex-end;gap:1rem;margin-top:1rem;padding:1rem;min-height:200px;border:1px solid #dfe5ed;border-radius:12px}.cf-bar-col{display:grid;gap:.35rem;min-width:75px;text-align:center}.cf-bar-col-wrap{height:120px;display:flex;align-items:end;border-bottom:2px solid #dfe5ed}.cf-bar-col-fill{width:100%;border-radius:4px 4px 0 0}.cf-actions{margin-top:1.5rem;display:flex;gap:.75rem;flex-wrap:wrap}.cf-period-filter{max-width:300px;margin-bottom:1rem}.cf-lead{margin:.5rem 0 0;color:#344054;font-size:.92rem;line-height:1.5}.cf-form select{width:100%;min-height:2.7rem;border:1px solid #cbd5e1;border-radius:8px;padding:.65rem .75rem;color:#172033;background:#fbfdff;outline:none}.cf-form select:focus{border-color:#1769aa;box-shadow:0 0 0 3px rgba(23,105,170,.14)}.cf-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin:1rem 0 1.5rem}.cf-step{display:grid;gap:.35rem;align-content:start;padding:1rem;border:1px solid #dfe5ed;border-radius:10px;background:#f8fafc}.cf-step>span{display:inline-flex;align-items:center;justify-content:center;width:1.75rem;height:1.75rem;border-radius:999px;background:#1769aa;color:#fff;font-weight:800;font-size:.8rem}.cf-step p{margin:0;color:#657083;font-size:.82rem;line-height:1.45}.cf-mini{display:block;margin-top:.2rem;color:#657083;font-size:.72rem;font-weight:600}@media(max-width:760px){.cf-kpis,.cf-contrib-info,.cf-two-columns,.cf-three-columns{grid-template-columns:1fr 1fr}.cf-steps{grid-template-columns:1fr}}`}</style>
    </section>
  );
}
