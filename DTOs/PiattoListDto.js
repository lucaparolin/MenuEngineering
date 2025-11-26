/**
 * PiattoListDto - DTO per la visualizzazione in lista dei piatti
 * Include dati calcolati per performance e analisi
 */
class PiattoListDto {
    constructor(entity = null, percentualeCostiFissi = 30) {
        if (entity) {
            this.id = entity.id;
            this.nome = entity.nome;
            this.categoria = entity.categoria;
            this.prezzoVendita = entity.prezzoVendita;
            this.prezzoFormattato = entity.getPrezzoFormattato();
            this.costoTotale = entity.calcolaCostoIngedienti(percentualeCostiFissi);
            this.costoFormattato = entity.getCostoFormattato(percentualeCostiFissi);
            this.margine = entity.calcolaMargineProfitto(percentualeCostiFissi);
            this.margineFormattato = this.formattaValuta(this.margine);
            this.percentualeMargine = entity.calcolaPercentualeMargin(percentualeCostiFissi);
            this.foodCostPercentage = entity.calcolaFoodCostPercentage(percentualeCostiFissi);
            this.disponibile = entity.disponibile;
            this.venditeGiornaliere = entity.venditeGiornaliere;
            this.venditeSettimanali = entity.venditeSettimanali;
            this.numeroIngredienti = entity.ingredienti.length;
            this.tempoPreparazione = entity.tempoPreparazione;
        }
    }

    /**
     * Formatta un valore come valuta italiana
     * @param {number} valore
     * @returns {string}
     */
    formattaValuta(valore) {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(valore);
    }

    /**
     * Converte da Entity a ListDto
     * @param {PiattoEntity} entity
     * @param {number} percentualeCostiFissi
     * @returns {PiattoListDto}
     */
    static fromEntity(entity, percentualeCostiFissi = 30) {
        return new PiattoListDto(entity, percentualeCostiFissi);
    }

    /**
     * Restituisce la classe CSS per il colore del margine
     * @returns {string}
     */
    getClasseMargine() {
        if (this.percentualeMargine >= 70) return 'margine-ottimo';
        if (this.percentualeMargine >= 50) return 'margine-buono';
        if (this.percentualeMargine >= 30) return 'margine-sufficiente';
        return 'margine-critico';
    }

    /**
     * Restituisce l'icona per la classificazione BCG
     * @param {string} classificazione
     * @returns {string}
     */
    static getIconaBCG(classificazione) {
        const icone = {
            'star': '⭐',
            'puzzle': '🧩',
            'plow_horse': '🐴',
            'dog': '🐕'
        };
        return icone[classificazione] || '❓';
    }

    /**
     * Restituisce la descrizione della classificazione BCG
     * @param {string} classificazione
     * @returns {string}
     */
    static getDescrizioneBCG(classificazione) {
        const descrizioni = {
            'star': 'Star - Alta popolarità, alto margine. Piatto eccellente!',
            'puzzle': 'Puzzle - Bassa popolarità, alto margine. Promuovere di più!',
            'plow_horse': 'Cavallo da traino - Alta popolarità, basso margine. Ottimizzare costi!',
            'dog': 'Cane - Bassa popolarità, basso margine. Valutare rimozione.'
        };
        return descrizioni[classificazione] || 'Classificazione non disponibile';
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PiattoListDto;
}
