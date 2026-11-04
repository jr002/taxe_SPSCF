import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  createContribuable,
  createDeclaration,
  getCentres,
  getDeclarations,
  getErrorMessage,
  updateDeclaration,
} from '@/api';
import { formatAriary, statutSelonEcart } from '@/utils';
import { useModalA11y } from '@/hooks';

/**
 * Valeur numérique d'une cellule monétaire, ou `null` quand elle n'est pas
 * lisible. `null` veut dire « le fichier ne le dit pas » : la cellule est alors
 * omise de la requête, jamais remplacée par 0.
 */
const nombreOuRien = (valeur) => {
  const texte = String(valeur ?? '')
    .replace(/\s|\u00a0/g, '')
    .replace(/,(?=[0-9]{1,2}$)/, '.');
  if (!texte) return null;
  const nombre = Number(texte);
  return Number.isFinite(nombre) ? nombre : null;
};

/**
 * Montant déjà enregistré en base, tenu pour « renseigné » seulement s'il est
 * positif : la table `declarations` autorise `null` comme `0`, et l'un comme
 * l'autre signifient qu'aucune assiette n'est connue du dossier.
 */
const nombreStrictementPositif = (valeur) => {
  const nombre = Number(valeur);
  return Number.isFinite(nombre) && nombre > 0 ? nombre : null;
};

/**
 * Colonnes d'un classeur qui alimentent la table `declarations` (une ligne = une
 * déclaration TVA d'un exercice). Ce sont exactement les colonnes que le modèle
 * sait enregistrer ; aucune autre valeur du fichier n'est envoyée.
 */
const COLONNES_DECLARATION = {
  ca: "Chiffre d'affaires",
  benefice: 'Bénéfice',
  tva_collectee: 'TVA collectée',
  tva_deductible: 'TVA déductible',
  tva_payee: 'TVA payée',
  tva_theorique: 'TVA théorique',
};

/** Montants d'une ligne : `null` quand la cellule est vide ou illisible. */
const montantsDuneLigne = (ligne) =>
  Object.fromEntries(
    Object.keys(COLONNES_DECLARATION).map((colonne) => [colonne, nombreOuRien(ligne[colonne])]),
  );

/**
 * Incident sur les montants manquants, accordé : un classeur peut n'en laisser
 * qu'un seul en suspens comme cinq, et l'agent lit le même message dans les deux
 * cas.
 */
const montantsAbsentsDuFichier = (noms) =>
  noms.length > 1
    ? `les montants ${noms.join(', ')} étaient absents du fichier`
    : `le montant ${noms.join(', ')} était absent du fichier`;

/**
 * Lecture d'une cellule d'exercice. La base accepte une période annuelle —
 * `2024`, ce que saisit le module Collecte — ou mensuelle — `2024-03`, ce que
 * saisit le formulaire de déclaration de la fiche : le classeur peut porter
 * l'un ou l'autre, et c'est cette clé qui sert au rapprochement.
 */
const lireExercice = (valeur) => {
  // Une cellule de classeur est parfois typée « date » par le tableur : « 2024-03 »
  // arrive alors comme un objet Date, pas comme du texte. L'année et le mois
  // affichés dans la cellule sont ceux à retenir, sinon la période serait lue
  // comme un nombre de série et refusée à tort.
  if (valeur instanceof Date && !Number.isNaN(valeur.getTime())) {
    const anneeDate = valeur.getFullYear();
    if (anneeDate >= 2000 && anneeDate <= 2100) {
      const mois = String(valeur.getMonth() + 1).padStart(2, '0');
      return { annee: anneeDate, periode: `${anneeDate}-${mois}` };
    }
    return { annee: null, periode: '' };
  }

  const texte = String(valeur ?? '').trim().replace(/\s/g, '');
  const mensuelle = texte.match(/^(\d{4})[-/](\d{1,2})$/);
  if (mensuelle) {
    return {
      annee: Number(mensuelle[1]),
      periode: `${mensuelle[1]}-${mensuelle[2].padStart(2, '0')}`,
    };
  }
  if (/^\d{4}$/.test(texte)) return { annee: Number(texte), periode: texte };
  return { annee: null, periode: '' };
};

/** Clé de période réellement stockée sur une déclaration de la base. */
const cleDePeriode = (declaration) =>
  String(declaration.periode ?? '').trim() || String(declaration.annee ?? '').trim();

