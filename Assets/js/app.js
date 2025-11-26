/**
 * Menu Optimizer - App JavaScript principale
 * Gestisce l'interfaccia utente e il binding con i servizi
 */

// Variabili globali
let ingredienteRepo, piattoRepo, venditaRepo;
let foodCostService, menuEngineeringService, simulazioneService, chatGPTService;
let ingredientiNuovoPiatto = [];
let coloriAnalisi = null;

// Formattatori italiani
const formatValuta = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const formatNumero = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatPercentuale = new Intl.NumberFormat('it-IT', { style: 'percent', minimumFractionDigits: 1 });

/**
 * Inizializzazione applicazione
 */
document.addEventListener('DOMContentLoaded', () => {
    inizializzaApp();
    setupEventListeners();
    caricaDatiDemo();
    aggiornaDashboard();
});

function inizializzaApp() {
    // Inizializza repositories
    ingredienteRepo = new IngredienteRepository();
    piattoRepo = new PiattoRepository();
    venditaRepo = new VenditaRepository();

    // Inizializza services
    foodCostService = new FoodCostService(ingredienteRepo, piattoRepo);
    menuEngineeringService = new MenuEngineeringService(piattoRepo, venditaRepo);
    simulazioneService = new SimulazioneService(piattoRepo, ingredienteRepo);
    chatGPTService = new ChatGPTService();

    // Carica configurazioni
    foodCostService.caricaPercentualeCostiFissi();
    chatGPTService.caricaApiKey();

    // Aggiorna slider costi fissi
    const slider = document.getElementById('costi-fissi-slider');
    if (slider) {
        slider.value = foodCostService.percentualeCostiFissi;
        document.getElementById('costi-fissi-value').textContent = slider.value + '%';
    }

    console.log('Menu Optimizer inizializzato');
}

function setupEventListeners() {
    // Navigazione tabs
    document.querySelectorAll('.nav-tabs a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            cambiaSezione(section);
        });
    });

    // Upload CSV Ingredienti
    setupFileUpload('csv-upload-ingredienti', 'file-ingredienti', handleCsvIngredienti);

    // Upload CSV Menu
    setupFileUpload('csv-upload-menu', 'file-menu', handleCsvMenu);

    // Upload Foto
    setupFileUpload('foto-upload', 'file-foto', handleFotoUpload);

    // Slider costi fissi
    const sliderCosti = document.getElementById('costi-fissi-slider');
    if (sliderCosti) {
        sliderCosti.addEventListener('input', (e) => {
            const valore = parseInt(e.target.value);
            document.getElementById('costi-fissi-value').textContent = valore + '%';
            foodCostService.setPercentualeCostiFissi(valore);
            menuEngineeringService.setPercentualeCostiFissi(valore);
            simulazioneService.setPercentualeCostiFissi(valore);
            aggiornaTabellaPiatti();
            aggiornaDashboard();
        });
    }

    // Slider simulazione
    const sliderSim = document.getElementById('sim-percentuale');
    if (sliderSim) {
        sliderSim.addEventListener('input', (e) => {
            const valore = parseInt(e.target.value);
            document.getElementById('sim-perc-value').textContent = (valore >= 0 ? '+' : '') + valore + '%';
        });
    }

    // Slider impostazioni
    const sliderDefault = document.getElementById('costi-fissi-default');
    if (sliderDefault) {
        sliderDefault.addEventListener('input', (e) => {
            document.getElementById('costi-fissi-default-value').textContent = e.target.value + '%';
        });
    }
}

function setupFileUpload(dropzoneId, inputId, handler) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);

    if (!dropzone || !input) return;

    dropzone.addEventListener('click', () => input.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--color-accento)';
        dropzone.style.background = 'white';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '';
        dropzone.style.background = '';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '';
        dropzone.style.background = '';
        const file = e.dataTransfer.files[0];
        if (file) handler(file);
    });

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handler(file);
    });
}

/**
 * Navigazione
 */
function cambiaSezione(sectionId) {
    // Nascondi tutte le sezioni
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tabs a').forEach(a => a.classList.remove('active'));

    // Mostra sezione selezionata
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

    // Aggiorna contenuto specifico
    switch(sectionId) {
        case 'dashboard':
            aggiornaDashboard();
            break;
        case 'ingredienti':
            aggiornaTabellaingredienti();
            break;
        case 'menu':
            aggiornaTabellaPiatti();
            break;
        case 'nuovo-piatto':
            aggiornaSelectIngredienti();
            break;
        case 'simulazione':
            aggiornaSelectSimulazione();
            break;
    }
}

/**
 * Dashboard
 */
function aggiornaDashboard() {
    const ingredienti = ingredienteRepo.getAll();
    const piatti = piattoRepo.getAll();

    // Stats
    document.getElementById('stat-piatti').textContent = piatti.length;
    document.getElementById('stat-ingredienti').textContent = ingredienti.length;

    if (piatti.length > 0) {
        const stats = menuEngineeringService.calcolaStatisticheMenu();
        const marginePerPiatto = stats.margineSettimanale / (piatti.length * 7);
        document.getElementById('stat-margine').textContent = formatValuta.format(marginePerPiatto);
        document.getElementById('stat-foodcost').textContent = stats.foodCostMedio.toFixed(1) + '%';

        // BCG Matrix
        aggiornaBCGMatrix();

        // Suggerimenti
        aggiornaSuggerimenti();
    } else {
        document.getElementById('stat-margine').textContent = '€ 0';
        document.getElementById('stat-foodcost').textContent = '0%';
    }
}

