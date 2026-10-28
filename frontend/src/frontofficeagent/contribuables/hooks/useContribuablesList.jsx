import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getContribuables, getErrorMessage } from '@/api/api';
import { getCategorie } from '@/utils/contribuable.utils';
import { readSearchParam, updateSearchParams } from '@/utils/searchParams.utils';

const PAGE_SIZE = 15;

/**
 * Liste des contribuables : l'état de filtrage et de pagination vit dans l'URL
 * (`?q=`, `?categorie=`, `?page=`) pour qu'une recherche reste partageable et
 * survive à un rechargement ou à un retour arrière.
 */
export default function useContribuablesList() {
  const [contribuables, setContribuables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = readSearchParam(searchParams, 'q', '');
  const categorieFilter = readSearchParam(searchParams, 'categorie', 'Tous');
  const requestedPage = Number(searchParams.get('page')) || 1;

  const patchParams = (changes) => {
    setSearchParams(updateSearchParams(searchParams, changes), { replace: true });
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getContribuables({ limit: 10000 });
      setContribuables(result.data || result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chargement initial volontairement déclenché au montage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const allContribuables = useMemo(
    () => contribuables.map((contribuable) => ({
      ...contribuable,
      key: String(contribuable.id_contribuable),
      declarations: contribuable.declarations || [],
      categorie: getCategorie(contribuable),
    })),
    [contribuables]
  );

  const counts = useMemo(() => {
    const categoryCounts = { Grand: 0, Moyen: 0, Petit: 0 };
    allContribuables.forEach(({ categorie }) => {
      categoryCounts[categorie] = (categoryCounts[categorie] || 0) + 1;
    });
    return categoryCounts;
  }, [allContribuables]);

  const filteredContribuables = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    return allContribuables.filter((contribuable) => {
      if (categorieFilter !== 'Tous' && contribuable.categorie !== categorieFilter) return false;
      return !normalized || [
        contribuable.nif,
        contribuable.raison_sociale,
        contribuable.secteur_activite,
      ].some((value) => String(value || '').toLowerCase().includes(normalized));
    });
  }, [allContribuables, categorieFilter, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredContribuables.length / PAGE_SIZE));
  const safePage = Math.min(requestedPage, totalPages);
  const paginatedContribuables = useMemo(
    () => filteredContribuables.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredContribuables, safePage]
  );

  const hasActiveFilters = filter.trim() !== '' || categorieFilter !== 'Tous';

  const updateFilter = (value) => {
    patchParams({ q: value, page: '' });
  };

  const updateCategory = (value) => {
    patchParams({ categorie: value === 'Tous' ? '' : value, page: '' });
  };

  const setCurrentPage = (value) => {
    patchParams({ page: value <= 1 ? '' : value });
  };

  const clearFilters = () => {
    patchParams({ q: '', categorie: '', page: '' });
  };

  return {
    allContribuables,
    counts,
    currentPage: safePage,
    error,
    filter,
    filteredContribuables,
    hasActiveFilters,
    loading,
    loadData,
    pageSize: PAGE_SIZE,
    paginatedContribuables,
    categorieFilter,
    clearFilters,
    setCurrentPage,
    totalPages,
    updateCategory,
    updateFilter,
  };
}
