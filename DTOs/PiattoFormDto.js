/**
 * PiattoFormDto - DTO per il form di inserimento/modifica piatto
 */
class PiattoFormDto {
    constructor(entity = null) {
        if (entity) {
            this.id = entity.id;
            this.nome = entity.nome;
            this.descrizione = entity.descrizione;
            this.ingredienti = entity.ingredienti.map(i => ({...i}));
            this.prezzoVendita = entity.prezzoVendita;
            this.categoria = entity.categoria;
            this.disponibile = entity.disponibile;
            this.tempoPreparazione = entity.tempoPreparazione;
            this.immagineUrl = entity.immagineUrl;
        } else {
            this.id = '';
            this.nome = '';
            this.descrizione = '';
            this.ingredienti = [];
            this.prezzoVendita = 0;
            this.categoria = '';
            this.disponibile = true;
            this.tempoPreparazione = 0;
            this.immagineUrl = '';
        }
    }

    /**
     * Converte da Entity a FormDto
     * @param {PiattoEntity} entity
     * @returns {PiattoFormDto}
     */
    static fromEntity(entity) {
        return new PiattoFormDto(entity);
    }

    /**
     * Converte da FormDto a Entity
     * @returns {PiattoEntity}
     */
    toEntity() {
        return new PiattoEntity(
            this.id,
            this.nome,
            this.descrizione,
            this.ingredienti,
            this.prezzoVendita,
            this.categoria,
            this.disponibile,
            this.tempoPreparazione,
            this.immagineUrl
        );
    }

    /**
     * Valida i dati del form
     * @returns {{valido: boolean, errori: Array}}
     */
    valida() {
        const errori = [];

        if (!this.nome || this.nome.trim() === '') {
            errori.push('Il nome del piatto è obbligatorio');
        }

        if (this.ingredienti.length === 0) {
            errori.push('Aggiungere almeno un ingrediente');
        }

        if (this.prezzoVendita <= 0) {
            errori.push('Il prezzo di vendita deve essere maggiore di zero');
        }

        return {
            valido: errori.length === 0,
            errori
        };
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PiattoFormDto;
}
