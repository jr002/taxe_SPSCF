/**
 * Recoupements : sources externes rapprochées d'un contribuable.
 */
import api from './client';

export const getRecoupements = (params = {}) =>
  api.get('/recoupements', { params }).then((res) => res.data.data);

export const getRecoupementById = (id) =>
  api.get(`/recoupements/${id}`).then((res) => res.data.data);

export const createRecoupement = (payload) =>
  api.post('/recoupements', payload).then((res) => res.data.data);

export const updateRecoupement = (id, payload) =>
  api.put(`/recoupements/${id}`, payload).then((res) => res.data.data);

export const deleteRecoupement = (id) => api.delete(`/recoupements/${id}`).then((res) => res.data);

export const getRecoupementsByContribuable = (idContribuable) =>
  api.get(`/recoupements/${idContribuable}/analyser`).then((res) => res.data.data);

export const getRecoupementSourceStats = () =>
  api.get('/recoupements/stats/sources').then((res) => res.data.data);
