import { getPageNumbers } from '@/utils/pagination.utils';

/**
 * Barre de pages des tableaux. `showSinglePage` la garde visible même quand la
 * liste tient sur une seule page : les tables du backoffice n'ont que quelques
 * lignes aujourd'hui et doivent tout de même afficher leur pagination.
 */
export default function Pagination({ currentPage, onPageChange, totalPages, showSinglePage = false }) {
  if (totalPages <= 1 && !showSinglePage) return null;
  return <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
    <button type="button" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>Précédent</button>
    {getPageNumbers(currentPage, totalPages).map((page, index) => page === '...' ? (
      <span key={`ellipsis-${index}`} style={{ padding: '0.5rem 0.6rem', color: '#64748b' }}>…</span>
    ) : (
      <button key={page} type="button" onClick={() => onPageChange(page)} className={page === currentPage ? 'active' : ''} style={{ minWidth: '2.25rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #dfe5ed', background: page === currentPage ? '#1d4ed8' : '#fff', color: page === currentPage ? '#fff' : '#172033', fontWeight: 700 }}>{page}</button>
    ))}
    <button type="button" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>Suivant</button>
  </div>;
}
