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

export const resetAgentPassword = (id, password) =>
  api.patch(`/agents/${id}/password`, { password }).then((res) => res.data.data);

export const deleteAgent = (id) =>
  api.delete(`/agents/${id}`).then((res) => res.data);

// ==================== RECOUPEMENTS ====================
export const createRecoupement = (payload) =>
  api.post('/recoupements', payload).then((res) => res.data.data);

export const getRecoupementsByContribuable = (idContribuable) =>
  api.get(`/recoupements/${idContribuable}/analyser`).then((res) => res.data.data);

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
