import { useEffect, useRef } from 'react';

/**
 * Rend une modale utilisable au clavier : la touche Échap la ferme, le focus
 * entre dans la boîte de dialogue à l'ouverture et revient à l'élément qui
 * l'a déclenchée à la fermeture.
 *
 * L'appelant doit placer la référence renvoyée sur l'élément portant
 * `role="dialog"` et lui donner `tabIndex={-1}` pour qu'il soit focalisable.
 */
export function useModalA11y(isOpen, onClose) {
  const containerRef = useRef(null);
  // `onClose` est presque toujours une flèche recréée à chaque rendu du parent :
  // passer par une référence évite que l'effet se relance et rende le focus trop tôt.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const opener = document.activeElement;
    containerRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // `preventScroll` : rendre le focus au déclencheur ne doit pas déplacer la
      // page ni le tableau derrière la fenêtre qui vient de se fermer.
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  return containerRef;
}
