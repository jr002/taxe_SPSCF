const PDFDocument = require('pdfkit');

const COULEUR = {
  primaire: '#1769aa',
  texte: '#172033',
  muet: '#657083',
  bordure: '#dfe5ed',
  fond: '#f8fafc',
  alerte: '#b42318',
  succes: '#237a43',
  avertissement: '#8a5d00',
};

const STATUT_LABELS = {
  rapproche: 'Rapproché',
  a_verifier: 'À vérifier',
  ecart: 'Écart',
  valide: 'Validé',
  rejete: 'Rejeté',
  annule: 'Annulé',
};

const TYPE_LABELS = {
  exact: 'Exact',
  tolerance: 'Tolérance',
  partiel: 'Partiel',
  manuel: 'Manuel',
};

const SOURCE_LABELS = {
  tiers_declarant: 'Tiers déclarant',
  banque: 'Banque',
  fournisseur: 'Fournisseur',
  client: 'Client',
  administration: 'Administration',
  assurance: 'Assurance',
  notaire: 'Notaire',
  autre: 'Autre',
};

// Les polices standard du PDF ne connaissent pas l'espace fine insécable
// produite par `toLocaleString('fr-FR')` : on la remplace par une espace.
const montant = (value) => `${Number(value || 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')} Ar`;
const dateHeure = (value) => new Date(value).toLocaleString('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
});
const dateCourte = (value) => new Date(value).toLocaleDateString('fr-FR');

const periodeDe = (row) => {
  const declaration = row.declarations || {};
  if (declaration.periode) return declaration.periode;
  if (declaration.annee) return `Exercice ${declaration.annee}`;
  return (row.recoupements || {}).periode || '—';
};

const recoupementDe = (row) => {
  const recoupement = row.recoupements || {};
  const source = SOURCE_LABELS[recoupement.source] || recoupement.source || '—';
  const reference = recoupement.reference ? ` · ${recoupement.reference}` : '';
  return `${source}${reference}`;
};

const statutCouleur = (statut) => {
  if (statut === 'rapproche') return COULEUR.succes;
  if (statut === 'ecart') return COULEUR.alerte;
  if (statut === 'a_verifier') return COULEUR.avertissement;
  if (statut === 'valide') return COULEUR.primaire;
  return COULEUR.muet;
};

const filtresTexte = (filters = {}) => {
  const parties = [];
  if (filters.periode) {
    parties.push(/^\d{4}$/.test(filters.periode)
      ? `exercice ${filters.periode}`
      : `période ${filters.periode}`);
  }
  if (filters.statut) parties.push(`statut « ${STATUT_LABELS[filters.statut] || filters.statut} »`);
  if (filters.type_rapprochement) parties.push(`type « ${TYPE_LABELS[filters.type_rapprochement] || filters.type_rapprochement} »`);
  if (filters.search) parties.push(`recherche « ${filters.search} »`);
  return parties.length ? `Filtres appliqués : ${parties.join(' · ')}` : 'Aucun filtre : toutes les lignes du contribuable.';
};

