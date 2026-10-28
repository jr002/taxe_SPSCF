/**
 * Rapprochements CA/TVA : confrontation, statistiques et export.
 */
import api from '@/api/client';

export const getRapprochements = (params = {}) =>
  api.get('/rapprochements', { params }).then((res) => res.data.data);

export const getRapprochementById = (id) =>
  api.get(`/rapprochements/${id}`).then((res) => res.data.data);

export const getRapprochementStats = (params = {}) =>
  api.get('/rapprochements/stats', { params }).then((res) => res.data.data);

export const getApercuConfrontation = (idContribuable) =>
  api.get(`/rapprochements/apercu/${idContribuable}`).then((res) => res.data.data);

/** Réponse brute : le client doit manipuler le blob PDF et son en-tête de nom de fichier. */
export const exportRapprochementsPdf = (params = {}) =>
  api.get('/rapprochements/export/pdf', { params, responseType: 'blob', timeout: 30000 });

export const createRapprochement = (payload) =>
  api.post('/rapprochements', payload).then((res) => res.data.data);

export const confronterRapprochement = (payload) =>
  api.post('/rapprochements/confronter', payload).then((res) => res.data.data);

export const autoRapprocherContribuable = (idContribuable, params = {}) =>
  api.post(`/rapprochements/auto/${idContribuable}`, null, { params }).then((res) => res.data.data);

export const updateRapprochementStatut = (id, payload) =>
  api.patch(`/rapprochements/${id}/statut`, payload).then((res) => res.data.data);

export const updateRapprochement = (id, payload) =>
  api.put(`/rapprochements/${id}`, payload).then((res) => res.data.data);

export const deleteRapprochement = (id) => api.delete(`/rapprochements/${id}`).then((res) => res.data);
