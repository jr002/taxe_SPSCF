export const AmountFormatter = ({ amount }) => {
  // Fonction de formatage interne
  const formatAmount = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0 Ar';

    const abs = Math.abs(val);
    if (abs >= 1e15) {
      return `${(val / 1e15).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} mille milliards Ar`;
    }
    if (abs >= 1e12) {
      return `${(val / 1e12).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} mille milliards Ar`;
    }
    if (abs >= 1e9) {
      return `${(val / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} milliard${abs >= 2e9 ? 's' : ''} Ar`;
    }
    if (abs >= 1e6) {
      return `${(val / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} million${abs >= 2e6 ? 's' : ''} Ar`;
    }
    if (abs >= 1e3) {
      return `${(val / 1e3).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} mille Ar`;
    }

    return `${val.toLocaleString('fr-FR')} Ar`;
  };

  return <span>{formatAmount(amount)}</span>;
};