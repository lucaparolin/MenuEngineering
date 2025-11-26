/**
 * MenuEngineeringService - Servizio per l'analisi del menu engineering
 * Implementa la matrice BCG e le analisi di redditività
 */
class MenuEngineeringService {
    constructor(piattoRepository, venditaRepository) {
        this.piattoRepo = piattoRepository;
        this.venditaRepo = venditaRepository;
        this.percentualeCostiFissi = 30;
    }

    /**
     * Imposta la percentuale di costi fissi
     * @param {number} percentuale
     */
    setPercentualeCostiFissi(percentuale) {
        this.percentualeCostiFissi = percentuale;
    }

    /**
     * Calcola le medie per la classificazione BCG
     * @returns {{mediaVendite: number, mediaMargine: number}}
     */
    calcolaMediaPerBCG() {
        const piatti = this.piattoRepo.getAll();
        if (piatti.length === 0) return { mediaVendite: 0, mediaMargine: 0 };

        let totaleVendite = 0;
        let totaleMargine = 0;

        piatti.forEach(p => {
            totaleVendite += p.venditeSettimanali;
            totaleMargine += p.calcolaMargineProfitto(this.percentualeCostiFissi);
        });

        return {
            mediaVendite: totaleVendite / piatti.length,
            mediaMargine: totaleMargine / piatti.length
        };
    }

    /**
     * Classifica tutti i piatti secondo la matrice BCG
     * @returns {Object} - Oggetto con le 4 categorie
     */
    classificaPiattiBCG() {
        const piatti = this.piattoRepo.getAll();
        const medie = this.calcolaMediaPerBCG();

        const classificazione = {
            star: [],      // Alta pop, alto margine
            puzzle: [],    // Bassa pop, alto margine
            plow_horse: [],// Alta pop, basso margine
            dog: []        // Bassa pop, basso margine
        };

        piatti.forEach(piatto => {
            const categoria = piatto.classificaBCG(
                medie.mediaVendite,
                medie.mediaMargine,
                this.percentualeCostiFissi
            );
            classificazione[categoria].push({
                piatto,
                margine: piatto.calcolaMargineProfitto(this.percentualeCostiFissi),
                vendite: piatto.venditeSettimanali
            });
        });

        return classificazione;
    }

    /**
     * Genera suggerimenti basati sulla classificazione BCG
     * @returns {Array<Object>}
     */
    generaSuggerimenti() {
        const classificazione = this.classificaPiattiBCG();
        const suggerimenti = [];

        // Suggerimenti per Puzzle (bassa pop, alto margine)
        classificazione.puzzle.forEach(item => {
            suggerimenti.push({
                tipo: 'promozione',
                piatto: item.piatto,
                messaggio: `Promuovere "${item.piatto.nome}": alto margine ma vendite basse. Potrebbe beneficiare di una posizione migliore nel menu o promozioni.`,
                priorita: 'alta',
                icona: '🧩'
            });
        });

        // Suggerimenti per Plow Horse (alta pop, basso margine)
        classificazione.plow_horse.forEach(item => {
            suggerimenti.push({
                tipo: 'ottimizzazione',
                piatto: item.piatto,
                messaggio: `Ottimizzare "${item.piatto.nome}": vende bene ma margine basso. Valutare aumento prezzo o riduzione costi ingredienti.`,
                priorita: 'media',
                icona: '🐴'
            });
        });

        // Suggerimenti per Dog (bassa pop, basso margine)
        classificazione.dog.forEach(item => {
            suggerimenti.push({
                tipo: 'rimozione',
                piatto: item.piatto,
                messaggio: `Valutare rimozione "${item.piatto.nome}": basse vendite e basso margine. Considerare sostituzione con nuovo piatto.`,
                priorita: 'bassa',
                icona: '🐕'
            });
        });

        // Suggerimenti per Star (mantieni così)
        classificazione.star.forEach(item => {
            suggerimenti.push({
                tipo: 'mantenimento',
                piatto: item.piatto,
                messaggio: `"${item.piatto.nome}" è una Star! Mantenere la qualità e la posizione nel menu.`,
                priorita: 'info',
                icona: '⭐'
            });
        });

        // Ordina per priorità
        const ordinePriorita = { 'alta': 1, 'media': 2, 'bassa': 3, 'info': 4 };
        suggerimenti.sort((a, b) => ordinePriorita[a.priorita] - ordinePriorita[b.priorita]);

        return suggerimenti;
    }