function aggiornaBCGMatrix() {
    const classificazione = menuEngineeringService.classificaPiattiBCG();

    ['star', 'puzzle', 'plow_horse', 'dog'].forEach(cat => {
        const container = document.getElementById(`bcg-${cat === 'plow_horse' ? 'horse' : cat}`);
        if (container) {
            const items = classificazione[cat].map(item =>
                `<div>• ${item.piatto.nome}</div>`
            ).join('');
            container.innerHTML = items || '<div><em>Nessun piatto</em></div>';
        }
    });
}

function aggiornaSuggerimenti() {
    const suggerimenti = menuEngineeringService.generaSuggerimenti();
    const container = document.getElementById('suggerimenti-container');

    if (suggerimenti.length === 0) {
        container.innerHTML = '<p>Nessun suggerimento disponibile. Carica piatti per ricevere analisi.</p>';
        return;
    }

    container.innerHTML = suggerimenti.slice(0, 5).map(s => `
        <div class="suggestion-card priority-${s.priorita}">
            <div class="suggestion-icon">${s.icona}</div>
            <div class="suggestion-content">
                <strong>${s.piatto.nome}</strong>
                <p>${s.messaggio}</p>
            </div>
        </div>
    `).join('');
}

/**
 * Gestione Ingredienti
 */
function handleCsvIngredienti(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const contenuto = e.target.result;
        const ingredienti = ingredienteRepo.caricaDaCsv(contenuto);

        mostraAlert('success', `Caricati ${ingredienti.length} ingredienti con successo!`);
        aggiornaTabellaingredienti();
        aggiornaDashboard();

        // Aggiorna anche i prezzi nei piatti esistenti
        piattoRepo.aggiornaCosingIngredienti(ingredienteRepo);
    };
    reader.readAsText(file);
}

