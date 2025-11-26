/**
 * ChatGPTService - Servizio per l'integrazione con OpenAI ChatGPT
 * Gestisce le chiamate API per suggerimenti nomi e analisi immagini
 */
class ChatGPTService {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://api.openai.com/v1';
        this.model = 'gpt-4o-mini'; // Modello economico con visione
        this.modelVision = 'gpt-4o'; // Per analisi immagini
    }

    /**
     * Imposta la API key
     * @param {string} apiKey
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('menuOptimizer_openaiKey', apiKey);
    }

    /**
     * Carica la API key dal localStorage
     */
    caricaApiKey() {
        this.apiKey = localStorage.getItem('menuOptimizer_openaiKey') || '';
        return this.apiKey;
    }

    /**
     * Verifica se la API key è configurata
     * @returns {boolean}
     */
    isConfigurato() {
        return this.apiKey && this.apiKey.length > 20;
    }

    /**
     * Effettua una richiesta a ChatGPT
     * @param {Array} messages - Array di messaggi
     * @param {string} model - Modello da usare
     * @returns {Promise<Object>}
     */
    async chiamaAPI(messages, model = null) {
        if (!this.isConfigurato()) {
            throw new Error('API Key OpenAI non configurata');
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: model || this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Errore chiamata API');
        }

        return await response.json();
    }

    /**
     * Suggerisce 3 nomi creativi per un piatto basato sugli ingredienti
     * @param {Array} ingredienti - Lista di nomi ingredienti
     * @param {string} categoria - Categoria del piatto
     * @returns {Promise<Array<string>>}
     */
    async suggerisciNomiPiatto(ingredienti, categoria = '') {
        const prompt = `Sei uno chef creativo italiano. Suggerisci 3 nomi eleganti e accattivanti per un piatto della categoria "${categoria || 'piatto principale'}" che contiene i seguenti ingredienti: ${ingredienti.join(', ')}.

I nomi devono essere:
- In italiano
- Evocativi e appetitosi
- Adatti a un ristorante di media-alta qualità
- Originali ma non troppo complessi

Rispondi SOLO con un JSON valido in questo formato esatto:
{
  "nomi": [
    {"nome": "Nome 1", "descrizione": "Breve descrizione evocativa"},
    {"nome": "Nome 2", "descrizione": "Breve descrizione evocativa"},
    {"nome": "Nome 3", "descrizione": "Breve descrizione evocativa"}
  ]
}`;

        try {
            const response = await this.chiamaAPI([
                { role: 'user', content: prompt }
            ]);

            const contenuto = response.choices[0].message.content;
            // Estrai il JSON dalla risposta
            const jsonMatch = contenuto.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.nomi;
            }
            throw new Error('Formato risposta non valido');
        } catch (error) {
            console.error('Errore suggerimento nomi:', error);
            throw error;
        }
    }

    /**
     * Analizza l'impiattamento di una foto del piatto
     * @param {string} base64Image - Immagine in base64
     * @returns {Promise<Object>}
     */
    async analizzaImpiattamento(base64Image) {
        if (!this.isConfigurato()) {
            throw new Error('API Key OpenAI non configurata');
        }

        const prompt = `Sei un esperto chef e critico gastronomico. Analizza questa foto di un piatto e fornisci un giudizio sull'impiattamento.

Rispondi SOLO con un JSON valido in questo formato esatto:
{
  "commento": "Un commento dettagliato sull'impiattamento (3-4 frasi), includendo punti di forza e suggerimenti di miglioramento",
  "punteggio": 8,
  "colori_dominanti": ["#colore1", "#colore2", "#colore3"],
  "colore_primario": "#colorePrimario",
  "colore_secondario": "#coloreSecondario",
  "colore_accento": "#coloreAccento",
  "aspetti_positivi": ["aspetto1", "aspetto2"],
  "suggerimenti": ["suggerimento1", "suggerimento2"]
}

Assicurati che:
- I colori siano codici esadecimali validi estratti dal piatto
- Il punteggio sia da 1 a 10
- Il commento sia in italiano
- I colori riflettano la palette cromatica del piatto`;

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.modelVision,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: prompt },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: base64Image.startsWith('data:')
                                            ? base64Image
                                            : `data:image/jpeg;base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Errore analisi immagine');
            }

            const data = await response.json();
            const contenuto = data.choices[0].message.content;

            // Estrai il JSON dalla risposta
            const jsonMatch = contenuto.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Formato risposta non valido');
        } catch (error) {
            console.error('Errore analisi impiattamento:', error);
            throw error;
        }
    }

    /**
     * Genera suggerimenti per ottimizzare un piatto
     * @param {PiattoEntity} piatto
     * @param {string} problema - 'basse_vendite', 'basso_margine', 'alto_costo'
     * @returns {Promise<Object>}
     */
    async generaSuggerimentiPiatto(piatto, problema) {
        const ingredientiStr = piatto.ingredienti.map(i => i.nomeIngrediente).join(', ');

        const prompt = `Sei un consulente esperto di menu engineering per ristoranti italiani.

Analizza questo piatto:
- Nome: ${piatto.nome}
- Categoria: ${piatto.categoria}
- Ingredienti: ${ingredientiStr}
- Prezzo: €${piatto.prezzoVendita.toFixed(2)}
- Problema principale: ${problema}

Fornisci suggerimenti pratici per migliorare le performance del piatto.

Rispondi SOLO con un JSON valido:
{
  "analisi": "Breve analisi del problema",
  "suggerimenti": [
    {"tipo": "prezzo|ingredienti|presentazione|marketing", "suggerimento": "Descrizione", "impatto_stimato": "alto|medio|basso"}
  ],
  "ingredienti_alternativi": ["ingrediente1", "ingrediente2"],
  "range_prezzo_consigliato": {"min": 10, "max": 15}
}`;

        try {
            const response = await this.chiamaAPI([
                { role: 'user', content: prompt }
            ]);

            const contenuto = response.choices[0].message.content;
            const jsonMatch = contenuto.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Formato risposta non valido');
        } catch (error) {
            console.error('Errore generazione suggerimenti:', error);
            throw error;
        }
    }
}

// Esporta per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatGPTService;
}
