import { formatAriary } from './utils';

export default function Dashboard({ loading, error, stats }) {
  if (loading) return <p className="status">Chargement…</p>;
  if (error) return <p className="empty error">{error}</p>;
  if (!stats) return <p className="empty">Aucune donnée disponible pour cette période.</p>;
  const cards = [['Déclarations analysées', stats.declarations, '#1769aa'], ['Recoupements analysés', stats.recoupements, '#1769aa'], ['Rapprochements exacts', stats.exact, '#237a43'], ['Avec tolérance', stats.tolerance, '#8a5d00'], ['Partiels', stats.partiel, '#946200'], ['Écarts', stats.ecart, '#b42318'], ['À vérifier', stats.a_verifier, '#8a5d00'], ['Validés', stats.valide, '#1769aa']];
  return <div><div className="section-heading"><span className="section-number">2</span><div><h2>Tableau de bord</h2><p>Synthèse des confrontations du contribuable sélectionné.</p></div></div><div className="cf-kpis">{cards.map(([label, value, color]) => <article className="cf-kpi" key={label}><span>{label}</span><strong style={{ color }}>{value}</strong></article>)}</div><div className="cf-three-columns">{[['Montant total déclaré', stats.montant_declare_total, '#1769aa'], ['Montant total recoupé', stats.montant_recoupe_total, '#237a43'], ['Écart global', stats.ecart_total, Number(stats.ecart_total) > 0 ? '#b42318' : '#237a43']].map(([label, value, color]) => <div className="sum-field" key={label}><span>{label}</span><strong style={{ color }}>{formatAriary(value)}</strong></div>)}</div></div>;
}
