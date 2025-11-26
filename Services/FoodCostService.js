/**
 * FoodCostService - Servizio per il calcolo del food cost in tempo reale
 * Gestisce tutti i calcoli relativi ai costi degli ingredienti e dei piatti
 */
class FoodCostService {
    constructor(ingredienteRepository, piattoRepository) {
        this.ingredienteRepo = ingredienteRepository;
        this.piattoRepo = piattoRepository;
        this.percentualeCostiFissi = 30;
    }

    /**
     * Imposta la percentuale di costi fissi
     * @param {number} percentuale
     */
    setPercentualeCostiFissi(percentuale) {
        this.percentualeCostiFissi = percentuale;
        localStorage.setItem('menuOptimizer_costiFissi', percentuale.toString());
    }

    /**
     * Carica la percentuale di costi fissi dal localStorage
     */
    caricaPercentualeCostiFissi() {
        const stored = localStorage.getItem('menuOptimizer_costiFissi');
        if (stored) {
            this.percentualeCostiFissi = parseFloat(stored);
        }
        return this.percentualeCostiFissi;
    }

    /**
     * Calcola il costo di un piatto in tempo reale
     * @param {Array} ingredienti - Array di {ingredienteId, quantita}
     * @returns {Object}
     */
    calcolaCostoPiatto(ingredienti) {
        let costoBase = 0;
        const dettaglio = [];

        ingredienti.forEach(ing => {
            const ingrediente = this.ingredienteRepo.getById(ing.ingredienteId);
            if (ingrediente) {
                const costoIngrediente = ingrediente.costoPerUnita * ing.quantita;
                costoBase += costoIngrediente;
                dettaglio.push({
                    nome: ingrediente.nome,
                    quantita: ing.quantita,
                    unitaMisura: ingrediente.unitaMisura,
                    costoUnitario: ingrediente.costoPerUnita,
                    costoTotale: costoIngrediente
                });
            }
        });

        const costiFissi = costoBase * (this.percentualeCostiFissi / 100);
        const costoTotale = costoBase + costiFissi;

        return {
            costoBase,
            costiFissi,
            costoTotale,
            dettaglio,
            percentualeCostiFissi: this.percentualeCostiFissi
        };
    }

    /**
     * Suggerisce un prezzo di vendita basato sui prezzi del menu
     * @param {number} costoTotale
     * @param {string} categoria - Categoria del piatto
     * @returns {Object}
     */
    suggerisciPrezzo(costoTotale, categoria = '') {
        const piatti = this.piattoRepo.getAll();

        // Filtra per categoria se specificata
        const piattiCategoria = categoria
            ? piatti.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase())
            : piatti;

        if (piattiCategoria.length === 0) {
            // Se non ci sono piatti nella categoria, usa margine standard 65%
            const prezzoSuggerito = costoTotale / (1 - 0.65);
            return {
                prezzoMinimo: costoTotale / (1 - 0.50),  // Margine 50%
                prezzoSuggerito: prezzoSuggerito,        // Margine 65%
                prezzoMassimo: costoTotale / (1 - 0.75), // Margine 75%
                margineMinimo: 50,
                margineSuggerito: 65,
                margineMassimo: 75,
                basatoSu: 'margine_standard'
            };
        }

        // Calcola statistiche prezzi della categoria
        const prezzi = piattiCategoria.map(p => p.prezzoVendita);
        const prezzoMedio = prezzi.reduce((a, b) => a + b, 0) / prezzi.length;
        const prezzoMin = Math.min(...prezzi);
        const prezzoMax = Math.max(...prezzi);

        // Calcola food cost medio della categoria
        const foodCosts = piattiCategoria.map(p =>
            p.calcolaFoodCostPercentage(this.percentualeCostiFissi)
        );
        const foodCostMedio = foodCosts.reduce((a, b) => a + b, 0) / foodCosts.length;

        // Suggerisci prezzo basato sul food cost medio della categoria
        const prezzoSuggerito = costoTotale / (foodCostMedio / 100);

