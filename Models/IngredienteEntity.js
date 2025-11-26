/**
 * IngredienteEntity - Entità per rappresentare un ingrediente
 * Gestisce i dati base di un ingrediente con costo al kg/litro
 */
class IngredienteEntity {
    /**
     * @param {string} id - Identificativo univoco
     * @param {string} nome - Nome dell'ingrediente
     * @param {number} costoPerUnita - Costo per kg o litro
     * @param {string} unitaMisura - 'kg' o 'l' (litro)
     * @param {string} categoria - Categoria (verdure, carni, latticini, ecc.)
     * @param {string} fornitore - Nome del fornitore
     * @param {Date} dataAggiornamento - Data ultimo aggiornamento prezzo
     */
    constructor(id, nome, costoPerUnita, unitaMisura, categoria, fornitore, dataAggiornamento) {
        this.id = id || this.generaId();
        this.nome = nome;
        this.costoPerUnita = parseFloat(costoPerUnita) || 0;
        this.unitaMisura = unitaMisura || 'kg';
        this.categoria = categoria || 'Altro';
        this.fornitore = fornitore || '';
        this.dataAggiornamento = dataAggiornamento || new Date();
    }

    /**
     * Genera un ID univoco
     * @returns {string}
     */
    generaId() {
        return 'ING_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Calcola il costo per una quantità specifica
     * @param {number} quantita - Quantità in kg o litri
     * @returns {number} - Costo totale
     */
    calcolaCosto(quantita) {
        return this.costoPerUnita * quantita;
    }

    /**
     * Formatta il costo in formato italiano
     * @returns {string}
     */
    getCostoFormattato() {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(this.costoPerUnita);
    }

    /**
     * Restituisce una copia dell'oggetto
     * @returns {IngredienteEntity}
     */
    clone() {
        return new IngredienteEntity(
            this.id,
            this.nome,
            this.costoPerUnita,
            this.unitaMisura,
            this.categoria,
            this.fornitore,
            this.dataAggiornamento
        );
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IngredienteEntity;
}
