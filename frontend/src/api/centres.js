/**
 * Centres fiscaux (registre et annuaire des unités opérationnelles).
 */
import api from '@/api/client';

export const getCentres = () => api.get('/centres').then((res) => res.data.data);

export const getCentreById = (id) => api.get(`/centres/${id}`).then((res) => res.data.data);

export const createCentre = (payload) => api.post('/centres', payload).then((res) => res.data.data);

export const updateCentre = (id, payload) => api.put(`/centres/${id}`, payload).then((res) => res.data.data);

export const deleteCentre = (id) => api.delete(`/centres/${id}`).then((res) => res.data);
