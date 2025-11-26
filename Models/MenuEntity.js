/**
 * MenuEntity - Entità per rappresentare un menu del giorno
 * Raggruppa i piatti disponibili per una determinata data
 */
class MenuEntity {
    /**
     * @param {string} id - Identificativo univoco
     * @param {Date} data - Data del menu
     * @param {string} tipo - 'pranzo', 'cena', 'completo'
     * @param {Array} piatti - Array di PiattoEntity o ID piatti
     * @param {string} note - Note aggiuntive
     */
    constructor(id, data, tipo, piatti, note) {
        this.id = id || this.generaId();
        this.data = data || new Date();
        this.tipo = tipo || 'completo';
        this.piatti = piatti || [];
        this.note = note || '';
        this.attivo = true;
    }

    /**
     * Genera un ID univoco
     * @returns {string}
     */
    generaId() {
        return 'MENU_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Formatta la data in formato italiano
     * @returns {string}
     */
    getDataFormattata() {
        return new Intl.DateTimeFormat('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(this.data);
    }

    /**
     * Calcola statistiche del menu
     * @param {number} percentualeCostiFissi
     * @returns {Object}
     */
    calcolaStatistiche(percentualeCostiFissi = 30) {
        let costoTotale = 0;
        let ricavoTotale = 0;
        let margineTotale = 0;
        let numeroPiatti = this.piatti.length;

        this.piatti.forEach(piatto => {
            if (piatto.calcolaCostoIngedienti) {
                costoTotale += piatto.calcolaCostoIngedienti(percentualeCostiFissi);
                ricavoTotale += piatto.prezzoVendita;
                margineTotale += piatto.calcolaMargineProfitto(percentualeCostiFissi);
            }
        });

        return {
            numeroPiatti,
            costoTotale,
            ricavoTotale,
            margineTotale,
            margineMedio: numeroPiatti > 0 ? margineTotale / numeroPiatti : 0,
            foodCostMedio: ricavoTotale > 0 ? (costoTotale / ricavoTotale) * 100 : 0
        };
    }

    /**
     * Raggruppa i piatti per categoria
     * @returns {Object}
     */
    raggruppaPiattiPerCategoria() {
        const gruppi = {};
        this.piatti.forEach(piatto => {
            const cat = piatto.categoria || 'Altro';
            if (!gruppi[cat]) {
                gruppi[cat] = [];
            }
            gruppi[cat].push(piatto);
        });
        return gruppi;
    }

    /**
     * Aggiunge un piatto al menu
     * @param {PiattoEntity} piatto
     */
    aggiungiPiatto(piatto) {
        if (!this.piatti.find(p => p.id === piatto.id)) {
            this.piatti.push(piatto);
        }
    }

    /**
     * Rimuove un piatto dal menu
     * @param {string} piattoId
     */
    rimuoviPiatto(piattoId) {
        this.piatti = this.piatti.filter(p => p.id !== piattoId);
    }

    /**
     * Restituisce una copia dell'oggetto
     * @returns {MenuEntity}
     */
    clone() {
        return new MenuEntity(
            this.id,
            new Date(this.data),
            this.tipo,
            this.piatti.map(p => p.clone ? p.clone() : {...p}),
            this.note
        );
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuEntity;
}
