import { useEffect, useRef, useState } from 'react';
import { changeOwnPassword, getErrorMessage } from '../../api/api';
import { roleDefinition } from '../../backofficeadmin/utils/roles.utils';
import { initialsOf } from '../../utils/session.utils';
import ModaleConfirmation from './ModaleConfirmation';

const CHAMPS_VIDES = { actuel: '', nouveau: '', confirmation: '' };

/**
 * Profil de l'agent connecté : la barre ne montre qu'une pastille ronde portant
 * les initiales. Le nom, l'e-mail, le rôle, le centre, le périmètre, le changement
 * de son propre mot de passe, la bascule du thème et la déconnexion n'apparaissent
 * qu'une fois le panneau déroulé.
 *
 * La modale de mot de passe est rendue dans le conteneur du profil : les clics
 * qu'elle reçoit ne referment donc pas le panneau, et Échap ne ferme qu'elle.
 */
export default function UserProfile({ user, onLogout, isDarkMode, onToggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [visibles, setVisibles] = useState({});
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [enCours, setEnCours] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const onKeyDown = (event) => {
      if (modaleOuverte) return;
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, modaleOuverte]);

  if (!user) return null;

  const role = roleDefinition(user.role);
  const fullName =
    `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() || user.email || 'Agent';

  const ecrireChamp = (cle, valeur) => {
    setChamps((courant) => ({ ...courant, [cle]: valeur }));
    setErreur('');
    setSucces('');
  };

  const ouvrirModale = () => {
    setChamps(CHAMPS_VIDES);
    setVisibles({});
    setErreur('');
    setSucces('');
    setModaleOuverte(true);
  };

  const fermerModale = () => {
    setModaleOuverte(false);
    setErreur('');
    setSucces('');
  };

  const validerChangement = async () => {
    if (!champs.actuel || !champs.nouveau || !champs.confirmation) {
      setErreur('Renseignez le mot de passe actuel, le nouveau mot de passe et sa confirmation.');
      return;
    }
    if (champs.nouveau !== champs.confirmation) {
      setErreur('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (champs.nouveau.length < 4) {
      setErreur('Le nouveau mot de passe doit contenir au moins 4 caractères.');
      return;
    }
    if (champs.nouveau === champs.actuel) {
      setErreur('Le nouveau mot de passe doit être différent de l\'actuel.');
      return;
    }

    setErreur('');
    setEnCours(true);

    try {
      const reponse = await changeOwnPassword({
        password_actuel: champs.actuel,
        password_nouveau: champs.nouveau,
        password_confirmation: champs.confirmation,
      });
      setChamps(CHAMPS_VIDES);
      setSucces(reponse?.message || 'Mot de passe modifié.');
    } catch (requestError) {
      setErreur(getErrorMessage(requestError));
    } finally {
      setEnCours(false);
    }
  };

  const champMotDePasse = (cle, libelle, placeHolder) => (
    <label className="field">
      <span>{libelle}</span>
      <div className="login-field-control">
        <input
          type={visibles[cle] ? 'text' : 'password'}
          value={champs[cle]}
          maxLength={72}
          autoComplete={cle === 'actuel' ? 'current-password' : 'new-password'}
          placeholder={placeHolder}
          onChange={(event) => ecrireChamp(cle, event.target.value)}
        />
        <button
          type="button"
          className="login-password-toggle"
          onClick={() => setVisibles((courant) => ({ ...courant, [cle]: !courant[cle] }))}
          aria-pressed={Boolean(visibles[cle])}
        >
          {visibles[cle] ? 'Masquer' : 'Afficher'}
        </button>
      </div>
    </label>
  );

  return (
    <div className="user-profile" ref={containerRef}>
      <button
        type="button"
        className={`user-profile-toggle${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-controls={isOpen ? 'user-profile-menu' : undefined}
        aria-expanded={isOpen}
        aria-label={`Profil de ${fullName}, ${role.label}`}
        title={`${fullName} · ${role.label}`}
      >
        {initialsOf(user)}
      </button>

      {isOpen && (
        <div className="user-profile-menu" id="user-profile-menu" aria-label="Profil utilisateur">
          <div className="user-profile-menu-head">
            <span className="user-profile-avatar" aria-hidden="true">
              {initialsOf(user)}
            </span>
            <div className="user-profile-menu-id">
              <strong>{fullName}</strong>
              <small>{user.email}</small>
            </div>
            <button
              type="button"
              className="agent-profile-fermer"
              aria-label="Fermer le profil"
              title="Fermer le profil"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <dl className="user-profile-details">
            <div>
              <dt>Rôle</dt>
              <dd className={`badge user-profile-role ${role.badge}`}>{role.label}</dd>
            </div>
            <div>
              <dt>Centre de rattachement</dt>
              <dd>{user.nom_centre || 'Aucun centre affecté'}</dd>
            </div>
            <div>
              <dt>Périmètre</dt>
              <dd>{role.droits}</dd>
            </div>
          </dl>

          <div className="user-profile-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={onToggleTheme}
              aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
              title={isDarkMode ? 'Basculer en mode clair' : 'Basculer en mode sombre'}
            >
              <span aria-hidden="true">{isDarkMode ? '☀' : '☾'}</span>
              {isDarkMode ? 'Mode clair' : 'Mode sombre'}
            </button>
            <button
              type="button"
              className="user-profile-motdepasse"
              onClick={ouvrirModale}
              title="Remplacer mon mot de passe, après confirmation"
            >
              🔑 Changer mon mot de passe
            </button>
            <button
              type="button"
              className="logout-button user-profile-logout"
              onClick={onLogout}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}

      <ModaleConfirmation
        ouvert={modaleOuverte}
        etiquette="Mot de passe"
        titre="Changer mon mot de passe"
        intro={
          succes
            ? 'Le mot de passe de votre compte a été remplacé. Il sera exigé à la prochaine connexion.'
            : 'Le mot de passe actuel est demandé : une session détournée ne suffit donc pas à reprendre le compte. Les sessions déjà ouvertes restent valables jusqu\'à leur expiration.'
        }
        messageErreur={erreur}
        messageSucces={succes}
        texteValider="Valider"
        enCours={enCours}
        onValider={succes ? null : validerChangement}
        onFermer={fermerModale}
      >
        {succes ? null : (
          <>
            {champMotDePasse('actuel', 'Mot de passe actuel', 'Votre mot de passe en cours')}
            {champMotDePasse('nouveau', 'Nouveau mot de passe', '4 caractères minimum')}
            {champMotDePasse('confirmation', 'Confirmer le nouveau mot de passe', 'Retapez le nouveau')}
          </>
        )}
      </ModaleConfirmation>
    </div>
  );
}
