/**
 * Client API centralisé pour la communication avec le backend
 */
import axios from 'axios';

// En développement, Vite relaie /api vers http://localhost:5000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
});

/**
 * Extrait un message d'erreur lisible d'une exception Axios
 * @param {Error} error
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  return (
    error.response?.data?.message ||
    error.message ||
    'Une erreur réseau est survenue. Veuillez vérifier votre connexion.'
  );
};

// ==================== DÉCLARATIONS ====================
export const getDeclarations = (params = {}) =>
  api.get('/declarations', { params: { limit: 250, ...params } }).then((res) => res.data.data);

export const getDeclarationById = (id) =>
  api.get(`/declarations/${id}`).then((res) => res.data.data);

export const getDeclarationStats = () =>
  api.get('/declarations/stats').then((res) => res.data.data);

export const createDeclaration = (payload) =>
  api.post('/declarations', payload).then((res) => res.data.data);

// ==================== CONTRIBUABLES ====================
export const getContribuables = (params = {}) =>
  api.get('/contribuables', { params }).then((res) => res.data.data);

export const getContribuableById = (id) =>
  api.get(`/contribuables/${id}`).then((res) => res.data.data);

export const getContribuableByNif = async (nif) => {
  const result = await api.get('/contribuables', { params: { search: nif, limit: 20 } });
  return result.data?.data?.data?.find((item) => item.nif === nif);
};

export const createContribuable = (payload) =>
  api.post('/contribuables', payload).then((res) => res.data.data);

export const getCentres = () =>
  api.get('/centres').then((res) => res.data.data);

export const getCentreById = (id) =>
  api.get(`/centres/${id}`).then((res) => res.data.data);

export const createCentre = (payload) =>
  api.post('/centres', payload).then((res) => res.data.data);

export const updateCentre = (id, payload) =>
  api.put(`/centres/${id}`, payload).then((res) => res.data.data);

export const deleteCentre = (id) =>
  api.delete(`/centres/${id}`).then((res) => res.data);

// ==================== AGENTS (ADMINISTRATION) ====================
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

/** L'agent connecté remplace son propre mot de passe ; renvoie le message serveur. */
export const changeOwnPassword = (payload) =>
  api.post('/auth/change-password', payload).then((res) => res.data);

export const deleteAgent = (id) =>
  api.delete(`/agents/${id}`).then((res) => res.data);

export const getHistoriqueAgents = (params = {}) =>
  api.get('/agents/historique', { params }).then((res) => res.data.data);

export const updateDeclaration = (id, payload) =>
  api.put(`/declarations/${id}`, payload).then((res) => res.data.data);

// ==================== RECOUPEMENTS ====================
export const getRecoupements = (params = {}) =>
  api.get('/recoupements', { params }).then((res) => res.data.data);

export const getRecoupementById = (id) =>
  api.get(`/recoupements/${id}`).then((res) => res.data.data);

export const createRecoupement = (payload) =>
  api.post('/recoupements', payload).then((res) => res.data.data);

export const updateRecoupement = (id, payload) =>
  api.put(`/recoupements/${id}`, payload).then((res) => res.data.data);

export const deleteRecoupement = (id) =>
  api.delete(`/recoupements/${id}`).then((res) => res.data);

export const getRecoupementsByContribuable = (idContribuable) =>
  api.get(`/recoupements/${idContribuable}/analyser`).then((res) => res.data.data);

export const getRecoupementSourceStats = () =>
  api.get('/recoupements/stats/sources').then((res) => res.data.data);

// ==================== DROITS DE COMMUNICATION ====================
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

// ==================== RAPPROCHEMENTS ====================
export const getRapprochements = (params = {}) =>
  api.get('/rapprochements', { params }).then((res) => res.data.data);

export const getRapprochementById = (id) =>
  api.get(`/rapprochements/${id}`).then((res) => res.data.data);

export const getRapprochementStats = (params = {}) =>
  api.get('/rapprochements/stats', { params }).then((res) => res.data.data);

export const getApercuConfrontation = (idContribuable) =>
  api.get(`/rapprochements/apercu/${idContribuable}`).then((res) => res.data.data);

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

export const deleteRapprochement = (id) =>
  api.delete(`/rapprochements/${id}`).then((res) => res.data);

// ==================== ÉTAT CONTRIBUABLE ====================
export const getEtatsContribuable = (params = {}) =>
  api.get('/etat-contribuable', { params }).then((res) => res.data.data);

export const getHistoriqueEtatContribuable = (idContribuable) =>
  api.get(`/contribuables/${idContribuable}/etat`).then((res) => res.data.data);

export const getDernierEtatContribuable = (idContribuable) =>
  api.get(`/etat-contribuable/contribuable/${idContribuable}/latest`).then((res) => res.data.data);

export const createEtatContribuable = (idContribuable, payload) =>
  api.post(`/contribuables/${idContribuable}/etat`, payload).then((res) => res.data.data);

export const getEtatStats = () =>
  api.get('/etat-contribuable/stats').then((res) => res.data.data);

// ==================== RELANCES ====================
export const getRelances = (params = {}) =>
  api.get('/relances', { params }).then((res) => res.data.data);

export const getRelanceById = (id) =>
  api.get(`/relances/${id}`).then((res) => res.data.data);

export const getRelancesByContribuable = (idContribuable) =>
  api.get(`/contribuables/${idContribuable}/relances`).then((res) => res.data.data);

export const createRelance = (payload) =>
  api.post('/relances', payload).then((res) => res.data.data);

export const updateRelance = (id, payload) =>
  api.put(`/relances/${id}`, payload).then((res) => res.data.data);

export const getRelanceStats = () =>
  api.get('/relances/stats').then((res) => res.data.data);

// ==================== CONTRÔLES ====================
export const effectuerControle = (idDeclaration, payload = {}) =>
  api.post(`/controles/${idDeclaration}/effectuer`, payload).then((res) => res.data.data);

export const getControlesDeclaration = (idDeclaration) =>
  api.get(`/controles/${idDeclaration}/historique`).then((res) => res.data.data);

// ==================== PROCÉDURE CONTRADICTOIRE & REDRESSEMENTS (CGI 2026) ====================
export const emettreNotificationPrimitive = (idDeclaration, payload = {}) =>
  api.post(`/declarations/${idDeclaration}/notification-primitive`, payload).then((res) => res.data.data);

export const emettreNotificationDefinitive = (idDeclaration, payload = {}) =>
  api.post(`/declarations/${idDeclaration}/notification-definitive`, payload).then((res) => res.data.data);

export const imputerCreditImpot = (idDeclaration, payload = {}) =>
  api.post(`/declarations/${idDeclaration}/imputer-credit`, payload).then((res) => res.data.data);

export default api;