function aggiornaTabellaingredienti() {
    const tbody = document.querySelector('#tabella-ingredienti tbody');
    const ingredienti = ingredienteRepo.getAll();

    tbody.innerHTML = ingredienti.map(ing => `
        <tr>
            <td>${ing.nome}</td>
            <td>${formatValuta.format(ing.costoPerUnita)}</td>
            <td>${ing.unitaMisura}</td>
            <td>${ing.categoria}</td>
            <td>${ing.fornitore || '-'}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="modificaIngrediente('${ing.id}')">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="eliminaIngrediente('${ing.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function eliminaIngrediente(id) {
    if (confirm('Eliminare questo ingrediente?')) {
        ingredienteRepo.elimina(id);
        aggiornaTabellaingredienti();
        aggiornaDashboard();
    }
}

/**
 * Gestione Menu/Piatti
 */
function handleCsvMenu(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const contenuto = e.target.result;
        const piatti = piattoRepo.caricaDaCsv(contenuto, ingredienteRepo);

        mostraAlert('success', `Caricati ${piatti.length} piatti con successo!`);
        aggiornaTabellaPiatti();
        aggiornaDashboard();
    };
    reader.readAsText(file);
}

function aggiornaTabellaPiatti() {
    const tbody = document.querySelector('#tabella-menu tbody');
    const piatti = piattoRepo.getAll();
    const medie = menuEngineeringService.calcolaMediaPerBCG();
    const perc = foodCostService.percentualeCostiFissi;

    tbody.innerHTML = piatti.map(p => {
        const costo = p.calcolaCostoIngedienti(perc);
        const margine = p.calcolaMargineProfitto(perc);
        const foodCost = p.calcolaFoodCostPercentage(perc);
        const classif = p.classificaBCG(medie.mediaVendite, medie.mediaMargine, perc);
        const icone = { star: '⭐', puzzle: '🧩', plow_horse: '🐴', dog: '🐕' };

        return `
            <tr>
                <td><strong>${p.nome}</strong></td>
                <td>${p.categoria}</td>
                <td>${formatValuta.format(costo)}</td>
                <td>${formatValuta.format(p.prezzoVendita)}</td>
                <td>${formatValuta.format(margine)}</td>
                <td>${foodCost.toFixed(1)}%</td>
                <td>${p.venditeSettimanali}</td>
                <td>${icone[classif]} ${classif}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Nuovo Piatto
 */
function aggiornaSelectIngredienti() {
    const select = document.getElementById('select-ingrediente');
    const ingredienti = ingredienteRepo.getAll();

    select.innerHTML = '<option value="">-- Seleziona ingrediente --</option>' +
        ingredienti.map(i => `<option value="${i.id}">${i.nome} (${formatValuta.format(i.costoPerUnita)}/${i.unitaMisura})</option>`).join('');
}

function aggiungiIngredienteAPiatto() {
    const selectIng = document.getElementById('select-ingrediente');
    const inputQta = document.getElementById('quantita-ingrediente');

    const ingId = selectIng.value;
    const quantita = parseFloat(inputQta.value);

    if (!ingId || !quantita || quantita <= 0) {
        mostraAlert('warning', 'Seleziona un ingrediente e inserisci la quantità');
        return;
    }

    const ingrediente = ingredienteRepo.getById(ingId);
    if (!ingrediente) return;

    // Verifica se già presente
    if (ingredientiNuovoPiatto.find(i => i.ingredienteId === ingId)) {
        mostraAlert('warning', 'Ingrediente già presente nel piatto');
        return;
    }

    ingredientiNuovoPiatto.push({
        ingredienteId: ingId,
        nomeIngrediente: ingrediente.nome,
        quantita: quantita,
        costoUnitario: ingrediente.costoPerUnita,
        unitaMisura: ingrediente.unitaMisura
    });

    // Reset input
    selectIng.value = '';
    inputQta.value = '';

    aggiornaIngredientiSelezionati();
    calcolaCostoNuovoPiatto();
}

function rimuoviIngredienteDaPiatto(index) {
    ingredientiNuovoPiatto.splice(index, 1);
    aggiornaIngredientiSelezionati();
    calcolaCostoNuovoPiatto();
}

function aggiornaIngredientiSelezionati() {
    const container = document.getElementById('ingredienti-selezionati');
    container.innerHTML = ingredientiNuovoPiatto.map((ing, idx) => `
        <div class="ingredient-tag">
            ${ing.nomeIngrediente} (${ing.quantita} ${ing.unitaMisura})
            <span class="remove" onclick="rimuoviIngredienteDaPiatto(${idx})">&times;</span>
        </div>
    `).join('');
}

function calcolaCostoNuovoPiatto() {
    const perc = foodCostService.percentualeCostiFissi;
    let costoBase = 0;

    ingredientiNuovoPiatto.forEach(ing => {
        costoBase += ing.costoUnitario * ing.quantita;
    });

    const costiFissi = costoBase * (perc / 100);
    const costoTotale = costoBase + costiFissi;

    document.getElementById('costo-base-nuovo').textContent = formatValuta.format(costoBase);
    document.getElementById('costi-fissi-nuovo').textContent = formatValuta.format(costiFissi);
    document.getElementById('costo-totale-nuovo').textContent = formatValuta.format(costoTotale);

    // Suggerisci prezzo
    const categoria = document.getElementById('nuovo-piatto-categoria').value;
    const suggerimento = foodCostService.suggerisciPrezzo(costoTotale, categoria);
    document.getElementById('prezzo-suggerito-nuovo').textContent = formatValuta.format(suggerimento.prezzoSuggerito);
    document.getElementById('prezzo-vendita-nuovo').value = suggerimento.prezzoSuggerito.toFixed(2);
}

async function suggerisciNomiPiatto() {
    if (!chatGPTService.isConfigurato()) {
        mostraAlert('warning', 'Configura la API Key OpenAI nelle impostazioni');
        return;
    }

    if (ingredientiNuovoPiatto.length === 0) {
        mostraAlert('warning', 'Aggiungi almeno un ingrediente');
        return;
    }

    const btn = document.getElementById('btn-suggerisci-nomi');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Generando nomi...';

    try {
        const nomiIng = ingredientiNuovoPiatto.map(i => i.nomeIngrediente);
        const categoria = document.getElementById('nuovo-piatto-categoria').value;
        const nomi = await chatGPTService.suggerisciNomiPiatto(nomiIng, categoria);

        const container = document.getElementById('nomi-suggeriti');
        container.innerHTML = '<h4>Nomi Suggeriti:</h4>' + nomi.map(n => `
            <div class="suggestion-card" style="cursor: pointer;" onclick="selezionaNomePiatto('${n.nome.replace(/'/g, "\\'")}')">
                <strong>${n.nome}</strong>
                <p>${n.descrizione}</p>
            </div>
        `).join('');
    } catch (error) {
        mostraAlert('danger', 'Errore: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🤖 Suggerisci Nomi con AI';
    }
}

function selezionaNomePiatto(nome) {
    document.getElementById('nuovo-piatto-nome').value = nome;
}

function salvaNuovoPiatto() {
    const nome = document.getElementById('nuovo-piatto-nome').value.trim();
    const categoria = document.getElementById('nuovo-piatto-categoria').value;
    const prezzo = parseFloat(document.getElementById('prezzo-vendita-nuovo').value);

    if (!nome) {
        mostraAlert('warning', 'Inserisci un nome per il piatto');
        return;
    }

    if (ingredientiNuovoPiatto.length === 0) {
        mostraAlert('warning', 'Aggiungi almeno un ingrediente');
        return;
    }

    if (!prezzo || prezzo <= 0) {
        mostraAlert('warning', 'Inserisci un prezzo valido');
        return;
    }

    const piatto = new PiattoEntity(
        null, nome, '', ingredientiNuovoPiatto, prezzo, categoria, true, 15, ''
    );
    piatto.venditeGiornaliere = Math.floor(Math.random() * 10);
    piatto.venditeSettimanali = piatto.venditeGiornaliere * 7;

    piattoRepo.aggiungi(piatto);

    mostraAlert('success', `Piatto "${nome}" salvato con successo!`);

    // Reset form
    document.getElementById('nuovo-piatto-nome').value = '';
    document.getElementById('prezzo-vendita-nuovo').value = '';
    document.getElementById('nomi-suggeriti').innerHTML = '';
    ingredientiNuovoPiatto = [];
    aggiornaIngredientiSelezionati();
    calcolaCostoNuovoPiatto();
    aggiornaDashboard();
}

/**
 * Simulazioni
 */
function aggiornaSelectSimulazione() {
    const selectPiatti = document.getElementById('sim-select-piatto');
    const selectIng = document.getElementById('sim-select-ingrediente');
    const piatti = piattoRepo.getAll();
    const ingredienti = ingredienteRepo.getAll();

    selectPiatti.innerHTML = piatti.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    selectIng.innerHTML = ingredienti.map(i => `<option value="${i.id}">${i.nome} (${formatValuta.format(i.costoPerUnita)})</option>`).join('');
}

function cambiaModalitaSimulazione() {
    const tipo = document.getElementById('tipo-simulazione').value;

    document.getElementById('sim-prezzo-piatto').style.display = tipo === 'prezzo-piatto' ? 'block' : 'none';
    document.getElementById('sim-costo-ingrediente').style.display = tipo === 'costo-ingrediente' ? 'block' : 'none';
    document.getElementById('sim-aumento-generale').style.display = tipo === 'aumento-generale' ? 'block' : 'none';

    document.getElementById('risultati-simulazione').innerHTML = '';
}

function eseguiSimulazionePrezzo() {
    const piattoId = document.getElementById('sim-select-piatto').value;
    const nuovoPrezzo = parseFloat(document.getElementById('sim-nuovo-prezzo').value);

    if (!piattoId || !nuovoPrezzo) {
        mostraAlert('warning', 'Seleziona un piatto e inserisci il nuovo prezzo');
        return;
    }

    const sim = simulazioneService.simulaVariazionePrezzo(piattoId, nuovoPrezzo);
    if (!sim) return;

    const risultati = sim.getResultFormattato();
    const diffClass = sim.variazioneMargine >= 0 ? 'diff-positive' : 'diff-negative';

    document.getElementById('risultati-simulazione').innerHTML = `
        <h4>Risultato Simulazione: ${sim.nomePiatto}</h4>
        <div class="simulation-result">
            <div class="simulation-before">
                <h5>Situazione Attuale</h5>
                <p><strong>Prezzo:</strong> ${risultati.prezzoAttuale}</p>
                <p><strong>Costo:</strong> ${risultati.costoAttuale}</p>
                <p><strong>Margine:</strong> ${risultati.margineAttuale}</p>
                <p><strong>% Margine:</strong> ${risultati.percentualeMarginAttuale}</p>
            </div>
            <div class="simulation-after">
                <h5>Scenario Simulato</h5>
                <p><strong>Prezzo:</strong> ${risultati.prezzoSimulato}</p>
                <p><strong>Costo:</strong> ${risultati.costoSimulato}</p>
                <p><strong>Margine:</strong> ${risultati.margineSimulato}</p>
                <p><strong>% Margine:</strong> ${risultati.percentualeMarginSimulato}</p>
            </div>
        </div>
        <div class="simulation-diff ${diffClass}">
            Variazione Margine: ${risultati.variazioneMargine}<br>
            ${risultati.impattoPrevisto}
        </div>
    `;
}

function eseguiSimulazioneCosto() {
    const ingId = document.getElementById('sim-select-ingrediente').value;
    const nuovoCosto = parseFloat(document.getElementById('sim-nuovo-costo').value);

    if (!ingId || !nuovoCosto) {
        mostraAlert('warning', 'Seleziona un ingrediente e inserisci il nuovo costo');
        return;
    }

    const impatti = simulazioneService.simulaVariazioneCostoIngrediente(ingId, nuovoCosto);

    if (impatti.length === 0) {
        document.getElementById('risultati-simulazione').innerHTML = '<p>Nessun piatto usa questo ingrediente.</p>';
        return;
    }

    document.getElementById('risultati-simulazione').innerHTML = `
        <h4>Impatto su ${impatti.length} piatti</h4>
        <table>
            <thead>
                <tr>
                    <th>Piatto</th>
                    <th>Costo Attuale</th>
                    <th>Nuovo Costo</th>
                    <th>Variazione Margine</th>
                </tr>
            </thead>
            <tbody>
                ${impatti.map(i => {
                    const diffClass = i.variazioneMargine >= 0 ? 'color: green' : 'color: red';
                    return `
                        <tr>
                            <td>${i.piatto.nome}</td>
                            <td>${formatValuta.format(i.costoAttuale)}</td>
                            <td>${formatValuta.format(i.nuovoCosto)}</td>
                            <td style="${diffClass}">${formatValuta.format(i.variazioneMargine)}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function eseguiSimulazioneGenerale() {
    const percentuale = parseInt(document.getElementById('sim-percentuale').value);
    const risultato = simulazioneService.simulaAumentoGeneralePrezzo(percentuale);
    const r = risultato.riepilogo;

    const diffClassRicavo = r.variazioneRicavo >= 0 ? 'diff-positive' : 'diff-negative';
    const diffClassMargine = r.variazioneMargine >= 0 ? 'diff-positive' : 'diff-negative';

    document.getElementById('risultati-simulazione').innerHTML = `
        <h4>Simulazione Aumento Generale ${percentuale >= 0 ? '+' : ''}${percentuale}%</h4>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${formatValuta.format(r.ricavoAttualeStimato)}</div>
                <div class="stat-label">Ricavo Attuale/Settimana</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatValuta.format(r.ricavoNuovoStimato)}</div>
                <div class="stat-label">Ricavo Simulato/Settimana</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatValuta.format(r.margineAttualeStimato)}</div>
                <div class="stat-label">Margine Attuale/Settimana</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatValuta.format(r.margineNuovoStimato)}</div>
                <div class="stat-label">Margine Simulato/Settimana</div>
            </div>
        </div>
        <div class="simulation-diff ${diffClassMargine}">
            Variazione Margine: ${r.variazioneMargine >= 0 ? '+' : ''}${r.variazioneMargine.toFixed(1)}%<br>
            <small>Nota: considera un calo vendite stimato del ${Math.abs(percentuale * 0.5).toFixed(0)}% per elasticità prezzo</small>
        </div>
    `;
}

/**
 * Analisi Foto
 */
function handleFotoUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById('foto-preview');
        img.src = e.target.result;
        img.style.display = 'block';
        document.getElementById('btn-analizza-foto').style.display = 'inline-flex';
        document.getElementById('risultato-analisi').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

async function analizzaFoto() {
    if (!chatGPTService.isConfigurato()) {
        mostraAlert('warning', 'Configura la API Key OpenAI nelle impostazioni');
        return;
    }

    const img = document.getElementById('foto-preview');
    if (!img.src) {
        mostraAlert('warning', 'Carica prima una foto');
        return;
    }

    const btn = document.getElementById('btn-analizza-foto');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Analizzando...';

    try {
        const risultato = await chatGPTService.analizzaImpiattamento(img.src);
        coloriAnalisi = risultato;

        // Determina colore in base al livello di servizio
        const coloreGiudizio = getColoreGiudizio(risultato.livello_servizio, risultato.punteggio);

        // Applica automaticamente i colori all'interfaccia
        applicaColoriGiudizio(coloreGiudizio);

        // Mostra punteggio con colore
        document.getElementById('analisi-punteggio').innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="background: ${coloreGiudizio.primario}; color: white; padding: 1rem 2rem; border-radius: 12px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: bold;">${risultato.punteggio}/10</div>
                    <div style="font-size: 0.9rem;">${coloreGiudizio.etichetta}</div>
                </div>
                <div style="flex: 1;">
                    <p style="font-size: 1.2rem; font-weight: 600; color: ${coloreGiudizio.primario};">${risultato.conclusione || coloreGiudizio.messaggio}</p>
                </div>
            </div>
        `;

        // Mostra valutazioni dettagliate se presenti
        let valutazioniHTML = '';
        if (risultato.valutazione_estetica) {
            valutazioniHTML += `
                <div style="margin-top: 1rem;">
                    <h5>Valutazione Estetica</h5>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        ${creaBarraValutazione('Armonia Visiva', risultato.valutazione_estetica.armonia_visiva)}
                        ${creaBarraValutazione('Equilibrio Colori', risultato.valutazione_estetica.equilibrio_colori)}
                        ${creaBarraValutazione('Ordine Generale', risultato.valutazione_estetica.ordine_generale)}
                    </div>
                </div>
            `;
        }
        if (risultato.valutazione_tecnica) {
            valutazioniHTML += `
                <div style="margin-top: 1rem;">
                    <h5>Valutazione Tecnica</h5>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        ${creaBarraValutazione('Porzione', risultato.valutazione_tecnica.porzione)}
                        ${creaBarraValutazione('Pulizia Bordi', risultato.valutazione_tecnica.pulizia_bordi)}
                        ${creaBarraValutazione('Texture', risultato.valutazione_tecnica.texture)}
                    </div>
                </div>
            `;
        }

        document.getElementById('analisi-commento').innerHTML = `
            <p><strong>Valutazione Professionale:</strong></p>
            <p style="font-style: italic; background: #f9f9f9; padding: 1rem; border-radius: 8px; border-left: 4px solid ${coloreGiudizio.primario};">${risultato.commento}</p>
            ${valutazioniHTML}
        `;

        document.getElementById('color-palette').innerHTML = risultato.colori_dominanti.map(c => `
            <div class="color-swatch" style="background: ${c};" title="${c}"></div>
        `).join('');

        // Aspetti positivi
        document.getElementById('analisi-positivi').innerHTML = risultato.aspetti_positivi && risultato.aspetti_positivi.length > 0 ?
            `<h5 style="margin-top: 1rem; color: #27AE60;">Punti di Forza</h5>
            <ul style="list-style: none; padding: 0;">${risultato.aspetti_positivi.map(a => `<li style="padding: 0.5rem; background: #E8F8F0; margin-bottom: 0.5rem; border-radius: 6px;">✓ ${a}</li>`).join('')}</ul>` : '';

        // Criticità
        const criticita = risultato.criticita || [];
        const suggerimenti = risultato.suggerimenti_miglioramento || risultato.suggerimenti || [];

        let criticitaHTML = '';
        if (criticita.length > 0) {
            criticitaHTML += `<h5 style="margin-top: 1rem; color: #E74C3C;">Criticità</h5>
            <ul style="list-style: none; padding: 0;">${criticita.map(c => `<li style="padding: 0.5rem; background: #FDEDEC; margin-bottom: 0.5rem; border-radius: 6px;">⚠ ${c}</li>`).join('')}</ul>`;
        }
        if (suggerimenti.length > 0) {
            criticitaHTML += `<h5 style="margin-top: 1rem; color: #F39C12;">Suggerimenti di Miglioramento</h5>
            <ul style="list-style: none; padding: 0;">${suggerimenti.map(s => `<li style="padding: 0.5rem; background: #FEF9E7; margin-bottom: 0.5rem; border-radius: 6px;">💡 ${s}</li>`).join('')}</ul>`;
        }

        document.getElementById('analisi-suggerimenti').innerHTML = criticitaHTML;

        document.getElementById('risultato-analisi').style.display = 'block';

    } catch (error) {
        mostraAlert('danger', 'Errore analisi: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🤖 Analizza Impiattamento con AI';
    }
}

/**
 * Crea una barra di valutazione visiva
 */
function creaBarraValutazione(label, valore) {
    const percentuale = (valore / 10) * 100;
    const colore = valore >= 8 ? '#27AE60' : valore >= 5 ? '#F1C40F' : '#E74C3C';
    return `
        <div style="flex: 1; min-width: 150px;">
            <div style="font-size: 0.85rem; margin-bottom: 0.25rem;">${label}: <strong>${valore}/10</strong></div>
            <div style="background: #eee; border-radius: 4px; height: 8px; overflow: hidden;">
                <div style="background: ${colore}; height: 100%; width: ${percentuale}%; transition: width 0.5s;"></div>
            </div>
        </div>
    `;
}

/**
 * Determina i colori in base al livello di servizio
 */
function getColoreGiudizio(livelloServizio, punteggio) {
    // Colori netti come richiesto
    const colori = {
        perfetto: {
            primario: '#27AE60',      // Verde netto
            secondario: '#D5F5E3',    // Verde chiaro
            accento: '#1E8449',       // Verde scuro
            sfondo: '#EAFAF1',        // Verde molto chiaro
            etichetta: 'PERFETTO',
            messaggio: 'Perfetto per il servizio'
        },
        da_ritoccare: {
            primario: '#F1C40F',      // Giallo netto
            secondario: '#FCF3CF',    // Giallo chiaro
            accento: '#D4AC0D',       // Giallo scuro
            sfondo: '#FEF9E7',        // Giallo molto chiaro
            etichetta: 'DA RITOCCARE',
            messaggio: 'Da ritoccare prima del servizio'
        },
        non_pronto: {
            primario: '#E74C3C',      // Rosso netto
            secondario: '#FADBD8',    // Rosso chiaro
            accento: '#C0392B',       // Rosso scuro
            sfondo: '#FDEDEC',        // Rosso molto chiaro
            etichetta: 'NON PRONTO',
            messaggio: 'Non pronto per il servizio'
        }
    };

    // Determina in base al livello o al punteggio
    if (livelloServizio) {
        return colori[livelloServizio] || colori.da_ritoccare;
    }

    // Fallback basato sul punteggio
    if (punteggio >= 8) return colori.perfetto;
    if (punteggio >= 5) return colori.da_ritoccare;
    return colori.non_pronto;
}

/**
 * Applica i colori del giudizio all'interfaccia
 */
function applicaColoriGiudizio(coloreGiudizio) {
    const root = document.documentElement;
    root.style.setProperty('--color-primario', coloreGiudizio.primario);
    root.style.setProperty('--color-secondario', coloreGiudizio.secondario);
    root.style.setProperty('--color-accento', coloreGiudizio.accento);
    root.style.setProperty('--color-sfondo', coloreGiudizio.sfondo);

    // Aggiorna anche l'header per effetto visivo immediato
    const header = document.querySelector('.header');
    if (header) {
        header.style.background = `linear-gradient(135deg, ${coloreGiudizio.secondario}, ${coloreGiudizio.primario})`;
    }

    // Salva in localStorage
    localStorage.setItem('menuOptimizer_coloriUI', JSON.stringify({
        primario: coloreGiudizio.primario,
        secondario: coloreGiudizio.secondario,
        accento: coloreGiudizio.accento,
        sfondo: coloreGiudizio.sfondo
    }));
}

function applicaColoriEstratti() {
    if (!coloriAnalisi) return;

    const root = document.documentElement;
    root.style.setProperty('--color-primario', coloriAnalisi.colori_dominanti[0] || '#E8D5B7');
    root.style.setProperty('--color-secondario', schiarisciColore(coloriAnalisi.colori_dominanti[0] || '#E8D5B7', 0.7));
    root.style.setProperty('--color-accento', coloriAnalisi.colori_dominanti[1] || coloriAnalisi.colori_dominanti[0] || '#C4A574');

    // Ripristina header
    const header = document.querySelector('.header');
    if (header) {
        header.style.background = '';
    }

    // Salva in localStorage
    localStorage.setItem('menuOptimizer_coloriUI', JSON.stringify({
        primario: root.style.getPropertyValue('--color-primario'),
        secondario: root.style.getPropertyValue('--color-secondario'),
        accento: root.style.getPropertyValue('--color-accento')
    }));

    mostraAlert('success', 'Colori del piatto applicati all\'interfaccia!');
}

function schiarisciColore(colore, fattore) {
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
 * Impostazioni
 */
function mostraImpostazioni() {
    document.getElementById('modal-impostazioni').classList.add('active');

    // Carica valori attuali
    document.getElementById('api-key').value = chatGPTService.apiKey || '';
    document.getElementById('costi-fissi-default').value = foodCostService.percentualeCostiFissi;
    document.getElementById('costi-fissi-default-value').textContent = foodCostService.percentualeCostiFissi + '%';
}

function chiudiModal() {
    document.getElementById('modal-impostazioni').classList.remove('active');
}

function salvaImpostazioni() {
    const apiKey = document.getElementById('api-key').value.trim();
    const costiFissi = parseInt(document.getElementById('costi-fissi-default').value);

    if (apiKey) {
        chatGPTService.setApiKey(apiKey);
    }

    foodCostService.setPercentualeCostiFissi(costiFissi);
    menuEngineeringService.setPercentualeCostiFissi(costiFissi);
    simulazioneService.setPercentualeCostiFissi(costiFissi);

    document.getElementById('costi-fissi-slider').value = costiFissi;
    document.getElementById('costi-fissi-value').textContent = costiFissi + '%';

    mostraAlert('success', 'Impostazioni salvate!');
    chiudiModal();
    aggiornaDashboard();
}

function ripristinaColori() {
    const root = document.documentElement;
    root.style.setProperty('--color-primario', '#E8D5B7');
    root.style.setProperty('--color-secondario', '#F5E6CC');
    root.style.setProperty('--color-accento', '#C4A574');
    root.style.setProperty('--color-sfondo', '#FDF8F0');

    localStorage.removeItem('menuOptimizer_coloriUI');
    mostraAlert('success', 'Colori ripristinati!');
}

function esportaDati() {
    const dati = {
        ingredienti: ingredienteRepo.getAll(),
        piatti: piattoRepo.getAll(),
        configurazione: {
            percentualeCostiFissi: foodCostService.percentualeCostiFissi
        },
        dataExport: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dati, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu_optimizer_export.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importaDati() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const dati = JSON.parse(ev.target.result);
                if (dati.ingredienti) {
                    ingredienteRepo.svuota();
                    dati.ingredienti.forEach(i => ingredienteRepo.aggiungi(i));
                }
                if (dati.piatti) {
                    piattoRepo.svuota();
                    dati.piatti.forEach(p => piattoRepo.aggiungi(p));
                }
                mostraAlert('success', 'Dati importati con successo!');
                aggiornaDashboard();
                chiudiModal();
            } catch (err) {
                mostraAlert('danger', 'Errore importazione: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetDati() {
    if (confirm('Sei sicuro di voler eliminare TUTTI i dati? Questa azione non è reversibile.')) {
        ingredienteRepo.svuota();
        piattoRepo.svuota();
        venditaRepo.svuota();
        localStorage.removeItem('menuOptimizer_coloriUI');
        ripristinaColori();
        mostraAlert('success', 'Tutti i dati sono stati eliminati');
        aggiornaDashboard();
        chiudiModal();
    }
}

/**
 * Utilità
 */
function mostraAlert(tipo, messaggio) {
    // Rimuovi alert esistenti
    document.querySelectorAll('.alert-temp').forEach(a => a.remove());

    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo} alert-temp`;
    alert.style.position = 'fixed';
    alert.style.top = '100px';
    alert.style.right = '20px';
    alert.style.zIndex = '1001';
    alert.style.maxWidth = '400px';
    alert.innerHTML = messaggio;

    document.body.appendChild(alert);

    setTimeout(() => alert.remove(), 4000);
}

/**
 * Carica dati demo per test
 */
function caricaDatiDemo() {
    // Se non ci sono dati, carica demo
    if (ingredienteRepo.getAll().length === 0) {
        const csvIngredienti = `Nome;CostoPerUnita;UnitaMisura;Categoria;Fornitore
Pomodori San Marzano;3,50;kg;Verdure;Ortofrutticola Sud
Mozzarella di Bufala;12,00;kg;Latticini;Caseificio Campano
Farina 00;0,80;kg;Farine;Molino Rosso
Olio EVO;8,50;l;Condimenti;Oleificio Puglia
Basilico Fresco;15,00;kg;Erbe;Ortofrutticola Sud
Prosciutto Crudo DOP;28,00;kg;Salumi;Salumificio Parma
Parmigiano Reggiano 24m;22,00;kg;Latticini;Caseificio Emilia
Spaghetti;1,80;kg;Pasta;Pastificio Gragnano
Guanciale;18,00;kg;Salumi;Norcineria Umbra
Pecorino Romano;16,00;kg;Latticini;Caseificio Lazio
Uova Fresche;4,50;kg;Uova;Fattoria Bio
Burro;9,00;kg;Latticini;Latteria Alpina
Aglio;6,00;kg;Verdure;Ortofrutticola Sud
Peperoncino;25,00;kg;Spezie;Spezieria Calabra
Branzino;24,00;kg;Pesce;Pescheria Adriatica
Gamberi;32,00;kg;Pesce;Pescheria Adriatica
Vitello;22,00;kg;Carni;Macelleria Chianina
Funghi Porcini;45,00;kg;Verdure;Funghi Toscani
Tartufo Nero;800,00;kg;Tartufi;Tartufi Umbria
Mascarpone;8,00;kg;Latticini;Caseificio Lombardo
Savoiardi;6,00;kg;Dolci;Biscottificio
Cacao Amaro;12,00;kg;Dolci;Cioccolateria
Caffe Espresso;18,00;kg;Bevande;Torrefazione Napoli`;

        ingredienteRepo.caricaDaCsv(csvIngredienti);
    }

    if (piattoRepo.getAll().length === 0) {
        const csvMenu = `Nome;Descrizione;Categoria;PrezzoVendita;Ingredienti;Quantita;TempoPreparazione
Margherita DOC;Pizza con mozzarella di bufala e pomodoro San Marzano;Pizze;12,00;Farina 00,Pomodori San Marzano,Mozzarella di Bufala,Olio EVO,Basilico Fresco;0.25,0.15,0.15,0.02,0.01;15
Spaghetti alla Carbonara;Il classico romano con guanciale e pecorino;Primi;14,00;Spaghetti,Guanciale,Pecorino Romano,Uova Fresche;0.12,0.08,0.05,0.1;20
Tiramisù;Dolce al mascarpone e caffè;Dolci;8,00;Mascarpone,Savoiardi,Caffe Espresso,Cacao Amaro,Uova Fresche;0.1,0.06,0.02,0.01,0.08;30
Branzino al Forno;Branzino con patate e olive;Secondi;22,00;Branzino,Olio EVO,Aglio;0.35,0.03,0.01;35
Tagliatelle ai Porcini;Pasta fresca con funghi porcini;Primi;18,00;Farina 00,Uova Fresche,Funghi Porcini,Parmigiano Reggiano,Burro;0.1,0.08,0.12,0.03,0.02;25
Prosciutto e Bufala;Antipasto con prosciutto crudo e mozzarella;Antipasti;16,00;Prosciutto Crudo DOP,Mozzarella di Bufala;0.08,0.12;5
Gamberi alla Griglia;Gamberi freschi alla griglia;Secondi;24,00;Gamberi,Olio EVO,Aglio,Peperoncino;0.25,0.02,0.01,0.002;20
Spaghetti Aglio Olio;Semplicità e tradizione;Primi;10,00;Spaghetti,Olio EVO,Aglio,Peperoncino;0.12,0.04,0.02,0.003;15`;

        piattoRepo.caricaDaCsv(csvMenu, ingredienteRepo);
    }
}

/**
 * Gestione Form Ingrediente
 */
let ingredienteInModifica = null;

function mostraFormIngrediente(id = null) {
    ingredienteInModifica = id;

    // Crea modal se non esiste
    let modal = document.getElementById('modal-ingrediente');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-ingrediente';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 id="titolo-form-ingrediente">Nuovo Ingrediente</h3>
                    <button class="modal-close" onclick="chiudiModalIngrediente()">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label" for="ing-nome">Nome</label>
                    <input type="text" class="form-control" id="ing-nome" placeholder="Nome ingrediente">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="ing-costo">Costo per Unità (€)</label>
                        <input type="number" class="form-control" id="ing-costo" step="0.01" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="ing-unita">Unità di Misura</label>
                        <select class="form-control" id="ing-unita">
                            <option value="kg">kg (chilogrammo)</option>
                            <option value="l">l (litro)</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="ing-categoria">Categoria</label>
                        <input type="text" class="form-control" id="ing-categoria" placeholder="Es: Verdure, Latticini...">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="ing-fornitore">Fornitore</label>
                        <input type="text" class="form-control" id="ing-fornitore" placeholder="Nome fornitore">
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button class="btn btn-success" onclick="salvaIngrediente()">💾 Salva</button>
                    <button class="btn btn-secondary" onclick="chiudiModalIngrediente()">Annulla</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Popola form se modifica
    if (id) {
        const ing = ingredienteRepo.getById(id);
        if (ing) {
            document.getElementById('titolo-form-ingrediente').textContent = 'Modifica Ingrediente';
            document.getElementById('ing-nome').value = ing.nome;
            document.getElementById('ing-costo').value = ing.costoPerUnita;
            document.getElementById('ing-unita').value = ing.unitaMisura;
            document.getElementById('ing-categoria').value = ing.categoria || '';
            document.getElementById('ing-fornitore').value = ing.fornitore || '';
        }
    } else {
        document.getElementById('titolo-form-ingrediente').textContent = 'Nuovo Ingrediente';
        document.getElementById('ing-nome').value = '';
        document.getElementById('ing-costo').value = '';
        document.getElementById('ing-unita').value = 'kg';
        document.getElementById('ing-categoria').value = '';
        document.getElementById('ing-fornitore').value = '';
    }

    modal.classList.add('active');
}

function chiudiModalIngrediente() {
    const modal = document.getElementById('modal-ingrediente');
    if (modal) {
        modal.classList.remove('active');
    }
    ingredienteInModifica = null;
}

function salvaIngrediente() {
    const nome = document.getElementById('ing-nome').value.trim();
    const costo = parseFloat(document.getElementById('ing-costo').value);
    const unita = document.getElementById('ing-unita').value;
    const categoria = document.getElementById('ing-categoria').value.trim();
    const fornitore = document.getElementById('ing-fornitore').value.trim();

    if (!nome) {
        mostraAlert('warning', 'Inserisci il nome dell\'ingrediente');
        return;
    }

    if (!costo || costo <= 0) {
        mostraAlert('warning', 'Inserisci un costo valido');
        return;
    }

    if (ingredienteInModifica) {
        // Modifica esistente
        ingredienteRepo.aggiorna(ingredienteInModifica, {
            nome,
            costoPerUnita: costo,
            unitaMisura: unita,
            categoria: categoria || 'Altro',
            fornitore,
            dataAggiornamento: new Date()
        });
        mostraAlert('success', 'Ingrediente aggiornato!');
    } else {
        // Nuovo ingrediente
        const nuovoIng = new IngredienteEntity(null, nome, costo, unita, categoria || 'Altro', fornitore, new Date());
        ingredienteRepo.aggiungi(nuovoIng);
        mostraAlert('success', 'Ingrediente aggiunto!');
    }

    chiudiModalIngrediente();
    aggiornaTabellaingredienti();
    aggiornaDashboard();

    // Aggiorna costi nei piatti
    piattoRepo.aggiornaCosingIngredienti(ingredienteRepo);
}

function modificaIngrediente(id) {
    mostraFormIngrediente(id);
}