/** Déclaration déjà enregistrée pour cet exercice, ou `null` s'il faut la créer. */
const trouverDeclarationExistante = (declarations, periode) =>
  declarations.find((declaration) => cleDePeriode(declaration) === periode) || null;

/**
 * Cellule d'aperçu d'un montant : une case vide du classeur se lit « absente »,
 * elle ne se lit jamais 0 — c'est ce qui sera enregistré en base.
 */
const CelluleMontant = ({ valeur }) => {
  const nombre = nombreOuRien(valeur);
  return nombre === null ? (
    <span className="text-[10px] font-semibold text-gray-400">Absente du fichier</span>
  ) : (
    <span className="text-gray-800">{formatAriary(nombre)}</span>
  );
};

/**
 * Modale personnalisée d'importation de fichiers Excel / CSV pour les contribuables.
 *
 * Règle de fidélité : une colonne absente du fichier reste absente à la base. Le
 * formulaire n'ajoute ni adresse, ni téléphone, ni nature d'impôt qu'un agent
 * n'aurait pas écrits ; les manquants sont listés comme avertissements par ligne.
 * Le secteur d'activité, lui, est exigé par la base : une ligne sans secteur est
 * refusée plutôt que d'être créée sous un libellé inventé.
 */
export default function ExcelImportModal({ isOpen, onClose, onSuccess, contribuable = null }) {
  // Passer `contribuable` bascule la modale en mode « dossier » : plus aucune
  // fiche n'est créée, chaque ligne du classeur alimente une déclaration TVA du
  // contribuable affiché, rapprochée de celles déjà enregistrées.
  const enModeFiche = Boolean(contribuable?.id_contribuable);
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
    reader.onload = async (e) => {
      try {
        // Un CSV n'annonce pas son encodage dans le fichier : lu en octets,
        // SheetJS applique cp1252 et les en-têtes accentués (« TVA Déductible »)
        // deviennent méconnaissables, donc leurs montants sont perdus. Il est donc
        // lu en texte UTF-8 ; .xlsx et .xls portent leur encodage et se lisent en
        // octets. `cellDates` empêche qu'une période mensuelle comme « 2024-03 »
        // arrive sous forme de numéro de série de date.
        const enTexte = fileExtension === 'csv';
        const source = enTexte
          ? String(e.target.result).replace(/^\uFEFF/, '')
          : new Uint8Array(e.target.result);
        const workbook = XLSX.read(source, {
          type: enTexte ? 'string' : 'array',
          cellDates: true,
        });
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

        // Mode dossier : chaque ligne est rapprochée des déclarations TVA déjà
        // enregistrées pour ce contribuable, pour annoncer « mise à jour » ou
        // « création ». Sans cette lecture l'import ne peut pas dire ce qu'il va
        // écrire : on interrompt avant toute modification.
        let declarationsDuDossier = [];
        if (enModeFiche) {
          try {
            const resultat = await getDeclarations({
              search: String(contribuable.nif ?? ''),
              type_declaration: 'TVA',
            });
            declarationsDuDossier = (resultat?.data || []).filter(
              (declaration) =>
                Number(declaration.id_contribuable) === Number(contribuable.id_contribuable),
            );
          } catch (lectureError) {
            setStatusMessage({
              type: 'error',
              text: `Impossible de lire les déclarations déjà enregistrées de ce dossier (${getErrorMessage(lectureError)}). Import interrompu avant toute écriture.`,
            });
            setParsedRows([]);
            return;
          }
        }

        // Mappage dynamique des colonnes
        const periodesDejaPorteesParLeFichier = new Set();
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
            periode: '',
            tva_payee: '',
            tva_collectee: '',
            tva_deductible: '',
            tva_theorique: '',
            isValid: true,
            errors: [],
            avertissements: [],
            declarationExistante: null,
          };

          // « Activité » sert aussi d'en-tête à des colonnes qui ne décrivent pas le
          // secteur (statut de l'entreprise). Sa valeur n'est conservée ici qu'en
          // repli, pour être retenue seulement si aucune colonne « Secteur … » n'a
          // été lue — et donc indépendamment de l'ordre des colonnes.
          let secteurDepuisActivite = null;

          rowKeys.forEach((key) => {
            const normalized = normalizeColumnName(key);
            const val = String(row[key]).trim();

            if (normalized === 'nif' || normalized === 'numeronif') mapped.nif = val;
            else if (['raisonsociale', 'nom', 'societe', 'entreprise'].includes(normalized))
              mapped.raison_sociale = val;
            else if (['secteur', 'secteuractivite', 'secteurdactivite'].includes(normalized))
              // « Secteur d'Activité », l'en-tête du modèle téléchargeable, se
              // normalise avec le « d » de l'élision : sans cette variante, un
              // classeur rempli depuis le modèle perdait son secteur et chaque
              // ligne était refusée.
              mapped.secteur_activite = val;
            else if (normalized === 'activite') {
              if (!mapped.secteur_activite && secteurDepuisActivite === null) {
                secteurDepuisActivite = val;
              }
            }
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
            else if (['annee', 'anneefiscale', 'exercice', 'periode'].includes(normalized))
              // La cellule brute est conservée quand le tableur l'a typée en date :
              // `lireExercice` la lit correctement, alors que sa représentation
              // textuelle (« Fri Mar 01 2024 … ») serait illisible.
              mapped.annee = row[key] instanceof Date ? row[key] : val;
            else if (['tvapayee', 'tvapaye'].includes(normalized)) mapped.tva_payee = val;
            else if (['tvacollectee', 'tvacollecte'].includes(normalized))
              mapped.tva_collectee = val;
            else if (['tvadeductible'].includes(normalized)) mapped.tva_deductible = val;
            else if (['tvatheorique', 'tvat'].includes(normalized)) mapped.tva_theorique = val;
          });

          if (!mapped.secteur_activite && secteurDepuisActivite) {
            mapped.secteur_activite = secteurDepuisActivite;
          }

          if (enModeFiche) {
            // Une ligne du classeur devient une déclaration TVA de CE dossier :
            // il lui faut un exercice lisible et au moins un montant lisible.
            const exercice = lireExercice(mapped.annee);
            mapped.annee = exercice.annee;
            mapped.periode = exercice.periode;

            if (mapped.nif && String(mapped.nif) !== String(contribuable.nif)) {
              mapped.isValid = false;
              mapped.errors.push(
                `NIF « ${mapped.nif} » différent du dossier (${contribuable.nif}) — ligne refusée`,
              );
            }

            if (!exercice.annee || exercice.annee < 2000 || exercice.annee > 2100) {
              mapped.isValid = false;
              mapped.errors.push("Exercice manquant ou illisible (2024 ou 2024-03)");
            }

            // La base n'admet qu'une déclaration par contribuable, période et type
            // (`@@unique` sur `declarations`) : deux lignes du même classeur sur le
            // même exercice écriraient l'une sur l'autre, la seconde est écartée.
            if (exercice.annee) {
              if (periodesDejaPorteesParLeFichier.has(mapped.periode)) {
                mapped.isValid = false;
                mapped.errors.push(
                  `Exercice ${mapped.periode} déjà porté par une ligne précédente du classeur — une seule déclaration par période au dossier, cette ligne est écartée`,
                );
              } else {
                periodesDejaPorteesParLeFichier.add(mapped.periode);
              }
            }

            const montantsLigne = montantsDuneLigne(mapped);
            const absentsLigne = Object.entries(montantsLigne)
              .filter(([, valeur]) => valeur === null)
              .map(([colonne]) => COLONNES_DECLARATION[colonne]);
            mapped.montantsAbsents = absentsLigne;
            if (absentsLigne.length === Object.keys(montantsLigne).length) {
              mapped.isValid = false;
              mapped.errors.push("Aucun montant lisible — la ligne n'apporte rien à enregistrer");
            } else if (absentsLigne.length) {
              mapped.avertissements.push(`Absent(s) du fichier : ${absentsLigne.join(', ')}`);
            }

            // Deux colonnes commandent ce que le serveur sait écrire : sans TVA
            // théorique, la création déclenche son calcul automatique depuis le CA ;
            // sans TVA payée, aucun écart n'est mesurable. L'agent est averti avant
            // l'enregistrement : le dossier ne gardera ni un montant ni un statut
            // que le classeur n'a pas apportés.
            if (montantsLigne.tva_theorique === null) {
              mapped.avertissements.push(
                'TVA théorique absente du fichier : à la création, le dossier la laissera non renseignée (le calcul automatique du serveur sera retiré) ; à la mise à jour, le statut déjà enregistré ne sera pas recalculé.',
              );
            } else if (montantsLigne.tva_payee === null) {
              mapped.avertissements.push(
                'TVA payée absente du fichier : aucun écart mesurable, le statut de la déclaration sera laissé tel quel.',
              );
            }

            if (exercice.annee) {
              mapped.declarationExistante = trouverDeclarationExistante(
                declarationsDuDossier,
                mapped.periode,
              );
            }

            return mapped;
          }

          // Validation de la ligne : seuls blocages, les colonnes que la base
          // exige réellement (NIF, raison sociale, secteur d'activité).
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
            mapped.isValid = false;
            mapped.errors.push("Secteur d'activité manquant — la base l'exige à la création");
          }

          // Renseignements absents : ils sont signalés, jamais inventés.
          if (!mapped.adresse) mapped.avertissements.push('Adresse non fournie');
          if (!mapped.telephone) mapped.avertissements.push('Téléphone non fourni');
          if (!mapped.email) mapped.avertissements.push('E-mail non fourni');

          // La nature d'impôt n'est pas déduite du chiffre d'affaires : un seuil
          // de CA ne dit rien du régime réellement souscrit par le contribuable.
          if (!['IS', 'IR'].includes(mapped.regime_fiscal)) {
            mapped.avertissements.push(
              mapped.regime_fiscal
                ? `Nature d’impôt « ${mapped.regime_fiscal} » non reconnue (IS ou IR) — non envoyée`
                : 'Nature d’impôt non déclarée',
            );
            mapped.regime_fiscal = '';
          }

          // La colonne d'année peut arriver typée en date par le tableur : le
          // registre n'en retient que l'année, seule colonne qu'il sait stocker.
          const exerciceRegistre = lireExercice(mapped.annee);
          if (exerciceRegistre.annee) mapped.annee = exerciceRegistre.annee;

          return mapped;
        });

        setParsedRows(mappedRows);
        const validCount = mappedRows.filter((r) => r.isValid).length;
        const avecAvertissement = mappedRows.filter((r) => r.avertissements.length).length;
        const dejaSuivies = enModeFiche
          ? mappedRows.filter((ligne) => ligne.isValid && ligne.declarationExistante).length
          : 0;
        setStatusMessage({
          type: validCount ? 'info' : 'error',
          text: `${mappedRows.length} ligne(s) détectée(s) : ${validCount} importable(s), ${
            mappedRows.length - validCount
          } refusée(s) ; ${avecAvertissement} ligne(s) avec renseignement(s) absent(s) du fichier.${
            enModeFiche && validCount
              ? ` ${dejaSuivies} exercice(s) figure(nt) déjà au dossier et seront mis à jour, ${validCount - dejaSuivies} créé(s).`
              : ''
          }`,
        });
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: `Erreur lors de la lecture du fichier : ${err.message}`,
        });
        setParsedRows([]);
      }
    };
    if (fileExtension === 'csv') reader.readAsText(selectedFile, 'UTF-8');
    else reader.readAsArrayBuffer(selectedFile);
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

  // Télécharger un modèle Excel : l'en-tête exact des colonnes reconnues, suivi
  // d'une unique ligne neutre. Les valeurs sont des libellés d'aide, pas des
  // contribuables : l'agent les remplace avant d'importer le classeur.
  const handleDownloadTemplate = () => {
    if (enModeFiche) {
      // Classeur d'un dossier : une ligne par exercice, uniquement les colonnes
      // que la table `declarations` sait enregistrer.
      const templateFiche = [
        {
          NIF: String(contribuable.nif ?? ''),
          Exercice: '2024 (ou 2024-03 pour une période mensuelle)',
          "Chiffre d'Affaires": 0,
          Bénéfice: 0,
          'TVA Collectée': 0,
          'TVA Déductible': 0,
          'TVA Payée': 0,
          'TVA Théorique': 0,
        },
      ];
      const feuilleFiche = XLSX.utils.json_to_sheet(templateFiche);
      const classeurFiche = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(classeurFiche, feuilleFiche, 'Déclarations');
      XLSX.writeFile(classeurFiche, 'Modele_Import_Declarations_DGI.xlsx');
      return;
    }

    const templateData = [
      {
        NIF: '1234567890',
        'Raison Sociale': 'RAISON SOCIALE DU CONTRIBUTABLE',
        "Secteur d'Activité": 'Commerce de détail (à remplacer par le secteur réel)',
        Adresse: 'Adresse telle que déclarée par le contribuable',
        Téléphone: '+261340000000',
        Email: 'contact@entreprise.mg',
        'Centre gestionnaire': 'Nom exact du centre, tel qu’il figure à l’annuaire',
        'Nature d’impôt': 'IS ou IR — ne pas déduire du chiffre d’affaires',
        "Chiffre d'Affaires": 0,
        Bénéfice: 0,
        Année: 2026,
        'TVA Payée': 0,
        'TVA Collectée': 0,
        'TVA Déductible': 0,
        'TVA Théorique': 0,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contribuables');
    XLSX.writeFile(workbook, 'Modele_Import_Contribuables_DGI.xlsx');
  };

  /**
   * Enregistrement par lot, mode dossier. Une ligne = une déclaration TVA du
   * contribuable affiché, repérée par sa période :
   * - l'exercice déjà au dossier est **mis à jour** (`PUT /declarations/:id`,
   *   partiel : un montant absent du fichier garde la valeur enregistrée) ;
   * - un exercice nouveau est **créé** (`POST /declarations`, type TVA).
   * La fiche elle-même n'est jamais modifiée ni recréée, et un autre NIF que
   * celui du dossier est refusé ligne par ligne. Rien n'est inventé : un montant
   * que le classeur n'apporte pas reste non renseigné, et le calcul automatique
   * de la TVA théorique que le serveur applique à la création est retiré du
   * dossier quand la colonne manquait — le dossier ne porte que les chiffres de
   * l'agent.
   */
  const importerLignesDossier = async (validRows) => {
    setImporting(true);
    setProgress(0);
    const erreurs = [];
    let creees = 0;
    let misesAJour = 0;

    for (let i = 0; i < validRows.length; i++) {
      const ligne = validRows[i];
      const montants = montantsDuneLigne(ligne);
      const presents = Object.fromEntries(
        Object.entries(montants).filter(([, valeur]) => valeur !== null),
      );
      const absents = Object.entries(montants)
        .filter(([, valeur]) => valeur === null)
        .map(([colonne]) => COLONNES_DECLARATION[colonne]);

      try {
        const existante = ligne.declarationExistante;
        // Valeurs qui seront réellement au dossier après l'écriture : celles du
        // classeur, sinon celles déjà enregistrées. `0` et `null` disent tous deux
        // « non renseigné » : sans assiette lisible, aucun écart n'est calculable.
        const theorieApres =
          presents.tva_theorique ?? nombreStrictementPositif(existante?.tva_theorique);
        const payeeApres = presents.tva_payee ?? nombreStrictementPositif(existante?.tva_payee);
        // Un écart ne se mesure qu'avec une assiette ET un paiement connu : sans
        // l'un des deux, écrire un statut serait affirmer une situation que personne
        // n'a déclarée.
        const statutCalculable = theorieApres !== null && payeeApres !== null;

        if (existante?.id_declaration) {
          const corps = { ...presents };
          // `PUT /declarations/:id` ne recalcule pas le statut : on ne pousse le
          // statut dérivé que si le classeur ou le dossier de quoi le calculer ;
          // sinon le statut déjà enregistré reste en place, rien n'est inventé.
          if (statutCalculable) corps.statut = statutSelonEcart(theorieApres, payeeApres);
          await updateDeclaration(existante.id_declaration, corps);
          misesAJour += 1;
          if (absents.length) {
            erreurs.push(
              `Ligne ${ligne.id} (${ligne.periode}) : mise à jour partielle — ${montantsAbsentsDuFichier(absents)} ; la valeur déjà enregistrée reste en place.`,
            );
          }
          if (!statutCalculable) {
            erreurs.push(
              `Ligne ${ligne.id} (${ligne.periode}) : statut non recalculé — sans TVA théorique et TVA payée lisibles au fichier ou au dossier, aucun écart n'est mesurable ; le statut enregistré reste celui d'avant l'import.`,
            );
          }
        } else {
          const creee = await createDeclaration({
            id_contribuable: Number(contribuable.id_contribuable),
            annee: ligne.annee,
            periode: ligne.periode,
            type_declaration: 'TVA',
            ...presents,
          });
          creees += 1;
          if (absents.length) {
            erreurs.push(
              `Ligne ${ligne.id} (${ligne.periode}) : déclaration créée incomplète — ${montantsAbsentsDuFichier(absents)} ; rien n'est compté à zéro au dossier.`,
            );
          }

          // À la création, le serveur ne laisse jamais ces deux colonnes vides : il
          // calcule une TVA théorique depuis le CA et en déduit un statut. Ces
          // chiffres ne viennent pas de l'agent, ils sont donc retirés du dossier
          // pour qu'il ne porte que ce que le classeur apporte.
          const aRetirer = {};
          if (presents.tva_theorique === undefined) {
            aRetirer.tva_theorique = null;
            aRetirer.statut = null;
          } else if (payeeApres === null) {
            aRetirer.statut = null;
          }
          if (Object.keys(aRetirer).length) {
            const idCree = creee?.declaration?.id_declaration ?? creee?.id_declaration;
            if (idCree) {
              await updateDeclaration(idCree, aRetirer);
              erreurs.push(
                `Ligne ${ligne.id} (${ligne.periode}) : ${
                  presents.tva_theorique === undefined
                    ? 'TVA théorique et statut calculés automatiquement par le serveur, le classeur ne les portait pas — retirés du dossier'
                    : 'statut calculé sans TVA payée lisible — retiré du dossier'
                }, à établir après contrôle.`,
              );
            } else {
              erreurs.push(
                `Ligne ${ligne.id} (${ligne.periode}) : le serveur a calculé une TVA théorique et un statut que le classeur ne portait pas ; identifiant de la déclaration illisible, retrait impossible — à vérifier au dossier.`,
              );
            }
          }
        }
      } catch (erreurImport) {
        erreurs.push(
          `Ligne ${ligne.id} (${ligne.periode || 'exercice illisible'}) : ${getErrorMessage(erreurImport)}`,
        );
      }

      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImporting(false);
    setErrorLog(erreurs);

    const bilan = `${creees} déclaration(s) créée(s) · ${misesAJour} mise(s) à jour · ${erreurs.length} incident(s) pour ${contribuable.raison_sociale || contribuable.nif}`;
    const rienEcrit = creees === 0 && misesAJour === 0;

    setStatusMessage({
      type: rienEcrit ? 'error' : erreurs.length ? 'warning' : 'success',
      text: rienEcrit
        ? `Aucune déclaration n'a été enregistrée dans ce dossier. ${bilan}.`
        : `${bilan}. Un montant absent du classeur n'est jamais compté à zéro.`,
    });

    if (rienEcrit) return;

    onSuccess?.(bilan);
    if (erreurs.length === 0) {
      setTimeout(() => onClose?.(), 2500);
    }
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

    if (enModeFiche) {
      await importerLignesDossier(validRows);
      return;
    }

    setImporting(true);
    setProgress(0);
    const errors = [];
    let contribuableCount = 0;
    let declarationCount = 0;
    let ignores = 0;

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

        // 1. Contribuable : seuls les champs réellement lus dans le fichier sont
        //    envoyés. Un champ absent reste absent en base, il n'est pas comblé.
        const contribution = {
          nif: row.nif,
          raison_sociale: row.raison_sociale,
          secteur_activite: row.secteur_activite,
          ...(row.adresse ? { adresse: row.adresse } : {}),
          ...(row.telephone ? { telephone: row.telephone } : {}),
          ...(row.email ? { email: row.email } : {}),
          ...(row.regime_fiscal ? { regime_fiscal: row.regime_fiscal } : {}),
          ...(centreId ? { id_centre: centreId } : {}),
        };

        const createdContribuable = await createContribuable(contribution);

        const contribuableId =
          createdContribuable?.id_contribuable || createdContribuable?.data?.id_contribuable;
        if (contribuableId) contribuableCount++;
        if (row.centre_gestionnaire && !centreId) {
          errors.push(
            `Ligne ${row.id} (${row.raison_sociale}) : centre « ${row.centre_gestionnaire} » absent de l’annuaire — contribuable créé sans rattachement.`,
          );
        }

        // 2. Déclaration : elle n'est créée que si le fichier porte un exercice
        //    lisible et au moins un montant lisible.
        const annee = Number(row.annee);
        const montants = {
          ca: nombreOuRien(row.ca),
          benefice: nombreOuRien(row.benefice),
          tva_collectee: nombreOuRien(row.tva_collectee),
          tva_deductible: nombreOuRien(row.tva_deductible),
          tva_payee: nombreOuRien(row.tva_payee),
          tva_theorique: nombreOuRien(row.tva_theorique),
        };
        const montantsPresents = Object.fromEntries(
          Object.entries(montants).filter(([, valeur]) => valeur !== null),
        );

        if (contribuableId && Object.keys(montantsPresents).length) {
          if (!Number.isInteger(annee) || annee < 2000 || annee > 2100) {
            errors.push(
              `Ligne ${row.id} (${row.raison_sociale}) : déclaration non créée, l'exercice « ${row.annee} » n'est pas une année valable.`,
            );
          } else {
            const manquants = Object.entries(montants)
              .filter(([, valeur]) => valeur === null)
              .map(([cle]) => COLONNES_DECLARATION[cle] ?? cle);
            if (manquants.length) {
              errors.push(
                `Ligne ${row.id} (${row.raison_sociale}) : déclaration créée incomplète — ${montantsAbsentsDuFichier(manquants)} ; rien n'est compté à zéro au dossier.`,
              );
            }

            try {
              const creee = await createDeclaration({
                id_contribuable: Number(contribuableId),
                annee,
                ...montantsPresents,
                ...(row.regime_fiscal ? { regime_fiscal: row.regime_fiscal } : {}),
              });
              declarationCount++;

              // Comme dans le mode dossier : à la création le serveur calcule
              // toujours une TVA théorique (5 % du CA à défaut) et le statut qui en
              // découle. Ces chiffres ne viennent d'aucune saisie de l'agent, ils
              // sont donc retirés du dossier quand le classeur ne les portait pas.
              const aRetirer = {};
              if (montantsPresents.tva_theorique === undefined) {
                aRetirer.tva_theorique = null;
                aRetirer.statut = null;
              }
              if (Object.keys(aRetirer).length) {
                const idCreee =
                  creee?.declaration?.id_declaration ?? creee?.id_declaration;
                if (idCreee) {
                  await updateDeclaration(idCreee, aRetirer);
                  errors.push(
                    `Ligne ${row.id} (${row.raison_sociale}) : TVA théorique et statut calculés automatiquement par le serveur, le classeur ne les portait pas — retirés du dossier, à établir après contrôle.`,
                  );
                } else {
                  errors.push(
                    `Ligne ${row.id} (${row.raison_sociale}) : le serveur a calculé une TVA théorique et un statut que le classeur ne portait pas ; identifiant de la déclaration illisible, retrait impossible — à vérifier au dossier.`,
                  );
                }
              }
            } catch (declErr) {
              errors.push(
                `Ligne ${row.id} (${row.raison_sociale}) : contribuable créé, déclaration refusée — ${getErrorMessage(declErr)}`,
              );
            }
          }
        } else if (contribuableId) {
          ignores++;
        }
      } catch (err) {
        errors.push(`Ligne ${row.id} (${row.raison_sociale || row.nif}) : ${getErrorMessage(err)}`);
      }

      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImporting(false);
    setErrorLog(errors);

    const bilan = `${contribuableCount} contribuable(s) créé(s) · ${declarationCount} déclaration(s) enregistrée(s) · ${errors.length} incident(s)`;
    const rienCree = contribuableCount === 0;

    setStatusMessage({
      type: rienCree ? 'error' : errors.length ? 'warning' : 'success',
      text: rienCree
        ? `Aucun contribuable n'a été créé. ${bilan}.`
        : `${bilan}.${ignores ? ` ${ignores} ligne(s) sans montant fiscal : contribuable(s) créé(s), aucune déclaration inventée.` : ''}`,
    });

    if (!rienCree) {
      onSuccess?.();
      if (errors.length === 0) {
        // Le bilan reste lisible quand tout s'est bien passé : la fenêtre se
        // referme après avoir laissé le message s'afficher.
        setTimeout(() => onClose?.(), 2500);
      }
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
        aria-label={
          enModeFiche
            ? 'Import Excel des déclarations du dossier contribuable'
            : 'Import Excel des contribuables'
        }
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
                {enModeFiche
                  ? `Importer les déclarations de ${contribuable.raison_sociale || contribuable.nif}`
                  : 'Importer des Contribuables (Excel / CSV)'}
              </h2>
              <p className="text-xs text-gray-500 m-0">
                {enModeFiche ? (
                  <>
                    Une ligne du classeur devient une déclaration TVA de ce dossier, reconnue à son
                    exercice : un exercice déjà au dossier est <strong>mis à jour</strong>, un
                    exercice nouveau est <strong>créé</strong>. La fiche elle-même reste inchangée
                    et une colonne absente du fichier reste absente en base.
                  </>
                ) : (
                  <>
                    Intégrez rapidement vos listes d'entreprises et déclarations fiscales par lot.
                    Une colonne absente du fichier reste absente en base : rien n'est complété
                    d'office.
                  </>
                )}
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
                {enModeFiche
                  ? 'Le modèle du dossier porte une ligne par exercice : Exercice, Chiffre d’Affaires, Bénéfice, TVA collectée, TVA déductible, TVA payée, TVA théorique.'
                  : 'Téléchargez notre modèle Excel prérempli pour formater facilement vos données.'}
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
                <table
                  aria-label={
                    enModeFiche
                      ? 'Aperçu des déclarations à enregistrer pour ce dossier'
                      : 'Aperçu des lignes à importer'
                  }
                  className="min-w-full divide-y divide-gray-200 text-xs"
                >
                  <thead className="bg-gray-100 text-gray-600 sticky top-0 font-bold">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Statut</th>
                      {enModeFiche ? (
                        <>
                          <th className="px-3 py-2 text-left">Exercice</th>
                          <th className="px-3 py-2 text-left">Chiffre d’affaires</th>
                          <th className="px-3 py-2 text-left">Bénéfice</th>
                          <th className="px-3 py-2 text-left">TVA collectée</th>
                          <th className="px-3 py-2 text-left">TVA déductible</th>
                          <th className="px-3 py-2 text-left">TVA payée</th>
                          <th className="px-3 py-2 text-left">TVA théorique</th>
                          <th className="px-3 py-2 text-left">Action</th>
                        </>
                      ) : (
                        <>
                          <th className="px-3 py-2 text-left">NIF</th>
                          <th className="px-3 py-2 text-left">Raison Sociale</th>
                          <th className="px-3 py-2 text-left">CA Déclaré</th>
                          <th className="px-3 py-2 text-left">Nature d’impôt</th>
                          <th className="px-3 py-2 text-left">Téléphone</th>
                        </>
                      )}
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
                            row.avertissements.length ? (
                              <span
                                className="inline-block px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 rounded-full cursor-help"
                                title={row.avertissements.join(' · ')}
                              >
                                ⚠{' '}
                                {(row.montantsAbsents || row.avertissements).length}{' '}
                                {row.montantsAbsents
                                  ? 'montant(s) absent(s)'
                                  : 'absence(s)'}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full">
                                ✓ Complète
                              </span>
                            )
                          ) : (
                            <span
                              className="inline-block px-2 py-0.5 text-[10px] font-bold text-red-700 bg-red-100 rounded-full"
                              title={row.errors.join(', ')}
                            >
                              ⛔ {row.errors[0]}
                            </span>
                          )}
                        </td>
                        {enModeFiche ? (
                          <>
                            <td className="px-3 py-2 font-mono font-bold text-gray-800">
                              {row.periode || '—'}
                            </td>
                            <td className="px-3 py-2">
                              <CelluleMontant valeur={row.ca} />
                            </td>
                            <td className="px-3 py-2">
                              <CelluleMontant valeur={row.benefice} />
                            </td>
                            <td className="px-3 py-2">
                              <CelluleMontant valeur={row.tva_collectee} />
                            </td>
                            <td className="px-3 py-2">
                              <CelluleMontant valeur={row.tva_deductible} />
                            </td>
                            <td className="px-3 py-2">
                              <CelluleMontant valeur={row.tva_payee} />
                            </td>
                            <td className="px-3 py-2">
                              <CelluleMontant valeur={row.tva_theorique} />
                            </td>
                            <td className="px-3 py-2">
                              {!row.isValid ? (
                                <span className="text-[10px] font-semibold text-gray-400">
                                  Non importée
                                </span>
                              ) : row.declarationExistante ? (
                                <span
                                  className="inline-block px-2 py-0.5 text-[10px] font-bold text-blue-800 bg-blue-100 rounded-full cursor-help"
                                  title={`Exercice ${row.periode} déjà au dossier : les montants du classeur remplaceront ceux enregistrés.`}
                                >
                                  ↻ Mettre à jour
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-indigo-800 bg-indigo-100 rounded-full">
                                  + Créer
                                </span>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 font-mono font-bold text-gray-800">
                              {row.nif || '-'}
                            </td>
                            <td className="px-3 py-2 font-semibold text-gray-900">
                              {row.raison_sociale || '-'}
                            </td>
                            <td className="px-3 py-2">
                              {row.ca ? formatAriary(row.ca) : 'Non déclaré'}
                            </td>
                            <td className="px-3 py-2">
                              {row.regime_fiscal ? (
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                    row.regime_fiscal === 'IS'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {row.regime_fiscal}
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-gray-400">
                                  Non déclarée
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {row.telephone || <span className="text-gray-400">Non fourni</span>}
                            </td>
                          </>
                        )}
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
              : enModeFiche
                ? `💾 Enregistrer ${parsedRows.filter((r) => r.isValid).length} ligne(s) dans le dossier`
                : `🚀 Importer les ${parsedRows.filter((r) => r.isValid).length} ligne(s) valide(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
