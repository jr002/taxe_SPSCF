/**
 * Contribuables : portefeuille, recherche par NIF et création.
 */
import api from './client';

export const getContribuables = (params = {}) =>
  api.get('/contribuables', { params }).then((res) => res.data.data);

export const getContribuableById = (id) =>
  api.get(`/contribuables/${id}`).then((res) => res.data.data);

/** Le serveur ne sait pas filtrer sur un NIF exact : on relit la recherche et on sélectionne. */
export const getContribuableByNif = async (nif) => {
  const result = await api.get('/contribuables', { params: { search: nif, limit: 20 } });
  return result.data?.data?.data?.find((item) => item.nif === nif);
};

export const createContribuable = (payload) =>
  api.post('/contribuables', payload).then((res) => res.data.data);
