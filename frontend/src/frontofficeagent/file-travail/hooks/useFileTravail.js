import { useCallback, useEffect, useState } from 'react';
import {
  getDeclarations,
  getErrorMessage,
  getRelances,
  getRapprochements,
} from '@/api';
import { construireFile } from '@/frontofficeagent/file-travail/utils/fileTravail.utils';

/**
 * Charge les trois sources de la file (déclarations, rapprochements ouverts,
 * relances émises) et les assemble en actes triés par urgence.
 *
 * `Promise.allSettled` : si une source tombe, la file reste utilisable avec les
 * deux autres plutôt que de se vider entièrement.
 */
export default function useFileTravail() {
  const [actes, setActes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const chargerSources = useCallback(async () => {
    const [declarations, aVerifier, ecarts, relances] = await Promise.allSettled([
      getDeclarations({ limit: 1000 }),
      getRapprochements({ statut: 'a_verifier', limit: 500 }),
      getRapprochements({ statut: 'ecart', limit: 500 }),
      getRelances({ statut: 'emise', limit: 500 }),
    ]);

    // `@/api` renvoie pour ces trois listes l'enveloppe de pagination du serveur
    // `{ data, pagination }` : ce sont les lignes qu'il faut passer à la file,
    // pas l'enveloppe. Le tableau brut reste accepté si une source change de forme.
    const lignes = (resultat) => {
      if (resultat.status !== 'fulfilled') return [];
      const valeur = resultat.value;
      if (Array.isArray(valeur)) return valeur;
      return Array.isArray(valeur?.data) ? valeur.data : [];
    };
    const sources = {
      declarations: lignes(declarations),
      rapprochements: [...lignes(aVerifier), ...lignes(ecarts)],
      relances: lignes(relances),
    };
    const aEchoue = [declarations, aVerifier, ecarts, relances].filter(
      (resultat) => resultat.status === 'rejected',
    );

    return {
      actes: construireFile(sources),
      error: aEchoue.length ? getErrorMessage(aEchoue[0].reason) : '',
    };
  }, []);

  useEffect(() => {
    let annule = false;

    const demarrer = async () => {
      const donnees = await chargerSources();
      if (annule) return;
      setActes(donnees.actes);
      setError(donnees.error);
      setLoading(false);
    };

    void demarrer();
    return () => {
      annule = true;
    };
  }, [chargerSources]);

  const recharger = useCallback(async () => {
    const donnees = await chargerSources();
    setActes(donnees.actes);
    setError(donnees.error);
  }, [chargerSources]);

  return { actes, loading, error, recharger };
}
