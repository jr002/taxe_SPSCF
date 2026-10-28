/**
 * Portail contribuable « Ma situation fiscale » : lien à usage unique vérifié par
 * NIF + e-mail. Les routes publiques sont montées hors session agent côté serveur.
 */
import api from '@/api/client';

/** Génération (ou renouvellement) du lien depuis la fiche du contribuable. */
export const genererAccesContribuable = (idContribuable, payload = {}) =>
  api.post(`/contribuables/${idContribuable}/acces-contribuable`, payload).then((res) => res.data.data);

export const getStatutAccesContribuable = (token) =>
  api.get(`/acces-contribuable/${encodeURIComponent(token)}`).then((res) => res.data.data);

/**
 * Ouverture après confirmation d'identité. En cas de `403`, l'erreur Axios conserve
 * `response.data.tentatives_restantes` : le formulaire l'utilise pour avertir le
 * contribuable avant le blocage temporaire du lien.
 */
export const ouvrirAccesContribuable = (token, payload) =>
  api
    .post(`/acces-contribuable/${encodeURIComponent(token)}/ouvrir`, payload)
    .then((res) => res.data.data);
