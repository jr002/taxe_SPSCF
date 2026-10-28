/**
 * Comptes agents : statut, rôle, centre de rattachement, mot de passe, journal.
 */
import api from '@/api/client';

export const getAgents = (params = {}) =>
  api.get('/agents', { params }).then((res) => res.data.data);

export const updateAgentStatut = (id, statut) =>
  api.patch(`/agents/${id}/statut`, { statut }).then((res) => res.data.data);

export const updateAgentRole = (id, role) =>
  api.patch(`/agents/${id}/role`, { role }).then((res) => res.data.data);

/** Affectation du centre de rattachement ; `null` retire l'affectation. */
export const updateAgentCentre = (id, idCentre) =>
  api.patch(`/agents/${id}/centre`, { id_centre: idCentre }).then((res) => res.data);

export const resetAgentPassword = (id, password) =>
  api.patch(`/agents/${id}/password`, { password }).then((res) => res.data.data);

/**
 * Correction de l'identité d'un compte (nom, prénom, e-mail de connexion) par un
 * administrateur.
 */
export const updateAgentIdentite = (id, payload) =>
  api.patch(`/agents/${id}/identite`, payload).then((res) => res.data.data);

export const deleteAgent = (id) => api.delete(`/agents/${id}`).then((res) => res.data);

export const getHistoriqueAgents = (params = {}) =>
  api.get('/agents/historique', { params }).then((res) => res.data.data);
