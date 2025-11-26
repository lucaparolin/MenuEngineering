/**
 * IngredienteFormDto - DTO per il form di inserimento/modifica ingrediente
 */
class IngredienteFormDto {
    constructor(entity = null) {
        if (entity) {
            this.id = entity.id;
            this.nome = entity.nome;
            this.costoPerUnita = entity.costoPerUnita;
            this.unitaMisura = entity.unitaMisura;
            this.categoria = entity.categoria;
            this.fornitore = entity.fornitore;
        } else {
            this.id = '';
            this.nome = '';
            this.costoPerUnita = 0;
            this.unitaMisura = 'kg';
            this.categoria = '';
            this.fornitore = '';
        }
    }

    /**
     * Converte da Entity a FormDto
     * @param {IngredienteEntity} entity
     * @returns {IngredienteFormDto}
     */
    static fromEntity(entity) {
        return new IngredienteFormDto(entity);
    }

    /**
     * Converte da FormDto a Entity
     * @returns {IngredienteEntity}
     */
    toEntity() {
        return new IngredienteEntity(
            this.id,
            this.nome,
            this.costoPerUnita,
            this.unitaMisura,
            this.categoria,
            this.fornitore,
            new Date()
        );
    }

    /**
     * Valida i dati del form
     * @returns {{valido: boolean, errori: Array}}
     */
    valida() {
        const errori = [];

        if (!this.nome || this.nome.trim() === '') {
            errori.push('Il nome dell\'ingrediente è obbligatorio');
        }

        if (this.costoPerUnita <= 0) {
            errori.push('Il costo deve essere maggiore di zero');
        }

        if (!['kg', 'l'].includes(this.unitaMisura)) {
            errori.push('L\'unità di misura deve essere kg o l');
        }

        return {
            valido: errori.length === 0,
            errori
        };
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IngredienteFormDto;
}
