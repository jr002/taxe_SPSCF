import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { autoRapprocherContribuable, getContribuableById, getErrorMessage, getRapprochementById, getRapprochements, updateRapprochementStatut } from '../../../api/api';
import ConfrontationLaunch from './confrontation/ConfrontationLaunch';
import Dashboard from './confrontation/Dashboard';
import RapprochementsList from './confrontation/RapprochementsList';
import RapprochementDetail from './confrontation/RapprochementDetail';
import Statistics from './confrontation/Statistics';
import { buildStats, periodOf, statusLabel } from './confrontation/utils';

const tabs = [['confrontation', 'Confrontation'], ['tableau-bord', 'Tableau de bord'], ['liste', 'Rapprochements'], ['statistiques', 'Statistiques']];

export default function Confrontation() {
  const { id } = useParams();
  const location = useLocation();
  const [tab, setTab] = useState('confrontation');
  const [contribuable, setContribuable] = useState(location.state?.contribuable || null);
  const [contribuableLoading, setContribuableLoading] = useState(!location.state?.contribuable);
  const [contribuableError, setContribuableError] = useState('');
  const [periode, setPeriode] = useState('');
  const [launch, setLaunch] = useState({ loading: false, result: null, error: '' });
  const [rows, setRows] = useState([]); const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(1);
  const [listLoading, setListLoading] = useState(false); const [listError, setListError] = useState('');
  const [filters, setFilters] = useState({ search: '', periode: '', statut: '', type: '' });
  const [stats, setStats] = useState(null); const [statsLoading, setStatsLoading] = useState(false); const [statsError, setStatsError] = useState(''); const [statsPeriod, setStatsPeriod] = useState('');
  const [detailId, setDetailId] = useState(null); const [detail, setDetail] = useState(null); const [detailLoading, setDetailLoading] = useState(false); const [detailError, setDetailError] = useState('');
  const [modal, setModal] = useState(null); const [motif, setMotif] = useState(''); const [actionLoading, setActionLoading] = useState(false); const [actionSuccess, setActionSuccess] = useState(''); const [actionError, setActionError] = useState('');

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (contribuable) return;
    getContribuableById(id)
      .then(setContribuable)
      .catch((error) => setContribuableError(getErrorMessage(error)))
      .finally(() => setContribuableLoading(false));
  }, [contribuable, id]);

  const loadList = useCallback(async () => { setListLoading(true); setListError(''); try { const response = await getRapprochements({ id_contribuable: id, page, limit: 15, ...(filters.statut && { statut: filters.statut }), ...(filters.type && { type_rapprochement: filters.type }) }); const items = response?.rapprochements || response?.data || response || []; const pagination = response?.pagination || {}; setRows(Array.isArray(items) ? items : []); setTotal(pagination.total ?? response?.total ?? items.length); setTotalPages(pagination.pages ?? response?.totalPages ?? 1); } catch (error) { setListError(getErrorMessage(error)); } finally { setListLoading(false); } }, [filters.statut, filters.type, id, page]);
  useEffect(() => { if (tab === 'liste') loadList(); }, [loadList, tab]);

  const loadStats = useCallback(async () => { setStatsLoading(true); setStatsError(''); try { const response = await getRapprochements({ id_contribuable: id, page: 1, limit: 1000 }); const items = response?.rapprochements || response?.data || response || []; setStats(buildStats((Array.isArray(items) ? items : []).filter((row) => !statsPeriod || periodOf(row).startsWith(statsPeriod)))); } catch (error) { setStatsError(getErrorMessage(error)); } finally { setStatsLoading(false); } }, [id, statsPeriod]);
  useEffect(() => { if (tab === 'tableau-bord' || tab === 'statistiques') loadStats(); }, [loadStats, tab]);
  useEffect(() => { if (!detailId) return; setDetailLoading(true); setDetailError(''); getRapprochementById(detailId).then(setDetail).catch((error) => setDetailError(getErrorMessage(error))).finally(() => setDetailLoading(false)); }, [detailId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const launchConfrontation = async () => { setLaunch({ loading: true, result: null, error: '' }); try { const result = await autoRapprocherContribuable(id, { periode }); setLaunch({ loading: false, result, error: '' }); } catch (error) { setLaunch({ loading: false, result: null, error: getErrorMessage(error) }); } };
  const openDetail = (row) => { setDetailId(row.id_rapprochement); setDetail(null); setTab('detail'); };
  const changeFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const openModal = (action, label) => { setModal({ action, label }); setMotif(''); setActionError(''); setActionSuccess(''); };
  const confirmAction = async () => { if (!modal || !detailId) return; if (['rejete', 'annule'].includes(modal.action) && !motif.trim()) { setActionError('Le motif est obligatoire pour cette action.'); return; } setActionLoading(true); setActionError(''); try { await updateRapprochementStatut(detailId, { statut: modal.action, motif: motif.trim() || undefined }); setActionSuccess(`Statut mis à jour : ${statusLabel(modal.action)}`); setModal(null); setDetail(await getRapprochementById(detailId)); loadList(); } catch (error) { setActionError(getErrorMessage(error)); } finally { setActionLoading(false); } };

  if (contribuableLoading) return <section className="page"><p className="status">Chargement du contribuable…</p></section>;
  if (contribuableError || !contribuable) return <section className="page error"><h1>Contribuable indisponible</h1><p>{contribuableError || 'Aucune donnée disponible.'}</p><Link className="primary" to="/contribuables">Retour</Link></section>;
  return <section className="page declaration-page"><div className="page-heading"><Link className="detail-back-link" to={`/contribuables/${id}`}>Retour au dossier contribuable</Link><p className="eyebrow">Module de confrontation TVA</p><h1>Confrontation fiscale</h1><p>Comparez les déclarations de <strong>{contribuable.raison_sociale}</strong> avec les recoupements disponibles.</p></div><nav className="contribuable-tabs">{tabs.map(([key, label]) => <button type="button" className={tab === key || (tab === 'detail' && key === 'liste') ? 'active' : ''} onClick={() => setTab(key)} key={key}>{label}</button>)}</nav>{tab === 'confrontation' && <ConfrontationLaunch contribuable={contribuable} periode={periode} onPeriodeChange={setPeriode} {...launch} onLaunch={launchConfrontation} onShowList={() => setTab('liste')} />}{tab === 'tableau-bord' && <Dashboard loading={statsLoading} error={statsError} stats={stats} />}{tab === 'liste' && <RapprochementsList rows={rows} total={total} totalPages={totalPages} page={page} loading={listLoading} error={listError} filters={filters} onFilterChange={changeFilter} onPageChange={setPage} onRefresh={loadList} onOpenDetail={openDetail} contribuable={contribuable} />}{tab === 'detail' && <RapprochementDetail data={detail} loading={detailLoading} error={detailError} success={actionSuccess} actionError={actionError} modal={modal} motif={motif} actionLoading={actionLoading} onBack={() => setTab('liste')} onOpenModal={openModal} onCloseModal={() => setModal(null)} onMotifChange={setMotif} onConfirm={confirmAction} />}{tab === 'statistiques' && <Statistics loading={statsLoading} error={statsError} stats={stats} period={statsPeriod} onPeriodChange={setStatsPeriod} />}<style>{`.cf-ccard,.cf-form,.cf-actions,.cf-modal{padding:1.25rem;border:1px solid #dfe5ed;border-radius:12px;background:#fff}.cf-ccard{margin-bottom:1.5rem;border-left:4px solid #1769aa}.cf-ccard h2{margin:.25rem 0}.cf-contrib-info,.cf-two-columns,.cf-three-columns{display:grid;gap:1rem}.cf-contrib-info{grid-template-columns:repeat(3,minmax(0,1fr));color:#657083}.cf-two-columns{grid-template-columns:repeat(2,minmax(0,1fr));margin:1rem 0}.cf-three-columns{grid-template-columns:repeat(3,minmax(0,1fr));margin-top:1rem}.cf-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}.cf-kpi{display:grid;gap:.4rem;padding:1rem;border:1px solid #dfe5ed;border-radius:10px;background:#f8fafc}.cf-kpi span{color:#657083;font-size:.75rem}.cf-kpi strong{font-size:1.25rem}.cfb{display:inline-flex;padding:.2rem .6rem;border-radius:999px;font-size:.72rem;font-weight:800}.cfb-g{background:#d1fae5;color:#065f46}.cfb-b{background:#dbeafe;color:#1e40af}.cfb-o{background:#fff3cd;color:#8a5d00}.cfb-r{background:#fee2e2;color:#991b1b}.cfb-x{background:#f1f5f9;color:#475569}.cf-toolbar{flex-wrap:wrap;gap:.5rem}.cf-bars{display:flex;align-items:flex-end;gap:1rem;margin-top:1rem;padding:1rem;min-height:200px;border:1px solid #dfe5ed;border-radius:12px}.cf-bar-col{display:grid;gap:.35rem;min-width:75px;text-align:center}.cf-bar-col-wrap{height:120px;display:flex;align-items:end;border-bottom:2px solid #dfe5ed}.cf-bar-col-fill{width:100%;border-radius:4px 4px 0 0}.cf-actions{margin-top:1.5rem;display:flex;gap:.75rem;flex-wrap:wrap}.cf-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(17,24,39,.55)}.cf-modal{width:min(100%,520px)}.cf-period-filter{max-width:220px;margin-bottom:1rem}@media(max-width:760px){.cf-kpis,.cf-contrib-info,.cf-two-columns,.cf-three-columns{grid-template-columns:1fr 1fr}}`}</style></section>;
}
