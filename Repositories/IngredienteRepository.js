/**
 * IngredienteRepository - Repository per la gestione degli ingredienti
 * Gestisce il caricamento da CSV e le operazioni CRUD
 */
class IngredienteRepository extends BaseRepository {
    constructor() {
        super('menuOptimizer_ingredienti');
        this.caricaDaStorage();
    }

    /**
     * Carica ingredienti da contenuto CSV
     * Formato atteso: Nome;CostoPerUnita;UnitaMisura;Categoria;Fornitore
     * @param {string} csvContent
     * @returns {Array<IngredienteEntity>}
     */
    caricaDaCsv(csvContent) {
        const datiCsv = this.parseaCsv(csvContent, ';');
        const ingredienti = [];

        datiCsv.forEach(riga => {
            const ingrediente = this.fromCsvDataToEntity(riga);
            if (ingrediente) {
                ingredienti.push(ingrediente);
            }
        });

        // Sostituisce i dati esistenti
        this.data = ingredienti;
        this.salvaSuStorage();

        return ingredienti;
    }

    /**
     * Converte una riga CSV in IngredienteEntity
     * @param {Object} rigaCsv
     * @returns {IngredienteEntity|null}
     */
    fromCsvDataToEntity(rigaCsv) {
        // Supporta diversi nomi di colonna
        const nome = rigaCsv.Nome || rigaCsv.nome || rigaCsv.NOME || '';
        const costoStr = rigaCsv.CostoPerUnita || rigaCsv.Costo || rigaCsv.costo ||
                         rigaCsv.COSTO || rigaCsv.CostoKg || rigaCsv.CostoLitro || '0';
        const unita = rigaCsv.UnitaMisura || rigaCsv.Unita || rigaCsv.unita ||
                      rigaCsv.UNITA || 'kg';
        const categoria = rigaCsv.Categoria || rigaCsv.categoria || rigaCsv.CATEGORIA || 'Altro';
        const fornitore = rigaCsv.Fornitore || rigaCsv.fornitore || rigaCsv.FORNITORE || '';

        if (!nome) return null;

        const costo = this.parseaNumeroItaliano(costoStr);

        return new IngredienteEntity(
            null, // Genera nuovo ID
            nome,
            costo,
            unita.toLowerCase().includes('l') ? 'l' : 'kg',
            categoria,
            fornitore,
            new Date()
        );
    }

    /**
     * Cerca ingredienti per nome (ricerca parziale)
     * @param {string} nome
     * @returns {Array<IngredienteEntity>}
     */
    cercaPerNome(nome) {
        const nomeLower = nome.toLowerCase();
        return this.data.filter(ing =>
            ing.nome.toLowerCase().includes(nomeLower)
        );
    }

    /**
     * Filtra ingredienti per categoria
     * @param {string} categoria
     * @returns {Array<IngredienteEntity>}
     */
    filtraPerCategoria(categoria) {
        return this.data.filter(ing =>
            ing.categoria.toLowerCase() === categoria.toLowerCase()
        );
    }

    /**
     * Ottiene tutte le categorie presenti
     * @returns {Array<string>}
     */
    getCategorie() {
        const categorie = new Set(this.data.map(ing => ing.categoria));
        return Array.from(categorie).sort();
    }

    /**
     * Ottiene tutti i fornitori presenti
     * @returns {Array<string>}
     */
    getFornitori() {
        const fornitori = new Set(this.data.map(ing => ing.fornitore).filter(f => f));
        return Array.from(fornitori).sort();
    }

    /**
     * Aggiorna il prezzo di un ingrediente
     * @param {string} id
     * @param {number} nuovoPrezzo
     */
    aggiornaPrezzo(id, nuovoPrezzo) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[index].costoPerUnita = nuovoPrezzo;
            this.data[index].dataAggiornamento = new Date();
            this.salvaSuStorage();
        }
    }

    /**
     * Esporta ingredienti in formato CSV
     * @returns {string}
     */
    esportaCsv() {
        const intestazioni = 'Nome;CostoPerUnita;UnitaMisura;Categoria;Fornitore';
        const righe = this.data.map(ing =>
            `${ing.nome};${this.formattaNumeroItaliano(ing.costoPerUnita)};${ing.unitaMisura};${ing.categoria};${ing.fornitore}`
        );
        return [intestazioni, ...righe].join('\n');
    }

    /**
     * Override getAll per restituire entità con metodi
     * @returns {Array<IngredienteEntity>}
     */
    getAll() {
        return this.data.map(item => {
            const entity = new IngredienteEntity(
                item.id,
                item.nome,
                item.costoPerUnita,
                item.unitaMisura,
                item.categoria,
                item.fornitore,
                item.dataAggiornamento
            );
            return entity;
        });
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IngredienteRepository;
}
