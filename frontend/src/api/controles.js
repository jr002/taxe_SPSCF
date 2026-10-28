/**
 * Contrôle de conformité d'une déclaration.
 */
import api from './client';

export const effectuerControle = (idDeclaration, payload = {}) =>
  api.post(`/controles/${idDeclaration}/effectuer`, payload).then((res) => res.data.data);

export const getControlesDeclaration = (idDeclaration) =>
  api.get(`/controles/${idDeclaration}/historique`).then((res) => res.data.data);
