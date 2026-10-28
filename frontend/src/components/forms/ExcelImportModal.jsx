import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { createContribuable, createDeclaration, getCentres, getErrorMessage } from '@/api';
import { formatAriary } from '@/utils/formatters';
import { useModalA11y } from '@/hooks/useModalA11y';

/**
 * Modale personnalisée d'importation de fichiers Excel / CSV pour les contribuables
 */
export default function ExcelImportModal({ isOpen, onClose, onSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorLog, setErrorLog] = useState([]);
  const fileInputRef = useRef(null);
  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  // Normalise les noms de colonnes pour accepter plusieurs variantes
  const normalizeColumnName = (colName = '') => {
    return String(colName)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  // Traite et parse le fichier Excel / CSV
  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      setStatusMessage({
        type: 'error',
        text: 'Format non supporté. Veuillez sélectionner un fichier .xlsx, .xls ou .csv.',
      });
      return;
    }

    setFile(selectedFile);
    setStatusMessage(null);
    setErrorLog([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setStatusMessage({
            type: 'error',
            text: 'Le fichier sélectionné est vide ou ne contient aucune donnée valide.',
          });
          setParsedRows([]);
          return;
        }

        // Mappage dynamique des colonnes
        const mappedRows = rawJson.map((row, index) => {
          const rowKeys = Object.keys(row);
          const mapped = {
            id: index + 1,
            nif: '',
            raison_sociale: '',
            secteur_activite: '',
            ca: '',
            benefice: '',
            regime_fiscal: '',
            centre_gestionnaire: '',
            adresse: '',
            telephone: '',
            email: '',
            annee: '',
            tva_payee: '',
            tva_collectee: '',
            tva_deductible: '',
            isValid: true,
            errors: [],
          };

          rowKeys.forEach((key) => {
            const normalized = normalizeColumnName(key);
            const val = String(row[key]).trim();

            if (normalized === 'nif' || normalized === 'numeronif') mapped.nif = val;
            else if (['raisonsociale', 'nom', 'societe', 'entreprise'].includes(normalized))
              mapped.raison_sociale = val;
            else if (['secteur', 'secteuractivite', 'activite'].includes(normalized))
              mapped.secteur_activite = val;
            else if (['ca', 'chiffredaffaires', 'chiffreaffaire', 'revenue'].includes(normalized))
              mapped.ca = val;
            else if (['benefice', 'beneficefiscal'].includes(normalized)) mapped.benefice = val;
            else if (['regime', 'regimefiscal', 'naturedimpot', 'natureimpot'].includes(normalized))
              mapped.regime_fiscal = val.toUpperCase();
            else if (['centregestionnaire'].includes(normalized))
              mapped.centre_gestionnaire = val;
            else if (['adresse', 'siege', 'localisation'].includes(normalized)) mapped.adresse = val;
            else if (['telephone', 'tel', 'phone', 'contact'].includes(normalized))
              mapped.telephone = val;
            else if (['email', 'mail', 'courriel'].includes(normalized)) mapped.email = val;
            else if (['annee', 'anneefiscale', 'exercice'].includes(normalized))
              mapped.annee = val;
            else if (['tvapayee', 'tvapaye'].includes(normalized)) mapped.tva_payee = val;
            else if (['tvacollectee', 'tvacollecte'].includes(normalized))
              mapped.tva_collectee = val;
            else if (['tvadeductible'].includes(normalized)) mapped.tva_deductible = val;
          });

          // Validation de la ligne
          if (!mapped.nif) {
            mapped.isValid = false;
            mapped.errors.push('NIF manquant');
          } else if (!/^\d{10,}$/.test(mapped.nif)) {
            mapped.isValid = false;
            mapped.errors.push('NIF invalide (10 chiffres min)');
          }

          if (!mapped.raison_sociale) {
            mapped.isValid = false;
            mapped.errors.push('Raison sociale manquante');
          }

          if (!mapped.secteur_activite) {
            mapped.secteur_activite = 'Activités commerciales générales';
          }
          if (!mapped.adresse) {
            mapped.adresse = 'Antananarivo, Madagascar';
          }
          if (!mapped.telephone) {
            mapped.telephone = '+261 34 00 000 00';
          }

          // Détermination auto du régime fiscal si absent
          if (!['IS', 'IR'].includes(mapped.regime_fiscal)) {
            const parsedCA = Number(mapped.ca) || 0;
            mapped.regime_fiscal = parsedCA < 400000000 ? 'IS' : 'IR';
          }

          return mapped;
        });

        setParsedRows(mappedRows);
        const validCount = mappedRows.filter((r) => r.isValid).length;
        setStatusMessage({
          type: 'info',
          text: `${mappedRows.length} ligne(s) détectée(s) : ${validCount} valide(s), ${mappedRows.length - validCount} avec avertissement(s).`,
        });
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: `Erreur lors de la lecture du fichier : ${err.message}`,
        });
        setParsedRows([]);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Gestion du Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Télécharger un modèle Excel vierge
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        NIF: '1000000001',
        'Raison Sociale': 'Madagascar Tech Solutions SARL',
        "Secteur d'Activité": 'Développement de logiciels & Informatique',
        Adresse: 'Analakely, Antananarivo 101',
        Téléphone: '+261 34 11 222 33',
        Email: 'contact@madatech.mg',
        'Centre gestionnaire': 'Centre des Impôts d’Antananarivo',
        'Nature d’impôt': 'IR',
        "Chiffre d'Affaires": 450000000,
        Bénéfice: 65000000,
        Année: 2026,
        'TVA Payée': 90000000,
        'TVA Collectée': 90000000,
        'TVA Déductible': 15000000,
        Activité: 'Actif/ En veille / En liquidation/ Dissous',
        Conformité: 'Conformité/ Défaillant /  En vérification / Bloqué ',
      },
      {
        NIF: '1000000002',
        'Raison Sociale': 'Boutique Ravinala',
        "Secteur d'Activité": 'Commerce de détail & Produits artisanaux',
        Adresse: 'Isoraka, Antananarivo 101',
        Téléphone: '+261 32 44 555 66',
        Email: 'ravinala@boutique.mg',
        'Centre gestionnaire': 'Centre des Impôts d’Antananarivo',
        'Nature d’impôt': 'IS',
        "Chiffre d'Affaires": 180000000,
        Bénéfice: 28000000,
        Année: 2026,
        'TVA Payée': 9000000,
        'TVA Collectée': 12000000,
        'TVA Déductible': 3000000,
        Activité: 'Actif/ En veille / En liquidation/ Dissous',
        Conformité: 'Conformité/ Défaillant /  En vérification / Bloqué ',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contribuables');
    XLSX.writeFile(workbook, 'Modele_Import_Contribuables_DGI.xlsx');
  };

  // Exécution de l'importation par lot vers la base de données
  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Aucune ligne valide à importer.',
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    const errors = [];
    let successCount = 0;

    const centres = await getCentres().catch(() => []);
    const centreByName = new Map(
      (centres || [])
        .filter((centre) => centre.nom_centre)
        .map((centre) => [String(centre.nom_centre).trim().toLowerCase(), centre.id_centre]),
    );

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const centreId = centreByName.get(
          String(row.centre_gestionnaire || '').trim().toLowerCase(),
        );

        // 1. Créer ou mettre à jour l'entreprise
        const createdContribuable = await createContribuable({
          nif: row.nif,
          raison_sociale: row.raison_sociale,
          secteur_activite: row.secteur_activite,
          regime_fiscal: row.regime_fiscal,
          adresse: row.adresse,
          telephone: row.telephone,
          email: row.email || null,
          ...(centreId ? { id_centre: centreId } : {}),
        });

        const contribuableId =
          createdContribuable?.id_contribuable || createdContribuable?.data?.id_contribuable;

        // 2. Si des données de déclaration sont renseignées, créer la déclaration associée
        if (contribuableId && row.annee && row.ca) {
          try {
            await createDeclaration({
              id_contribuable: Number(contribuableId),
              annee: Number(row.annee) || new Date().getFullYear(),
              ca: Number(row.ca) || 0,
              benefice: Number(row.benefice) || 0,
              tva_collectee: Number(row.tva_collectee) || 0,
              tva_deductible: Number(row.tva_deductible) || 0,
              tva_payee: Number(row.tva_payee) || 0,
              regime_fiscal: row.regime_fiscal,
            });
          } catch (declErr) {
            console.warn('Avertissement déclaration :', declErr.message);
          }
        }

        successCount++;
      } catch (err) {
        errors.push(`Ligne ${row.id} (${row.raison_sociale || row.nif}) : ${getErrorMessage(err)}`);
      }

      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImporting(false);
    setErrorLog(errors);

    if (errors.length === 0) {
      setStatusMessage({
        type: 'success',
        text: `Félicitations ! ${successCount} contribuable(s) ont été importé(s) avec succès dans la base.`,
      });
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1500);
    } else {
      setStatusMessage({
        type: 'warning',
        text: `${successCount} importé(s) avec succès, mais ${errors.length} erreur(s) ont été rencontrées.`,
      });
      onSuccess?.();
    }
  };

  const handleResetModal = () => {
    setFile(null);
    setParsedRows([]);
    setStatusMessage(null);
    setErrorLog([]);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-gray-800"
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Import Excel des contribuables"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header de la Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 text-xl font-bold">
              📊
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 m-0">
                Importer des Contribuables (Excel / CSV)
              </h2>
              <p className="text-xs text-gray-500 m-0">
                Intégrez rapidement vos listes d'entreprises et déclarations fiscales par lot.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors text-lg cursor-pointer"
            title="Fermer la fenêtre"
          >
            ✕
          </button>
        </div>

        {/* Corps de la Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Bannière de téléchargement du modèle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-sm text-blue-900">
              <strong>Besoin du format standard ?</strong>
              <p className="text-xs text-blue-700 m-0 mt-0.5">
                Téléchargez notre modèle Excel prérempli pour formater facilement vos données.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-700 bg-white rounded-lg border border-blue-300 hover:bg-blue-100 shadow-xs cursor-pointer whitespace-nowrap transition-all"
            >
              📥 Télécharger le modèle (.xlsx)
            </button>
          </div>

          {/* Zone de Drag & Drop */}
          {!file && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50 scale-[0.99]'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => e.target.files && processFile(e.target.files[0])}
              />
              <div className="text-4xl mb-3">📁</div>
              <p className="font-semibold text-gray-800 text-sm mb-1">
                Glissez-déposez votre fichier Excel ou CSV ici
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Formats acceptés : <span className="font-semibold">.xlsx, .xls, .csv</span>
              </p>
              <span className="inline-block px-4 py-2 text-xs font-bold text-white bg-indigo-700 rounded-lg shadow-sm hover:bg-indigo-800">
                Parcourir les fichiers
              </span>
            </div>
          )}

          {/* Fichier chargé & Bouton de réinitialisation */}
          {file && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <div>
                  <strong className="text-gray-900">{file.name}</strong>
                  <span className="text-gray-500 ml-2">
                    ({(file.size / 1024).toFixed(1)} Ko)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetModal}
                disabled={importing}
                className="px-3 py-1.5 text-xs text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 cursor-pointer"
              >
                Changer de fichier
              </button>
            </div>
          )}

          {/* Messages d'état */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : statusMessage.type === 'warning'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              <span>
                {statusMessage.type === 'error'
                  ? '❌'
                  : statusMessage.type === 'success'
                    ? '✅'
                    : 'ℹ️'}
              </span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Barre de progression pendant l'import */}
          {importing && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>Importation en cours...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Aperçu des données extraites */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 m-0">
                  Aperçu des données ({parsedRows.length} lignes)
                </h3>
              </div>
              <div className="max-h-60 overflow-x-auto overflow-y-auto border border-gray-200 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-100 text-gray-600 sticky top-0 font-bold">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Statut</th>
                      <th className="px-3 py-2 text-left">NIF</th>
                      <th className="px-3 py-2 text-left">Raison Sociale</th>
                      <th className="px-3 py-2 text-left">CA Déclaré</th>
                      <th className="px-3 py-2 text-left">Nature d’impôt</th>
                      <th className="px-3 py-2 text-left">Téléphone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {parsedRows.slice(0, 50).map((row) => (
                      <tr
                        key={row.id}
                        className={row.isValid ? 'hover:bg-gray-50' : 'bg-red-50/50'}
                      >
                        <td className="px-3 py-2 text-gray-500">{row.id}</td>
                        <td className="px-3 py-2">
                          {row.isValid ? (
                            <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full">
                              ✓ Valide
                            </span>
                          ) : (
                            <span
                              className="inline-block px-2 py-0.5 text-[10px] font-bold text-red-700 bg-red-100 rounded-full"
                              title={row.errors.join(', ')}
                            >
                              ⚠ {row.errors[0]}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-gray-800">
                          {row.nif || '-'}
                        </td>
                        <td className="px-3 py-2 font-semibold text-gray-900">
                          {row.raison_sociale || '-'}
                        </td>
                        <td className="px-3 py-2">
                          {row.ca ? formatAriary(row.ca) : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              row.regime_fiscal === 'IS'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {row.regime_fiscal || 'IS'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{row.telephone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rapport d'erreurs éventuelles */}
          {errorLog.length > 0 && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
              <strong>Erreurs rencontrées :</strong>
              <ul className="list-disc list-inside space-y-0.5">
                {errorLog.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer avec Boutons d'Action */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={importing || parsedRows.filter((r) => r.isValid).length === 0}
            className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all ${
              importing || parsedRows.filter((r) => r.isValid).length === 0
                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                : 'bg-emerald-700 hover:bg-emerald-800 cursor-pointer hover:shadow-md'
            }`}
          >
            {importing
              ? 'Importation en cours...'
              : `🚀 Importer les ${parsedRows.filter((r) => r.isValid).length} ligne(s) valide(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
