/**
 * PiattoEntity - Entità per rappresentare un piatto del menu
 * Contiene gli ingredienti e calcola automaticamente i costi
 */
class PiattoEntity {
    /**
     * @param {string} id - Identificativo univoco
     * @param {string} nome - Nome del piatto
     * @param {string} descrizione - Descrizione del piatto
     * @param {Array} ingredienti - Array di {ingredienteId, quantita}
     * @param {number} prezzoVendita - Prezzo di vendita al cliente
     * @param {string} categoria - Antipasti, Primi, Secondi, Dolci, ecc.
     * @param {boolean} disponibile - Se il piatto è disponibile
     * @param {number} tempoPreparazione - Tempo in minuti
     * @param {string} immagineUrl - URL dell'immagine del piatto
     */
    constructor(id, nome, descrizione, ingredienti, prezzoVendita, categoria, disponibile, tempoPreparazione, immagineUrl) {
        this.id = id || this.generaId();
        this.nome = nome || '';
        this.descrizione = descrizione || '';
        this.ingredienti = ingredienti || []; // [{ingredienteId, quantita, nomeIngrediente, costoUnitario}]
        this.prezzoVendita = parseFloat(prezzoVendita) || 0;
        this.categoria = categoria || 'Altro';
        this.disponibile = disponibile !== false;
        this.tempoPreparazione = parseInt(tempoPreparazione) || 0;
        this.immagineUrl = immagineUrl || '';
        this.dataCreazione = new Date();
        this.venditeGiornaliere = 0;
        this.venditeSettimanali = 0;
        this.venduteTotale = 0;
    }

    /**
     * Genera un ID univoco
     * @returns {string}
     */
    generaId() {
        return 'PIA_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Calcola il costo totale degli ingredienti
     * @param {number} percentualeCostiFissi - Percentuale costi fissi (default 30%)
     * @returns {number}
     */
    calcolaCostoIngedienti(percentualeCostiFissi = 30) {
        let costoBase = 0;
        this.ingredienti.forEach(ing => {
            costoBase += (ing.costoUnitario || 0) * (ing.quantita || 0);
        });
        // Aggiungi percentuale costi fissi
        const costiFissi = costoBase * (percentualeCostiFissi / 100);
        return costoBase + costiFissi;
    }

    /**
     * Calcola il costo base senza costi fissi
     * @returns {number}
     */
    calcolaCostoBase() {
        let costoBase = 0;
        this.ingredienti.forEach(ing => {
            costoBase += (ing.costoUnitario || 0) * (ing.quantita || 0);
        });
        return costoBase;
    }

    /**
     * Calcola il margine di profitto
     * @param {number} percentualeCostiFissi
     * @returns {number}
     */
    calcolaMargineProfitto(percentualeCostiFissi = 30) {
        const costo = this.calcolaCostoIngedienti(percentualeCostiFissi);
        return this.prezzoVendita - costo;
    }

    /**
     * Calcola la percentuale di margine
     * @param {number} percentualeCostiFissi
     * @returns {number}
     */
    calcolaPercentualeMargin(percentualeCostiFissi = 30) {
        if (this.prezzoVendita === 0) return 0;
        const margine = this.calcolaMargineProfitto(percentualeCostiFissi);
        return (margine / this.prezzoVendita) * 100;
    }

    /**
     * Calcola il food cost percentage
     * @param {number} percentualeCostiFissi
     * @returns {number}
     */
    calcolaFoodCostPercentage(percentualeCostiFissi = 30) {
        if (this.prezzoVendita === 0) return 0;
        const costo = this.calcolaCostoIngedienti(percentualeCostiFissi);
        return (costo / this.prezzoVendita) * 100;
    }

    /**
     * Formatta il prezzo in formato italiano
     * @returns {string}
     */
    getPrezzoFormattato() {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(this.prezzoVendita);
    }

    /**
     * Formatta il costo in formato italiano
     * @param {number} percentualeCostiFissi
     * @returns {string}
     */
    getCostoFormattato(percentualeCostiFissi = 30) {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(this.calcolaCostoIngedienti(percentualeCostiFissi));
    }

    /**
     * Aggiunge un ingrediente al piatto
     * @param {string} ingredienteId
     * @param {number} quantita - in kg o litri
     * @param {string} nomeIngrediente
     * @param {number} costoUnitario
     */
    aggiungiIngrediente(ingredienteId, quantita, nomeIngrediente, costoUnitario) {
        this.ingredienti.push({
            ingredienteId,
            quantita: parseFloat(quantita),
            nomeIngrediente,
            costoUnitario: parseFloat(costoUnitario)
        });
    }

    /**
     * Rimuove un ingrediente dal piatto
     * @param {string} ingredienteId
     */
    rimuoviIngrediente(ingredienteId) {
        this.ingredienti = this.ingredienti.filter(i => i.ingredienteId !== ingredienteId);
    }

    /**
     * Classifica il piatto secondo la matrice BCG del menu engineering
     * @param {number} mediaVendite - Media vendite di tutti i piatti
     * @param {number} mediaMargine - Media margine di tutti i piatti
     * @param {number} percentualeCostiFissi
     * @returns {string} - 'star', 'puzzle', 'plow_horse', 'dog'
     */
    classificaBCG(mediaVendite, mediaMargine, percentualeCostiFissi = 30) {
        const margine = this.calcolaMargineProfitto(percentualeCostiFissi);
        const vendite = this.venditeSettimanali;

        if (vendite >= mediaVendite && margine >= mediaMargine) {
            return 'star'; // Alta popolarità, alto margine
        } else if (vendite < mediaVendite && margine >= mediaMargine) {
            return 'puzzle'; // Bassa popolarità, alto margine
        } else if (vendite >= mediaVendite && margine < mediaMargine) {
            return 'plow_horse'; // Alta popolarità, basso margine
        } else {
            return 'dog'; // Bassa popolarità, basso margine
        }
    }

    /**
     * Restituisce una copia dell'oggetto
     * @returns {PiattoEntity}
     */
    clone() {
        const cloned = new PiattoEntity(
            this.id,
            this.nome,
            this.descrizione,
            JSON.parse(JSON.stringify(this.ingredienti)),
            this.prezzoVendita,
            this.categoria,
            this.disponibile,
            this.tempoPreparazione,
            this.immagineUrl
        );
        cloned.venditeGiornaliere = this.venditeGiornaliere;
        cloned.venditeSettimanali = this.venditeSettimanali;
        cloned.venduteTotale = this.venduteTotale;
        return cloned;
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PiattoEntity;
}
