import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import '@/App.css';
import { deconnexion, getMoi } from '@/api';

// Composants transverses et utilitaires chargés avec la coquille de l'application
import { AgentSidebar, Header, EspaceOperateurs } from '@/components/common';
import { getLandingPath } from '@/utils';
// L'écran de connexion reste dans le bundle initial : c'est la porte d'entrée.
import Signin from '@/backofficeadmin/auth/pages/Signin';

// Chaque page est un module séparé, chargé à la première visite de sa route.
const EspaceContribuable = lazy(() => import('@/accountcontribuable/pages/EspaceContribuable'));

const AdminDashboard = lazy(() => import('@/backofficeadmin/dashboard/pages/AdminDashboard'));
const AdminHistorique = lazy(() => import('@/backofficeadmin/historique/pages/AdminHistorique'));
const AdminRoles = lazy(() => import('@/backofficeadmin/roles/pages/AdminRoles'));
const AdminUtilisateurs = lazy(() => import('@/backofficeadmin/utilisateurs/pages/AdminUtilisateurs'));
const AdminVerificationNIF = lazy(() => import('@/backofficeadmin/verification-nif/pages/AdminVerificationNIF'));
const VerificationNifExcel = lazy(() => import('@/backofficeadmin/verification-nif/pages/VerificationNifExcel'));
const VerificationNifJson = lazy(() => import('@/backofficeadmin/verification-nif/pages/VerificationNifJson'));
const VerificationNifSql = lazy(() => import('@/backofficeadmin/verification-nif/pages/VerificationNifSql'));
const AttenteActivation = lazy(() => import('@/backofficeadmin/auth/pages/AttenteActivation'));
const MotDePasseOublie = lazy(() => import('@/backofficeadmin/auth/pages/MotDePasseOublie'));
const Signup = lazy(() => import('@/backofficeadmin/auth/pages/Signup'));

