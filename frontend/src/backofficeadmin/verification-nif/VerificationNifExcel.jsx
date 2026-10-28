import { useState } from 'react';
import ErreursVerification from './ErreursVerification';
import HistoriqueVerification from './HistoriqueVerification';
import VerificationNifLayout from './VerificationNifLayout';
import {
  COLONNES_MODELE,
  MODELE_EXCEL_NOM,
  loadHistorique,
  loadReferentiel,
  lireNifsDepuisExcel,
  mergeReferentiel,
  nouvelleErreur,
  pushHistorique,
  telechargerModeleExcel,
} from './verification.utils';

/**
 * Page dédiée du type 2 : enrichissement du référentiel NIF depuis un classeur
 * Excel lu côté navigateur. Un modèle vierge, portant exactement les colonnes
 * reconnues, est téléchargeable avant l'import.
 */
export default function VerificationNifExcel({ currentUser }) {
  const [message, setMessage] = useState('');
  const [erreurs, setErreurs] = useState([]);
  const [referentiel, setReferentiel] = useState(() => loadReferentiel());
  const [historique, setHistorique] = useState(() => loadHistorique('excel'));

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage('');
    setErreurs([]);

    try {
      const entrees = await lireNifsDepuisExcel(file);
      const fusionne = mergeReferentiel(entrees, referentiel);
      setReferentiel(fusionne);
      setMessage(`✓ Succès : ${entrees.length} NIF importés et liés depuis ${file.name}.`);
      setHistorique(
        pushHistorique('excel', {
          label: file.name,
          detail: `${entrees.length} NIF liés · référentiel porté à ${fusionne.length} entrées`,
          reussi: true,
        }),
      );
    } catch (readError) {
      setErreurs([
        nouvelleErreur('Lecture du classeur refusée', readError.message),
        nouvelleErreur('Format attendu', `Une feuille « NIF » dont la ligne d'en-têtes porte ${COLONNES_MODELE.join(' · ')}.`),
      ]);
      setHistorique(
        pushHistorique('excel', {
          label: file.name,
          detail: readError.message,
          reussi: false,
        }),
      );
    } finally {
      // Le champ doit être vidé pour autoriser la sélection du même fichier deux fois.
      event.target.value = '';
    }
  };

  return (
    <VerificationNifLayout
      currentUser={currentUser}
      eyebrow="Backoffice Administration · Vérification NIF"
      titre="2 · Liaison via Fichier Excel"
      description="Importez un fichier Excel de contribuables certifiés (.xlsx, .xls, .csv) pour enrichir le référentiel de vérification."
    >
      <div className="panel" style={{ borderTop: '4px solid #10b981' }}>
        <div className="verif-gabarit">
          <p>
            Modèle vierge à compléter : une feuille « NIF » portant uniquement la ligne d'en-têtes{' '}
            <strong>{COLONNES_MODELE.join(' · ')}</strong>. Le classeur est généré sous le nom{' '}
            <code>{MODELE_EXCEL_NOM}</code>.
          </p>
          <button type="button" className="admin-secondary-button" onClick={telechargerModeleExcel}>
            📥 Télécharger le modèle Excel
          </button>
        </div>

        <label className="verif-dropzone" style={{ marginTop: '0.9rem' }}>
          <span className="verif-dropzone-icon" aria-hidden="true">
            📁
          </span>
          <span className="verif-dropzone-label">Choisir un fichier Excel (.xlsx, .xls, .csv)</span>
          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        <p className="status" style={{ marginTop: '0.9rem', fontSize: '0.85rem' }}>
          Colonnes reconnues : <strong>NIF</strong> (ou nif / Numero), <strong>RaisonSociale</strong> (ou Nom /
          raison_sociale), <strong>Centre</strong>. Référentiel actuel : {referentiel.length} entrées.
        </p>

        {message && (
          <p className="success form-submit-message" role="status">
            {message}
          </p>
        )}

        <ErreursVerification entries={erreurs} onClear={() => setErreurs([])} />
      </div>

      <HistoriqueVerification
        entries={historique}
        emptyLabel="Aucun import Excel enregistré sur ce navigateur."
      />
    </VerificationNifLayout>
  );
}
