import { useState } from 'react';
import { DataTable } from '@/components/common';
import { AideTerme } from '@/frontofficeagent/aide';
import { formatAriary, toNumber } from '@/utils';

const PAGE_SIZE = 10;

const DECLARATION_STATUS_LABELS = {
  conforme: 'Conforme',
  alerte: 'Alerte',
  critique: 'Critique',
  non_conforme: 'Non conforme',
  primitive_envoyée: 'Notification primitive envoyée',
  définitive_envoyée: 'Notification définitive envoyée',
  primitive_envoyee: 'Notification primitive envoyée',
  definitive_envoyee: 'Notification définitive envoyée',
};

function declarationStatusLabel(statut) {
  if (!statut) return 'Conforme';
  return DECLARATION_STATUS_LABELS[String(statut).toLocaleLowerCase('fr')] || statut;
}

function getDeclarationCategory(revenue) {
  const amount = toNumber(revenue);

  if (amount >= 400_000_000) return ['Grand', 'badge critique'];
  if (amount >= 100_000_000) return ['Moyen', 'badge surveillance'];

  return ['Petit', 'badge conforme'];
}

export default function DeclarationHistory({ declarations, onOpenDeclaration }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(declarations.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const lignes = declarations.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <div className="history-heading">
        <h2>Historique des déclarations</h2>
        <span>{declarations.length} déclaration(s)</span>
      </div>

      <p className="aide-ecran-intro">
        Une ligne par année déclarée, la plus récente en tête. Un clic sur une ligne ouvre son
        suivi fiscal — notification et imputation se mènent là-bas, pas ici.
      </p>

      <DataTable
        ariaLabel="Historique des déclarations"
        columns={[
          { key: 'annee', label: 'Année', render: (declaration) => <strong>{declaration.annee}</strong> },
          { key: 'ca', label: "Chiffre d'affaires", header: <AideTerme id="ca">{"Chiffre d’affaires"}</AideTerme>, render: (declaration) => formatAriary(declaration.ca) },
          {
            key: 'categorie',
            label: 'Catégorie',
            header: <AideTerme id="categorie">Catégorie</AideTerme>,
            render: (declaration) => {
              const [categorie, badgeClass] = getDeclarationCategory(declaration.ca);
              return <span className={badgeClass}>{categorie}</span>;
            },
          },
          { key: 'tva_collectee', label: 'TVA collectée', header: <AideTerme id="tva_collectee">TVA collectée</AideTerme>, render: (declaration) => formatAriary(declaration.tva_collectee) },
          { key: 'tva_deductible', label: 'TVA déductible', header: <AideTerme id="tva_deductible">TVA déductible</AideTerme>, render: (declaration) => formatAriary(declaration.tva_deductible) },
          {
            key: 'tva_payee',
            label: 'TVA payée',
            header: <AideTerme id="tva_payee">TVA payée</AideTerme>,
            render: (declaration) => <strong>{formatAriary(declaration.tva_payee)}</strong>,
          },
          { key: 'tva_theorique', label: 'TVA théorique', header: <AideTerme id="tva_theorique">TVA théorique</AideTerme>, render: (declaration) => formatAriary(declaration.tva_theorique) },
          { key: 'statut', label: 'Statut', header: <AideTerme id="statut_declaration">Statut</AideTerme>, render: (declaration) => declarationStatusLabel(declaration.statut) },
        ]}
        rows={lignes}
        rowKey={(declaration) => declaration.id_declaration}
        rowTitle={() => 'Voir le détail de cette déclaration'}
        onRowClick={onOpenDeclaration}
        emptyMessage="Aucune déclaration enregistrée."
        pagination={{ page: safePage, totalPages, onPageChange: setPage }}
      />
    </>
  );
}