const Accueil = lazy(() => import('@/frontofficeagent/accueil/pages/Accueil'));
const CentreDetail = lazy(() => import('@/frontofficeagent/centres/pages/CentreDetail'));
const CentreListe = lazy(() => import('@/frontofficeagent/centres/pages/CentreListe'));
const Register = lazy(() => import('@/frontofficeagent/centres/pages/Register'));
const UniteFiscaleDetail = lazy(() => import('@/frontofficeagent/centres/pages/UniteFiscaleDetail'));
const Collecte = lazy(() => import('@/frontofficeagent/collecte/pages/Collecte'));
const Confrontation = lazy(() => import('@/frontofficeagent/confrontation/pages/Confrontation'));
const ContribuableDetail = lazy(() => import('@/frontofficeagent/contribuables/pages/ContribuableDetail'));
const Contribuables = lazy(() => import('@/frontofficeagent/contribuables/pages/Contribuables'));
const DeclarationCreate = lazy(() => import('@/frontofficeagent/contribuables/pages/DeclarationCreate'));
const DroitCommunicationCreate = lazy(() => import('@/frontofficeagent/contribuables/pages/DroitCommunicationCreate'));
const RecoupementCreate = lazy(() => import('@/frontofficeagent/contribuables/pages/RecoupementCreate'));
const TableauDecisionnel = lazy(() => import('@/frontofficeagent/decisionnel/pages/TableauDecisionnel'));
const PhaseClassement = lazy(() => import('@/frontofficeagent/entreprises/pages/PhaseClassement'));
const FormInformation = lazy(() => import('@/frontofficeagent/entreprises/pages/FormInformation'));
const FileTravail = lazy(() => import('@/frontofficeagent/file-travail/pages/FileTravail'));
const RelanceFiscale = lazy(() => import('@/frontofficeagent/relance/pages/RelanceFiscale'));
const SuiviFiscal = lazy(() => import('@/frontofficeagent/suivi-fiscal/pages/SuiviFiscal'));
const DeclarationDetail = lazy(() => import('@/frontofficeagent/suivi-fiscal/pages/DeclarationDetail'));

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
  const isAdmin = currentUser?.role === 'admin';
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
      <Suspense fallback={<p className="auth-loading">Chargement de la page…</p>}>
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
                  isAdmin={isAdmin}
                />
                {isAdmin ? (
                  <main className="app-main"><Outlet /></main>
                ) : (
                  <div className="agent-layout">
                    <AgentSidebar
                      isChefCentre={currentUser?.role === 'chef_centre'}
                    />
                    <main className="app-main"><Outlet /></main>
                  </div>
                )}
              </>
            ) : <Navigate to="/" replace />
          )}
        >
          <Route path="/accueil" element={<Accueil currentUser={currentUser} />} />
          <Route path="/acceuil" element={<Navigate to="/accueil" replace />} />
          <Route path="/collecte" element={<Collecte currentModule={currentModule} />} />
          <Route path="/entreprises/nouveau" element={<PhaseClassement />} />
          <Route path="/entreprises/nouveau/form" element={<FormInformation />} />
          <Route path="/decisionnel" element={<TableauDecisionnel />} />
          <Route path="/register" element={<Register />} />
          <Route path="/centres/:id" element={<CentreDetail />} />
          <Route path="/centres-fiscaux" element={<CentreListe />} />
          <Route path="/centres-fiscaux/:type/:index" element={<UniteFiscaleDetail />} />
          <Route path="/suivi" element={<SuiviFiscal />} />
          <Route path="/file-de-travail" element={<FileTravail />} />
          <Route path="/suivi/:id" element={<DeclarationDetail />} />
          {/* Portefeuille contribuable : espace des rôles opérationnels, fermé à
              l'administrateur même quand il tape l'URL directement. */}
          <Route path="/contribuables" element={<EspaceOperateurs currentUser={currentUser}><Contribuables /></EspaceOperateurs>} />
          <Route path="/contribuables/:id" element={<EspaceOperateurs currentUser={currentUser}><ContribuableDetail /></EspaceOperateurs>} />
          <Route path="/contribuables/:id/classification" element={<EspaceOperateurs currentUser={currentUser}><ContribuableDetail /></EspaceOperateurs>} />
          <Route path="/contribuables/:id/declarations" element={<EspaceOperateurs currentUser={currentUser}><ContribuableDetail /></EspaceOperateurs>} />
          <Route path="/contribuables/:id/declarations/nouveau" element={<EspaceOperateurs currentUser={currentUser}><DeclarationCreate /></EspaceOperateurs>} />
          <Route path="/contribuables/:id/recoupements" element={<EspaceOperateurs currentUser={currentUser}><ContribuableDetail /></EspaceOperateurs>} />
          <Route path="/contribuables/:id/recoupements/nouveau" element={<EspaceOperateurs currentUser={currentUser}><RecoupementCreate /></EspaceOperateurs>} />
          <Route path="/contribuables/:id/droits-communication" element={<EspaceOperateurs currentUser={currentUser}><ContribuableDetail /></EspaceOperateurs>} />
          <Route path="/contribuables/:id/droits-communication/nouveau" element={<EspaceOperateurs currentUser={currentUser}><DroitCommunicationCreate /></EspaceOperateurs>} />
          <Route path="/contribuables/:id/relances" element={<EspaceOperateurs currentUser={currentUser}><ContribuableDetail /></EspaceOperateurs>} />
          <Route path="/contribuables/:id/confrontation" element={<EspaceOperateurs currentUser={currentUser}><Confrontation currentUser={currentUser} /></EspaceOperateurs>} />
          <Route path="/relance" element={<RelanceFiscale />} />
          <Route path="/admin" element={<AdminDashboard currentUser={currentUser} />} />
          <Route path="/admin/utilisateurs" element={<AdminUtilisateurs currentUser={currentUser} />} />
          <Route path="/admin/roles" element={<AdminRoles currentUser={currentUser} />} />
          <Route path="/admin/verification-nif" element={<AdminVerificationNIF currentUser={currentUser} />} />
          <Route path="/admin/verification-nif/sql" element={<VerificationNifSql currentUser={currentUser} />} />
          <Route path="/admin/verification-nif/excel" element={<VerificationNifExcel currentUser={currentUser} />} />
          <Route path="/admin/verification-nif/json" element={<VerificationNifJson currentUser={currentUser} />} />
          <Route path="/admin/historique" element={<AdminHistorique currentUser={currentUser} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}
