/**
 * Session agent : connexion, inscription, profil et mot de passe.
 */
import api from './client';

/** Connexion ; renvoie le profil agent, l'erreur conserve `error.response.data.code`. */
export const connexion = (email, password) =>
  api.post('/auth/login', { email, password }).then((res) => res.data);

/** Demande d'inscription ; le serveur crée un compte en attente d'activation. */
export const inscrireAgent = (payload) => api.post('/auth/register', payload).then((res) => res.data);

/** Agent connecté ; renvoie `{ user }`. */
export const getMoi = () => api.get('/auth/me').then((res) => res.data);

export const deconnexion = () => api.post('/auth/logout').then((res) => res.data);

/** Demande de réinitialisation ; renvoie le message serveur à afficher tel quel. */
export const demanderReinitialisationMotDePasse = (email) =>
  api.post('/auth/reset-request', { email }).then((res) => res.data);

/** L'agent connecté remplace son propre mot de passe ; renvoie le message serveur. */
export const changerSonMotDePasse = (payload) =>
  api.post('/auth/change-password', payload).then((res) => res.data);
