/**
 * État contribuable : photographie du dossier à une date donnée.
 */
import api from './client';

export const getEtatsContribuable = (params = {}) =>
  api.get('/etat-contribuable', { params }).then((res) => res.data.data);

export const getHistoriqueEtatContribuable = (idContribuable) =>
  api.get(`/contribuables/${idContribuable}/etat`).then((res) => res.data.data);

export const getDernierEtatContribuable = (idContribuable) =>
  api.get(`/etat-contribuable/contribuable/${idContribuable}/latest`).then((res) => res.data.data);

export const createEtatContribuable = (idContribuable, payload) =>
  api.post(`/contribuables/${idContribuable}/etat`, payload).then((res) => res.data.data);

export const getEtatStats = () => api.get('/etat-contribuable/stats').then((res) => res.data.data);
