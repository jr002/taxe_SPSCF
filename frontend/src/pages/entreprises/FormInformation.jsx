import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createContribuable, getErrorMessage } from '../../api/api';
import { getOperationalUnits } from '../../utils/uniteFiscale.utils';

const CENTRES_BY_STRUCTURE = {
  centre_fiscal: getOperationalUnits('centres_fiscaux'),
  sre: getOperationalUnits('sre'),
  dge: getOperationalUnits('dge'),
};

const normalizeCentreText = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('fr');

/**
 * Étape 2 : Formulaire de création et d'immatriculation d'un contribuable
 */
export default function FormInformation() {
  const [searchParams] = useSearchParams();
  const selectedStructure = searchParams.get('structure') || '';

  const [formData, setFormData] = useState({
    nif: '',
    companyName: '',
    socialReason: '',
    legalStatus: '',
    revenue: '',
    fiscalStructure: selectedStructure,
    regimeFiscal: '',
    phone: '',
    email: '',
    address: '',
    centreSelection: '',
  });

  const [errors, setErrors] = useState({});
  const [centreSearch, setCentreSearch] = useState('');
  const [centreSuggestionsOpen, setCentreSuggestionsOpen] = useState(false);
  const [activeCentreIndex, setActiveCentreIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'fiscalStructure') {
      setCentreSearch('');
      setCentreSuggestionsOpen(false);
      setActiveCentreIndex(-1);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'fiscalStructure'
        ? { centreSelection: '', ...(value !== 'centre_fiscal' ? { regimeFiscal: '' } : {}) }
        : {}),
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nif.trim()) {
      newErrors.nif = 'Le NIF est obligatoire';
    } else if (!/^\d{10,}$/.test(formData.nif.trim())) {
      newErrors.nif = 'Le NIF doit contenir au moins 10 chiffres (format numérique)';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Le nom de la société est obligatoire';
    }

    if (!formData.socialReason.trim()) {
      newErrors.socialReason = 'La raison sociale est obligatoire';
    }

    if (!formData.legalStatus.trim()) {
      newErrors.legalStatus = "Le secteur d'activité est obligatoire";
    }

    if (!formData.revenue) {
      newErrors.revenue = "Le chiffre d'affaires est obligatoire";
    } else if (isNaN(formData.revenue) || parseFloat(formData.revenue) < 0) {
      newErrors.revenue = 'Le CA doit être un montant positif';
    }

    if (!formData.fiscalStructure) {
      newErrors.fiscalStructure = 'La structure fiscale est obligatoire';
    }

    if (formData.fiscalStructure === 'centre_fiscal' && !formData.regimeFiscal) {
      newErrors.regimeFiscal = 'Veuillez sélectionner le régime IS ou IR';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est obligatoire';
    } else if (!/^[0-9+\-\s]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide (au moins 8 chiffres)';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'L\'email doit être une adresse valide';
    }

    if (!formData.address.trim()) {
      newErrors.address = "L'adresse est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (validateForm()) {
      setIsSubmitting(true);

      try {
        await createContribuable({
          nif: formData.nif.trim(),
          raison_sociale: [formData.companyName.trim(), formData.socialReason.trim()].filter(Boolean).join(' / '),
          secteur_activite: formData.legalStatus.trim(),
          regime_fiscal: formData.fiscalStructure === 'centre_fiscal'
            ? formData.regimeFiscal
            : Number(formData.revenue) < 400000000 ? 'IS' : 'IR',
          centre_fiscal_ref: formData.centreSelection || undefined,
          telephone: formData.phone.trim(),
          email: formData.email.trim(),
          adresse: formData.address.trim(),
        });

        setSubmitSuccess('Le contribuable a été enregistré avec succès.');
        setTimeout(() => navigate('/contribuables'), 800);
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReset = () => {
    setFormData({
      nif: '',
      companyName: '',
      socialReason: '',
      legalStatus: '',
      revenue: '',
      fiscalStructure: '',
      regimeFiscal: '',
      phone: '',
      email: '',
      address: '',
      centreSelection: '',
    });
    setCentreSearch('');
    setCentreSuggestionsOpen(false);
    setActiveCentreIndex(-1);
    setErrors({});
    setSubmitError('');
    setSubmitSuccess('');
  };

  const centresCompatibles = CENTRES_BY_STRUCTURE[formData.fiscalStructure] || [];
  const termesRecherche = normalizeCentreText(centreSearch).trim().split(/\s+/).filter(Boolean);
  const centresFiltres = centresCompatibles.filter((centre) => {
    const termesCentre = [
      centre.nom,
      centre.type,
      centre.dri,
      centre.region,
      ...(centre.regions_couvertes || []),
      centre.adresse,
    ]
      .filter(Boolean)
      .join(' ');

    const texteCentreNormalise = normalizeCentreText(termesCentre);
    return termesRecherche.every((terme) => texteCentreNormalise.includes(terme));
  });
  const centreSuggestions = centresFiltres.slice(0, 8);

  const selectCentre = (centre) => {
    const centreValue = `${formData.fiscalStructure}:${centre.nom}`;
    const zone = centre.regions_couvertes?.join(', ') || centre.region;
    setFormData((previous) => ({ ...previous, centreSelection: centreValue }));
    setCentreSearch(`${centre.nom} - ${centre.type}${zone ? ` (${zone})` : ''}`);
    setCentreSuggestionsOpen(false);
    setActiveCentreIndex(-1);
  };

  const handleCentreSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCentreSuggestionsOpen(true);
      setActiveCentreIndex((previous) => Math.min(previous + 1, centreSuggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveCentreIndex((previous) => Math.max(previous - 1, 0));
    } else if (event.key === 'Enter' && centreSuggestionsOpen && centreSuggestions.length) {
      event.preventDefault();
      selectCentre(centreSuggestions[Math.max(activeCentreIndex, 0)]);
    } else if (event.key === 'Escape') {
      setCentreSuggestionsOpen(false);
      setActiveCentreIndex(-1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 bg-white rounded-xl shadow-lg my-6">
      <h2 className="text-3xl font-bold text-center text-indigo-900 mb-8 pb-4 border-b-4 border-indigo-900">
        Informations du contribuable
      </h2>

      {submitError && (
        <p className="error form-submit-message" role="alert">
          {submitError}
        </p>
      )}
      {submitSuccess && (
        <p className="success form-submit-message" role="status">
          {submitSuccess}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* NIF */}
        <div className="space-y-1">
          <label htmlFor="nif" className="block font-semibold text-gray-700 text-sm">
            NIF (Numéro d'Immatriculation Fiscale) <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="nif"
            name="nif"
            value={formData.nif}
            onChange={handleInputChange}
            placeholder="Ex: 1000000001"
            className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm transition-all duration-200 
              ${
                errors.nif
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-600'
              } focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white`}
          />
          {errors.nif && <span className="text-red-600 text-xs block mt-1">{errors.nif}</span>}
        </div>

        {/* Nom de la société */}
        <div className="space-y-1">
          <label htmlFor="companyName" className="block font-semibold text-gray-700 text-sm">
            Nom de la Société <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="Ex: ABC Madagascar"
            className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm transition-all duration-200 
              ${
                errors.companyName
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-600'
              } focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white`}
          />
          {errors.companyName && (
            <span className="text-red-600 text-xs block mt-1">{errors.companyName}</span>
          )}
        </div>

        {/* Raison sociale */}
        <div className="space-y-1">
          <label htmlFor="socialReason" className="block font-semibold text-gray-700 text-sm">
            Raison sociale <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="socialReason"
            name="socialReason"
            value={formData.socialReason}
            onChange={handleInputChange}
            placeholder="Ex: SARL ABC Madagascar"
            className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm transition-all duration-200 
              ${
                errors.socialReason
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-600'
              } focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white`}
          />
          {errors.socialReason && (
            <span className="text-red-600 text-xs block mt-1">{errors.socialReason}</span>
          )}
        </div>

        {/* Secteur d'activité */}
        <div className="space-y-1">
          <label htmlFor="legalStatus" className="block font-semibold text-gray-700 text-sm">
            Secteur d’activité <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="legalStatus"
            name="legalStatus"
            value={formData.legalStatus}
            onChange={handleInputChange}
            placeholder="Ex: Commerce général, Développement de logiciels..."
            className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm transition-all duration-200 
              ${
                errors.legalStatus
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-600'
              } focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white`}
          />
          {errors.legalStatus && (
            <span className="text-red-600 text-xs block mt-1">{errors.legalStatus}</span>
          )}
        </div>

        {/* Chiffre d'Affaires */}
        <div className="space-y-1">
          <label htmlFor="revenue" className="block font-semibold text-gray-700 text-sm">
            Chiffre d'Affaires prévisionnel annuel (en Ariary) <span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            id="revenue"
            name="revenue"
            value={formData.revenue}
            onChange={handleInputChange}
            placeholder="Ex: 500000000"
            className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm transition-all duration-200 
              ${
                errors.revenue
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-600'
              } focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white`}
          />
          {errors.revenue && (
            <span className="text-red-600 text-xs block mt-1">{errors.revenue}</span>
          )}
        </div>

        {/* Structure fiscale */}
        <div className="space-y-1">
          <label htmlFor="fiscalStructure" className="block font-semibold text-gray-700 text-sm">
            Structure fiscale compétente <span className="text-red-600">*</span>
          </label>
          <select
            id="fiscalStructure"
            name="fiscalStructure"
            value={formData.fiscalStructure}
            onChange={handleInputChange}
            className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm transition-all duration-200 bg-white
              ${
                errors.fiscalStructure
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-600'
              } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
          >
            <option value="">Sélectionner une structure fiscale</option>
            <option value="centre_fiscal">Centre Fiscal - CA inférieur à 2 milliards Ar</option>
            <option value="sre">SRE - CA de 2 à 4 milliards Ar</option>
            <option value="dge">DGE - CA supérieur à 4 milliards Ar</option>
          </select>
          {errors.fiscalStructure && (
            <span className="text-red-600 text-xs block mt-1">{errors.fiscalStructure}</span>
          )}
        </div>

        {formData.fiscalStructure === 'centre_fiscal' && (
          <fieldset className="space-y-2">
            <legend className="block font-semibold text-gray-700 text-sm">
              Régime fiscal <span className="text-red-600">*</span>
            </legend>
            <div className="flex flex-wrap gap-4">
              {['IS', 'IR'].map((regime) => (
                <label
                  key={regime}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    formData.regimeFiscal === regime
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-gray-300 text-gray-700 hover:border-indigo-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="regimeFiscal"
                    value={regime}
                    checked={formData.regimeFiscal === regime}
                    onChange={handleInputChange}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  {regime}
                </label>
              ))}
            </div>
            {errors.regimeFiscal && (
              <span className="text-red-600 text-xs block mt-1">{errors.regimeFiscal}</span>
            )}
          </fieldset>
        )}

        {/* Centre de rattachement */}
        <div className="space-y-1">
          <label htmlFor="centreSearch" className="block font-semibold text-gray-700 text-sm">
            Centre de rattachement
          </label>
          <input
            type="text"
            id="centreSearch"
            value={centreSearch}
            onChange={(event) => {
              setCentreSearch(event.target.value);
              setCentreSuggestionsOpen(true);
              setActiveCentreIndex(-1);
              setFormData((previous) => ({ ...previous, centreSelection: '' }));
            }}
            onFocus={(event) => {
              event.target.select();
              setCentreSuggestionsOpen(true);
            }}
            onBlur={() => setCentreSuggestionsOpen(false)}
            onKeyDown={handleCentreSearchKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={centreSuggestionsOpen}
            aria-controls="centre-suggestions"
            aria-activedescendant={activeCentreIndex >= 0
              ? `centre-suggestion-${activeCentreIndex}`
              : undefined}
            autoComplete="off"
            placeholder="Saisissez un nom, une région ou une DRI..."
            aria-label="Rechercher un centre par nom, région ou DRI"
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50"
          />
          {centreSuggestionsOpen && centresCompatibles.length > 0 && (
            <ul
              id="centre-suggestions"
              role="listbox"
              className="max-h-64 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg"
            >
              {centreSuggestions.map((centre, index) => {
                const centreValue = `${formData.fiscalStructure}:${centre.nom}`;
                const zone = centre.regions_couvertes?.join(', ') || centre.region;
                const label = `${centre.nom} - ${centre.type}${zone ? ` (${zone})` : ''}`;

                return (
                  <li
                    id={`centre-suggestion-${index}`}
                    key={centreValue}
                    role="option"
                    aria-selected={index === activeCentreIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectCentre(centre)}
                    className={`cursor-pointer px-4 py-2.5 text-sm hover:bg-indigo-50 ${
                      index === activeCentreIndex ? 'bg-indigo-50' : ''
                    }`}
                  >
                    {label}
                  </li>
                );
              })}
              {centreSuggestions.length > 0 && centresFiltres.length > centreSuggestions.length && (
                <li className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
                  {centresFiltres.length - centreSuggestions.length} autre(s) résultat(s) — précisez votre recherche.
                </li>
              )}
            </ul>
          )}
          {!centresCompatibles.length && (
            <span className="text-gray-500 text-xs block mt-1">
              Aucun centre n'est renseigné dans unitefiscal.json pour cette structure.
            </span>
          )}
          {formData.centreSelection && (
            <span className="text-gray-600 text-xs block mt-1" role="status">
              Centre sélectionné : {centreSearch}
            </span>
          )}
          {centresCompatibles.length > 0 && !centresFiltres.length && (
            <span className="text-gray-500 text-xs block mt-1" aria-live="polite">
              Aucun centre ne correspond à cette recherche.
            </span>
          )}
          <span className="text-gray-500 text-xs block mt-1">
            Cette liste provient de unitefiscal.json. Le centre choisi ne sera pas enregistré avec le contribuable.
          </span>
        </div>

        {/* Téléphone */}
        <div className="space-y-1">
          <label htmlFor="phone" className="block font-semibold text-gray-700 text-sm">
            Numéro de Téléphone <span className="text-red-600">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Ex: +261 34 00 000 00"
            className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm transition-all duration-200 
              ${
                errors.phone
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-600'
              } focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white`}
          />
          {errors.phone && <span className="text-red-600 text-xs block mt-1">{errors.phone}</span>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="block font-semibold text-gray-700 text-sm">
            Adresse e-mail <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Ex: contact@entreprise.mg"
            className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm transition-all duration-200 
              ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-600'
              } focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white`}
          />
          {errors.email && <span className="text-red-600 text-xs block mt-1">{errors.email}</span>}
        </div>

        {/* Adresse */}
        <div className="space-y-1">
          <label htmlFor="address" className="block font-semibold text-gray-700 text-sm">
            Adresse physique <span className="text-red-600">*</span>
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Adresse complète du siège ou de l'exploitation"
            rows="3"
            className={`w-full px-4 py-2.5 border-2 rounded-lg text-sm transition-all duration-200 
              ${
                errors.address
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-600 focus:ring-indigo-600'
              } focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-white resize-y`}
          />
          {errors.address && (
            <span className="text-red-600 text-xs block mt-1">{errors.address}</span>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 px-6 py-3 bg-indigo-800 text-white font-semibold rounded-lg 
              transition-all duration-200 hover:bg-indigo-900 hover:shadow-lg
              ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
          >
            {isSubmitting ? 'Envoi en cours...' : '📝 Enregistrer le contribuable'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg 
              transition-all duration-200 hover:bg-gray-300 hover:-translate-y-0.5"
          >
            🔄 Réinitialiser
          </button>
        </div>
      </form>
    </div>
  );
}
