import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/api';
import logoDgi from '../../assets/logodgi.jpg';

/**
 * Écran public de demande de réinitialisation du mot de passe, atteint depuis le
 * lien « Mot de passe oublié ? » de `/`. Reprend la mise en page de `/`,
 * `/signup` et `/attente-activation` (`.login-page`, `.login-brand-panel`,
 * `.login-form-panel`).
 *
 * L'adresse e-mail est préremplie depuis l'état de navigation transmis par
 * l'écran de connexion ; rien n'est lu depuis l'URL.
 */
export default function MotDePasseOublie({ isDarkMode = false, onToggleTheme }) {
    const { state } = useLocation();
    const [email, setEmail] = useState(String(state?.email || '').trim());
    const [feedback, setFeedback] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFeedback(null);
        setIsSubmitting(true);

        try {
            const response = await api.post('/auth/reset-request', { email });
            setFeedback({ tone: 'success', message: response.data?.message });
        } catch (resetError) {
            setFeedback({ tone: 'error', message: getErrorMessage(resetError) });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <section className="login-brand-panel" aria-label="Direction Générale des Impôts">
                <img src={logoDgi} alt="Logo de la Direction Générale des Impôts" />
                <p className="login-kicker">République de Madagascar · DGI</p>
                <h1>Hetra<span>•</span>SSIF</h1>
                <h1 className="login-brand-caption">S <span>•</span> P <span>•</span> S <span>•</span> C <span>•</span> F</h1>
                <div className="login-panel-rule" />
                <p className="login-brand-note">Acces à la plateforme du systeme de pilotage et du suivi de la conformite fiscale.</p>
            </section>

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
                    <h2>Mot de passe oublié</h2>
                    <p className="login-intro">Demandez la réinitialisation du mot de passe de votre compte agent.</p>

                    <div className="login-reset">
                        <p className="login-reset-note">
                            La plateforme n&apos;envoie pas d&apos;e-mail automatique. Votre demande est enregistrée dans
                            l&apos;historique et un administrateur définit un nouveau mot de passe.
                        </p>
                        <ol className="attente-etapes">
                            <li>Vous indiquez l&apos;adresse e-mail de votre compte agent.</li>
                            <li>Un administrateur traite la demande depuis « Gestion Utilisateurs ».</li>
                            <li>Il vous communique le nouveau mot de passe, à changer après connexion.</li>
                        </ol>
                    </div>

                    <label className="login-field">
                        E-mail du compte
                        <input
                            type="email"
                            name="email"
                            autoComplete="username"
                            maxLength={255}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="agent@dgi.mg"
                            required
                        />
                    </label>
                    {feedback && (
                        <p
                            className={feedback.tone === 'error' ? 'login-error' : 'login-success'}
                            role={feedback.tone === 'error' ? 'alert' : 'status'}
                        >
                            {feedback.message}
                        </p>
                    )}
                    <button className="login-submit" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                    </button>
                    <Link className="auth-link" to="/">← Retour à la connexion</Link>
                    <p className="login-security-note">
                        La réponse est identique que le compte existe ou non : l&apos;adresse n&apos;est jamais confirmée.
                    </p>
                </form>
            </section>
        </div>
    );
}
