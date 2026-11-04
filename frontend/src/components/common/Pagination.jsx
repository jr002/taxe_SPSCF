import { getPageNumbers } from '@/utils';

/**
 * Barre de pages des tableaux. `showSinglePage` la garde visible même quand la
 * liste tient sur une seule page : les tables du backoffice n'ont que quelques
 * lignes aujourd'hui et doivent tout de même afficher leur pagination.
 */
export default function Pagination({ currentPage, onPageChange, totalPages, showSinglePage = false }) {
  if (totalPages <= 1 && !showSinglePage) return null;

  return (
    <nav className="pagination-controls" aria-label="Pagination du tableau">
      <button type="button" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
        Précédent
      </button>
      {getPageNumbers(currentPage, totalPages).map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="pagination-ellipsis" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={page === currentPage ? 'active' : ''}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Suivant
      </button>
    </nav>
  );
}
