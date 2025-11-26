/**
 * BaseRepository - Classe base per i repository
 * Fornisce funzionalità comuni di storage locale e parsing CSV
 */
class BaseRepository {
    constructor(storageKey) {
        this.storageKey = storageKey;
        this.data = [];
    }

    /**
     * Carica i dati dal localStorage
     */
    caricaDaStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.data = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Errore caricamento storage:', e);
            this.data = [];
        }
        return this.data;
    }

    /**
     * Salva i dati nel localStorage
     */
    salvaSuStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.error('Errore salvataggio storage:', e);
        }
    }

    /**
     * Svuota tutti i dati
     */
    svuota() {
        this.data = [];
        this.salvaSuStorage();
    }

    /**
     * Restituisce tutti i dati
     * @returns {Array}
     */
    getAll() {
        return [...this.data];
    }

    /**
     * Trova un elemento per ID
     * @param {string} id
     * @returns {Object|null}
     */
    getById(id) {
        return this.data.find(item => item.id === id) || null;
    }

    /**
     * Aggiunge un nuovo elemento
     * @param {Object} item
     */
    aggiungi(item) {
        this.data.push(item);
        this.salvaSuStorage();
    }

    /**
     * Aggiorna un elemento esistente
     * @param {string} id
     * @param {Object} nuoviDati
     */
    aggiorna(id, nuoviDati) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...nuoviDati };
            this.salvaSuStorage();
        }
    }

    /**
     * Elimina un elemento
     * @param {string} id
     */
    elimina(id) {
        this.data = this.data.filter(item => item.id !== id);
        this.salvaSuStorage();
    }

    /**
     * Parsea un file CSV in un array di oggetti
     * @param {string} csvContent - Contenuto del file CSV
     * @param {string} separatore - Carattere separatore (default ';')
     * @returns {Array}
     */
    parseaCsv(csvContent, separatore = ';') {
        const righe = csvContent.trim().split('\n');
        if (righe.length < 2) return [];

        // Prima riga = intestazioni
        const intestazioni = this.parseaRigaCsv(righe[0], separatore);
        const risultato = [];

        for (let i = 1; i < righe.length; i++) {
            const valori = this.parseaRigaCsv(righe[i], separatore);
            if (valori.length === intestazioni.length) {
                const oggetto = {};
                intestazioni.forEach((intestazione, index) => {
                    oggetto[intestazione.trim()] = valori[index].trim();
                });
                risultato.push(oggetto);
            }
        }

        return risultato;
    }

    /**
     * Parsea una singola riga CSV
     * @param {string} riga
     * @param {string} separatore
     * @returns {Array}
     */
    parseaRigaCsv(riga, separatore) {
        const risultato = [];
        let corrente = '';
        let dentroVirgolette = false;

        for (let i = 0; i < riga.length; i++) {
            const char = riga[i];

            if (char === '"') {
                dentroVirgolette = !dentroVirgolette;
            } else if (char === separatore && !dentroVirgolette) {
                risultato.push(corrente);
                corrente = '';
            } else {
                corrente += char;
            }
        }
        risultato.push(corrente);

        return risultato;
    }

    /**
     * Converte un numero in formato italiano o internazionale a float
     * Supporta:
     * - Formato italiano: 1.234,56 (punto migliaia, virgola decimali)
     * - Formato internazionale: 1234.56 (punto decimali)
     * - Formato semplice italiano: 12,50 (virgola decimali)
     * @param {string} valore
     * @returns {number}
     */
    parseaNumeroItaliano(valore) {
        if (!valore) return 0;

        const str = valore.toString().trim();

        // Se contiene sia punto che virgola
        if (str.includes('.') && str.includes(',')) {
            // Formato italiano: 1.234,56
            // Rimuovi punti migliaia, sostituisci virgola con punto
            const pulito = str.replace(/\./g, '').replace(',', '.');
            return parseFloat(pulito) || 0;
        }

        // Se contiene solo virgola, è formato italiano semplice: 12,50
        if (str.includes(',')) {
            const pulito = str.replace(',', '.');
            return parseFloat(pulito) || 0;
        }

        // Se contiene solo punto, è formato internazionale: 12.50
        // Oppure nessun separatore decimale
        return parseFloat(str) || 0;
    }

    /**
     * Formatta un numero in formato italiano
     * @param {number} numero
     * @param {number} decimali
     * @returns {string}
     */
    formattaNumeroItaliano(numero, decimali = 2) {
        return new Intl.NumberFormat('it-IT', {
            minimumFractionDigits: decimali,
            maximumFractionDigits: decimali
        }).format(numero);
    }

    /**
     * Parsea una data in formato italiano (gg/mm/aaaa)
     * @param {string} dataStr
     * @returns {Date}
     */
    parseaDataItaliana(dataStr) {
        if (!dataStr) return new Date();
        const parti = dataStr.split('/');
        if (parti.length === 3) {
            return new Date(parti[2], parti[1] - 1, parti[0]);
        }
        return new Date(dataStr);
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseRepository;
}
