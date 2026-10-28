import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLES_AGENTS } from '@/backofficeadmin/utils/roles.utils';

/**
 * Calcule les coordonnées d'un point sur le cercle
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Génère le chemin SVG d'un segment en anneau (donut slice)
 */
function describeArc(x, y, innerRadius, outerRadius, startAngle, endAngle) {
  // Éviter le bug de l'angle à 360° complet
  const adjustedEndAngle = endAngle - startAngle >= 360 ? startAngle + 359.999 : endAngle;
  const startOuter = polarToCartesian(x, y, outerRadius, adjustedEndAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, startAngle);
  const endInner = polarToCartesian(x, y, innerRadius, adjustedEndAngle);

  const largeArcFlag = adjustedEndAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', startInner.x, startInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, endInner.x, endInner.y,
    'Z',
  ].join(' ');
}

export default function CamembertUtilisateurs({ stats, agents = [] }) {
  const navigate = useNavigate();
  const [vue, setVue] = useState('statut'); // 'statut' ou 'role'
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const total = agents.length || stats?.total || 0;

  // Données par statut
  const donneesStatut = [
    {
      id: 'actif',
      label: 'Comptes actifs',
      valeur: stats?.parStatut?.actif || 0,
      couleur: '#10b981', // Vert
      filtre: 'actif',
    },
    {
      id: 'en_attente',
      label: 'En attente',
      valeur: stats?.parStatut?.en_attente || 0,
      couleur: '#f59e0b', // Orange / Ambre
      filtre: 'en_attente',
    },
    {
      id: 'inactif',
      label: 'Bloqués / Inactifs',
      valeur: stats?.parStatut?.inactif || 0,
      couleur: '#ef4444', // Rouge
      filtre: 'inactif',
    },
  ];

  // Données par rôle (une tranche par rôle du référentiel)
  const donneesRole = ROLES_AGENTS.map((role) => ({
    id: role.role,
    label: role.label,
    valeur: agents.filter((a) => (a.role || 'agent') === role.role).length,
    couleur: role.couleur,
    filtre: role.role,
  }));

  const donneesActuelles = vue === 'statut' ? donneesStatut : donneesRole;
  const donneesFiltrees = donneesActuelles.filter((d) => d.valeur > 0);

  // Construction des tranches avec angles
  const slices = donneesFiltrees.reduce(
    (acc, item) => {
      const proportion = total > 0 ? item.valeur / total : 0;
      const angleTranche = proportion * 360;
      const startAngle = acc.angleCourant;
      const endAngle = acc.angleCourant + angleTranche;

      acc.tranches.push({
        ...item,
        proportion,
        pourcentage: Math.round(proportion * 100),
        startAngle,
        endAngle,
      });
      acc.angleCourant = endAngle;
      return acc;
    },
    { angleCourant: 0, tranches: [] },
  ).tranches;

  const handleSliceClick = (filtre) => {
    if (vue === 'statut') {
      navigate('/admin/utilisateurs', { state: { statut: filtre } });
    } else {
      navigate('/admin/utilisateurs');
    }
  };

  return (
    <div className="camembert-container" style={{ padding: '0.5rem 0' }}>
      {/* Sélecteur de mode de vue */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => setVue('statut')}
          className={`categorie-tab${vue === 'statut' ? ' active' : ''}`}
          style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
        >
          Par Statut de compte
        </button>
        <button
          type="button"
          onClick={() => setVue('role')}
          className={`categorie-tab${vue === 'role' ? ' active' : ''}`}
          style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
        >
          Par Rôle utilisateur
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Graphique SVG */}
        <div style={{ position: 'relative', width: '200px', height: '200px' }}>
          {total === 0 ? (
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="70" fill="none" stroke="#e5e7eb" strokeWidth="30" />
              <text x="100" y="105" textAnchor="middle" fill="#9ca3af" fontSize="13">
                Aucune donnée
              </text>
            </svg>
          ) : (
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
              <g>
                {slices.map((slice) => {
                  const isHovered = hoveredSlice === slice.id;
                  const innerR = isHovered ? 48 : 52;
                  const outerR = isHovered ? 88 : 82;
                  const pathD = describeArc(100, 100, innerR, outerR, slice.startAngle, slice.endAngle);

                  return (
                    <path
                      key={slice.id}
                      d={pathD}
                      fill={slice.couleur}
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' : 'none',
                        opacity: hoveredSlice && !isHovered ? 0.6 : 1,
                      }}
                      onMouseEnter={() => setHoveredSlice(slice.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      onClick={() => handleSliceClick(slice.filtre)}
                    >
                      <title>{`${slice.label} : ${slice.valeur} (${slice.pourcentage}%) - Cliquez pour filtrer`}</title>
                    </path>
                  );
                })}
              </g>

              {/* Texte au centre du donut */}
              <text
                x="100"
                y="94"
                textAnchor="middle"
                fontSize="24"
                fontWeight="700"
                fill="currentColor"
                style={{ pointerEvents: 'none' }}
              >
                {hoveredSlice
                  ? slices.find((s) => s.id === hoveredSlice)?.valeur
                  : total}
              </text>
              <text
                x="100"
                y="114"
                textAnchor="middle"
                fontSize="11"
                fill="var(--text-muted, #666)"
                style={{ pointerEvents: 'none', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                {hoveredSlice
                  ? slices.find((s) => s.id === hoveredSlice)?.label
                  : 'Total'}
              </text>
            </svg>
          )}
        </div>

        {/* Légende détaillée et cliquable */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minWidth: '190px' }}>
          {donneesActuelles.map((item) => {
            const pct = total ? Math.round((item.valeur / total) * 100) : 0;
            const isHovered = hoveredSlice === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleSliceClick(item.filtre)}
                onMouseEnter={() => setHoveredSlice(item.id)}
                onMouseLeave={() => setHoveredSlice(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  background: isHovered ? 'rgba(0,0,0,0.05)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                title="Cliquer pour afficher ces utilisateurs"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: item.couleur,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.88rem', fontWeight: isHovered ? 700 : 500 }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                  <strong style={{ marginRight: '4px' }}>{item.valeur}</strong>
                  <small style={{ color: 'var(--text-muted, #666)' }}>({pct}%)</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p
        style={{
          marginTop: '1rem',
          fontSize: '0.78rem',
          textAlign: 'center',
          color: 'var(--text-muted, #888)',
          fontStyle: 'italic',
        }}
      >
        💡 Cliquez sur une portion du camembert ou de la légende pour filtrer la liste des utilisateurs.
      </p>
    </div>
  );
}
