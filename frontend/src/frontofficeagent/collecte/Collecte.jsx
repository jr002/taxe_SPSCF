import { useState } from 'react';

import { getErrorMessage } from '@/api/api';
import CollecterDeductible from './modules/CollecterDeductible';
import TheoreticalForm from './modules/TheoreticalForm';
import ReconciliationForm from './modules/ReconciliationForm';
import InsertionDeclaration from './modules/InsertionDeclaration';
import { enregistrerCollecte } from './utils/enregistrerCollecte';

/**
 * Page de collecte des données de TVA (Module dynamique).
 *
 * Chaque formulaire transmet sa collecte à `handleCollect`, qui l'enregistre en
 * base ; le retour à l'agent passe par `.form-submit-message`, comme sur les
 * autres fiches.
 */
export default function Collecte({ currentModule }) {
  const [message, setMessage] = useState({ tone: '', text: '' });
  const [saving, setSaving] = useState(false);

  const handleCollect = async (collecte) => {
    setSaving(true);
    setMessage({ tone: '', text: '' });
    try {
      const result = await enregistrerCollecte(collecte);
      setMessage({ tone: 'success', text: result.message });
    } catch (requestError) {
      setMessage({ tone: 'error', text: getErrorMessage(requestError) });
    } finally {
      setSaving(false);
    }
  };

  const renderModule = () => {
    const props = { surCollecte: handleCollect, enCours: saving };
    switch (currentModule) {
      case 'theoretical':
        return <TheoreticalForm {...props} />;
      case 'reconciliation':
        return <ReconciliationForm {...props} />;
      case 'declaration':
        return <InsertionDeclaration {...props} />;
      case 'sales':
      default:
        return <CollecterDeductible {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {message.text && (
        <p
          className={`${message.tone} form-submit-message collecte-message`}
          role={message.tone === 'success' ? 'status' : 'alert'}
        >
          {message.tone === 'success' ? '✅' : '⚠'} {message.text}
        </p>
      )}

      {renderModule()}
    </div>
  );
}
