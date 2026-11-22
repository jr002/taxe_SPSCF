/**
 * Prévisions de recette du centre, saisies par le chef de centre. La réponse
 * liste contient aussi les recettes réelles par année et la fenêtre d'exercices.
 */
import api from '@/api/client';

export const getPrevisions = () => api.get('/previsions').then((res) => res.data.data);

export const createPrevision = (payload) => api.post('/previsions', payload).then((res) => res.data.data);

export const updatePrevision = (id, payload) =>
  api.put(`/previsions/${id}`, payload).then((res) => res.data.data);

export const deletePrevision = (id) => api.delete(`/previsions/${id}`).then((res) => res.data);