import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/api';
import logoDgi from '../assets/logodgi.jpg';

/**
 * Redirection après connexion : un agent dont le rôle est `admin` est envoyé
 * directement sur la page de gestion des utilisateurs (`/admin`), les autres
 * arrivent sur le tableau de bord (`/acceuil`).
 *
 * Le rôle provient de la réponse de `POST /api/auth/login`, donc d'une session
 * réellement authentifiée : il n'y a aucun contournement possible.
 */
const getLandingPath = (user) => (user?.role === 'admin' ? '/admin' : '/acceuil');

export default function Signin({ onAuthenticated }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const user = response.data?.user;
            onAuthenticated(user);
            navigate(getLandingPath(user), { replace: true });
        } catch (loginError) {
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
                <h1>TAXE<span>•</span>SSIF</h1>
                <h1 className="login-brand-caption">S <span>•</span> P <span>•</span> S <span>•</span> C <span>•</span> F</h1>
                <div className="login-panel-rule" />
                <p className="login-brand-note">Acces à la plateforme du systeme de pilotage et du suivi de la conformite fiscale.</p>
            </section>

            {/* section droite */}
            <section className="login-form-panel">
                <form className="login-form" onSubmit={handleSubmit}>
                    <p className="login-kicker">Espace agent</p>
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
                        <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </label>
                    {error && <p className="login-error" role="alert">{error}</p>}
                    <button className="login-submit" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                    <Link className="auth-link" to="/signup">S'inscrire</Link>
                    <p className="login-security-note">Attendre les autorisations de l'administrateur du site.</p>
                </form>
            </section>
        </div>
    );
}