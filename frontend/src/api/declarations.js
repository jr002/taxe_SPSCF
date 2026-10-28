/**
 * Déclarations TVA et contrôle de conformité de la procédure contradictoire.
 */
import api from './client';

export const getDeclarations = (params = {}) =>
  api.get('/declarations', { params: { limit: 250, ...params } }).then((res) => res.data.data);

export const getDeclarationById = (id) =>
  api.get(`/declarations/${id}`).then((res) => res.data.data);

export const getDeclarationStats = () =>
  api.get('/declarations/stats').then((res) => res.data.data);

export const createDeclaration = (payload) =>
  api.post('/declarations', payload).then((res) => res.data.data);

export const updateDeclaration = (id, payload) =>
  api.put(`/declarations/${id}`, payload).then((res) => res.data.data);
