/**
 * PiattoRepository - Repository per la gestione dei piatti
 * Gestisce il caricamento da CSV e le operazioni CRUD
 */
class PiattoRepository extends BaseRepository {
    constructor() {
        super('menuOptimizer_piatti');
        this.caricaDaStorage();
    }

    /**
     * Carica piatti da contenuto CSV
     * Formato: Nome;Descrizione;Categoria;PrezzoVendita;Ingredienti;Quantita
     * Dove Ingredienti e Quantita sono liste separate da virgola
     * @param {string} csvContent
     * @param {IngredienteRepository} ingredienteRepo
     * @returns {Array<PiattoEntity>}
     */
    caricaDaCsv(csvContent, ingredienteRepo) {
        const datiCsv = this.parseaCsv(csvContent, ';');
        const piatti = [];

        datiCsv.forEach(riga => {
            const piatto = this.fromCsvDataToEntity(riga, ingredienteRepo);
            if (piatto) {
                piatti.push(piatto);
            }
        });

        // Sostituisce i dati esistenti
        this.data = piatti;
        this.salvaSuStorage();

        return piatti;
    }

    /**
     * Converte una riga CSV in PiattoEntity
     * @param {Object} rigaCsv
     * @param {IngredienteRepository} ingredienteRepo
     * @returns {PiattoEntity|null}
     */
    fromCsvDataToEntity(rigaCsv, ingredienteRepo) {
        const nome = rigaCsv.Nome || rigaCsv.nome || '';
        const descrizione = rigaCsv.Descrizione || rigaCsv.descrizione || '';
        const categoria = rigaCsv.Categoria || rigaCsv.categoria || 'Altro';
        const prezzoStr = rigaCsv.PrezzoVendita || rigaCsv.Prezzo || rigaCsv.prezzo || '0';
        const ingredientiStr = rigaCsv.Ingredienti || rigaCsv.ingredienti || '';
        const quantitaStr = rigaCsv.Quantita || rigaCsv.quantita || '';
        const tempo = rigaCsv.TempoPreparazione || rigaCsv.Tempo || '15';

        if (!nome) return null;

        const prezzo = this.parseaNumeroItaliano(prezzoStr);

        // Parsea ingredienti e quantità
        const nomiIngredienti = ingredientiStr.split(',').map(s => s.trim()).filter(s => s);
        const quantita = quantitaStr.split(',').map(s => this.parseaNumeroItaliano(s.trim()));

        const ingredienti = [];
        const tuttiIngredienti = ingredienteRepo ? ingredienteRepo.getAll() : [];

        nomiIngredienti.forEach((nomeIng, index) => {
            const ingTrovato = tuttiIngredienti.find(i =>
                i.nome.toLowerCase() === nomeIng.toLowerCase()
            );
            if (ingTrovato) {
                ingredienti.push({
                    ingredienteId: ingTrovato.id,
                    nomeIngrediente: ingTrovato.nome,
                    quantita: quantita[index] || 0.1,
                    costoUnitario: ingTrovato.costoPerUnita
                });
            }
        });

        const piatto = new PiattoEntity(
            null,
            nome,
            descrizione,
            ingredienti,
            prezzo,
            categoria,
            true,
            parseInt(tempo) || 15,
            ''
        );

        // Aggiungi dati vendita casuali per demo
        piatto.venditeGiornaliere = Math.floor(Math.random() * 20);
        piatto.venditeSettimanali = piatto.venditeGiornaliere * 7 + Math.floor(Math.random() * 30);

        return piatto;
    }

    /**
     * Cerca piatti per nome
     * @param {string} nome
     * @returns {Array<PiattoEntity>}
     */
    cercaPerNome(nome) {
        const nomeLower = nome.toLowerCase();
        return this.getAll().filter(p =>
            p.nome.toLowerCase().includes(nomeLower)
        );
    }

    /**
     * Filtra piatti per categoria
     * @param {string} categoria
     * @returns {Array<PiattoEntity>}
     */
    filtraPerCategoria(categoria) {
        return this.getAll().filter(p =>
            p.categoria.toLowerCase() === categoria.toLowerCase()
        );
    }

    /**
     * Ottiene tutte le categorie presenti
     * @returns {Array<string>}
     */
    getCategorie() {
        const categorie = new Set(this.data.map(p => p.categoria));
        return Array.from(categorie).sort();
    }

    /**
     * Aggiorna i costi degli ingredienti nei piatti
     * Da chiamare quando cambiano i prezzi degli ingredienti
     * @param {IngredienteRepository} ingredienteRepo
     */
    aggiornaCosingIngredienti(ingredienteRepo) {
        const tuttiIngredienti = ingredienteRepo.getAll();

        this.data.forEach(piatto => {
            piatto.ingredienti.forEach(ing => {
                const ingAggiornato = tuttiIngredienti.find(i => i.id === ing.ingredienteId);
                if (ingAggiornato) {
                    ing.costoUnitario = ingAggiornato.costoPerUnita;
                }
            });
        });

        this.salvaSuStorage();
    }

    /**
     * Override getAll per restituire entità con metodi
     * @returns {Array<PiattoEntity>}
     */
    getAll() {
        return this.data.map(item => {
            const entity = new PiattoEntity(
                item.id,
                item.nome,
                item.descrizione,
                item.ingredienti,
                item.prezzoVendita,
                item.categoria,
                item.disponibile,
                item.tempoPreparazione,
                item.immagineUrl
            );
            entity.venditeGiornaliere = item.venditeGiornaliere || 0;
            entity.venditeSettimanali = item.venditeSettimanali || 0;
            entity.venduteTotale = item.venduteTotale || 0;
            return entity;
        });
    }

    /**
     * Esporta piatti in formato CSV
     * @returns {string}
     */
    esportaCsv() {
        const intestazioni = 'Nome;Descrizione;Categoria;PrezzoVendita;Ingredienti;Quantita;TempoPreparazione';
        const righe = this.data.map(p => {
            const nomiIng = p.ingredienti.map(i => i.nomeIngrediente).join(',');
            const quantita = p.ingredienti.map(i => this.formattaNumeroItaliano(i.quantita, 3)).join(',');
            return `${p.nome};${p.descrizione};${p.categoria};${this.formattaNumeroItaliano(p.prezzoVendita)};${nomiIng};${quantita};${p.tempoPreparazione}`;
        });
        return [intestazioni, ...righe].join('\n');
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PiattoRepository;
}
