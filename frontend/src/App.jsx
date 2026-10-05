import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import api from './api/api';

// Composants communs
import Header from './components/common/Header';

// Page de connexion
import Login from './users/login';

// Pages principales (organisation modulaire par domaine)
import {
  Accueil,
  Collecte,
  PhaseClassement,
  FormInformation,
  TableauDecisionnel,
  SuiviFiscal,
  DeclarationDetail,
  Contribuables,
  ContribuableDetail,
  Register,
  CentreDetail,
  RelanceFiscale,
} from './pages';

/**
 * Composant racine de l'application SP2CF / TVA•SSIF
 */
export default function App() {
  const navigate = useNavigate();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentModule, setCurrentModule] = useState('sales');
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('tva-ssif-theme') === 'dark'
  );

  useEffect(() => {
    localStorage.setItem('tva-ssif-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    api.get('/auth/me')
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsCheckingSession(false));
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setIsAuthenticated(false);
      navigate('/', { replace: true });
    }
  };

  const modules = [
    { id: 'sales', label: 'TVA à payer' },
    { id: 'theoretical', label: 'TVA théorique' },
    { id: 'reconciliation', label: 'Recoupement' },
    { id: 'declaration', label: 'Declaration' },
  ];

  return (
    <div className={`app-shell${isDarkMode ? ' dark-theme' : ''}`}>
      <Routes>
        <Route
          path="/"
          element={isCheckingSession ? <p className="auth-loading">Vérification de la session...</p> : (
            isAuthenticated ? <Navigate to="/acceuil" replace /> : (
              <Login onAuthenticated={() => setIsAuthenticated(true)} />
            )
          )}
        />
        <Route path="/signin" element={<Navigate to="/" replace />} />
        <Route
          element={isCheckingSession ? <p className="auth-loading">Vérification de la session...</p> : (
            isAuthenticated ? (
              <>
                <Header
                  modules={modules}
                  currentModule={currentModule}
                  onSelectModule={setCurrentModule}
                  isDarkMode={isDarkMode}
                  onToggleTheme={() => setIsDarkMode((prev) => !prev)}
                  onLogout={handleLogout}
                />
                <main className="app-main"><Outlet /></main>
              </>
            ) : <Navigate to="/" replace />
          )}
        >
          <Route path="/acceuil" element={<Accueil />} />
          <Route path="/collecte" element={<Collecte currentModule={currentModule} />} />
          <Route path="/entreprises/nouveau" element={<PhaseClassement />} />
          <Route path="/entreprises/nouveau/form" element={<FormInformation />} />
          <Route path="/decisionnel" element={<TableauDecisionnel />} />
          <Route path="/register" element={<Register />} />
          <Route path="/centres/:id" element={<CentreDetail />} />
          <Route path="/suivi" element={<SuiviFiscal />} />
          <Route path="/suivi/:id" element={<DeclarationDetail />} />
          <Route path="/contribuables" element={<Contribuables />} />
          <Route path="/contribuables/:id" element={<ContribuableDetail />} />
          <Route path="/contribuables/:id/classification" element={<ContribuableDetail />} />
          <Route path="/contribuables/:id/declarations" element={<ContribuableDetail />} />
          <Route path="/contribuables/:id/relances" element={<ContribuableDetail />} />
          <Route path="/relance" element={<RelanceFiscale />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
