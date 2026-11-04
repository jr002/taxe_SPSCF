/**
 * Procédure contradictoire (code des procédures fiscales, art. V-03 à V-07) :
 * notification primitive avec le délai de 30 jours de l'art. V-04, notification
 * définitive de l'art. V-07, puis imputation du crédit d'impôt antérieur sur le
 * principal (code des impôts, art. 01.01.15 IR et 01.02.06 IS).
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
