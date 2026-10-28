import { useRef, useState } from 'react';

import { genererAccesContribuable, getErrorMessage } from '@/api/api';
import { useModalA11y } from '@/hooks/useModalA11y';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'long' });
};

export default function LienAccesModal({ ouvert, contribuable, onFermer }) {
  const dialogRef = useModalA11y(ouvert, onFermer);
  const inputRef = useRef(null);
  const [duree, setDuree] = useState(7);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [resultat, setResultat] = useState(null);
  const [copie, setCopie] = useState(false);

  if (!ouvert) return null;

  const url = resultat ? `${window.location.origin}${resultat.chemin}` : '';

  const generer = async () => {
    setEnCours(true);
    setErreur('');
    setCopie(false);

    try {
      const data = await genererAccesContribuable(contribuable.id_contribuable, {
        duree_jours: Number(duree),
      });
      setResultat(data);
    } catch (error) {
      setErreur(getErrorMessage(error));
    } finally {
      setEnCours(false);
    }
  };

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setErreur('');
    } catch {
      inputRef.current?.focus();
      inputRef.current?.select();
      setErreur('La copie automatique est indisponible : le lien est sélectionné, utilisez Ctrl+C.');
    }
  };

  return (
    <div className="rappel-modal-overlay modale-confirmation-overlay" onClick={onFermer}>
      <div
        className="modale-confirmation"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={resultat ? 'Lien de consultation prêt' : 'Émettre un lien de consultation'}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modale-confirmation-head">
          <span className="badge surveillance">Accès contribuable</span>
          <button
            type="button"
            className="agent-profile-fermer"
            aria-label="Fermer"
            title="Fermer"
            onClick={onFermer}
          >
            ✕
          </button>
        </div>

        {resultat ? (
          <>
            <div className="modale-confirmation-corps">
              <h2>Lien prêt à transmettre</h2>
              <p className="modale-confirmation-intro">
                Transmettez ce lien à {contribuable.raison_sociale} par un canal sûr.
                Le contribuable devra confirmer son NIF et l'adresse e-mail {resultat.email_masque}.
              </p>
              <div className="lien-acces-url">
                <input
                  ref={inputRef}
                  type="text"
                  readOnly
                  value={url}
                  aria-label="Lien d'accès du contribuable"
                  onFocus={(event) => event.target.select()}
                />
                <button type="button" onClick={copier}>{copie ? 'Copié' : 'Copier'}</button>
              </div>
              <p className="modale-confirmation-succes" role="status">
                Valable jusqu'au {formatDate(resultat.date_expiration)} · Consultation en lecture seule.
              </p>
              <p className="modale-confirmation-intro">
                Le lien actif précédent a été révoqué. Une nouvelle émission remplacera également celui-ci.
              </p>
              {erreur && <p className="modale-confirmation-erreur" role="alert">{erreur}</p>}
            </div>
            <div className="modale-confirmation-pied admin-inline-actions">
              <button type="button" className="primary" onClick={onFermer}>Terminer</button>
            </div>
          </>
        ) : (
          <>
            <div className="modale-confirmation-corps">
              <h2>Émettre un lien pour {contribuable.raison_sociale}</h2>
              <p className="modale-confirmation-intro">
                Ce lien ouvre une page « Ma situation fiscale » limitée à ce dossier.
                Le contribuable confirme son identité avec son NIF et l'adresse e-mail enregistrée.
              </p>
              <label className="login-field">
                Durée de validité
                <select
                  className="lien-acces-select"
                  value={duree}
                  onChange={(event) => setDuree(Number(event.target.value))}
                  disabled={enCours}
                >
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                </select>
              </label>
              <div className="rule-box">
                <strong>Lien unique et révocable.</strong>
                <span> Générer ce lien révoque immédiatement le lien actif précédent. Le dossier affiché reste en lecture seule et ne contient aucune note interne de l'agent.</span>
              </div>
              {erreur && <p className="modale-confirmation-erreur" role="alert">{erreur}</p>}
            </div>
            <div className="modale-confirmation-pied admin-inline-actions">
              <button type="button" className="modale-confirmation-annuler" onClick={onFermer} disabled={enCours}>
                Annuler
              </button>
              <button type="button" className="primary" onClick={generer} disabled={enCours}>
                {enCours ? 'Génération…' : 'Générer le lien'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
