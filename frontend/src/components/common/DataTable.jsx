import Pagination from '@/components/common/Pagination';

/**
 * Table unique du produit : en-têtes, lignes cliquables au clavier, état vide,
 * chargement et pagination. Les colonnes, les filtres et le tri restent la
 * responsabilité de l'écran ; ce composant ne fait que rendre une liste de la
 * même façon partout.
 *
 * `column.header` accepte un nœud (par exemple un bouton de tri) et prime sur
 * `column.label`.
 */
export default function DataTable({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowClassName,
  rowTitle,
  loading = false,
  loadingMessage = 'Chargement…',
  emptyMessage = 'Aucune ligne à afficher.',
  filteredEmptyMessage = 'Aucun résultat correspondant à cette recherche.',
  isFiltered = false,
  pagination = null,
  ariaLabel,
}) {
  if (loading) return <p className="status" role="status">{loadingMessage}</p>;

  return (
    <>
      <div className="table-wrap">
        <table aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={column.className}>
                  {column.header ?? column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const ouvrir = onRowClick ? () => onRowClick(row) : null;
              return (
                <tr
                  key={rowKey(row)}
                  className={[ouvrir ? 'clickable-row' : '', rowClassName?.(row) || ''].filter(Boolean).join(' ')}
                  title={rowTitle?.(row)}
                  tabIndex={ouvrir ? 0 : undefined}
                  onClick={ouvrir || undefined}
                  onKeyDown={ouvrir ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      ouvrir();
                    }
                  } : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={column.className}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="empty">
                  {isFiltered ? filteredEmptyMessage : emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}
    </>
  );
}
