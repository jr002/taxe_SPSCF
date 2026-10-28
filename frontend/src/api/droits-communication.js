/**
 * Droits de communication (demandes adressées à des tiers).
 */
import api from './client';

export const getDroitsCommunication = (params = {}) =>
  api.get('/droits-communication', { params }).then((res) => res.data.data);

export const getDroitCommunicationById = (id) =>
  api.get(`/droits-communication/${id}`).then((res) => res.data.data);

export const createDroitCommunication = (payload) =>
  api.post('/droits-communication', payload).then((res) => res.data.data);

export const updateDroitCommunication = (id, payload) =>
  api.put(`/droits-communication/${id}`, payload).then((res) => res.data.data);

export const deleteDroitCommunication = (id) =>
  api.delete(`/droits-communication/${id}`).then((res) => res.data);
