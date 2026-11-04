import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  getErrorMessage,
  getStatutAccesContribuable,
  ouvrirAccesContribuable,
} from '@/api';
import logoDgi from '@/assets/logodgi.jpg';
import AideContribuable from '@/accountcontribuable/components/AideContribuable';
import RegleFiscale from '@/accountcontribuable/components/RegleFiscale';
import SituationFiscale from '@/accountcontribuable/components/SituationFiscale';
import { formatDateLongue } from '@/accountcontribuable/utils/portail.utils';

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
  // Deux vues dans le même écran public : le dossier, puis l'aide et les repères
  // légaux. `aideSection` mémorise l'ancre demandée par un lien « comprendre ».
  const [vue, setVue] = useState('dossier');
  const [aideSection, setAideSection] = useState('');

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
      setVue('dossier');
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

  const ouvrirAide = (section) => {
    setAideSection(section || '');
    setVue('aide');
    window.scrollTo({ top: 0 });
  };

  const retourDossier = () => {
    setVue('dossier');
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="portail">
      <div className={`portail-shell${dossier || vue === 'aide' ? '' : ' portail-shell-etroit'}`}>
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

        {vue === 'aide' ? (
          <AideContribuable
            section={aideSection}
            expiration={lien?.date_expiration}
            libelleRetour={dossier ? 'Retour à mon dossier' : 'Retour à la connexion'}
            onRetour={retourDossier}
          />
        ) : dossier ? (
          <SituationFiscale
            dossier={dossier}
            expiration={lien?.date_expiration}
            onFermer={() => setDossier(null)}
            onOuvrirAide={ouvrirAide}
          />
        ) : chargement ? (
          <p className="status" role="status">Vérification du lien d'accès…</p>
        ) : erreurLien ? (
          <section className="panel portail-verification">
            <p className="eyebrow">Espace contribuable</p>
            <h1>Lien indisponible</h1>
            <p className="portail-intro" role="alert">{erreurLien}</p>
            <p className="procedure-note">
              Pour des raisons de sécurité, un lien expire automatiquement et peut être
              remplacé par votre centre fiscal. Aucune donnée n'est affichée sans lien valide.
            </p>
            <button type="button" className="portail-aide-lien" onClick={() => ouvrirAide('')}>
              Aide &amp; repères légaux
            </button>
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
              <RegleFiscale id="expiration_lien" onOuvrirAide={ouvrirAide} compact>
                Lien valable jusqu’au {formatDateLongue(lien?.date_expiration)}
              </RegleFiscale>
              {'. Ne le partagez pas : après confirmation du NIF et de l’e-mail, il donne accès à vos '}
              données fiscales.
              {' '}
              <RegleFiscale id="tentative_lien" onOuvrirAide={ouvrirAide} compact>
                Huit tentatives sont admises par lien
              </RegleFiscale>
              {', et une ouverture réussie remet le compteur à zéro.'}
            </p>

            <div className="portail-verification-aide">
              <p>
                Avant d’ouvrir votre dossier, vous pouvez lire l’aide : comment se lisent un écart,
                une notification, une relance, et quels délais et textes s’appliquent.
              </p>
              <button type="button" className="secondary" onClick={() => ouvrirAide('')}>
                Aide &amp; repères légaux
              </button>
            </div>
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
