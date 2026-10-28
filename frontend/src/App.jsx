import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { deconnexion, getMoi } from '@/api';

// Composants communs
import Header from './components/common/Header';
import EspaceContribuable from './accountcontribuable/EspaceContribuable';
import { getLandingPath } from './utils/session.utils';

// Pages de connexion, d'inscription et d'administration
import Signin from './backofficeadmin/auth/signin';
import Signup from './backofficeadmin/auth/signup';
import AttenteActivation from './backofficeadmin/auth/attente-activation';
import MotDePasseOublie from './backofficeadmin/auth/mot-de-passe-oublie';
import AccueilAdmin from './backofficeadmin/dashboard/AdminDashboard';
import Admin from './backofficeadmin/utilisateurs/AdminUtilisateurs';
import AdminRoles from './backofficeadmin/roles/AdminRoles';
import AdminVerificationNIF from './backofficeadmin/verification-nif/AdminVerificationNIF';
import VerificationNifSql from './backofficeadmin/verification-nif/VerificationNifSql';
import VerificationNifExcel from './backofficeadmin/verification-nif/VerificationNifExcel';
import VerificationNifJson from './backofficeadmin/verification-nif/VerificationNifJson';
import AdminHistorique from './backofficeadmin/historique/AdminHistorique';

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
  DeclarationCreate,
  RecoupementCreate,
  DroitCommunicationCreate,
  Register,
  CentreDetail,
  CentreListe,
  UniteFiscaleDetail,
  RelanceFiscale,
} from './frontofficeagent';

/**
 * Composant racine de l'application SP2CF / TVA•SSIF
 */
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const estPortailContribuable = location.pathname.startsWith('/espace-contribuable/');
  const [sessionVerifiee, setSessionVerifiee] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentModule, setCurrentModule] = useState('sales');
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('tva-ssif-theme') === 'dark'
  );

  // Le portail contribuable s'ouvre hors session agent : il n'a rien à vérifier.
  const isCheckingSession = !estPortailContribuable && !sessionVerifiee;

  useEffect(() => {
    localStorage.setItem('tva-ssif-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (estPortailContribuable) return undefined;

    getMoi()
      .then((donnees) => {
        setCurrentUser(donnees?.user || null);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setCurrentUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => setSessionVerifiee(true));
  }, [estPortailContribuable]);

  /**
   * Après connexion : l'écran de connexion transmet l'agent renvoyé par l'API ;
   * s'il n'est pas fourni, le profil est relu depuis la session.
   */
  const handleAuthenticated = (authenticatedUser = null) => {
    setCurrentUser(authenticatedUser);

    if (!authenticatedUser) {
      getMoi()
        .then((donnees) => setCurrentUser(donnees?.user || null))
        .catch(() => setCurrentUser(null));
    }

    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await deconnexion();
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
          path="/espace-contribuable/:token"
          element={(
            <EspaceContribuable
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode((prev) => !prev)}
            />
          )}
        />
        <Route
          path="/"
          element={isCheckingSession ? <p className="auth-loading">Vérification de la session...</p> : (
            isAuthenticated ? <Navigate to={getLandingPath(currentUser)} replace /> : (
              <Signin
                onAuthenticated={handleAuthenticated}
                isDarkMode={isDarkMode}
                onToggleTheme={() => setIsDarkMode((prev) => !prev)}
              />
            )
          )}
        />
        <Route path="/signin" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/attente-activation" element={<AttenteActivation />} />
        <Route
          path="/mot-de-passe-oublie"
          element={(
            <MotDePasseOublie
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode((prev) => !prev)}
            />
          )}
        />
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
                  user={currentUser}
                  isAdmin={currentUser?.role === 'admin'}
                />
                <main className="app-main"><Outlet /></main>
              </>
            ) : <Navigate to="/" replace />
          )}
        >
          <Route path="/acceuil" element={<Accueil currentUser={currentUser} />} />
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
          <Route path="/contribuables/:id/declarations/nouveau" element={<DeclarationCreate />} />
          <Route path="/contribuables/:id/recoupements" element={<ContribuableDetail />} />
          <Route path="/contribuables/:id/recoupements/nouveau" element={<RecoupementCreate />} />
          <Route path="/contribuables/:id/droits-communication" element={<ContribuableDetail />} />
          <Route path="/contribuables/:id/droits-communication/nouveau" element={<DroitCommunicationCreate />} />
          <Route path="/contribuables/:id/relances" element={<ContribuableDetail />} />
          <Route path="/contribuables/:id/confrontation" element={<Confrontation currentUser={currentUser} />} />
          <Route path="/relance" element={<RelanceFiscale />} />
          <Route path="/admin" element={<AccueilAdmin currentUser={currentUser} />} />
          <Route path="/admin/utilisateurs" element={<Admin currentUser={currentUser} />} />
          <Route path="/admin/roles" element={<AdminRoles currentUser={currentUser} />} />
          <Route path="/admin/verification-nif" element={<AdminVerificationNIF currentUser={currentUser} />} />
          <Route path="/admin/verification-nif/sql" element={<VerificationNifSql currentUser={currentUser} />} />
          <Route path="/admin/verification-nif/excel" element={<VerificationNifExcel currentUser={currentUser} />} />
          <Route path="/admin/verification-nif/json" element={<VerificationNifJson currentUser={currentUser} />} />
          <Route path="/admin/historique" element={<AdminHistorique currentUser={currentUser} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
