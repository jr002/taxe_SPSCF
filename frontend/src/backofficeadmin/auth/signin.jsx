import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { connexion, getErrorMessage } from '@/api';
import { getLandingPath } from '@/utils/session.utils';
import logoDgi from '@/assets/logodgi.jpg';

/**
 * Redirection après connexion : `getLandingPath` envoie un agent dont le rôle
 * est `admin` sur son backoffice, les autres sur le tableau de bord.
 *
 * Le rôle provient de la réponse de `POST /api/auth/login`, donc d'une session
 * réellement authentifiée : il n'y a aucun contournement possible.
 */

export default function Signin({ onAuthenticated, isDarkMode = false, onToggleTheme }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const { user } = await connexion(email, password);
            onAuthenticated(user);
            navigate(getLandingPath(user), { replace: true });
        } catch (loginError) {
            // Un compte non activé a son propre écran de statut ; les autres
            // échecs restent signalés en ligne, sous le formulaire.
            if (loginError.response?.data?.code === 'COMPTE_EN_ATTENTE') {
                navigate('/attente-activation', { replace: true, state: { origine: 'connexion', email } });
                return;
            }
            setError(getErrorMessage(loginError));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            {/* section gauche */}
            <section className="login-brand-panel" aria-label="Direction Générale des Impôts">
                <img src={logoDgi} alt="Logo de la Direction Générale des Impôts" />
                <p className="login-kicker">République de Madagascar · DGI</p>
                <h1>Hetra<span>•</span>SSIF</h1>
                <h1 className="login-brand-caption">S <span>•</span> P <span>•</span> S <span>•</span> C <span>•</span> F</h1>
                <div className="login-panel-rule" />
                <p className="login-brand-note">Acces à la plateforme du systeme de pilotage et du suivi de la conformite fiscale.</p>
            </section>

            {/* section droite */}
            <section className="login-form-panel">
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-form-top">
                        <p className="login-kicker">Espace agent</p>
                        <button
                            type="button"
                            className="theme-toggle"
                            onClick={onToggleTheme}
                            aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
                            title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
                        >
                            {isDarkMode ? '☀' : '☾'}
                        </button>
                    </div>
                    <h2>Se connecter</h2>
                    <p className="login-intro">Connectez-vous avec les identifiants de votre compte agent.</p>
                    <label className="login-field">
                        Adresse e-mail
                        <input
                            type="email"
                            name="email"
                            autoComplete="username"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </label>
                    <label className="login-field">
                        Mot de passe
                        <div className="login-field-control">
                            <input
                                type={isPasswordVisible ? 'text' : 'password'}
                                name="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="login-password-toggle"
                                onClick={() => setIsPasswordVisible((previous) => !previous)}
                                aria-pressed={isPasswordVisible}
                            >
                                {isPasswordVisible ? 'Masquer' : 'Afficher'}
                            </button>
                        </div>
                    </label>
                    {error && <p className="login-error" role="alert">{error}</p>}
                    <button className="login-submit" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                    <Link className="login-forgot" to="/mot-de-passe-oublie" state={{ email }}>
                        Mot de passe oublié ?
                    </Link>
                    <Link className="auth-link" to="/signup">S'inscrire</Link>
                    <p className="login-security-note">Attendre les autorisations de l'administrateur du site.</p>
                </form>
            </section>
        </div>
    );
}
