/**
 * Extrait un message lisible d'une erreur API, y compris quand aucune réponse
 * HTTP n'a été reçue.
 * @param {Error} error
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  const message = error?.response?.data?.message;
  if (message) return message;

  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'Le serveur met trop de temps à répondre. Veuillez réessayer.';
  }

  if (error?.isAxiosError && !error.response) {
    return "Impossible de joindre l'API. Vérifiez que le serveur backend est démarré et que son adresse est correcte.";
  }

  return error?.message || 'Une erreur réseau est survenue. Veuillez vérifier votre connexion.';
};
