import { useState } from 'react';
import ErreursVerification from './ErreursVerification';
import HistoriqueVerification from './HistoriqueVerification';
import VerificationNifLayout from './VerificationNifLayout';
import {
  DOSSIER_REFERENTIEL_LOCAL,
  MODELE_JSON_NOM,
  chargerReferentielDepuisApiJson,
  formatDateHeure,
  loadApisJson,
  loadHistorique,
  loadReferentiel,
  marquerApiSynchronisee,
  mergeReferentiel,
  nouvelleErreur,
  pushApiJson,
  pushHistorique,
  removeApiJson,
  synchroniserCatalogueJson,
  telechargerModeleJson,
} from './verification.utils';

const FICHIER_EXEMPLE = `${DOSSIER_REFERENTIEL_LOCAL}referentiel-nif-exemple.json`;

/**
 * Page dédiée du type 3 : liaison du référentiel NIF avec des sources JSON.
 * Trois voies — le catalogue des unités fiscales du frontend, un fichier déposé
 * dans `frontend/public/referentiel-nif/` (servi en statique) et une API JSON
 * distante — plus le modèle de déclaration téléchargeable.
 */
export default function VerificationNifJson({ currentUser }) {
  const [message, setMessage] = useState('');
  const [erreurs, setErreurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [referentiel, setReferentiel] = useState(() => loadReferentiel());
  const [historique, setHistorique] = useState(() => loadHistorique('json'));
  const [apis, setApis] = useState(() => loadApisJson());
  const [nouvelleUrl, setNouvelleUrl] = useState('');

  const consigner = async (libelle, operation) => {
    setLoading(true);
    setMessage('');
    setErreurs([]);

    try {
      const entrees = await operation();
      const fusionne = mergeReferentiel(entrees, referentiel);
      setReferentiel(fusionne);
      setMessage(`✓ ${libelle} : ${entrees.length} NIFs liés · référentiel porté à ${fusionne.length} entrées.`);
      setHistorique(
        pushHistorique('json', {
          label: libelle,
          detail: `${entrees.length} NIFs liés · référentiel porté à ${fusionne.length} entrées`,
          reussi: true,
        }),
      );
      return entrees.length;
    } catch (syncError) {
      setErreurs([nouvelleErreur(`Liaison refusée — ${libelle}`, syncError.message)]);
      setHistorique(
        pushHistorique('json', { label: libelle, detail: syncError.message, reussi: false }),
      );
      return 0;
    } finally {
      setLoading(false);
    }
  };

  const handleLierCatalogue = () => consigner('unitefiscal.json', synchroniserCatalogueJson);

  const handleSynchroniserApi = async (api) => {
    const lies = await consigner(api.label, () => chargerReferentielDepuisApiJson(api.url));
    if (lies) {
      setApis(marquerApiSynchronisee(api.id, { nbNifs: lies, total: loadReferentiel().length }));
    }
  };

  const handleAjouterApi = (event) => {
    event.preventDefault();
    setErreurs([]);
    setMessage('');

    try {
      const { apis: enregistrees, api } = pushApiJson(nouvelleUrl);
      setApis(enregistrees);
      setNouvelleUrl('');
      setMessage(`✓ API enregistrée : ${api.url}. Synchronisez-la pour lier ses NIFs au référentiel.`);
    } catch (urlError) {
      setErreurs([nouvelleErreur('Adresse refusée', urlError.message)]);
    }
  };

  const handleRetirerApi = (api) => setApis(removeApiJson(api.id));

  return (
    <VerificationNifLayout
      currentUser={currentUser}
      eyebrow="Backoffice Administration · Vérification NIF"
      titre="3 · Synchronisation Base JSON"
      description="Liez les NIFs au catalogue des unités fiscales, à un fichier déposé dans le dossier public/referentiel-nif du frontend ou à une API JSON distante."
    >
      <div className="panel" style={{ borderTop: '4px solid #8b5cf6' }}>
        <p className="status" style={{ fontSize: '0.85rem' }}>
          Référentiel actuel : {referentiel.length} entrées. La synchronisation ajoute l'unité opérationnelle DGE
          déclarée dans le catalogue et trois NIFs de contrôle.
        </p>

        <button
          type="button"
          onClick={handleLierCatalogue}
          disabled={loading}
          className="admin-secondary-button"
          style={{ width: '100%', padding: '0.75rem', fontWeight: 600, marginTop: '0.5rem' }}
        >
          {loading ? '⏳ Synchronisation…' : '⚡ Synchroniser avec le catalogue JSON'}
        </button>

        <div className="verif-gabarit">
          <p>
            Modèle de déclaration JSON : un tableau d'objets <code>{'{ "NIF", "RaisonSociale", "Centre" }'}</code>,
            à compléter puis à déposer dans <code>{DOSSIER_REFERENTIEL_LOCAL}</code>. Fichier généré :{' '}
            <code>{MODELE_JSON_NOM}</code>.
          </p>
          <button type="button" className="admin-secondary-button" onClick={telechargerModeleJson}>
            📥 Télécharger le modèle JSON
          </button>
        </div>

        <form className="datatable-toolbar" onSubmit={handleAjouterApi} style={{ marginTop: '1rem' }}>
          <input
            value={nouvelleUrl}
            onChange={(event) => setNouvelleUrl(event.target.value)}
            placeholder={`URL d'une API JSON — ${DOSSIER_REFERENTIEL_LOCAL}mon-referentiel.json ou https://…`}
            aria-label="URL de l'API JSON de référentiel NIF"
            required
          />
          <span>{apis.length} API enregistrée{apis.length > 1 ? 's' : ''}</span>
          <button type="submit">+ Ajouter l'API</button>
        </form>

        {apis.length ? (
          <div className="verif-api-liste">
            {apis.map((api) => (
              <div className="verif-api-item" key={api.id}>
                <span>
                  <code>{api.url}</code>
                  <small>
                    {api.synchroniseeLe
                      ? `Synchronisée le ${formatDateHeure(api.synchroniseeLe)} · ${api.nbNifs} NIFs`
                      : `Ajoutée le ${formatDateHeure(api.date)} · jamais synchronisée`}
                  </small>
                </span>
                <span className="verif-api-actions">
                  <button
                    type="button"
                    className="admin-secondary-button"
                    disabled={loading}
                    onClick={() => handleSynchroniserApi(api)}
                  >
                    ⟳ Synchroniser
                  </button>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() => handleRetirerApi(api)}
                  >
                    ✕ Retirer
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="verif-aide" style={{ marginTop: '0.9rem' }}>
            Aucune API JSON enregistrée sur ce navigateur. Le jeu de démonstration servi par le frontend,{' '}
            <a href={FICHIER_EXEMPLE} target="_blank" rel="noreferrer">
              {FICHIER_EXEMPLE}
            </a>
            , peut être ajouté tel quel pour tester la liaison.
          </p>
        )}

        {message && (
          <p className="success form-submit-message" role="status">
            {message}
          </p>
        )}

        <ErreursVerification entries={erreurs} onClear={() => setErreurs([])} />
      </div>

      <HistoriqueVerification
        entries={historique}
        emptyLabel="Aucune synchronisation JSON enregistrée sur ce navigateur."
      />
    </VerificationNifLayout>
  );
}
