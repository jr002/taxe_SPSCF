import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage, inscrireAgent } from '@/api';
import logoDgi from '@/assets/logodgi.jpg';

export default function Signup() {
    const navigate = useNavigate();
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (password !== confirmation) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setIsSubmitting(true);
        try {
            await inscrireAgent({ nom, prenom, email, password });
            // L'écran dédié tient lieu de confirmation : la demande y est
            // récapitulée avec le bouton de retour vers la connexion.
            navigate('/attente-activation', {
                replace: true,
                state: { origine: 'inscription', email: email.trim(), nom: nom.trim(), prenom: prenom.trim() },
            });
        } catch (registrationError) {
            setError(getErrorMessage(registrationError));
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
                    <p className="login-kicker">Espace agent</p>
                    <h2>Créer un compte</h2>
                    <p className="login-intro">Enregistrez votre demande d’accès à la plateforme.</p>
                    <label className="login-field">
                        Nom
                        <input
                            type="text"
                            name="nom"
                            autoComplete="family-name"
                            maxLength={100}
                            value={nom}
                            onChange={(event) => setNom(event.target.value)}
                            required
                        />
                    </label>
                    <label className="login-field">
                        Prénom
                        <input
                            type="text"
                            name="prenom"
                            autoComplete="given-name"
                            maxLength={100}
                            value={prenom}
                            onChange={(event) => setPrenom(event.target.value)}
                            required
                        />
                    </label>
                    <label className="login-field">
                        Adresse e-mail
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            maxLength={255}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </label>
                    <label className="login-field">
                        Mot de passe (4 caractères minimum)
                        <input
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            minLength={4}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </label>
                    <label className="login-field">
                        Confirmer le mot de passe
                        <input
                            type="password"
                            name="password-confirmation"
                            autoComplete="new-password"
                            minLength={4}
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            required
                        />
                    </label>
                    {error && <p className="login-error" role="alert">{error}</p>}
                    <button className="login-submit" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Enregistrement...' : 'Créer mon compte'}
                    </button>
                    <Link className="auth-link" to="/">Déjà inscrit ? Se connecter</Link>
                    <p className="login-security-note">
                        Après l’enregistrement, un écran confirme la demande et attend son activation par un
                        administrateur.
                    </p>
                </form>
            </section>
        </div>
    );
}