    /**
     * Calcola statistiche globali del menu
     * @returns {Object}
     */
    calcolaStatisticheMenu() {
        const piatti = this.piattoRepo.getAll();
        const classificazione = this.classificaPiattiBCG();

        let ricavoTotaleGiornaliero = 0;
        let costoTotaleGiornaliero = 0;
        let ricavoTotaleSettimanale = 0;
        let costoTotaleSettimanale = 0;

        piatti.forEach(p => {
            const costo = p.calcolaCostoIngedienti(this.percentualeCostiFissi);
            ricavoTotaleGiornaliero += p.prezzoVendita * p.venditeGiornaliere;
            costoTotaleGiornaliero += costo * p.venditeGiornaliere;
            ricavoTotaleSettimanale += p.prezzoVendita * p.venditeSettimanali;
            costoTotaleSettimanale += costo * p.venditeSettimanali;
        });

        const margineGiornaliero = ricavoTotaleGiornaliero - costoTotaleGiornaliero;
        const margineSettimanale = ricavoTotaleSettimanale - costoTotaleSettimanale;

        return {
            numeroPiatti: piatti.length,
            ricavoGiornaliero: ricavoTotaleGiornaliero,
            costoGiornaliero: costoTotaleGiornaliero,
            margineGiornaliero: margineGiornaliero,
            ricavoSettimanale: ricavoTotaleSettimanale,
            costoSettimanale: costoTotaleSettimanale,
            margineSettimanale: margineSettimanale,
            foodCostMedio: ricavoTotaleSettimanale > 0
                ? (costoTotaleSettimanale / ricavoTotaleSettimanale) * 100 : 0,
            distribuzioneCategorie: {
                star: classificazione.star.length,
                puzzle: classificazione.puzzle.length,
                plow_horse: classificazione.plow_horse.length,
                dog: classificazione.dog.length
            }
        };
    }

    /**
     * Identifica i piatti con performance in calo
     * @param {number} sogliaPercentuale - Soglia di calo (default -10%)
     * @returns {Array}
     */
    identificaPiattiInCalo(sogliaPercentuale = -10) {
        const piatti = this.piattoRepo.getAll();
        const inCalo = [];

        piatti.forEach(p => {
            // Simula confronto con periodo precedente
            // In produzione, questo confronterebbe dati storici reali
            const variazione = (Math.random() - 0.5) * 40; // -20% a +20%
            if (variazione < sogliaPercentuale) {
                inCalo.push({
                    piatto: p,
                    variazione: variazione.toFixed(1),
                    suggerimento: variazione < -15
                        ? 'Valutare rimozione o rivisitazione del piatto'
                        : 'Monitorare attentamente le vendite'
                });
            }
        });

        return inCalo;
    }

    /**
     * Calcola prezzo suggerito basato su margine obiettivo
     * @param {PiattoEntity} piatto
     * @param {number} margineObiettivoPercentuale
     * @returns {number}
     */
    calcolaPrezzoSuggerito(piatto, margineObiettivoPercentuale = 65) {
        const costo = piatto.calcolaCostoIngedienti(this.percentualeCostiFissi);
        // Prezzo = Costo / (1 - Margine%)
        return costo / (1 - margineObiettivoPercentuale / 100);
    }

    /**
     * Formatta valuta in formato italiano
     * @param {number} valore
     * @returns {string}
     */
    formattaValuta(valore) {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(valore);
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuEngineeringService;
}