class RapprochementPdfService {
  /**
   * Rapport de confrontation d'un contribuable : en-tête, tableau des lignes
   * filtrées, totaux et pagination. Le document est écrit dans le flux HTTP
   * par le contrôleur ; aucune dépendance nouvelle n'est nécessaire.
   */
  static buildDocument({ contribuable, rows = [], filters = {}, genereLe = new Date() }) {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 36,
      bufferPages: true,
      info: {
        Title: `Confrontation fiscale — ${contribuable.raison_sociale || contribuable.nif || ''}`,
        Author: 'DGI · SSIF',
        Subject: 'Rapport de confrontation fiscale',
      },
    });

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const left = 36;
    const tableWidth = pageWidth - left * 2;
    const colonnes = [
      { cle: 'periode', titre: 'Période', largeur: 90 },
      { cle: 'declaration', titre: 'Déclaration', largeur: 65 },
      { cle: 'recoupement', titre: 'Recoupement', largeur: 155 },
      { cle: 'type', titre: 'Type', largeur: 60 },
      { cle: 'declare', titre: 'CA déclaré', largeur: 100, align: 'right' },
      { cle: 'recoupe', titre: 'Recoupé', largeur: 100, align: 'right' },
      { cle: 'ecart', titre: 'Écart', largeur: 100, align: 'right' },
      { cle: 'statut', titre: 'Statut', largeur: 80 },
    ];
    const positions = colonnes.reduce((acc, colonne) => {
      acc.push({ ...colonne, x: acc.length ? acc[acc.length - 1].x + acc[acc.length - 1].largeur : left });
      return acc;
    }, []);
    const yTableMax = pageHeight - 60;

    const dessinerEnteteTableau = (y) => {
      doc.rect(left, y, tableWidth, 22).fill(COULEUR.primaire);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
      for (const colonne of positions) {
        doc.text(colonne.titre, colonne.x + 4, y + 7, {
          width: colonne.largeur - 8,
          align: colonne.align || 'left',
          lineBreak: false,
        });
      }
      doc.fillColor(COULEUR.texte);
      return y + 22;
    };

    // En-tête du document
    doc.fillColor(COULEUR.muet).font('Helvetica-Bold').fontSize(8);
    doc.text('RÉPUBLIQUE DE MADAGASCAR · DIRECTION GÉNÉRALE DES IMPÔTS', left, 32, { lineBreak: false });
    doc.font('Helvetica').fontSize(7.5);
    doc.text('Système d’information fiscal (SSIF) · Confrontation fiscale', left, 44, { lineBreak: false });

    doc.fillColor(COULEUR.primaire).font('Helvetica-Bold').fontSize(18);
    doc.text('Rapport de confrontation fiscale', left, 64, { width: tableWidth * 0.62, lineBreak: false });

    doc.fillColor(COULEUR.texte).font('Helvetica-Bold').fontSize(12);
    doc.text(contribuable.raison_sociale || 'Contribuable', left, 92, { width: tableWidth * 0.62, lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillColor(COULEUR.muet);
    doc.text(`NIF ${contribuable.nif || '—'}`, left, 110, { lineBreak: false });

    doc.fontSize(8).fillColor(COULEUR.muet);
    doc.text(`Généré le ${dateHeure(genereLe)}`, pageWidth - 36 - 220, 64, { width: 220, align: 'right', lineBreak: false });
    doc.text(`${rows.length} rapprochement(s)`, pageWidth - 36 - 220, 78, { width: 220, align: 'right', lineBreak: false });

    doc.fillColor(COULEUR.texte).font('Helvetica').fontSize(8.5);
    doc.text(filtresTexte(filters), left, 134, { width: tableWidth, lineBreak: false });
    doc.fillColor(COULEUR.muet).fontSize(8);
    doc.text(
      'Base comparée : chiffre d’affaires déclaré face aux montants recoupés TTC. Les montants de TVA ne sont pas comparés.',
      left,
      148,
      { width: tableWidth, lineBreak: false },
    );

    let y = dessinerEnteteTableau(170);

    if (rows.length === 0) {
      doc.font('Helvetica').fontSize(9).fillColor(COULEUR.muet);
      doc.text('Aucun rapprochement ne correspond aux filtres.', left + 4, y + 10, {
        width: tableWidth - 8,
        lineBreak: false,
      });
      y += 30;
    }

    rows.forEach((row, index) => {
      const declaration = row.declarations || {};
      const valeurs = {
        periode: periodeDe(row),
        declaration: declaration.id_declaration ? `#${declaration.id_declaration}` : '—',
        recoupement: recoupementDe(row),
        type: TYPE_LABELS[row.type_rapprochement] || row.type_rapprochement || '—',
        declare: montant(row.montant_declare),
        recoupe: montant(row.montant_recoupe),
        ecart: montant(row.ecart),
        statut: STATUT_LABELS[row.statut] || row.statut || '—',
      };

      doc.font('Helvetica').fontSize(8);
      const hauteur = Math.max(
        16,
        ...positions.map((colonne) => doc.heightOfString(valeurs[colonne.cle], {
          width: colonne.largeur - 8,
        }) + 8),
      );

      if (y + hauteur > yTableMax) {
        doc.addPage();
        y = dessinerEnteteTableau(36);
      }

      if (index % 2 === 1) {
        doc.rect(left, y, tableWidth, hauteur).fill(COULEUR.fond);
      }

      for (const colonne of positions) {
        doc.fillColor(colonne.cle === 'statut' ? statutCouleur(row.statut) : COULEUR.texte)
          .font(colonne.cle === 'statut' ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8)
          .text(valeurs[colonne.cle], colonne.x + 4, y + 4, {
            width: colonne.largeur - 8,
            align: colonne.align || 'left',
          });
      }

      y += hauteur;
      doc.moveTo(left, y).lineTo(left + tableWidth, y).strokeColor(COULEUR.bordure).lineWidth(0.5).stroke();
    });

    // Synthèse
    const actifs = rows.filter((row) => !['rejete', 'annule'].includes(row.statut));
    const somme = (champ) => actifs.reduce((total, row) => total + Number(row[champ] || 0), 0);
    const compter = (champ, valeur) => rows.filter((row) => row[champ] === valeur).length;

    if (y + 95 > pageHeight - 50) {
      doc.addPage();
      y = 36;
    }

    y += 12;
    doc.moveTo(left, y).lineTo(left + tableWidth, y).strokeColor(COULEUR.bordure).lineWidth(1).stroke();
    y += 10;
    doc.fillColor(COULEUR.texte).font('Helvetica-Bold').fontSize(10);
    doc.text('Synthèse du rapport', left, y, { lineBreak: false });
    y += 16;
    doc.font('Helvetica').fontSize(8.5).fillColor(COULEUR.muet);
    doc.text(
      `Total : ${rows.length} rapprochement(s) · actifs : ${actifs.length} · exact ${compter('type_rapprochement', 'exact')} · tolérance ${compter('type_rapprochement', 'tolerance')} · partiel ${compter('type_rapprochement', 'partiel')} · écart ${compter('statut', 'ecart')}`,
      left,
      y,
      { width: tableWidth, lineBreak: false },
    );
    y += 13;
    doc.text(
      `CA déclaré (hors rejetés/annulés) : ${montant(somme('montant_declare'))} · recoupé : ${montant(somme('montant_recoupe'))} · écart global : ${montant(somme('ecart'))}`,
      left,
      y,
      { width: tableWidth, lineBreak: false },
    );
    y += 13;
    doc.fillColor(COULEUR.texte).font('Helvetica-Oblique').fontSize(8);
    doc.text(
      'Un écart n’est pas automatiquement une fraude : il doit être analysé avec les pièces justificatives avant toute décision.',
      left,
      y,
      { width: tableWidth, lineBreak: false },
    );

    // Pied de page
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc.font('Helvetica').fontSize(7).fillColor(COULEUR.muet);
      doc.text(
        `SSIF · Confrontation fiscale · ${contribuable.nif || ''} · généré le ${dateCourte(genereLe)}`,
        36,
        pageHeight - 28,
        { width: tableWidth - 80, lineBreak: false },
      );
      doc.text(
        `Page ${i + 1} / ${range.count}`,
        pageWidth - 36 - 80,
        pageHeight - 28,
        { width: 80, align: 'right', lineBreak: false },
      );
    }

    return doc;
  }
}

module.exports = RapprochementPdfService;
