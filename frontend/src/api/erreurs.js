/**
 * Extrait un message d'erreur lisible d'une exception Axios.
 * @param {Error} error
 * @returns {string}
 */
export const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  'Une erreur réseau est survenue. Veuillez vérifier votre connexion.';
