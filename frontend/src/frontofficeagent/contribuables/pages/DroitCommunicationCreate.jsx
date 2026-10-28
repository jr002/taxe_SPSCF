import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  createDroitCommunication,
  getContribuableById,
  getErrorMessage,
} from '@/api/api';
import DroitCommunicationForm from '@/frontofficeagent/contribuables/components/DroitCommunicationForm';

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = () => ({
  tier: '',
  type_tier: 'banque',
  nif_tier: '',
  objet: '',
  pieces_demandees: '',
  date_demande: today(),
  date_reponse: '',
  statut: 'demande',
  documents_recus: '',
  observations: '',
});

export default function DroitCommunicationCreate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contribuable, setContribuable] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getContribuableById(id)
      .then((result) => { if (!cancelled) setContribuable(result); })
      .catch((requestError) => { if (!cancelled) setError(getErrorMessage(requestError)); });

    return () => { cancelled = true; };
  }, [id]);

  const handleChange = ({ target: { name, value } }) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.tier.trim() || !form.objet.trim() || !form.date_demande) {
      setError('Le tiers, l’objet et la date de la demande sont obligatoires.');
      return;
    }

    if (['reponse', 'partiel'].includes(form.statut) && !form.date_reponse) {
      setError('Renseignez la date de réponse pour un statut « réponse reçue » ou « réponse partielle ».');
      return;
    }

    setSubmitting(true);

    try {
      await createDroitCommunication({
        id_contribuable: Number(id),
        tier: form.tier.trim(),
        type_tier: form.type_tier,
        nif_tier: form.nif_tier.trim() || undefined,
        objet: form.objet.trim(),
        pieces_demandees: form.pieces_demandees.trim() || undefined,
        date_demande: form.date_demande,
        date_reponse: form.date_reponse || undefined,
        statut: form.statut,
        documents_recus: form.documents_recus.trim() || undefined,
        observations: form.observations.trim() || undefined,
      });
      navigate(`/contribuables/${id}/droits-communication`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (!contribuable) {
    return error ? (
      <section className="page error">
        <h1>Contribuable indisponible</h1>
        <p>{error}</p>
        <Link className="primary detail-back" to={`/contribuables/${id}/droits-communication`}>
          Retour aux droits de communication
        </Link>
      </section>
    ) : (
      <p className="page status">Chargement du contribuable…</p>
    );
  }

  return (
    <section className="page declaration-page contribuable-detail-page">
      <Link className="detail-back-link" to={`/contribuables/${id}/droits-communication`}>
        ← Retour aux droits de communication
      </Link>
      <DroitCommunicationForm
        contribuable={contribuable}
        error={error}
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
      <Link className="detail-back" to={`/contribuables/${id}/confrontation`}>
        ⚖️ Retour à la confrontation
      </Link>
    </section>
  );
}
