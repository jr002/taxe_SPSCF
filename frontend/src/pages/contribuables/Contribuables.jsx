import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExcelImportModal from '../../components/forms/ExcelImportModal';
import ContribuablesFilters from './components/ContribuablesFilters';
import ContribuablesTable from './components/ContribuablesTable';
import Pagination from './components/Pagination';
import useContribuablesList from './hooks/useContribuablesList';

export default function Contribuables() {
  const navigate = useNavigate();
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const list = useContribuablesList();

  const openDetail = (contribuable) => {
    navigate(`/contribuables/${encodeURIComponent(contribuable.key)}`, {
      state: { contribuable },
    });
  };

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Registre fiscal</p>
        <h1>Contribuables</h1>
        <p>
          Retrouvez chaque contribuable et consultez ses déclarations et paiements
          cumulés.
        </p>
      </div>

      <ContribuablesFilters
        allCount={list.allContribuables.length}
        category={list.categorieFilter}
        counts={list.counts}
        filter={list.filter}
        loading={list.loading}
        onCategoryChange={list.updateCategory}
        onFilterChange={list.updateFilter}
        onImport={() => setIsExcelModalOpen(true)}
        onRefresh={list.loadData}
        resultCount={list.filteredContribuables.length}
        page={list.currentPage}
        pageSize={list.pageSize}
      />

      {list.error && <p className="error">{list.error}</p>}

      {list.loading ? (
        <p className="status">Chargement des contribuables...</p>
      ) : (
        <>
          <ContribuablesTable
            allCount={list.allContribuables.length}
            contribuables={list.paginatedContribuables}
            onOpenDetail={openDetail}
          />
          {list.filteredContribuables.length > list.pageSize && (
            <Pagination
              currentPage={list.currentPage}
              onPageChange={list.setCurrentPage}
              totalPages={list.totalPages}
            />
          )}
        </>
      )}

      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={list.loadData}
      />
    </section>
  );
}
