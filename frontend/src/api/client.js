/**
 * Instance HTTP partagée par tous les modules du dossier `api/`.
 *
 * En développement, Vite relaie `/api` vers `http://localhost:5000` ; le
 * cookie de session agent est transporté par `withCredentials`.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
});

export default api;
