import { useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '@/api';
import CollecterDeductible from '@/frontofficeagent/collecte/components/CollecterDeductible.jsx';
import TheoreticalForm from '@/frontofficeagent/collecte/components/TheoreticalForm.jsx';
import ReconciliationForm from '@/frontofficeagent/collecte/components/ReconciliationForm.jsx';
import InsertionDeclaration from '@/frontofficeagent/collecte/components/InsertionDeclaration.jsx';
import { enregistrerCollecte } from '@/frontofficeagent/collecte/utils/enregistrerCollecte';

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
  const feedbackRef = useRef(null);

  // Le retour se rend au-dessus du module, loin du bouton d'envoi : le ramener à l'écran.
  useEffect(() => {
    if (feedbackRef.current) feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [message]);

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
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Déclaration de TVA</p>
        <h1>Collecte TVA</h1>
      </div>

      {message.text && (
        <p
          ref={feedbackRef}
          className={`${message.tone} form-submit-message collecte-message`}
          role={message.tone === 'success' ? 'status' : 'alert'}
        >
          {message.tone === 'success' ? '✅' : '⚠'} {message.text}
        </p>
      )}

      {renderModule()}
    </section>
  );
}
