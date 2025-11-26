/**
 * SimulazioneService - Servizio per simulazioni di scenario "E se..."
 * Permette di simulare variazioni di prezzo e costi
 */
class SimulazioneService {
    constructor(piattoRepository, ingredienteRepository) {
        this.piattoRepo = piattoRepository;
        this.ingredienteRepo = ingredienteRepository;
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
     * Simula variazione prezzo di un piatto
     * @param {string} piattoId
     * @param {number} nuovoPrezzo
     * @returns {SimulazioneDto}
     */
    simulaVariazionePrezzo(piattoId, nuovoPrezzo) {
        const piatto = this.piattoRepo.getById(piattoId);
        if (!piatto) return null;

        // Crea un'entità per avere accesso ai metodi
        const piattoEntity = new PiattoEntity(
            piatto.id,
            piatto.nome,
            piatto.descrizione,
            piatto.ingredienti,
            piatto.prezzoVendita,
            piatto.categoria,
            piatto.disponibile,
            piatto.tempoPreparazione,
            piatto.immagineUrl
        );

        const simulazione = SimulazioneDto.fromPiatto(piattoEntity, this.percentualeCostiFissi);
        simulazione.simulaPrezzo(nuovoPrezzo);

        return simulazione;
    }

    /**
     * Simula variazione costo di un ingrediente e impatto sui piatti
     * @param {string} ingredienteId
     * @param {number} nuovoCosto
     * @returns {Array<Object>}
     */
    simulaVariazioneCostoIngrediente(ingredienteId, nuovoCosto) {
        const ingrediente = this.ingredienteRepo.getById(ingredienteId);
        if (!ingrediente) return [];

        const piatti = this.piattoRepo.getAll();
        const impatti = [];
        const vecchioCosto = ingrediente.costoPerUnita;

        piatti.forEach(piatto => {
            // Verifica se il piatto contiene l'ingrediente
            const ingNelPiatto = piatto.ingredienti.find(i => i.ingredienteId === ingredienteId);
            if (ingNelPiatto) {
                const piattoEntity = new PiattoEntity(
                    piatto.id,
                    piatto.nome,
                    piatto.descrizione,
                    piatto.ingredienti,
                    piatto.prezzoVendita,
                    piatto.categoria,
                    piatto.disponibile,
                    piatto.tempoPreparazione,
                    piatto.immagineUrl
                );

                // Calcola costo attuale
                const costoAttuale = piattoEntity.calcolaCostoIngedienti(this.percentualeCostiFissi);
                const margineAttuale = piattoEntity.calcolaMargineProfitto(this.percentualeCostiFissi);

                // Simula nuovo costo
                const differenzaCosto = (nuovoCosto - vecchioCosto) * ingNelPiatto.quantita;
                const costiFissiDiff = differenzaCosto * (this.percentualeCostiFissi / 100);
                const nuovoCostoTotale = costoAttuale + differenzaCosto + costiFissiDiff;
                const nuovoMargine = piattoEntity.prezzoVendita - nuovoCostoTotale;

                impatti.push({
                    piatto: piattoEntity,
                    ingrediente: ingrediente.nome,
                    quantitaUsata: ingNelPiatto.quantita,
                    costoAttuale,
                    nuovoCosto: nuovoCostoTotale,
                    margineAttuale,
                    nuovoMargine,
                    variazioneMargine: nuovoMargine - margineAttuale,
                    percentualeVariazione: ((nuovoMargine - margineAttuale) / margineAttuale) * 100
                });
            }
        });

        return impatti;
    }

    /**
     * Simula aumento percentuale prezzi su tutti i piatti
     * @param {number} percentualeAumento
     * @returns {Object}
     */
    simulaAumentoGeneralePrezzo(percentualeAumento) {
        const piatti = this.piattoRepo.getAll();
        const risultati = [];
        let ricavoAttualeStimato = 0;
        let ricavoNuovoStimato = 0;
        let margineAttualeStimato = 0;
        let margineNuovoStimato = 0;

        piatti.forEach(piatto => {
            const piattoEntity = new PiattoEntity(
                piatto.id,
                piatto.nome,
                piatto.descrizione,
                piatto.ingredienti,
                piatto.prezzoVendita,
                piatto.categoria,
                piatto.disponibile,
                piatto.tempoPreparazione,
                piatto.immagineUrl
            );
            piattoEntity.venditeSettimanali = piatto.venditeSettimanali;

            const prezzoAttuale = piattoEntity.prezzoVendita;
            const nuovoPrezzo = prezzoAttuale * (1 + percentualeAumento / 100);
            const costo = piattoEntity.calcolaCostoIngedienti(this.percentualeCostiFissi);
            const margineAttuale = prezzoAttuale - costo;
            const nuovoMargine = nuovoPrezzo - costo;

            // Stima impatto sulle vendite (elasticità semplificata)
            // Aumento 10% prezzo = -5% vendite circa
            const elasticita = -0.5;
            const variazionePrevVendite = percentualeAumento * elasticita;
            const nuoveVenditeStimate = piattoEntity.venditeSettimanali * (1 + variazionePrevVendite / 100);

            ricavoAttualeStimato += prezzoAttuale * piattoEntity.venditeSettimanali;
            ricavoNuovoStimato += nuovoPrezzo * nuoveVenditeStimate;
            margineAttualeStimato += margineAttuale * piattoEntity.venditeSettimanali;
            margineNuovoStimato += nuovoMargine * nuoveVenditeStimate;

            risultati.push({
                piatto: piattoEntity,
                prezzoAttuale,
                nuovoPrezzo,
                margineAttuale,
                nuovoMargine,
                venditePrev: piattoEntity.venditeSettimanali,
                venditeStimate: Math.round(nuoveVenditeStimate)
            });
        });

        return {
            dettaglio: risultati,
            riepilogo: {
                ricavoAttualeStimato,
                ricavoNuovoStimato,
                variazioneRicavo: ((ricavoNuovoStimato - ricavoAttualeStimato) / ricavoAttualeStimato) * 100,
                margineAttualeStimato,
                margineNuovoStimato,
                variazioneMargine: ((margineNuovoStimato - margineAttualeStimato) / margineAttualeStimato) * 100
            }
        };
    }

    /**
     * Simula aggiunta di un nuovo piatto al menu
     * @param {PiattoEntity} nuovoPiatto
     * @param {number} venditeStimateSettimanali
     * @returns {Object}
     */
    simulaNuovoPiatto(nuovoPiatto, venditeStimateSettimanali) {
        const costo = nuovoPiatto.calcolaCostoIngedienti(this.percentualeCostiFissi);
        const margineUnitario = nuovoPiatto.prezzoVendita - costo;
        const margineSettimanale = margineUnitario * venditeStimateSettimanali;
        const ricavoSettimanale = nuovoPiatto.prezzoVendita * venditeStimateSettimanali;
        const foodCost = (costo / nuovoPiatto.prezzoVendita) * 100;

        return {
            piatto: nuovoPiatto,
            costoUnitario: costo,
            margineUnitario,
            foodCostPercentage: foodCost,
            venditeStimate: venditeStimateSettimanali,
            ricavoSettimanaleStimato: ricavoSettimanale,
            margineSettimanaleStimato: margineSettimanale,
            valutazione: this.valutaNuovoPiatto(foodCost, margineUnitario)
        };
    }

    /**
     * Valuta la redditività di un nuovo piatto
     * @param {number} foodCost
     * @param {number} margine
     * @returns {Object}
     */
    valutaNuovoPiatto(foodCost, margine) {
        let punteggio = 0;
        let messaggi = [];

        if (foodCost <= 25) {
            punteggio += 3;
            messaggi.push('Eccellente food cost sotto il 25%');
        } else if (foodCost <= 30) {
            punteggio += 2;
            messaggi.push('Buon food cost tra 25-30%');
        } else if (foodCost <= 35) {
            punteggio += 1;
            messaggi.push('Food cost accettabile ma da monitorare');
        } else {
            messaggi.push('Attenzione: food cost elevato oltre 35%');
        }

        if (margine >= 10) {
            punteggio += 2;
            messaggi.push('Ottimo margine unitario');
        } else if (margine >= 5) {
            punteggio += 1;
            messaggi.push('Margine unitario nella media');
        } else {
            messaggi.push('Margine unitario basso');
        }

        const giudizio = punteggio >= 4 ? 'Ottimo' :
                        punteggio >= 2 ? 'Buono' :
                        punteggio >= 1 ? 'Da valutare' : 'Non consigliato';

        return { punteggio, giudizio, messaggi };
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
    module.exports = SimulazioneService;
}
