/**
 * SimulazioneDto - DTO per la simulazione di scenari
 * Permette di simulare modifiche di prezzo e vedere l'impatto
 */
class SimulazioneDto {
    constructor() {
        this.piattoId = '';
        this.nomePiatto = '';
        this.prezzoAttuale = 0;
        this.prezzoSimulato = 0;
        this.costoAttuale = 0;
        this.costoSimulato = 0;
        this.margineAttuale = 0;
        this.margineSimulato = 0;
        this.percentualeMarginAttuale = 0;
        this.percentualeMarginSimulato = 0;
        this.variazionePrezzo = 0;
        this.variazioneMargine = 0;
        this.impattoPrevisto = '';
    }

    /**
     * Crea una simulazione da un piatto
     * @param {PiattoEntity} piatto
     * @param {number} percentualeCostiFissi
     * @returns {SimulazioneDto}
     */
    static fromPiatto(piatto, percentualeCostiFissi = 30) {
        const dto = new SimulazioneDto();
        dto.piattoId = piatto.id;
        dto.nomePiatto = piatto.nome;
        dto.prezzoAttuale = piatto.prezzoVendita;
        dto.prezzoSimulato = piatto.prezzoVendita;
        dto.costoAttuale = piatto.calcolaCostoIngedienti(percentualeCostiFissi);
        dto.costoSimulato = dto.costoAttuale;
        dto.margineAttuale = piatto.calcolaMargineProfitto(percentualeCostiFissi);
        dto.margineSimulato = dto.margineAttuale;
        dto.percentualeMarginAttuale = piatto.calcolaPercentualeMargin(percentualeCostiFissi);
        dto.percentualeMarginSimulato = dto.percentualeMarginAttuale;
        return dto;
    }

    /**
     * Simula una variazione di prezzo
     * @param {number} nuovoPrezzo
     */
    simulaPrezzo(nuovoPrezzo) {
        this.prezzoSimulato = nuovoPrezzo;
        this.margineSimulato = this.prezzoSimulato - this.costoSimulato;
        this.percentualeMarginSimulato = this.prezzoSimulato > 0
            ? (this.margineSimulato / this.prezzoSimulato) * 100
            : 0;
        this.variazionePrezzo = ((nuovoPrezzo - this.prezzoAttuale) / this.prezzoAttuale) * 100;
        this.variazioneMargine = this.margineAttuale > 0
            ? ((this.margineSimulato - this.margineAttuale) / this.margineAttuale) * 100
            : 0;
        this.calcolaImpatto();
    }

    /**
     * Simula una variazione dei costi
     * @param {number} nuovoCosto
     */
    simulaCosto(nuovoCosto) {
        this.costoSimulato = nuovoCosto;
        this.margineSimulato = this.prezzoSimulato - this.costoSimulato;
        this.percentualeMarginSimulato = this.prezzoSimulato > 0
            ? (this.margineSimulato / this.prezzoSimulato) * 100
            : 0;
        this.variazioneMargine = this.margineAttuale > 0
            ? ((this.margineSimulato - this.margineAttuale) / this.margineAttuale) * 100
            : 0;
        this.calcolaImpatto();
    }

    /**
     * Calcola l'impatto previsto della simulazione
     */
    calcolaImpatto() {
        if (this.variazioneMargine > 20) {
            this.impattoPrevisto = 'Impatto molto positivo sul margine';
        } else if (this.variazioneMargine > 0) {
            this.impattoPrevisto = 'Impatto positivo sul margine';
        } else if (this.variazioneMargine > -10) {
            this.impattoPrevisto = 'Impatto lieve sul margine';
        } else {
            this.impattoPrevisto = 'Attenzione: impatto negativo significativo';
        }

        if (this.variazionePrezzo > 15) {
            this.impattoPrevisto += '. Rischio perdita clienti per aumento elevato.';
        }
    }

    /**
     * Formatta i risultati della simulazione
     * @returns {Object}
     */
    getResultFormattato() {
        const formatta = (val) => new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(val);

        return {
            prezzoAttuale: formatta(this.prezzoAttuale),
            prezzoSimulato: formatta(this.prezzoSimulato),
            costoAttuale: formatta(this.costoAttuale),
            costoSimulato: formatta(this.costoSimulato),
            margineAttuale: formatta(this.margineAttuale),
            margineSimulato: formatta(this.margineSimulato),
            percentualeMarginAttuale: this.percentualeMarginAttuale.toFixed(1) + '%',
            percentualeMarginSimulato: this.percentualeMarginSimulato.toFixed(1) + '%',
            variazionePrezzo: (this.variazionePrezzo >= 0 ? '+' : '') + this.variazionePrezzo.toFixed(1) + '%',
            variazioneMargine: (this.variazioneMargine >= 0 ? '+' : '') + this.variazioneMargine.toFixed(1) + '%',
            impattoPrevisto: this.impattoPrevisto
        };
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimulazioneDto;
}
