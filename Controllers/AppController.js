/**
 * AppController - Controller principale dell'applicazione
 * Gestisce l'inizializzazione e il coordinamento tra i vari componenti
 */
class AppController {
    constructor() {
        // Repositories
        this.ingredienteRepo = new IngredienteRepository();
        this.piattoRepo = new PiattoRepository();
        this.venditaRepo = new VenditaRepository();

        // Services
        this.foodCostService = new FoodCostService(this.ingredienteRepo, this.piattoRepo);
        this.menuEngineeringService = new MenuEngineeringService(this.piattoRepo, this.venditaRepo);
        this.simulazioneService = new SimulazioneService(this.piattoRepo, this.ingredienteRepo);
        this.chatGPTService = new ChatGPTService();

        // Stato UI
        this.coloriUI = {
            primario: '#E8D5B7',    // Beige caldo
            secondario: '#F5E6CC',  // Crema
            accento: '#C4A574',     // Oro antico
            sfondo: '#FDF8F0',      // Bianco panna
            testo: '#3D3D3D'        // Grigio scuro
        };

        // Carica configurazioni salvate
        this.caricaConfigurazione();
    }

    /**
     * Inizializza l'applicazione
     */
    async inizializza() {
        try {
            // Carica dati dal localStorage
            this.ingredienteRepo.caricaDaStorage();
            this.piattoRepo.caricaDaStorage();
            this.venditaRepo.caricaDaStorage();

            // Carica percentuale costi fissi
            this.foodCostService.caricaPercentualeCostiFissi();
            const percentuale = this.foodCostService.percentualeCostiFissi;
            this.menuEngineeringService.setPercentualeCostiFissi(percentuale);
            this.simulazioneService.setPercentualeCostiFissi(percentuale);

            // Carica API key ChatGPT
            this.chatGPTService.caricaApiKey();

            // Applica colori UI
            this.applicaColoriUI();

            console.log('Menu Optimizer inizializzato correttamente');
            return true;
        } catch (error) {
            console.error('Errore inizializzazione:', error);
            return false;
        }
    }

    /**
     * Carica configurazione salvata
     */
    caricaConfigurazione() {
        try {
            const coloriSalvati = localStorage.getItem('menuOptimizer_coloriUI');
            if (coloriSalvati) {
                this.coloriUI = JSON.parse(coloriSalvati);
            }
        } catch (e) {
            console.error('Errore caricamento configurazione:', e);
        }
    }

    /**
     * Salva configurazione
     */
    salvaConfigurazione() {
        localStorage.setItem('menuOptimizer_coloriUI', JSON.stringify(this.coloriUI));
    }

    /**
     * Aggiorna la percentuale di costi fissi
     * @param {number} percentuale
     */
    aggiornaPercentualeCostiFissi(percentuale) {
        this.foodCostService.setPercentualeCostiFissi(percentuale);
        this.menuEngineeringService.setPercentualeCostiFissi(percentuale);
        this.simulazioneService.setPercentualeCostiFissi(percentuale);
    }

    /**
     * Applica i colori alla UI
     */
    applicaColoriUI() {
        const root = document.documentElement;
        root.style.setProperty('--color-primario', this.coloriUI.primario);
        root.style.setProperty('--color-secondario', this.coloriUI.secondario);
        root.style.setProperty('--color-accento', this.coloriUI.accento);
        root.style.setProperty('--color-sfondo', this.coloriUI.sfondo);
        root.style.setProperty('--color-testo', this.coloriUI.testo);
    }

    /**
     * Aggiorna i colori UI (chiamato dopo analisi foto)
     * @param {Object} nuoviColori
     */
    aggiornaColoriUI(nuoviColori) {
        if (nuoviColori.colore_primario) {
            this.coloriUI.primario = nuoviColori.colore_primario;
        }
        if (nuoviColori.colore_secondario) {
            this.coloriUI.secondario = nuoviColori.colore_secondario;
        }
        if (nuoviColori.colore_accento) {
            this.coloriUI.accento = nuoviColori.colore_accento;
        }

        // Genera sfondo chiaro basato sul primario
        this.coloriUI.sfondo = this.schiarisciColore(this.coloriUI.primario, 0.9);

        // Genera colore testo con buon contrasto
        this.coloriUI.testo = this.calcolaColoreTesto(this.coloriUI.sfondo);

        this.salvaConfigurazione();
        this.applicaColoriUI();
    }

