import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';

import ExcelImportModal from '../../components/forms/ExcelImportModal';
import ContribuablesFilters from './components/ContribuablesFilters';
import ContribuablesStatistiques from './components/ContribuablesStatistiques';
import ContribuablesTable from './components/ContribuablesTable';
import Pagination from '../../components/common/Pagination';
import DossierFiscalNavigation from '../../components/common/DossierFiscalNavigation';
import useContribuablesList from './hooks/useContribuablesList';

const vues = [
  ['registre', 'Registre', ''],
  ['statistique', 'Statistique', '?vue=statistique'],
];

export default function Contribuables() {
  const navigate = useNavigate();
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const list = useContribuablesList();
  const [searchParams] = useSearchParams();
  const isStatistique = searchParams.get('vue') === 'statistique';

  const openDetail = (contribuable) => {
    navigate(`/contribuables/${encodeURIComponent(contribuable.key)}`, {
      state: { contribuable },
    });
  };

  const exportToExcel = () => {
    const rows = list.filteredContribuables.map((contribuable) => ({
      NIF: contribuable.nif || '',
      "Secteur d'activité": contribuable.secteur_activite || '',
      Adresse: contribuable.adresse || '',
      Téléphone: contribuable.telephone || '',
      'E-mail': contribuable.email || '',
      'Centre gestionnaire': contribuable.centres?.nom_centre || '',
      "Nature d'impôt": contribuable.regime_fiscal || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 32 },
      { wch: 36 },
      { wch: 20 },
      { wch: 30 },
      { wch: 28 },
      { wch: 14 },
    ];

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
      <DossierFiscalNavigation mode="collecte" />

      <div className="page-heading">
        <p className="eyebrow">Registre fiscal</p>
        <h1>Contribuables</h1>
        <p>
          Retrouvez chaque contribuable et consultez ses déclarations et paiements
          cumulés.
        </p>
      </div>

      <nav className="contribuable-tabs" aria-label="Vues du registre des contribuables">
        {vues.map(([key, label, suffix]) => (
          <Link className={isStatistique === (key === 'statistique') ? 'active' : ''} key={key} to={`/contribuables${suffix}`}>
            {label}
          </Link>
        ))}
      </nav>

      {list.error && <p className="error">{list.error}</p>}

      {list.loading ? (
        <p className="status">Chargement des contribuables...</p>
      ) : isStatistique ? (
        <ContribuablesStatistiques contribuables={list.allContribuables} />
      ) : (
        <>
          <ContribuablesFilters
            allCount={list.allContribuables.length}
            category={list.categorieFilter}
            counts={list.counts}
            filter={list.filter}
            hasActiveFilters={list.hasActiveFilters}
            loading={list.loading}
            onCategoryChange={list.updateCategory}
            onClearFilters={list.clearFilters}
            onFilterChange={list.updateFilter}
            onExport={exportToExcel}
            onImport={() => setIsExcelModalOpen(true)}
            onRefresh={list.loadData}
            resultCount={list.filteredContribuables.length}
            page={list.currentPage}
            pageSize={list.pageSize}
          />

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
