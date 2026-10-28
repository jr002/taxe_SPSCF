/**
 * Relances et recouvrement, y compris la demande d'éclaircissements (CPF V-17),
 * qui est portée par le même table `relances`.
 */
import api from './client';

export const getRelances = (params = {}) =>
  api.get('/relances', { params }).then((res) => res.data.data);

export const getRelanceById = (id) => api.get(`/relances/${id}`).then((res) => res.data.data);

export const getRelancesByContribuable = (idContribuable) =>
  api.get(`/contribuables/${idContribuable}/relances`).then((res) => res.data.data);

export const createRelance = (payload) => api.post('/relances', payload).then((res) => res.data.data);

export const updateRelance = (id, payload) =>
  api.put(`/relances/${id}`, payload).then((res) => res.data.data);

export const getRelanceStats = () => api.get('/relances/stats').then((res) => res.data.data);
