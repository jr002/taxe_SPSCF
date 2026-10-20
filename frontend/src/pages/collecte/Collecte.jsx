import CollecterDeductible from './modules/CollecterDeductible';
import TheoreticalForm from './modules/TheoreticalForm';
import ReconciliationForm from './modules/ReconciliationForm';
import InsertionDeclaration from './modules/InsertionDeclaration';
import DossierFiscalNavigation from '../../components/common/DossierFiscalNavigation';

/**
 * Page de simulation et de collecte des déclarations de TVA (Module dynamique)
 */
export default function Collecte({ currentModule }) {
  const handleCollect = (title, description, amount, company) => {
    console.log('Donnée fiscale collectée :', { title, description, amount, company });
  };

  const renderModule = () => {
    switch (currentModule) {
      case 'theoretical':
        return <TheoreticalForm surCollecte={handleCollect} />;
      case 'reconciliation':
        return <ReconciliationForm surCollecte={handleCollect} />;
      case 'declaration':
        return <InsertionDeclaration surCollecte={handleCollect} />;
      case 'sales':
      default:
        return <CollecterDeductible surCollecte={handleCollect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <DossierFiscalNavigation mode="collecte" />
      {renderModule()}
    </div>
  );
}
