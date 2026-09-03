import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';

// Composants communs
import Header from './components/common/Header';

// Pages principales
import Accueil from './pages/Accueil';
import Collecte from './pages/Collecte';
import PhaseClassement from './pages/PhaseClassement';
import FormInformation from './pages/FormInformation';
import TableauDecisionnel from './pages/TableauDecisionnel';
import SuiviFiscal from './pages/SuiviFiscal';
import DeclarationDetail from './pages/DeclarationDetail';
import Contribuables from './pages/Contribuables';
import ContribuableDetail from './pages/ContribuableDetail';
import Register from './pages/Register';

/**
 * Composant racine de l'application SP2CF / TVA•SSIF
 */
export default function App() {
  const [currentModule, setCurrentModule] = useState('sales');
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('tva-ssif-theme') === 'dark'
  );

  useEffect(() => {
    localStorage.setItem('tva-ssif-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const modules = [
    { id: 'sales', label: 'TVA à payer' },
    { id: 'theoretical', label: 'TVA théorique' },
    { id: 'reconciliation', label: 'Recoupement' },
    { id: 'declaration', label: 'Declaration' },
  ];

  return (
    <div className={`app-shell${isDarkMode ? ' dark-theme' : ''}`}>
      <Header
        modules={modules}
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
      />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/collecte" element={<Collecte currentModule={currentModule} />} />
          <Route path="/entreprises/nouveau" element={<PhaseClassement />} />
          <Route path="/entreprises/nouveau/form" element={<FormInformation />} />
          <Route path="/decisionnel" element={<TableauDecisionnel />} />
          <Route path="/register" element={<Register />} />
          <Route path="/suivi" element={<SuiviFiscal />} />
          <Route path="/suivi/:id" element={<DeclarationDetail />} />
          <Route path="/contribuables" element={<Contribuables />} />
          <Route path="/contribuables/:id" element={<ContribuableDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
