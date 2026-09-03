import { useEffect, useState } from 'react';
import { getDeclarationStats, getDeclarations, getErrorMessage } from '../api/api';

/**
 * Hook personnalisé pour charger les statistiques globales et la liste des déclarations
 */
export default function useDecisionnelData() {
  const [stats, setStats] = useState(null);
  const [declarations, setDeclarations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reloadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [statsResult, declarationsResult] = await Promise.all([
        getDeclarationStats(),
        getDeclarations({ limit: 10000 }),
      ]);

      setStats(statsResult);
      setDeclarations(declarationsResult.data || declarationsResult);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  return { stats, declarations, error, loading, reloadData };
}
