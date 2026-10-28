import { Link, useLocation } from 'react-router-dom';
import logoDgi from '@/assets/logodgi.jpg';

/**
 * Écran « compte en attente d'activation », commun à deux chemins : la fin d'une
 * inscription (`origine: 'inscription'`) et le refus de connexion d'un compte pas
 * encore activé (`origine: 'connexion'`). Reprend intégralement la mise en page
 * de `/` et `/signup` (`.login-page`, `.login-brand-panel`, `.login-form-panel`).
 *
 * Aucune donnée sensible n'est lue depuis l'URL : l'identité affichée provient de
 * l'état transmis par la page d'inscription ou par le formulaire de connexion.
 */
export default function AttenteActivation() {
  const { state } = useLocation();
  const estInscription = state?.origine === 'inscription';
  const estConnexionRefusee = state?.origine === 'connexion';
  const email = String(state?.email || '').trim();
  const titulaire = [state?.prenom, state?.nom].filter(Boolean).join(' ');

  return (
    <div className="login-page">
      <section className="login-brand-panel" aria-label="Direction Générale des Impôts">
        <img src={logoDgi} alt="Logo de la Direction Générale des Impôts" />
        <p className="login-kicker">République de Madagascar · DGI</p>
        <h1>Hetra<span>•</span>SSIF</h1>
        <h1 className="login-brand-caption">S <span>•</span> P <span>•</span> S <span>•</span> C <span>•</span> F</h1>
        <div className="login-panel-rule" />
        <p className="login-brand-note">
          Acces à la plateforme du systeme de pilotage et du suivi de la conformite fiscale.
        </p>
      </section>

      <section className="login-form-panel">
        <div className="login-form">
          <p className="login-kicker">Espace agent</p>
          <h2>{estInscription ? 'Demande enregistrée' : 'Compte en attente d’activation'}</h2>
          <p className="login-intro">
            {estInscription
              ? 'Votre demande d’accès a bien été enregistrée. Attendez l’activation de votre compte par un administrateur.'
              : estConnexionRefusee
                ? 'Votre compte est en attente d’activation par un administrateur. La connexion restera refusée jusque-là.'
                : 'La plateforme n’est accessible qu’aux comptes activés par un administrateur. Saisissez vos identifiants pour savoir où en est votre demande.'}
          </p>

          <p className="attente-statut">
            <span className="badge surveillance">En attente d’activation</span>
          </p>

          {(titulaire || email) && (
            <dl className="attente-compte">
              {titulaire && (
                <div>
                  <dt>Titulaire</dt>
                  <dd>{titulaire}</dd>
                </div>
              )}
              {email && (
                <div>
                  <dt>Adresse e-mail</dt>
                  <dd>{email}</dd>
                </div>
              )}
              <div>
                <dt>État du compte</dt>
                <dd>Non activé — accès à la plateforme fermé</dd>
              </div>
            </dl>
          )}

          <ol className="attente-etapes">
            <li>Un administrateur examine la demande depuis « Gestion Utilisateurs ».</li>
            <li>Le compte passe en statut « Actif », avec son rôle et son centre de rattachement.</li>
            <li>Vous pouvez alors vous connecter avec vos identifiants.</li>
          </ol>

          <Link to="/" className="login-submit attente-retour">
            ← Retour à la connexion
          </Link>
          <Link className="auth-link" to="/mot-de-passe-oublie">
            Mot de passe oublié ?
          </Link>
          <Link className="auth-link" to="/signup">
            Créer un autre compte
          </Link>
          <p className="login-security-note">
            Aucun e-mail automatique n’est envoyé : un administrateur définit le nouveau mot de passe.
          </p>
        </div>
      </section>
    </div>
  );
}
