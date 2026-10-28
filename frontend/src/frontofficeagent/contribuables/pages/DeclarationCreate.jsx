import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { createDeclaration, getContribuableById, getErrorMessage } from '@/api';
import { getRegime } from '@/frontofficeagent/decisionnel/utils/decisionnel.utils.js';
import DeclarationForm from '@/frontofficeagent/contribuables/components/DeclarationForm';

const REQUIRED_FIELDS = [
  'annee',
  'ca',
  'benefice',
  'tva_collectee',
  'tva_deductible',
  'tva_payee',
];

const initialForm = () => ({
  periode: '',
  type_declaration: 'TVA',
  annee: String(new Date().getFullYear()),
  ca: '',
  benefice: '',
  tva_collectee: '',
  tva_deductible: '',
  tva_payee: '',
});

function isFormValid(form) {
  return (
    /^\d{4}-\d{2}$/.test(form.periode) &&
    !REQUIRED_FIELDS.some((field) => form[field] === '' || Number(form[field]) < 0) &&
    Number.isInteger(Number(form.annee)) &&
    Number(form.annee) >= 2000 &&
    Number(form.annee) <= 2100
  );
}

export default function DeclarationCreate() {
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

    if (!isFormValid(form)) {
      setError('Veuillez renseigner une période, une année entre 2000 et 2100 et des montants positifs.');
      return;
    }

    setSubmitting(true);

    try {
      await createDeclaration({
        id_contribuable: Number(id),
        periode: form.periode,
        type_declaration: form.type_declaration,
        annee: Number(form.annee),
        ca: Number(form.ca),
        benefice: Number(form.benefice),
        tva_collectee: Number(form.tva_collectee),
        tva_deductible: Number(form.tva_deductible),
        tva_payee: Number(form.tva_payee),
        regime_fiscal: contribuable.regime_fiscal || getRegime(contribuable),
      });
      navigate(`/contribuables/${id}/declarations`);
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
        <Link className="primary detail-back" to={`/contribuables/${id}/declarations`}>
          Retour aux déclarations
        </Link>
      </section>
    ) : (
      <p className="page status">Chargement du contribuable…</p>
    );
  }

  return (
    <section className="page declaration-page contribuable-detail-page">
      <Link className="detail-back-link" to={`/contribuables/${id}/declarations`}>
        ← Retour aux déclarations
      </Link>
      <DeclarationForm
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
