/**
 * VenditaRepository - Repository per la gestione delle vendite
 * Traccia le vendite per l'analisi del menu engineering
 */
class VenditaRepository extends BaseRepository {
    constructor() {
        super('menuOptimizer_vendite');
        this.caricaDaStorage();
    }

    /**
     * Registra una nuova vendita
     * @param {string} piattoId
     * @param {number} quantita
     * @param {number} prezzoVendita
     * @param {number} costo
     * @returns {VenditaEntity}
     */
    registraVendita(piattoId, quantita, prezzoVendita, costo) {
        const vendita = new VenditaEntity(
            null,
            piattoId,
            quantita,
            prezzoVendita,
            costo,
            new Date()
        );
        this.aggiungi(vendita);
        return vendita;
    }

    /**
     * Ottiene vendite per un periodo
     * @param {Date} dataInizio
     * @param {Date} dataFine
     * @returns {Array<VenditaEntity>}
     */
    getVenditePerPeriodo(dataInizio, dataFine) {
        return this.data.filter(v => {
            const data = new Date(v.dataVendita);
            return data >= dataInizio && data <= dataFine;
        });
    }

    /**
     * Ottiene vendite di oggi
     * @returns {Array<VenditaEntity>}
     */
    getVenditeOggi() {
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);
        const domani = new Date(oggi);
        domani.setDate(domani.getDate() + 1);
        return this.getVenditePerPeriodo(oggi, domani);
    }

    /**
     * Ottiene vendite della settimana
     * @returns {Array<VenditaEntity>}
     */
    getVenditeSettimana() {
        const oggi = new Date();
        const inizioSettimana = new Date(oggi);
        inizioSettimana.setDate(oggi.getDate() - 7);
        inizioSettimana.setHours(0, 0, 0, 0);
        return this.getVenditePerPeriodo(inizioSettimana, oggi);
    }

    /**
     * Calcola statistiche vendite per piatto
     * @param {string} piattoId
     * @returns {Object}
     */
    getStatistichePiatto(piattoId) {
        const venditeOggi = this.getVenditeOggi().filter(v => v.piattoId === piattoId);
        const venditeSettimana = this.getVenditeSettimana().filter(v => v.piattoId === piattoId);

        const somma = (arr, prop) => arr.reduce((tot, v) => tot + v[prop] * v.quantita, 0);
        const contaQuantita = (arr) => arr.reduce((tot, v) => tot + v.quantita, 0);

        return {
            venditeGiornaliere: contaQuantita(venditeOggi),
            venditeSettimanali: contaQuantita(venditeSettimana),
            ricavoGiornaliero: somma(venditeOggi, 'prezzoVendita'),
            ricavoSettimanale: somma(venditeSettimana, 'prezzoVendita'),
            costoGiornaliero: somma(venditeOggi, 'costoAlMomento'),
            costoSettimanale: somma(venditeSettimana, 'costoAlMomento'),
            margineGiornaliero: somma(venditeOggi, 'prezzoVendita') - somma(venditeOggi, 'costoAlMomento'),
            margineSettimanale: somma(venditeSettimana, 'prezzoVendita') - somma(venditeSettimana, 'costoAlMomento')
        };
    }

    /**
     * Calcola statistiche globali
     * @returns {Object}
     */
    getStatisticheGlobali() {
        const venditeOggi = this.getVenditeOggi();
        const venditeSettimana = this.getVenditeSettimana();

        const somma = (arr, prop) => arr.reduce((tot, v) => tot + v[prop] * v.quantita, 0);

        return {
            venditeOggi: venditeOggi.length,
            ricavoOggi: somma(venditeOggi, 'prezzoVendita'),
            margineOggi: somma(venditeOggi, 'prezzoVendita') - somma(venditeOggi, 'costoAlMomento'),
            venditeSettimana: venditeSettimana.length,
            ricavoSettimana: somma(venditeSettimana, 'prezzoVendita'),
            margineSettimana: somma(venditeSettimana, 'prezzoVendita') - somma(venditeSettimana, 'costoAlMomento')
        };
    }

    /**
     * Genera vendite demo per test
     * @param {Array<PiattoEntity>} piatti
     * @param {number} giorniIndietro
     */
    generaVenditeDemo(piatti, giorniIndietro = 7) {
        const oggi = new Date();

        for (let g = 0; g < giorniIndietro; g++) {
            const data = new Date(oggi);
            data.setDate(data.getDate() - g);

            piatti.forEach(piatto => {
                // Numero casuale di vendite per piatto (0-15)
                const numVendite = Math.floor(Math.random() * 16);
                for (let v = 0; v < numVendite; v++) {
                    const vendita = new VenditaEntity(
                        null,
                        piatto.id,
                        1,
                        piatto.prezzoVendita,
                        piatto.calcolaCostoIngedienti ? piatto.calcolaCostoIngedienti(30) : 0,
                        data
                    );
                    this.data.push(vendita);
                }
            });
        }

        this.salvaSuStorage();
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VenditaRepository;
}
