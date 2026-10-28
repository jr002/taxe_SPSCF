/**
 * Procédure contradictoire (CGI 2026) : notification primitive avec son délai de
 * 30 jours, notification définitive qui arrête la dette, puis imputation du
 * crédit d'impôt antérieur sur le principal.
 */
import api from '@/api/client';

export const emettreNotificationPrimitive = (idDeclaration, payload = {}) =>
  api
    .post(`/declarations/${idDeclaration}/notification-primitive`, payload)
    .then((res) => res.data.data);

export const emettreNotificationDefinitive = (idDeclaration, payload = {}) =>
  api
    .post(`/declarations/${idDeclaration}/notification-definitive`, payload)
    .then((res) => res.data.data);

export const imputerCreditImpot = (idDeclaration, payload = {}) =>
  api.post(`/declarations/${idDeclaration}/imputer-credit`, payload).then((res) => res.data.data);
