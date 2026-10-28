import { useMemo, useState } from 'react';

/**
 * Pagination côté client : renvoie la tranche courante de `items` et laisse
 * l'appelant réinitialiser la page quand un filtre change. La page demandée est
 * toujours bornée au nombre réel de pages, donc une liste qui se raccourcit
 * n'affiche jamais une page vide.
 */
export function useTablePagination(items = [], pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    pageItems,
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    pageSize,
    isPaginated: items.length > pageSize,
  };
}
