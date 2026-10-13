import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

import ExcelImportModal from '../../components/forms/ExcelImportModal';
import ContribuablesFilters from './components/ContribuablesFilters';
import ContribuablesTable from './components/ContribuablesTable';
import Pagination from './components/Pagination';
import useContribuablesList from './hooks/useContribuablesList';
import { toNumber } from '../../utils/formatters';

export default function Contribuables() {
  const navigate = useNavigate();
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const list = useContribuablesList();

  const openDetail = (contribuable) => {
    navigate(`/contribuables/${encodeURIComponent(contribuable.key)}`, {
      state: { contribuable },
    });
  };

  const exportToExcel = () => {
    const rows = list.filteredContribuables.map((contribuable) => ({
      'Raison sociale': contribuable.raison_sociale || '',
      NIF: contribuable.nif || '',
      "Secteur d'activité": contribuable.secteur_activite || '',
      Catégorie: contribuable.categorie,
      'Dernière année': contribuable.declarations[0]?.annee || '',
      'Nombre de déclarations': contribuable.declarations.length,
      'TVA payée cumulée (Ar)': contribuable.declarations.reduce(
        (total, declaration) => total + toNumber(declaration.tva_payee),
        0
      ),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 32 },
      { wch: 18 },
      { wch: 28 },
      { wch: 16 },
      { wch: 16 },
      { wch: 24 },
      { wch: 26 },
    ];

    for (let row = 2; row <= rows.length + 1; row += 1) {
      const amountCell = worksheet[`G${row}`];
      if (amountCell) amountCell.z = '#,##0 "Ar"';
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contribuables');
    XLSX.writeFile(
      workbook,
      `contribuables-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const hasPagination = list.filteredContribuables.length > list.pageSize;

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
        onExport={exportToExcel}
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

          {hasPagination && (
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
