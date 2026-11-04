/**
 * Le bouton standard qui ouvre la modale « Aide à la lecture » d'un écran.
 * Toujours le même geste au même endroit — à droite des actions d'en-tête —
 * pour que l'agent le retrouve sans chercher.
 */
export default function BoutonAide({ ecran, onOuvrir }) {
  if (!onOuvrir) return null;

  return (
    <button
      type="button"
      className="secondary bouton-aide"
      onClick={() => onOuvrir(ecran)}
      title={`Ouvrir l’aide à la lecture de cet écran`}
    >
      ? Aide
    </button>
  );
}
