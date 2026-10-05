import { useEffect, useMemo, useState } from 'react';
import { getContribuables, getErrorMessage } from '../../../api/api';
import { getCategorie } from '../../../utils/contribuable.utils';

const PAGE_SIZE = 15;

export default function useContribuablesList() {
  const [contribuables, setContribuables] = useState([]);
  const [filter, setFilter] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('Tous');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
  const safePage = Math.min(currentPage, totalPages);
  const paginatedContribuables = useMemo(
    () => filteredContribuables.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredContribuables, safePage]
  );

  const updateFilter = (value) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const updateCategory = (value) => {
    setCategorieFilter(value);
    setCurrentPage(1);
  };

  return {
    allContribuables,
    counts,
    currentPage: safePage,
    error,
    filter,
    filteredContribuables,
    loading,
    loadData,
    pageSize: PAGE_SIZE,
    paginatedContribuables,
    categorieFilter,
    setCurrentPage,
    totalPages,
    updateCategory,
    updateFilter,
  };
}