        return {
            prezzoMinimo: Math.max(prezzoMin * 0.9, costoTotale * 1.5),
            prezzoSuggerito: Math.max(prezzoSuggerito, prezzoMedio * 0.9),
            prezzoMassimo: Math.min(prezzoMax * 1.1, costoTotale * 4),
            prezzoMedioCategoria: prezzoMedio,
            foodCostMedioCategoria: foodCostMedio,
            basatoSu: 'analisi_menu',
            numeroPiattiAnalizzati: piattiCategoria.length
        };
    }

    /**
     * Calcola metriche di food cost per tutti i piatti
     * @returns {Array}
     */
    calcolaMetrichePiatti() {
        const piatti = this.piattoRepo.getAll();

        return piatti.map(piatto => {
            const costo = piatto.calcolaCostoIngedienti(this.percentualeCostiFissi);
            const margine = piatto.calcolaMargineProfitto(this.percentualeCostiFissi);
            const foodCost = piatto.calcolaFoodCostPercentage(this.percentualeCostiFissi);

            return {
                id: piatto.id,
                nome: piatto.nome,
                categoria: piatto.categoria,
                prezzoVendita: piatto.prezzoVendita,
                costoTotale: costo,
                margine: margine,
                foodCostPercentage: foodCost,
                classificazione: this.classificaFoodCost(foodCost),
                suggerimento: this.getSuggerimentoFoodCost(foodCost)
            };
        });
    }

    /**
     * Classifica il food cost
     * @param {number} foodCost
     * @returns {string}
     */
    classificaFoodCost(foodCost) {
        if (foodCost <= 25) return 'ottimo';
        if (foodCost <= 30) return 'buono';
        if (foodCost <= 35) return 'accettabile';
        if (foodCost <= 40) return 'alto';
        return 'critico';
    }

    /**
     * Genera suggerimento basato sul food cost
     * @param {number} foodCost
     * @returns {string}
     */
    getSuggerimentoFoodCost(foodCost) {
        if (foodCost <= 25) {
            return 'Eccellente! Margine ottimale.';
        } else if (foodCost <= 30) {
            return 'Buon equilibrio costi/ricavi.';
        } else if (foodCost <= 35) {
            return 'Valutare ottimizzazione ingredienti.';
        } else if (foodCost <= 40) {
            return 'Consigliato aumento prezzo o riduzione costi.';
        }
        return 'Critico! Rivedere urgentemente pricing o ingredienti.';
    }

    /**
     * Calcola l'impatto di una variazione prezzo ingrediente
     * @param {string} ingredienteId
     * @param {number} nuovoPrezzo
     * @returns {Array}
     */
    calcolaImpattoVariazionePrezzo(ingredienteId, nuovoPrezzo) {
        const ingrediente = this.ingredienteRepo.getById(ingredienteId);
        if (!ingrediente) return [];

        const vecchioPrezzo = ingrediente.costoPerUnita;
        const variazione = nuovoPrezzo - vecchioPrezzo;
        const piatti = this.piattoRepo.getAll();
        const impatti = [];

        piatti.forEach(piatto => {
            const ingNelPiatto = piatto.ingredienti.find(i =>
                i.ingredienteId === ingredienteId || i.nomeIngrediente === ingrediente.nome
            );

            if (ingNelPiatto) {
                const variazioneNetta = variazione * ingNelPiatto.quantita;
                const variazioneConFissi = variazioneNetta * (1 + this.percentualeCostiFissi / 100);

                const costoAttuale = piatto.calcolaCostoIngedienti(this.percentualeCostiFissi);
                const nuovoCosto = costoAttuale + variazioneConFissi;
                const nuovoMargine = piatto.prezzoVendita - nuovoCosto;
                const nuovoFoodCost = (nuovoCosto / piatto.prezzoVendita) * 100;

                impatti.push({
                    piatto: piatto.nome,
                    piattoId: piatto.id,
                    ingrediente: ingrediente.nome,
                    quantitaUsata: ingNelPiatto.quantita,
                    costoAttuale,
                    nuovoCosto,
                    variazioneCosto: variazioneConFissi,
                    margineAttuale: piatto.calcolaMargineProfitto(this.percentualeCostiFissi),
                    nuovoMargine,
                    foodCostAttuale: piatto.calcolaFoodCostPercentage(this.percentualeCostiFissi),
                    nuovoFoodCost
                });
            }
        });

        return impatti;
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

    /**
     * Formatta numero in formato italiano
     * @param {number} numero
     * @param {number} decimali
     * @returns {string}
     */
    formattaNumero(numero, decimali = 2) {
        return new Intl.NumberFormat('it-IT', {
            minimumFractionDigits: decimali,
            maximumFractionDigits: decimali
        }).format(numero);
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FoodCostService;
}
