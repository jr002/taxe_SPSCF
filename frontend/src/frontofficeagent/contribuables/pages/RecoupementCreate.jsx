import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { createRecoupement, getContribuableById, getErrorMessage } from '@/api/api';
import RecoupementForm from '@/frontofficeagent/contribuables/components/RecoupementForm';

const AMOUNT_FIELDS = [
  'merchandise_sold', 'goods_purchased', 'services_purchased', 'third_party_payments',
  'local_products', 'import_expenses',
];

const initialForm = () => ({
  source: 'tiers_declarant', periode: '', reference: '', type_operation: 'vente', nif_tiers: '', date_operation: '',
  merchandise_sold: '', goods_purchased: '', services_purchased: '', third_party_payments: '', local_products: '',
  import_expenses: '', montant_declare: '', montant_tva: '', montant_ttc: '',
});

function computeSomme(form) {
  return AMOUNT_FIELDS.reduce((total, field) => total + Number(form[field] || 0), 0);
}

export default function RecoupementCreate() {
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

    if (!/^\d{4}-\d{2}$/.test(form.periode)) {
      setError('Veuillez renseigner une période au format AAAA-MM.');
      return;
    }

    const payload = {
      id_contribuable: Number(id),
      source: form.source.trim(),
      periode: form.periode,
      reference: form.reference.trim() || undefined,
      type_operation: form.type_operation,
      nif_tiers: form.nif_tiers.trim() || undefined,
      date_operation: form.date_operation || undefined,
    };
    [...AMOUNT_FIELDS, 'montant_declare', 'montant_tva', 'montant_ttc'].forEach((field) => {
      payload[field] = Number(form[field] || 0);
    });
    payload.somme_recoupee = computeSomme(form);

    setSubmitting(true);

    try {
      await createRecoupement(payload);
      navigate(`/contribuables/${id}/recoupements`);
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
        <Link className="primary detail-back" to={`/contribuables/${id}/recoupements`}>
          Retour aux recoupements
        </Link>
      </section>
    ) : (
      <p className="page status">Chargement du contribuable…</p>
    );
  }

  return (
    <section className="page declaration-page contribuable-detail-page">
      <Link className="detail-back-link" to={`/contribuables/${id}/recoupements`}>
        ← Retour aux recoupements
      </Link>
      <RecoupementForm
        contribuable={contribuable}
        error={error}
        form={{ ...form, somme_recoupee: computeSomme(form) }}
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
