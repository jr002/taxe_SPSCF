import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { readSearchParam, updateSearchParams } from '@/utils';

/**
 * Filtres, tri et page d'un écran de liste portés par l'URL : un rafraîchissement
 * ou un lien partagé retrouvent la vue de l'agent au lieu de la remettre à zéro.
 */
export default function useFiltresUrl() {
  const [searchParams, setSearchParams] = useSearchParams();

  const lire = useCallback(
    (cle, defaut = '') => readSearchParam(searchParams, cle, defaut),
    [searchParams],
  );

  /**
   * `changes` s'applique au jeu de paramètres **du rendu courant**. Plusieurs
   * appels successifs dans un même gestionnaire d'événement se lisent donc sur la
   * même image figée : le dernier écrase les précédents. Regrouper les modifications
   * d'une même action en un seul `patch`.
   */
  const patch = useCallback(
    (changes, options = {}) => setSearchParams(
      updateSearchParams(searchParams, changes),
      { replace: options.replace !== false },
    ),
    [searchParams, setSearchParams],
  );

  const page = Number(searchParams.get('page')) || 1;

  return { searchParams, setSearchParams, lire, patch, page };
}
