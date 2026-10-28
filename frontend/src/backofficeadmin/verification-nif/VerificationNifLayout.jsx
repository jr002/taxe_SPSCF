import { Link } from 'react-router-dom';
import AdminNav from '../components/AdminNav';

/**
 * Gabarit des trois pages dédiées de vérification NIF (`/sql`, `/excel`, `/json`) :
 * garde administrateur, navigation du backoffice, titre et retour vers la page
 * « Vérification NIF & Liaison Base de Données ».
 */
export default function VerificationNifLayout({ currentUser, eyebrow, titre, description, children }) {
  if (currentUser?.role !== 'admin') {
    return (
      <section className="page">
        <p className="error">Cette page est réservée aux administrateurs.</p>
      </section>
    );
  }

  return (
    <section className="page">
      <AdminNav />

      <div className="page-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{titre}</h1>
        <p>{description}</p>
      </div>

      <p style={{ margin: '0 0 1.25rem' }}>
        <Link to="/admin/verification-nif">← Retour à la vérification NIF</Link>
      </p>

      {children}
    </section>
  );
}
