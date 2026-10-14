import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import api from './api/api';

// Composants communs
import Header from './components/common/Header';

// Pages de connexion, d'inscription et d'administration
import Signin from './users/signin';
import Signup from './users/signup';
import AccueilAdmin from './users/acceuiladmin';
import Admin from './users/admin';

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
  Confrontation,
  Register,
  CentreDetail,
  CentreListe,
  UniteFiscaleDetail,
  RelanceFiscale,
} from './pages';

/**
 * Composant racine de l'application SP2CF / TVA•SSIF
 */
export default function App() {
  const navigate = useNavigate();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentModule, setCurrentModule] = useState('sales');
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('tva-ssif-theme') === 'dark'
  );

  useEffect(() => {
    localStorage.setItem('tva-ssif-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    api.get('/auth/me')
      .then((response) => {
        setCurrentUser(response.data?.user || null);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setCurrentUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => setIsCheckingSession(false));
  }, []);

  /**
   * Après connexion : l'écran de connexion transmet l'agent renvoyé par l'API ;
   * s'il n'est pas fourni, le profil est relu depuis la session.
   */
  const handleAuthenticated = (authenticatedUser = null) => {
    setCurrentUser(authenticatedUser);

    if (!authenticatedUser) {
      api.get('/auth/me')
        .then((response) => setCurrentUser(response.data?.user || null))
        .catch(() => setCurrentUser(null));
    }

    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setCurrentUser(null);
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
              <Signin onAuthenticated={handleAuthenticated} />
            )
          )}
        />
        <Route path="/signin" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Signup />} />
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
                  isAdmin={currentUser?.role === 'admin'}
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
          <Route path="/centres-fiscaux" element={<CentreListe />} />
          <Route path="/centres-fiscaux/:type/:index" element={<UniteFiscaleDetail />} />
          <Route path="/suivi" element={<SuiviFiscal />} />
          <Route path="/suivi/:id" element={<DeclarationDetail />} />
          <Route path="/contribuables" element={<Contribuables />} />
          <Route path="/contribuables/:id" element={<ContribuableDetail />} />
          <Route path="/contribuables/:id/classification" element={<ContribuableDetail />} />
          <Route path="/contribuables/:id/declarations" element={<ContribuableDetail />} />
          <Route path="/contribuables/:id/relances" element={<ContribuableDetail />} />
          <Route path="/contribuables/:id/confrontation" element={<Confrontation />} />
          <Route path="/relance" element={<RelanceFiscale />} />
          <Route path="/admin" element={<AccueilAdmin currentUser={currentUser} />} />
          <Route path="/admin/utilisateurs" element={<Admin currentUser={currentUser} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
