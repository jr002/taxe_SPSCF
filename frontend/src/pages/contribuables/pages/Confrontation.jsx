/**
 * MODULE DE CONFRONTATION TVA
 * ============================
 * Compare les declarations fiscales avec les recoupements pour detecter les ecarts.
 * Integre 5 sous-pages accessibles par onglets :
 *   1. Confrontation  - lancer le rapprochement automatique
 *   2. Tableau de bord - synthese chiffree
 *   3. Liste           - tableau filtrable et pagine
 *   4. Detail          - comparaison cote a cote + actions metier
 *   5. Statistiques    - repartition graphique
 *
 * Respecte le design App.css existant et le client API Axios centralise.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  autoRapprocherContribuable,
  getContribuableById,
  getErrorMessage,
  getRapprochementById,
  getRapprochements,
  updateRapprochementStatut,
} from '../../../api/api';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const fmt = (val) => {
  if (val === null || val === undefined || val === '') return '\u2014';
  return Number(val).toLocaleString('fr-FR') + ' Ar';
};

const fmtDate = (iso) => {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  return isNaN(d) ? '\u2014' : d.toLocaleDateString('fr-FR');
};

const badgeClass = (s) =>
  ({ rapproche: 'cfb cfb-g', valide: 'cfb cfb-b', a_verifier: 'cfb cfb-o',
     ecart: 'cfb cfb-r', rejete: 'cfb cfb-x', annule: 'cfb cfb-x' }[s] || 'cfb cfb-x');

const lblSt = (s) =>
  ({ rapproche: 'Rapproche', a_verifier: 'A verifier', ecart: 'Ecart',
     valide: 'Valide', rejete: 'Rejete', annule: 'Annule' }[s] || s || '\u2014');

const lblTy = (t) =>
  ({ exact: 'Exact', tolerance: 'Tolerance', partiel: 'Partiel', manuel: 'Manuel' }[t] || t || '\u2014');

// L'API expose les relations Prisma au pluriel. Ces helpers gardent le rendu
// lisible et compatible avec les anciennes réponses qui les nommaient au singulier.
const declarationOf = (rapprochement) => rapprochement.declaration || rapprochement.declarations || {};
const recoupementOf = (rapprochement) => rapprochement.recoupement || rapprochement.recoupements || {};
const periodeOf = (rapprochement) => declarationOf(rapprochement).periode || recoupementOf(rapprochement).periode || rapprochement.periode || '';

const buildStats = (rapprochements) => {
  const total = rapprochements.length;
  const byType = (type) => rapprochements.filter((r) => r.type_rapprochement === type).length;
  const byStatut = (statut) => rapprochements.filter((r) => r.statut === statut).length;
  const sum = (field) => rapprochements.reduce((result, r) => result + Number(r[field] || 0), 0);

  return {
    total,
    declarations: new Set(rapprochements.map((r) => r.id_declaration).filter(Boolean)).size,
    recoupements: new Set(rapprochements.map((r) => r.id_recoupement).filter(Boolean)).size,
    exact: byType('exact'), tolerance: byType('tolerance'), partiel: byType('partiel'),
    ecart: byStatut('ecart'), a_verifier: byStatut('a_verifier'), valide: byStatut('valide'),
    rejete: byStatut('rejete'), annule: byStatut('annule'),
    montant_declare_total: sum('montant_declare'), montant_recoupe_total: sum('montant_recoupe'), ecart_total: sum('ecart'),
  };
};

const TABS = [
  { id: 'confrontation', label: 'Confrontation' },
  { id: 'tableau-bord',  label: 'Tableau de bord' },
  { id: 'liste',         label: 'Rapprochements' },
  { id: 'statistiques',  label: 'Statistiques' },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Confrontation() {
  const { id } = useParams();
  const location = useLocation();

  // Navigation
  const [tab, setTab] = useState('confrontation');

  // Contribuable
  const [contrib, setContrib]     = useState(location.state?.contribuable || null);
  const [contribLoading, setContribLoading] = useState(!location.state?.contribuable);
  const [contribError,   setContribError]   = useState('');

  // Page 1
  const [periode,    setPeriode]    = useState('');
  const [lLoading,   setLLoading]   = useState(false);
  const [lResult,    setLResult]    = useState(null);
  const [lError,     setLError]     = useState('');

  // Pages 2 & 5
  const [sLoading, setSLoading] = useState(false);
  const [sData,    setSData]    = useState(null);
  const [sError,   setSError]   = useState('');
  const [sPeriode, setSPeriode] = useState('');

  // Page 3
  const [rows,       setRows]       = useState([]);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [rLoading,   setRLoading]   = useState(false);
  const [rError,     setRError]     = useState('');
  const [fStatut,    setFStatut]    = useState('');
  const [fType,      setFType]      = useState('');
  const [fSearch,    setFSearch]    = useState('');
  const [fPeriode,   setFPeriode]   = useState('');

  // Page 4
  const [detailId,   setDetailId]   = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [dLoading,   setDLoading]   = useState(false);
  const [dError,     setDError]     = useState('');
  const [aLoading,   setALoading]   = useState(false);
  const [aSuccess,   setASuccess]   = useState('');
  const [aError,     setAError]     = useState('');
  const [modal,      setModal]      = useState(null);
  const [motif,      setMotif]      = useState('');

  // Chargement contribuable
  useEffect(() => {
    if (contrib) return;
    setContribLoading(true);
    getContribuableById(id)
      .then(setContrib)
      .catch((e) => setContribError(getErrorMessage(e)))
      .finally(() => setContribLoading(false));
  }, [id, contrib]);

  // Chargement liste rapprochements
  const loadList = useCallback(async () => {
    setRLoading(true);
    setRError('');
    try {
      const p = { id_contribuable: id, page, limit: 15 };
      if (fStatut) p.statut = fStatut;
      if (fType)   p.type_rapprochement = fType;
      const res   = await getRapprochements(p);
      const items = res?.rapprochements || res?.data || res || [];
      const pagination = res?.pagination || {};
      const t = pagination.total ?? res?.total ?? (Array.isArray(items) ? items.length : 0);
      setRows(Array.isArray(items) ? items : []);
      setTotal(t);
      setTotalPages(pagination.pages ?? res?.totalPages ?? (Math.ceil(t / 15) || 1));
    } catch (e) {
      setRError(getErrorMessage(e));
    } finally {
      setRLoading(false);
    }
  }, [id, page, fStatut, fType]);

  useEffect(() => { if (tab === 'liste') loadList(); }, [tab, loadList]);

  // Statistiques limitées au contribuable affiché. L'endpoint de statistiques
  // est global, nous calculons donc la synthèse à partir de ses rapprochements.
  const loadStats = useCallback(async () => {
    setSLoading(true);
    setSError('');
    try {
      const res = await getRapprochements({ id_contribuable: id, page: 1, limit: 1000 });
      const items = res?.rapprochements || res?.data || res || [];
      const filtered = (Array.isArray(items) ? items : []).filter((r) => !sPeriode || periodeOf(r).startsWith(sPeriode));
      setSData(buildStats(filtered));
    }
    catch (e) { setSError(getErrorMessage(e)); }
    finally { setSLoading(false); }
  }, [id, sPeriode]);

  useEffect(() => {
    if (tab === 'statistiques' || tab === 'tableau-bord') loadStats();
  }, [tab, loadStats]);

  // Chargement detail
  useEffect(() => {
    if (!detailId) return;
    setDLoading(true);
    setDError('');
    setASuccess('');
    setAError('');
    getRapprochementById(detailId)
      .then(setDetailData)
      .catch((e) => setDError(getErrorMessage(e)))
      .finally(() => setDLoading(false));
  }, [detailId]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const lancerConfrontation = async () => {
    setLLoading(true);
    setLResult(null);
    setLError('');
    try {
      const p = {};
      p.periode = periode;
      setLResult(await autoRapprocherContribuable(id, p));
    } catch (e) {
      setLError(getErrorMessage(e));
    } finally {
      setLLoading(false);
    }
  };

  const openModal  = (action, label) => { setModal({ action, label }); setMotif(''); setASuccess(''); setAError(''); };
  const closeModal = () => { setModal(null); setMotif(''); };

  const confirmAction = async () => {
    if (!modal || !detailId) return;
    if (['rejete', 'annule'].includes(modal.action) && !motif.trim()) {
      setAError('Le motif est obligatoire pour cette action.'); return;
    }
    setALoading(true);
    setAError('');
    try {
      await updateRapprochementStatut(detailId, { statut: modal.action, motif: motif.trim() || undefined });
      setASuccess('Statut mis a jour : ' + lblSt(modal.action));
      closeModal();
      setDetailData(await getRapprochementById(detailId));
      loadList();
    } catch (e) {
      setAError(getErrorMessage(e));
    } finally {
      setALoading(false);
    }
  };

  const openDetail = (r) => { setDetailId(r.id_rapprochement); setDetailData(null); setTab('detail'); };

  const exportList = () => {
    const data = filtered.map((r) => {
      const declaration = declarationOf(r);
      const recoupement = recoupementOf(r);
      return {
        'N° rapprochement': r.id_rapprochement,
        Période: periodeOf(r),
        Référence: recoupement.reference || '—',
        'Montant déclaré (Ar)': Number(r.montant_declare || 0),
        'Montant recoupé (Ar)': Number(r.montant_recoupe || 0),
        'Écart (Ar)': Number(r.ecart || 0),
        Score: r.score != null ? `${r.score}%` : '—',
        Statut: lblSt(r.statut),
        'Type de rapprochement': lblTy(r.type_rapprochement),
        Déclaration: declaration.type_declaration || '—',
      };
    });
    const sheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Rapprochements');
    XLSX.writeFile(workbook, `rapprochements-${contrib.nif || id}.xlsx`);
  };

  // ─── Ecrans d etat ────────────────────────────────────────────────────────

  if (contribLoading)
    return <section className="page"><p className="status">Chargement du contribuable...</p></section>;
  if (contribError || !contrib)
    return (
      <section className="page error">
        <h1>Contribuable indisponible</h1>
        <p>{contribError || 'Aucune donnee disponible.'}</p>
        <Link className="primary detail-back" to="/contribuables">Retour</Link>
      </section>
    );

  // ─── PAGE 1 : Confrontation ───────────────────────────────────────────────

  const renderP1 = () => (
    <div>
      <div className="cf-ccard">
        <p className="eyebrow">Contribuable selectionne</p>
        <h2 style={{ margin: '0.2rem 0 0.5rem', fontSize: '1.2rem' }}>{contrib.raison_sociale}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', color: '#657083', fontSize: '0.82rem' }}>
          <span>NIF : <strong style={{ color: '#172033' }}>{contrib.nif}</strong></span>
          <span>Regime : <strong style={{ color: '#172033' }}>{contrib.regime_fiscal || '\u2014'}</strong></span>
          <span>Secteur : <strong style={{ color: '#172033' }}>{contrib.secteur_activite || '\u2014'}</strong></span>
        </div>
      </div>

      <div className="cf-form">
        <div className="section-heading">
          <span className="section-number">1</span>
          <div><h2>Parametres de la confrontation</h2><p>Selectionnez la periode et le type de declaration a analyser.</p></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="field">
            <label htmlFor="cf-periode">Periode (AAAA-MM)</label>
            <input id="cf-periode" type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} />
            <small style={{ color: '#657083', fontSize: '0.75rem' }}>Vide = toutes les periodes disponibles.</small>
          </div>
          <div className="field">
            <label htmlFor="cf-type">Type de déclaration</label>
            <input id="cf-type" value="TVA" readOnly aria-readonly="true" />
            <small style={{ color: '#657083', fontSize: '0.75rem' }}>Cette page est dédiée à la confrontation TVA.</small>
          </div>
        </div>
        <div className="rule-box" style={{ marginTop: '1rem' }}>
          <strong>Comment fonctionne la confrontation ?</strong>
          <span>Le moteur analyse automatiquement les declarations et les recoupements. Il applique les regles : correspondance exacte, tolerance, partielle, ecart detecte.</span>
        </div>
        <div className="form-actions" style={{ marginTop: '1.25rem' }}>
          <button id="btn-lancer-confrontation" className="primary" onClick={lancerConfrontation}
            disabled={lLoading || !periode} style={{ minWidth: '220px' }}>
            {lLoading ? 'Analyse en cours...' : 'Lancer la confrontation'}
          </button>
        </div>
      </div>

      {lError && (
        <div className="result-card alert" style={{ marginTop: '1rem' }}>
          <div className="result-header"><span className="status-indicator alert-dot" /><h3>Erreur lors de la confrontation</h3></div>
          <p className="result-message">{lError}</p>
        </div>
      )}
      {lResult && (
        <div className="result-card success" style={{ marginTop: '1rem' }}>
          <div className="result-header"><span className="status-indicator success-dot" /><h3>Confrontation terminee</h3></div>
          <p className="result-message">{lResult.count ?? lResult.total ?? '\u2014'} rapprochement(s) traité(s).</p>
          <dl className="result-rows">
            {lResult.exacts !== undefined && <div className="result-row"><dt>Exacts</dt><dd className="monetary-val">{lResult.exacts}</dd></div>}
            {lResult.ecarts !== undefined && <div className="result-row"><dt>Ecarts detectes</dt><dd style={{ color: '#b42318', fontWeight: 700 }}>{lResult.ecarts}</dd></div>}
          </dl>
          <button className="primary" style={{ marginTop: '1rem' }} onClick={() => { setTab('liste'); loadList(); }}>
            Voir les rapprochements
          </button>
        </div>
      )}
    </div>
  );

  // ─── PAGE 2 : Tableau de bord ─────────────────────────────────────────────

  const renderP2 = () => {
    if (sLoading) return <p className="status">Chargement...</p>;
    if (sError)   return <p className="empty" style={{ color: '#b42318' }}>{sError}</p>;
    if (!sData)   return <p className="empty">Aucune donnee disponible pour cette periode.</p>;
    const { total: t=0, exact=0, tolerance=0, partiel=0, ecart=0, a_verifier=0, valide=0, rejete=0,
      montant_declare_total=0, montant_recoupe_total=0, ecart_total=0 } = sData;
    return (
      <div>
        <div className="section-heading"><span className="section-number">2</span><div><h2>Tableau de bord</h2><p>Synthèse des confrontations du contribuable sélectionné.</p></div></div>
        <div className="cf-kpis">
          {[['Déclarations analysées', sData.declarations, '#1769aa'], ['Recoupements analysés', sData.recoupements, '#1769aa'],
            ['Rapprochements exacts', exact, '#237a43'], ['Avec tolérance', tolerance, '#8a5d00'],
            ['Partiels', partiel, '#946200'], ['Ecarts', ecart, '#b42318'],
            ['A verifier', a_verifier, '#8a5d00'], ['Valides', valide, '#1769aa'], ['Rejetes', rejete, '#657083']
          ].map(([lbl, val, col]) => (
            <article key={lbl} className="cf-kpi">
              <span className="cf-kpi-lbl">{lbl}</span>
              <strong className="cf-kpi-val" style={{ color: col }}>{val}</strong>
            </article>
          ))}
        </div>
        <div className="section-heading" style={{ marginTop: '2rem' }}><span className="section-number">3</span><div><h2>Montants analyses</h2></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '1rem' }}>
          <div className="sum-field"><span>Montant total declare</span><strong>{fmt(montant_declare_total)}</strong></div>
          <div className="sum-field"><span>Montant total recoupe</span><strong>{fmt(montant_recoupe_total)}</strong></div>
          <div className="sum-field" style={{ borderColor: Number(ecart_total) > 0 ? '#fde1d9' : '#cfeeda', background: Number(ecart_total) > 0 ? '#fff8f5' : '#f3fbf6' }}>
            <span>Ecart global</span>
            <strong style={{ color: Number(ecart_total) > 0 ? '#b42318' : '#237a43' }}>{fmt(ecart_total)}</strong>
          </div>
        </div>
        {t > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <div className="section-heading"><span className="section-number">4</span><div><h2>Repartition des statuts</h2></div></div>
            <div className="cf-repart">
              {[['Exact', exact, '#237a43'], ['Tolerance', tolerance, '#f2b84b'], ['Partiel', partiel, '#946200'],
                ['Ecart', ecart, '#b42318'], ['A verifier', a_verifier, '#8a5d00'],
                ['Valide', valide, '#1769aa'], ['Rejete', rejete, '#657083']
              ].filter(([,c]) => c > 0).map(([lbl, cnt, col]) => (
                <div key={lbl} className="cf-repart-row">
                  <span className="cf-repart-lbl">{lbl}</span>
                  <div className="cf-bar-wrap"><div className="cf-bar" style={{ width: Math.round((cnt/t)*100)+'%', background: col }} /></div>
                  <span className="cf-repart-cnt">{cnt} ({Math.round((cnt/t)*100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── PAGE 3 : Liste ───────────────────────────────────────────────────────

  const filtered = rows.filter((r) => {
    const declaration = declarationOf(r);
    const recoupement = recoupementOf(r);
    if (fSearch) {
      const s = fSearch.toLowerCase();
      if (!String(r.id_rapprochement).includes(s) &&
          !(declaration.contribuable?.nif || declaration.contribuables?.nif || '').toLowerCase().includes(s) &&
          !(declaration.contribuable?.raison_sociale || declaration.contribuables?.raison_sociale || '').toLowerCase().includes(s) &&
          !(recoupement.reference || '').toLowerCase().includes(s)) return false;
    }
    if (fPeriode && !periodeOf(r).startsWith(fPeriode)) return false;
    return true;
  });

  const renderP3 = () => (
    <div>
      <div className="section-heading"><span className="section-number">3</span><div><h2>Liste des rapprochements</h2><p>Cliquez sur une ligne pour consulter le détail.</p></div></div>
      <div className="datatable-toolbar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <input id="cf-search" type="text" placeholder="Référence, NIF ou raison sociale..." value={fSearch}
          onChange={(e) => setFSearch(e.target.value)} style={{ flex: '1 1 200px' }} />
        <input id="cf-fperiode" type="month" value={fPeriode} onChange={(e) => { setFPeriode(e.target.value); setPage(1); }}
          style={{ flex: '0 1 155px', minHeight: '2.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.75rem' }} />
        <select id="cf-fstatut" value={fStatut} onChange={(e) => { setFStatut(e.target.value); setPage(1); }}
          style={{ flex: '0 1 150px', minHeight: '2.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.75rem' }}>
          <option value="">Tous les statuts</option>
          <option value="rapproche">Rapproche</option><option value="a_verifier">A verifier</option>
          <option value="ecart">Ecart</option><option value="valide">Valide</option>
          <option value="rejete">Rejete</option><option value="annule">Annule</option>
        </select>
        <select id="cf-ftype" value={fType} onChange={(e) => { setFType(e.target.value); setPage(1); }}
          style={{ flex: '0 1 150px', minHeight: '2.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.75rem' }}>
          <option value="">Tous les types</option>
          <option value="exact">Exact</option><option value="tolerance">Tolerance</option>
          <option value="partiel">Partiel</option><option value="manuel">Manuel</option>
        </select>
        <button id="cf-refresh" onClick={() => { setPage(1); loadList(); }} disabled={rLoading}>Actualiser</button>
        <button type="button" onClick={exportList} disabled={filtered.length === 0}>Exporter Excel</button>
        <button type="button" onClick={() => window.print()} disabled={filtered.length === 0}>Exporter PDF</button>
      </div>
      {rError && <p className="empty" style={{ color: '#b42318' }}>{rError}</p>}
      {rLoading ? <p className="status">Chargement...</p> : filtered.length === 0 ? (
        <p className="empty">Aucun rapprochement trouve.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>ID</th><th>Periode</th><th>Type</th><th>Montant declare</th>
                <th>Montant recoupe</th><th>Ecart</th><th>Score</th><th>Statut</th><th>Date</th><th>Action</th>
              </tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id_rapprochement} className="clickable-row" tabIndex={0}
                    onClick={() => openDetail(r)} onKeyDown={(e) => e.key === 'Enter' && openDetail(r)}>
                    <td>#{r.id_rapprochement}</td>
                    <td>{periodeOf(r) || '\u2014'}</td>
                    <td>{lblTy(r.type_rapprochement)}</td>
                    <td>{fmt(r.montant_declare)}</td>
                    <td>{fmt(r.montant_recoupe)}</td>
                    <td style={{ color: Number(r.ecart) > 0 ? '#b42318' : Number(r.ecart) < 0 ? '#946200' : '#237a43', fontWeight: 700 }}>{fmt(r.ecart)}</td>
                    <td>{r.score != null ? r.score + '%' : '\u2014'}</td>
                    <td><span className={badgeClass(r.statut)}>{lblSt(r.statut)}</span></td>
                    <td>{fmtDate(r.date_rapprochement)}</td>
                    <td><button className="table-action" onClick={(e) => { e.stopPropagation(); openDetail(r); }}>Detail</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="datatable-pagination">
            <span>{total} resultat(s)</span>
            <div>
              <button id="cf-prev" onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page <= 1}>Precedent</button>
              <span>Page {page} / {totalPages}</span>
              <button id="cf-next" onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page >= totalPages}>Suivant</button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ─── PAGE 4 : Detail ──────────────────────────────────────────────────────

  const renderP4 = () => {
    if (dLoading) return <p className="status">Chargement...</p>;
    if (dError)   return <p className="empty" style={{ color: '#b42318' }}>{dError}</p>;
    if (!detailData) return <p className="empty">Selectionnez un rapprochement dans la liste.</p>;
    const d = detailData;
    const declaration = declarationOf(d);
    const recoupement = recoupementOf(d);
    const ev = Number(d.ecart || 0);
    const st = d.statut;
    return (
      <div>
        <button id="cf-back" className="table-action" style={{ marginBottom: '1rem' }} onClick={() => setTab('liste')}>Retour a la liste</button>
        <div className="declaration-detail" style={{ marginBottom: '1.25rem' }}>
          <div className="declaration-detail-heading">
            <div>
              <p className="eyebrow">Rapprochement #{d.id_rapprochement}</p>
              <h2>Detail du rapprochement</h2>
              <p>Type : <strong>{lblTy(d.type_rapprochement)}</strong> &mdash; Statut : <span className={badgeClass(st)}>{lblSt(st)}</span></p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="eyebrow">Score</p>
              <strong style={{ fontSize: '2rem', color: d.score >= 90 ? '#237a43' : d.score >= 70 ? '#f2b84b' : '#b42318' }}>
                {d.score != null ? d.score + '%' : '\u2014'}
              </strong>
              <p style={{ fontSize: '0.75rem', color: '#657083', margin: 0 }}>{fmtDate(d.date_rapprochement)}</p>
            </div>
          </div>
        </div>
        {aSuccess && <p className="form-submit-message success" role="status">{aSuccess}</p>}
        {aError   && <p className="form-submit-message" style={{ color: '#b42318', background: '#fff5f3' }}>{aError}</p>}
        <div className="comparison-grid" style={{ marginBottom: '1.25rem' }}>
          <article className="comparison-panel">
            <div className="comparison-header"><h2>Declaration</h2><span>Donnees declarees</span></div>
            <ul className="comparison-list">
              {[['ID déclaration', '#'+d.id_declaration], ['Période', declaration.periode||'\u2014'],
                ['Type', declaration.type_declaration||'\u2014'], ['Montant déclaré', fmt(d.montant_declare)],
                ['TVA collectée', fmt(declaration.tva_collectee)], ['TVA déductible', fmt(declaration.tva_deductible)],
                ['TVA à payer', fmt(declaration.tva_payee)], ['Statut', declaration.statut||'\u2014']
              ].map(([k, v]) => <li key={k} className="comparison-item"><span>{k}</span><strong>{v}</strong></li>)}
            </ul>
          </article>
          <article className="comparison-panel">
            <div className="comparison-header"><h2>Recoupement</h2><span>Source externe</span></div>
            <ul className="comparison-list">
              {[['ID recoupement', '#'+d.id_recoupement], ['Source', recoupement.source||'\u2014'],
                ['Référence', recoupement.reference||'\u2014'], ['Montant recoupé', fmt(d.montant_recoupe)],
                ['Type d’opération', recoupement.type_operation||'\u2014'], ['NIF tiers', recoupement.nif_tiers||'\u2014'],
                ['Date d’opération', fmtDate(recoupement.date_operation)], ['Montant TTC', fmt(recoupement.montant_ttc)]
              ].map(([k, v]) => <li key={k} className="comparison-item"><span>{k}</span><strong>{v}</strong></li>)}
            </ul>
          </article>
        </div>
        <div className="comparison-deltas">
          <div className="comparison-deltas-header"><h3>Synthese des ecarts</h3></div>
          <div className="comparison-delta-item"><span>Montant declare</span><strong style={{ color: '#1769aa' }}>{fmt(d.montant_declare)}</strong></div>
          <div className="comparison-delta-item"><span>Montant recoupe</span><strong style={{ color: '#237a43' }}>{fmt(d.montant_recoupe)}</strong></div>
          <div className="comparison-delta-item"><span>Ecart (recoupe - declare)</span><strong className={ev === 0 ? 'match' : 'alert'}>{fmt(ev)}</strong></div>
          {d.motif && <div className="comparison-delta-item"><span>Motif</span><strong style={{ color: '#344054', fontWeight: 'normal', maxWidth: '60%', textAlign: 'right' }}>{d.motif}</strong></div>}
        </div>
        <div className="cf-actions">
          <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Actions disponibles</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {['a_verifier','ecart','rapproche'].includes(st) && <button id="cf-valider" className="primary" style={{ background: '#237a43' }} onClick={() => openModal('valide','Valider')}>Valider</button>}
            {['rapproche','valide','ecart'].includes(st)     && <button id="cf-averif"  className="primary" style={{ background: '#f2b84b', color: '#172033' }} onClick={() => openModal('a_verifier','A verifier')}>A verifier</button>}
            {['a_verifier','ecart','rapproche','valide'].includes(st) && <button id="cf-rejeter" className="primary" style={{ background: '#b42318' }} onClick={() => openModal('rejete','Rejeter')}>Rejeter</button>}
            {st !== 'annule' && <button id="cf-annuler" className="primary" style={{ background: '#657083' }} onClick={() => openModal('annule','Annuler')}>Annuler</button>}
          </div>
        </div>
        {modal && (
          <div className="cf-overlay" role="dialog" aria-modal="true">
            <div className="cf-modal">
              <h3>Confirmer : {modal.label}</h3>
              <p>Changement du statut vers <strong>{lblSt(modal.action)}</strong>.</p>
              <div className="field" style={{ marginTop: '1rem' }}>
                <label htmlFor="cf-motif">Motif{['rejete','annule'].includes(modal.action) && <span style={{ color: '#b42318' }}> (obligatoire)</span>}</label>
                <textarea id="cf-motif" rows={3}
                  style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.75rem', resize: 'vertical', fontFamily: 'inherit' }}
                  value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Commentaire ou motif..." />
              </div>
              {aError && <p style={{ color: '#b42318', fontSize: '0.82rem', margin: '0.5rem 0' }}>{aError}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button id="cf-modal-cancel" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 1rem', background: '#fff', cursor: 'pointer' }}
                  onClick={closeModal} disabled={aLoading}>Annuler</button>
                <button id="cf-modal-confirm" className="primary" onClick={confirmAction} disabled={aLoading}>
                  {aLoading ? 'En cours...' : 'Confirmer : ' + modal.label}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── PAGE 5 : Statistiques ────────────────────────────────────────────────

  const renderP5 = () => {
    if (sLoading) return <p className="status">Chargement...</p>;
    if (sError)   return <p className="empty" style={{ color: '#b42318' }}>{sError}</p>;
    if (!sData)   return <p className="empty">Aucune donnee disponible pour cette periode.</p>;
    const { total: t=0, exact=0, tolerance=0, partiel=0, ecart=0, a_verifier=0, valide=0, rejete=0, annule=0,
      montant_declare_total=0, montant_recoupe_total=0, ecart_total=0 } = sData;
    const bars = [
      ['Exact', exact, '#237a43'], ['Tolerance', tolerance, '#f2b84b'], ['Partiel', partiel, '#946200'],
      ['Ecart', ecart, '#b42318'], ['A verifier', a_verifier, '#8a5d00'], ['Valide', valide, '#1769aa'],
      ['Rejete', rejete, '#657083'], ['Annule', annule, '#9caabd'],
    ].filter(([,c]) => c > 0);
    return (
      <div>
        <div className="section-heading"><span className="section-number">5</span><div><h2>Statistiques de confrontation</h2><p>Filtrez la période pour affiner l’analyse.</p></div></div>
        <div className="datatable-toolbar" style={{ marginBottom: '1rem' }}>
          <label htmlFor="cf-stats-periode">Période</label>
          <input id="cf-stats-periode" type="month" value={sPeriode} onChange={(e) => setSPeriode(e.target.value)} />
        </div>
        <div className="cf-kpis">
          {[['Total analyses', t, '#172033'],
            ['Taux exact', t > 0 ? Math.round((exact/t)*100)+'%' : '\u2014', '#237a43'],
            ['Taux ecarts',  t > 0 ? Math.round((ecart/t)*100)+'%'  : '\u2014', '#b42318'],
            ['Montant declare', fmt(montant_declare_total), '#1769aa'],
            ['Montant recoupe', fmt(montant_recoupe_total), '#237a43'],
            ['Ecart total', fmt(ecart_total), Number(ecart_total) > 0 ? '#b42318' : '#237a43'],
          ].map(([lbl, val, col]) => (
            <article key={lbl} className="cf-kpi">
              <span className="cf-kpi-lbl">{lbl}</span>
              <strong className="cf-kpi-val" style={{ color: col, fontSize: lbl.includes('Montant') || lbl.includes('Ecart total') ? '1rem' : undefined }}>{val}</strong>
            </article>
          ))}
        </div>
        {bars.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <div className="section-heading">
              <span className="section-number" style={{ background: '#f3fbf6', color: '#237a43' }}>v</span>
              <div><h2>Repartition par statut</h2><p>Distribution des {t} rapprochements.</p></div>
            </div>
            <div className="cf-bars">
              {bars.map(([lbl, cnt, col]) => (
                <div key={lbl} className="cf-bar-col">
                  <div className="cf-bar-col-wrap">
                    <div className="cf-bar-col-fill" style={{ height: Math.max(4, Math.round((cnt/t)*100))+'%', background: col }} />
                  </div>
                  <strong style={{ color: col, fontSize: '1.1rem', fontWeight: 800 }}>{cnt}</strong>
                  <span style={{ color: '#657083', fontSize: '0.72rem', textAlign: 'center' }}>{lbl}</span>
                  <small style={{ color: '#9caabd', fontSize: '0.68rem' }}>{Math.round((cnt/t)*100)}%</small>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="rule-box" style={{ marginTop: '2rem' }}>
          <strong>Rappel metier</strong>
          <span>Un ecart n est pas automatiquement une fraude. Chaque ecart doit etre analyse avec les pieces justificatives avant toute conclusion.</span>
        </div>
      </div>
    );
  };

  // ─── Rendu principal ──────────────────────────────────────────────────────

  return (
    <section className="page declaration-page">
      <div className="page-heading">
        <Link className="detail-back-link" to={'/contribuables/' + id}>Retour au dossier contribuable</Link>
        <p className="eyebrow">Module de confrontation TVA</p>
        <h1>Confrontation fiscale</h1>
        <p>Comparez les declarations de <strong>{contrib.raison_sociale}</strong> (NIF : {contrib.nif}) avec les recoupements disponibles.</p>
      </div>

      <div className="contribuable-tabs">
        {TABS.map((o) => (
          <button key={o.id} id={'tab-' + o.id}
            className={(tab === o.id || (tab === 'detail' && o.id === 'liste')) ? 'active' : ''}
            onClick={() => setTab(o.id)}
            style={{ flex: '1 0 auto', padding: '0.7rem 1rem', borderRadius: '7px', border: 0,
              color: tab === o.id ? '#fff' : '#657083', background: tab === o.id ? '#1769aa' : 'transparent',
              fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {o.label}
          </button>
        ))}
        {tab === 'detail' && detailId && (
          <button id="tab-detail" style={{ flex: '1 0 auto', padding: '0.7rem 1rem', borderRadius: '7px', border: 0,
            color: '#fff', background: '#1769aa', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            Detail #{detailId}
          </button>
        )}
      </div>

      {tab === 'confrontation' && renderP1()}
      {tab === 'tableau-bord'  && renderP2()}
      {tab === 'liste'         && renderP3()}
      {tab === 'detail'        && renderP4()}
      {tab === 'statistiques'  && renderP5()}

      <style>{`
        .cf-ccard{display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;padding:1.1rem 1.25rem;border:1px solid #dfe5ed;border-left:4px solid #1769aa;border-radius:12px;background:linear-gradient(135deg,#eef7ff,#f7fbff)}
        .cf-form{padding:1.25rem;border:1px solid #dfe5ed;border-radius:12px;background:#fff}
        .cfb{display:inline-flex;align-items:center;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.72rem;font-weight:800;white-space:nowrap}
        .cfb-g{background:#d1fae5;color:#065f46}.cfb-b{background:#dbeafe;color:#1e40af}.cfb-o{background:#fff3cd;color:#8a5d00}.cfb-r{background:#fee2e2;color:#991b1b}.cfb-x{background:#f1f5f9;color:#475569}
        .cf-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;margin-bottom:1rem}
        .cf-kpi{display:grid;gap:0.4rem;padding:1rem;border:1px solid #dfe5ed;border-radius:10px;background:#f8fafc}
        .cf-kpi-lbl{color:#657083;font-size:0.75rem}.cf-kpi-val{display:block;color:#172033;font-size:1.3rem;font-weight:800}
        .cf-repart{display:grid;gap:0.6rem;padding:1rem;border:1px solid #dfe5ed;border-radius:12px;background:#fafcff}
        .cf-repart-row{display:grid;grid-template-columns:130px 1fr 90px;align-items:center;gap:0.75rem}
        .cf-repart-lbl{color:#4b5565;font-size:0.82rem}
        .cf-bar-wrap{height:10px;border-radius:999px;background:#edf2f7;overflow:hidden}
        .cf-bar{height:100%;border-radius:999px;transition:width 600ms ease}
        .cf-repart-cnt{color:#657083;font-size:0.78rem;text-align:right}
        .cf-bars{display:flex;align-items:flex-end;gap:1rem;padding:1.25rem;border:1px solid #dfe5ed;border-radius:12px;background:#fafcff;overflow-x:auto;min-height:200px}
        .cf-bar-col{display:flex;flex-direction:column;align-items:center;gap:0.35rem;min-width:80px}
        .cf-bar-col-wrap{width:100%;height:120px;display:flex;align-items:flex-end;border-bottom:2px solid #dfe5ed}
        .cf-bar-col-fill{width:100%;border-radius:4px 4px 0 0;transition:height 600ms ease}
        .cf-actions{margin-top:1.5rem;padding:1.25rem;border:1px solid #dfe5ed;border-radius:12px;background:#fafcff}
        .cf-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(17,24,39,.55);backdrop-filter:blur(4px);padding:1rem}
        .cf-modal{width:min(100%,520px);padding:1.75rem;border-radius:16px;background:#fff;box-shadow:0 24px 60px rgba(17,24,39,.3)}
        .cf-modal h3{margin:0 0 0.75rem;color:#172033;font-size:1.15rem}
        .cf-modal p{color:#657083;font-size:0.88rem;line-height:1.5}
        @media(max-width:760px){.cf-kpis{grid-template-columns:repeat(2,1fr)}.cf-repart-row{grid-template-columns:100px 1fr 70px}}
      `}</style>
    </section>
  );
}
