import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAVIGATION_LINKS = [
  { to: '/accueil', label: 'Accueil' },
  { to: '/decisionnel', label: 'Décisionnel' },
  { to: '/suivi', label: 'Dossier fiscal' },
  { to: '/contribuables', label: 'Contribuables' },
  { to: '/centres-fiscaux', label: 'Centres fiscaux' },
  { to: '/register', label: 'Registre' },
];

const LIEN_EQUIPE_CENTRE = { to: '/admin/utilisateurs', label: 'Mon équipe' };

const pickActivePath = (pathname, links) =>
  links.reduce((longest, link) => {
    const matches = pathname === link.to || pathname.startsWith(`${link.to}/`);
    return matches && link.to.length > longest.length ? link.to : longest;
  }, '');

export default function AgentSidebar({ isChefCentre = false, isOpen = false, onClose }) {
  const { pathname } = useLocation();
  const sidebarRef = useRef(null);
  const closeButtonRef = useRef(null);
  const links = isChefCentre ? [...NAVIGATION_LINKS, LIEN_EQUIPE_CENTRE] : NAVIGATION_LINKS;
  const activePath = pickActivePath(pathname, links);

  useEffect(() => {
    if (!isOpen || !window.matchMedia('(max-width: 1024px)').matches) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = sidebarRef.current?.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      document.getElementById('agent-navigation-toggle')?.focus();
    };
  }, [isOpen, onClose]);

  const closeOnMobile = () => {
    if (window.matchMedia('(max-width: 1024px)').matches) onClose?.();
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        id="agent-navigation"
        className="agent-sidebar"
        aria-label="Navigation de l’espace agent"
        inert={!isOpen}
      >
        <div className="agent-sidebar-heading">
          <strong>Modules fiscaux</strong>
          <button
            ref={closeButtonRef}
            type="button"
            className="agent-sidebar-close"
            aria-label="Fermer la navigation"
            onClick={onClose}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
        <nav aria-label="Modules du frontoffice agent">
          {links.map((link) => {
            const actif = link.to === activePath;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={actif ? 'active' : ''}
                aria-current={actif ? 'page' : undefined}
                onClick={closeOnMobile}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      {isOpen && (
        <button
          type="button"
          className="agent-navigation-backdrop"
          aria-hidden="true"
          tabIndex={-1}
          onClick={onClose}
        />
      )}
    </>
  );
}
