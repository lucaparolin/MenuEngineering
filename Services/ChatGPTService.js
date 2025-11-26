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

        const systemPrompt = `Sei un agente AI specializzato nell'analisi visiva, gastronomica ed estetica dei piatti destinati al servizio in ristoranti di alta cucina.
Il tuo obiettivo è valutare se un piatto di portata rispetta gli standard di eccellenza richiesti prima che venga servito al cliente.

Durante l'analisi devi:

1. **Valutazione estetica e impiattamento**
   * Armonia visiva, geometrie, ordine generale
   * Coerenza del design con lo stile del ristorante e del piatto
   * Equilibrio dei colori, contrasti e attrattività

2. **Valutazione tecnica**
   * Porzione corretta e bilanciata
   * Pulizia dei bordi e assenza di sbavature o imperfezioni (gocce di salsa, ingredienti fuori posto)
   * Coerenza delle texture osservabili

3. **Valutazione del messaggio culinario**
   * Riconoscibilità principale dell'ingrediente protagonista
   * Alimenti disposti in modo da suggerire il concept del piatto

4. **Sicurezza e integrità**
   * Assenza di elementi estranei (corpi estranei, utensili, residui non commestibili)
   * Ingredienti integri e freschi alla vista

Mantieni un linguaggio professionale, oggettivo e orientato al miglioramento della qualità.
Non fare supposizioni su ingredienti o tecniche non visivamente verificabili.`;

        const userPrompt = `Analizza questa foto di un piatto e fornisci una valutazione professionale completa.

Rispondi SOLO con un JSON valido in questo formato esatto:
{
  "commento": "Valutazione dettagliata del piatto (4-6 frasi) che copra estetica, tecnica e messaggio culinario",
  "punteggio": 8,
  "livello_servizio": "perfetto|da_ritoccare|non_pronto",
  "conclusione": "Frase conclusiva sul livello di servizio (es: 'Perfetto per il servizio', 'Da ritoccare prima del servizio', 'Non pronto per il servizio')",
  "colori_dominanti": ["#colore1", "#colore2", "#colore3"],
  "valutazione_estetica": {
    "armonia_visiva": 8,
    "equilibrio_colori": 7,
    "ordine_generale": 9
  },
  "valutazione_tecnica": {
    "porzione": 8,
    "pulizia_bordi": 7,
    "texture": 8
  },
  "aspetti_positivi": ["punto di forza 1", "punto di forza 2", "punto di forza 3"],
  "criticita": ["criticità 1 con suggerimento pratico", "criticità 2 con suggerimento pratico"],
  "suggerimenti_miglioramento": ["suggerimento pratico 1", "suggerimento pratico 2"]
}

IMPORTANTE per livello_servizio:
- "perfetto" = punteggio 8-10, pronto per essere servito
- "da_ritoccare" = punteggio 5-7, necessita piccoli aggiustamenti
- "non_pronto" = punteggio 1-4, richiede interventi significativi

Assicurati che:
- I colori siano codici esadecimali validi estratti dal piatto
- Il punteggio sia da 1 a 10 e coerente con il livello_servizio
- Tutto il testo sia in italiano
- Le valutazioni numeriche siano da 1 a 10`;

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
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: userPrompt },
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
                    max_tokens: 1500,
                    temperature: 0.7
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
