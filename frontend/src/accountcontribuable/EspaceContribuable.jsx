import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  getErrorMessage,
  getStatutAccesContribuable,
  ouvrirAccesContribuable,
} from '@/api';
import logoDgi from '@/assets/logodgi.jpg';
import SituationFiscale from './components/SituationFiscale';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'long' });
};

/** Sous ce seuil, le compteur de tentatives restantes devient utile au contribuable. */
const SEUIL_ALERTE_TENTATIVES = 3;

function messageTentatives(restantes) {
  if (restantes === null) return '';
  if (restantes === 0) {
    return 'Trop de tentatives échouées : ce lien est temporairement bloqué. Réessayez dans quelques minutes ou demandez un nouveau lien à votre centre fiscal.';
  }
  return `Il vous reste ${restantes} tentative${restantes > 1 ? 's' : ''} avant le blocage temporaire de ce lien.`;
}

function ContenuEspace({ token, isDarkMode, onToggleTheme }) {
  const [lien, setLien] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreurLien, setErreurLien] = useState('');
  const [nif, setNif] = useState('');
  const [email, setEmail] = useState('');
  const [verificationEnCours, setVerificationEnCours] = useState(false);
  const [erreurVerification, setErreurVerification] = useState('');
  const [alerteTentatives, setAlerteTentatives] = useState('');
  const [dossier, setDossier] = useState(null);

  useEffect(() => {
    let actif = true;

    getStatutAccesContribuable(token)
      .then((resultat) => {
        if (actif) setLien(resultat);
      })
      .catch((error) => {
        if (actif) setErreurLien(getErrorMessage(error));
      })
      .finally(() => {
        if (actif) setChargement(false);
      });

    return () => {
      actif = false;
    };
  }, [token]);

  const verifier = async (event) => {
    event.preventDefault();
    setVerificationEnCours(true);
    setErreurVerification('');
    setAlerteTentatives('');

    try {
      const resultat = await ouvrirAccesContribuable(token, { nif, email });
      setDossier(resultat);
      setNif('');
      setEmail('');
    } catch (error) {
      const restantes = error.response?.data?.tentatives_restantes;
      const borne = Number.isInteger(restantes) && restantes <= SEUIL_ALERTE_TENTATIVES ? restantes : null;
      setErreurVerification(getErrorMessage(error));
      setAlerteTentatives(messageTentatives(borne));
    } finally {
      setVerificationEnCours(false);
    }
  };

  return (
    <div className="portail">
      <div className={`portail-shell${dossier ? '' : ' portail-shell-etroit'}`}>
        <header className="portail-brand">
          <img src={logoDgi} alt="Direction Générale des Impôts" />
          <div>
            <strong>Hetra<span>•</span>SSIF</strong>
            <span>République de Madagascar · DGI</span>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
            title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
          >
            {isDarkMode ? '☀' : '☾'}
          </button>
        </header>

        {dossier ? (
          <SituationFiscale
            dossier={dossier}
            expiration={lien?.date_expiration}
            onFermer={() => setDossier(null)}
          />
        ) : chargement ? (
          <p className="status">Vérification du lien d'accès…</p>
        ) : erreurLien ? (
          <section className="panel portail-verification">
            <p className="eyebrow">Espace contribuable</p>
            <h1>Lien indisponible</h1>
            <p className="portail-intro" role="alert">{erreurLien}</p>
            <p className="procedure-note">
              Pour des raisons de sécurité, un lien expire automatiquement et peut être
              remplacé par votre centre fiscal. Aucune donnée n'est affichée sans lien valide.
            </p>
          </section>
        ) : (
          <section className="panel portail-verification">
            <p className="eyebrow">Espace contribuable</p>
            <h1>Ma situation fiscale</h1>
            <p className="portail-intro">
              Ce lien a été émis pour le dossier <strong>{lien?.raison_sociale_masquee}</strong>
              {lien?.centre ? `, suivi par ${lien.centre}` : ''}. Confirmez votre identité
              avec votre NIF et l'adresse e-mail enregistrée dans ce dossier.
            </p>

            <form className="portail-form" onSubmit={verifier}>
              <label className="login-field">
                NIF
                <input
                  type="text"
                  name="nif"
                  autoComplete="off"
                  value={nif}
                  onChange={(event) => setNif(event.target.value)}
                  maxLength={100}
                  required
                />
              </label>
              <label className="login-field">
                Adresse e-mail enregistrée
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={255}
                  required
                />
              </label>
              {erreurVerification && (
                <p className="login-error" role="alert">{erreurVerification}</p>
              )}
              {alerteTentatives && (
                <p className="procedure-note" role="status">{alerteTentatives}</p>
              )}
              <button className="login-submit" type="submit" disabled={verificationEnCours}>
                {verificationEnCours ? 'Vérification en cours…' : 'Accéder à mon dossier'}
              </button>
            </form>

            <p className="portail-note">
              Lien valable jusqu'au {formatDate(lien?.date_expiration)}. Ne le partagez pas :
              après confirmation du NIF et de l'e-mail, il donne accès à vos données fiscales.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

export default function EspaceContribuable({ isDarkMode = false, onToggleTheme }) {
  const { token = '' } = useParams();

  return (
    <ContenuEspace
      key={token}
      token={token}
      isDarkMode={isDarkMode}
      onToggleTheme={onToggleTheme}
    />
  );
}
