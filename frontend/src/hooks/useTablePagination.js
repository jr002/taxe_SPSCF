import { useMemo, useState } from 'react';

/**
 * Pagination côté client : renvoie la tranche courante de `items` et laisse
 * l'appelant réinitialiser la page quand un filtre change. La page demandée est
 * toujours bornée au nombre réel de pages, donc une liste qui se raccourcit
 * n'affiche jamais une page vide.
 *
 * `controle = { page, onPageChange }` délègue la page courante à l'appelant —
 * les écrans qui la portent dans l'URL s'en servent pour survivre au rechargement.
 */
export function useTablePagination(items = [], pageSize = 10, controle = null) {
  const [pageInterne, setPageInterne] = useState(1);

  const pageDemandee = controle ? controle.page : pageInterne;
  const changerPage = controle ? controle.onPageChange : setPageInterne;

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(pageDemandee, totalPages);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    pageItems,
    currentPage: safePage,
    setCurrentPage: changerPage,
    totalPages,
    pageSize,
    isPaginated: items.length > pageSize,
  };
}