    /**
     * Schiarisce un colore
     * @param {string} colore - Colore in formato #RRGGBB
     * @param {number} fattore - 0-1, più alto = più chiaro
     * @returns {string}
     */
    schiarisciColore(colore, fattore) {
        const hex = colore.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const nuovoR = Math.round(r + (255 - r) * fattore);
        const nuovoG = Math.round(g + (255 - g) * fattore);
        const nuovoB = Math.round(b + (255 - b) * fattore);

        return '#' +
            nuovoR.toString(16).padStart(2, '0') +
            nuovoG.toString(16).padStart(2, '0') +
            nuovoB.toString(16).padStart(2, '0');
    }

    /**
     * Calcola colore testo ottimale per contrasto
     * @param {string} sfondo
     * @returns {string}
     */
    calcolaColoreTesto(sfondo) {
        const hex = sfondo.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Calcola luminosità percepita
        const luminosita = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

        return luminosita > 0.5 ? '#2D2D2D' : '#F5F5F5';
    }

    /**
     * Ripristina colori predefiniti
     */
    ripristinaColoriPredefiniti() {
        this.coloriUI = {
            primario: '#E8D5B7',
            secondario: '#F5E6CC',
            accento: '#C4A574',
            sfondo: '#FDF8F0',
            testo: '#3D3D3D'
        };
        this.salvaConfigurazione();
        this.applicaColoriUI();
    }

    /**
     * Ottiene le statistiche dashboard
     * @returns {Object}
     */
    getDashboardStats() {
        const stats = this.menuEngineeringService.calcolaStatisticheMenu();
        const suggerimenti = this.menuEngineeringService.generaSuggerimenti();
        const ingredienti = this.ingredienteRepo.getAll();

        return {
            ...stats,
            numeroIngredienti: ingredienti.length,
            suggerimenti: suggerimenti.slice(0, 5), // Primi 5 suggerimenti
            percentualeCostiFissi: this.foodCostService.percentualeCostiFissi
        };
    }

    /**
     * Esporta tutti i dati in formato JSON
     * @returns {string}
     */
    esportaDati() {
        return JSON.stringify({
            ingredienti: this.ingredienteRepo.getAll(),
            piatti: this.piattoRepo.getAll(),
            configurazione: {
                percentualeCostiFissi: this.foodCostService.percentualeCostiFissi,
                coloriUI: this.coloriUI
            },
            dataExport: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Importa dati da JSON
     * @param {string} jsonData
     */
    importaDati(jsonData) {
        try {
            const dati = JSON.parse(jsonData);

            if (dati.ingredienti) {
                this.ingredienteRepo.svuota();
                dati.ingredienti.forEach(ing => this.ingredienteRepo.aggiungi(ing));
            }

            if (dati.piatti) {
                this.piattoRepo.svuota();
                dati.piatti.forEach(p => this.piattoRepo.aggiungi(p));
            }

            if (dati.configurazione) {
                if (dati.configurazione.percentualeCostiFissi) {
                    this.aggiornaPercentualeCostiFissi(dati.configurazione.percentualeCostiFissi);
                }
                if (dati.configurazione.coloriUI) {
                    this.coloriUI = dati.configurazione.coloriUI;
                    this.applicaColoriUI();
                }
            }

            return true;
        } catch (error) {
            console.error('Errore importazione dati:', error);
            return false;
        }
    }

    /**
     * Svuota tutti i dati
     */
    resetDati() {
        this.ingredienteRepo.svuota();
        this.piattoRepo.svuota();
        this.venditaRepo.svuota();
        this.ripristinaColoriPredefiniti();
    }
}

// Istanza globale
let appController = null;

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    appController = new AppController();
    appController.inizializza();
});
