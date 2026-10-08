const comparisonData = [
    { label: 'Chiffre d’affaires', recoupement: '245 000 000', declaration: '238 000 000', delta: '7 000 000' },
    { label: 'TVA collectée', recoupement: '18 500 000', declaration: '18 200 000', delta: '300 000' },
    { label: 'TVA déductible', recoupement: '12 900 000', declaration: '12 900 000', delta: '0' },
    { label: 'TVA à payer', recoupement: '5 600 000', declaration: '5 300 000', delta: '300 000' },
    { label: 'Nombre de déclarations', recoupement: '4', declaration: '4', delta: '0' },
    { label: 'Statut fiscal', recoupement: 'À contrôler', declaration: 'Conforme', delta: 'À vérifier' },
];

export default function Confrontation() {
    const totalDelta = comparisonData.reduce((sum, item) => {
        const value = Number(String(item.delta).replace(/\D/g, '')) || 0;
        return sum + value;
    }, 0);

    return (
        <section className="page">
            <div className="page-heading">
                <p className="eyebrow">Confrontation</p>
                <h1>Confrontation</h1>
                <p>
                    Comparez les données de recoupement avec les déclarations du contribuable pour
                    identifier les écarts et les points à vérifier.
                </p>
            </div>

            <div className="comparison-summary">
                <div>
                    <span className="eyebrow subtle">Écart global</span>
                    <strong>{totalDelta.toLocaleString('fr-FR')} Ariary</strong>
                </div>
                <span className="status-badge warning">À contrôler</span>
            </div>

            <div className="comparison-grid">
                <article className="comparison-panel">
                    <div className="comparison-header">
                        <h2>Données de recoupement</h2>
                        <span>Source externe</span>
                    </div>

                    <ul className="comparison-list">
                        {comparisonData.map((item) => (
                            <li key={item.label} className="comparison-item">
                                <span>{item.label}</span>
                                <strong>{item.recoupement}</strong>
                            </li>
                        ))}
                    </ul>
                </article>

                <article className="comparison-panel">
                    <div className="comparison-header">
                        <h2>Déclarations</h2>
                        <span>Historique fiscal</span>
                    </div>

                    <ul className="comparison-list">
                        {comparisonData.map((item) => (
                            <li key={`${item.label}-declaration`} className="comparison-item">
                                <span>{item.label}</span>
                                <strong>{item.declaration}</strong>
                            </li>
                        ))}
                    </ul>
                </article>
            </div>

            <div className="comparison-deltas">
                <div className="comparison-deltas-header">
                    <h3>Écart par poste</h3>
                </div>
                {comparisonData.map((item) => (
                    <div key={`${item.label}-delta`} className="comparison-delta-item">
                        <span>{item.label}</span>
                        <strong className={item.delta === '0' ? 'match' : 'alert'}>{item.delta}</strong>
                    </div>
                ))}
            </div>
        </section>
    );
}
