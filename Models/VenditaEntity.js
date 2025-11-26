/**
 * VenditaEntity - Entità per rappresentare una vendita/ordine
 * Traccia le vendite per l'analisi del menu engineering
 */
class VenditaEntity {
    /**
     * @param {string} id - Identificativo univoco
     * @param {string} piattoId - ID del piatto venduto
     * @param {number} quantita - Quantità venduta
     * @param {number} prezzoVendita - Prezzo al momento della vendita
     * @param {number} costoAlMomento - Costo degli ingredienti al momento
     * @param {Date} dataVendita - Data e ora della vendita
     */
    constructor(id, piattoId, quantita, prezzoVendita, costoAlMomento, dataVendita) {
        this.id = id || this.generaId();
        this.piattoId = piattoId;
        this.quantita = parseInt(quantita) || 1;
        this.prezzoVendita = parseFloat(prezzoVendita) || 0;
        this.costoAlMomento = parseFloat(costoAlMomento) || 0;
        this.dataVendita = dataVendita || new Date();
    }

    /**
     * Genera un ID univoco
     * @returns {string}
     */
    generaId() {
        return 'VEN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Calcola il ricavo totale della vendita
     * @returns {number}
     */
    calcolaRicavo() {
        return this.prezzoVendita * this.quantita;
    }

    /**
     * Calcola il costo totale della vendita
     * @returns {number}
     */
    calcolaCosto() {
        return this.costoAlMomento * this.quantita;
    }

    /**
     * Calcola il margine della vendita
     * @returns {number}
     */
    calcolaMargine() {
        return this.calcolaRicavo() - this.calcolaCosto();
    }

    /**
     * Formatta la data in formato italiano
     * @returns {string}
     */
    getDataFormattata() {
        return new Intl.DateTimeFormat('it-IT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(this.dataVendita);
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VenditaEntity;
}
