const express = require('express');
const router = express.Router();
const { getLayout } = require('../config/Config');
const { VueloModel, AerolineaModel, AeropuertoModel } = require('../models');
const { generateRta } = require('../services/qwenService');

/* GET home page (login form). Maneja la ruta raíz: http://localhost:3000/ */
router.get('/', (req, res) => {
    const layout = getLayout(false);
    const pageTitle = "Iniciar Sesión - Buscador de Vuelos";
    const pageSubtitle = "Panel Administrativo";

    const content = `
        <h2>${pageTitle}</h2>
        <p>Por favor, ingrese sus credenciales para acceder al panel administrativo.</p>
        <!-- Mensajes de credenciales de prueba agregados aquí -->
        <p>Usuario: <b>admin</b></p>
        <p>Contraseña: <b>admin</b></p>
        <form action="/login" method="POST">
            <label for="username">Usuario:</label><br>
            <input type="text" id="username" name="username" required><br><br>
            <label for="password">Contraseña:</label><br>
            <input type="password" id="password" name="password" required><br><br>
            <button type="submit">Ingresar</button>
        </form>
        <div id="message"></div>`;

    const fullHtml = layout
        .replace('TITULO PRINCIPAL - APP', pageTitle)
        .replace('SUBTITULO - APP', pageSubtitle)
        .replace('<main>', `<main>${content}`);

    res.send(fullHtml);
});

// ====================================================================
// LOGIN Y EL DASHBOARD
// ====================================================================

/* POST para manejar el envío del formulario de login */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'admin') {
        req.session.isLoggedIn = true;
        res.redirect('/home');
    } else {
        const layout = getLayout(false);
        const errorMessage = `
            <p style="color: red;">Usuario o contraseña incorrectos. Por favor, intente de nuevo.</p>
            <p>Usuario: <b>admin</b></p>
            <p>Contraseña: <b>admin</b></p>
            <p><a href="/" class="button">Volver al Login</a></p>
        `;
        const fullHtml = layout
            .replace('TITULO PRINCIPAL - APP', 'Error de Autenticación')
            .replace('SUBTITULO - APP', 'Credenciales Inválidas')
            .replace('<main>', `<main>${errorMessage}</main>`);
        res.status(401).send(fullHtml);
    }
});

// Ruta para cerrar sesión
router.get('/login/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error al destruir la sesión:", err);
            return res.redirect('/home');
        }
        res.redirect('/');
    });
});

/* GET Dashboard / Home Screen (ruta: /home). */
router.get('/home', async (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/');
    }

    const layout = getLayout(req.session.isLoggedIn);
    const pageTitle = "Buscador de Vuelos - Panel Principal";
    const pageSubtitle = "Bienvenido a tu Dashboard";
    
    // CORREGIDO: Se ha modificado el HTML para incluir el dropdown
    const content = `
        <h2>${pageTitle}</h2>
        <p>${pageSubtitle}</p>
        <p>Aquí tendrás acceso a todas las funcionalidades del sistema.</p>
        <div class="actions">
            <a href="/vuelos" class="button">Gestión de Vuelos</a>
            <a href="/aerolineas" class="button">Gestión de Aerolíneas</a>
            <a href="/aeropuertos" class="button">Gestión de Aeropuertos</a>
        </div>
        
        <h3>Funcionalidades de Inteligencia Artificial</h3>
        <div class="ia-section">
            <p>Selecciona una opción y haz clic para obtener información generada por IA:</p>
            
            <h4>Generar Resumen de Vuelos</h4>
            <div class="ia-control">
                <select id="selectResumenPrompt">
                    <option value="resumen_general">Resumen general</option>
                    <option value="destinos_populares">Destinos más populares</option>
                    <option value="retrasos_cancelaciones">Vuelos con retrasos o cancelaciones</option>
                    <option value="alta_ocupacion">Vuelos con alta ocupación</option>
                </select>
                <button id="btnGenerarResumen" class="button primary">Generar Resumen</button>
            </div>
            
            <h4 style="margin-top: 20px;">Generar Alertas de Vuelos</h4>
            <div class="ia-control">
                <select id="selectAlertasPrompt">
                    <option value="alertas_criticas">Alertas críticas</option>
                    <option value="sugerencias">Sugerencias de gestión</option>
                </select>
                <button id="btnGenerarAlertas" class="button danger">Generar Alertas</button>
            </div>
            
            <div id="iaOutput" style="margin-top: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9; min-height: 100px;">
                <p>La respuesta de la IA aparecerá aquí...</p>
            </div>
        </div>
        <script src="/Buscador_Vuelos_scripts.js"></script>
    `;
    
    const fullHtml = layout
        .replace('TITULO PRINCIPAL - APP', pageTitle)
        .replace('SUBTITULO - APP', pageSubtitle)
        .replace('<main>', `<main>${content}`);
    res.send(fullHtml);
});

// ====================================================================
// RUTAS API PARA IA
// ====================================================================

router.post('/home/ia/resumen-vuelos', async (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.status(401).end("No autorizado. Por favor, inicie sesión.");
    }
    
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // CORREGIDO: El promptType se obtiene del cuerpo de la solicitud
    const { promptType } = req.body;

    let systemPrompt = "Eres un asistente útil especializado en información de vuelos. Tu tarea es resumir datos de vuelos de manera concisa y clara. Responde siempre en español.";
    let userPrompt = "";

    try {
        const flightData = await VueloModel.getAll();
        const aerolineas = await AerolineaModel.getAll();
        const aeropuertos = await AeropuertoModel.getAll();
        
        const flightDataString = flightData.map(v => 
            `Vuelo ID: ${v.id_vuelo}, Aerolínea: ${aerolineas.find(a => a.id_aerolinea === v.id_aerolinea)?.nombre_aerolinea || 'N/A'}, Origen: ${aeropuertos.find(a => a.id_aeropuerto === v.id_aeropuerto_origen)?.codigo_iata || 'N/A'}, Destino: ${aeropuertos.find(a => a.id_aeropuerto === v.id_aeropuerto_destino)?.codigo_iata || 'N/A'}, Fecha: ${v.fecha_salida}, Hora Salida: ${v.hora_salida}, Estado: ${v.estado_vuelo}`
        ).join('\n');

        // CORREGIDO: Se construye el prompt basado en la opción seleccionada
        switch (promptType) {
            case 'resumen_general':
                userPrompt = `Genera un resumen general de los siguientes vuelos. Destaca fechas, destinos populares y aerolíneas principales, así como cualquier estado notable (retrasos, etc.):\n\n${flightDataString}`;
                break;
            case 'destinos_populares':
                userPrompt = `Analiza los siguientes vuelos y genera una lista de los destinos más populares y la cantidad de vuelos a cada uno:\n\n${flightDataString}`;
                break;
            case 'retrasos_cancelaciones':
                userPrompt = `Identifica y lista los vuelos que están con estado 'retrasado' o 'cancelado'. Para cada uno, proporciona el ID de vuelo, la aerolínea y el destino:\n\n${flightDataString}`;
                break;
            case 'alta_ocupacion':
                userPrompt = `Genera una lista de los vuelos que podrían tener una alta ocupación. Basándote en la lista de vuelos, indica cuáles serían más populares por destino y aerolínea. Sé un poco creativo. Los vuelos son:\n\n${flightDataString}`;
                break;
            default:
                userPrompt = `Genera un resumen general de los siguientes vuelos:\n\n${flightDataString}`;
                break;
        }
        
        await generateRta('qwen-turbo', systemPrompt, userPrompt, 1024, (chunk) => {
            res.write(chunk);
        });

        res.end();

    } catch (error) {
        console.error("Error al generar resumen de vuelos:", error);
        res.status(500).end("Error al generar el resumen de vuelos: " + error.message);
    }
});

router.post('/home/ia/alertas-vuelos', async (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.status(401).end("No autorizado. Por favor, inicie sesión.");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const { promptType } = req.body;

    let systemPrompt = "Eres un asistente útil especializado en la detección y reporte de alertas sobre vuelos. Analiza los datos proporcionados y genera alertas claras y concisas. Responde siempre en español.";
    let userPrompt = "";

    try {
        const flightData = await VueloModel.getAll();
        const aerolineas = await AerolineaModel.getAll();
        const aeropuertos = await AeropuertoModel.getAll();

        const flightDataString = flightData.map(v =>
            `Vuelo ID: ${v.id_vuelo}, Aerolínea: ${aerolineas.find(a => a.id_aerolinea === v.id_aerolinea)?.nombre_aerolinea || 'N/A'}, Origen: ${aeropuertos.find(a => a.id_aeropuerto === v.id_aeropuerto_origen)?.codigo_iata || 'N/A'}, Destino: ${aeropuertos.find(a => a.id_aeropuerto === v.id_aeropuerto_destino)?.codigo_iata || 'N/A'}, Fecha: ${v.fecha_salida}, Hora Salida: ${v.hora_salida}, Estado: ${v.estado_vuelo}`
        ).join('\n');

        // CORREGIDO: Se construye el prompt basado en la opción seleccionada para las alertas
        switch (promptType) {
            case 'alertas_criticas':
                userPrompt = `Actúa como un gestor de operaciones de aeropuerto. Analiza la siguiente lista de vuelos y genera alertas críticas y recomendaciones para la gestión. Considera posibles retrasos, congestión de puertas, falta de personal, o cualquier otro problema que puedas inferir. Presenta las alertas de forma clara y directa.\n\nLista de vuelos:\n${flightDataString}`;
                break;
            case 'sugerencias':
                userPrompt = `Analiza la siguiente lista de vuelos y proporciona sugerencias para mejorar la eficiencia y la experiencia del pasajero. Ten en cuenta los horarios, destinos y aerolíneas para dar consejos prácticos. Los vuelos son:\n\n${flightDataString}`;
                break;
            default:
                userPrompt = `Genera un resumen de la gestión de vuelos para los siguientes datos:\n\n${flightDataString}`;
                break;
        }

        await generateRta('qwen-turbo', systemPrompt, userPrompt, 1024, (chunk) => {
            res.write(chunk);
        });

        res.end();

    } catch (error) {
        console.error("Error al generar alertas de vuelos:", error);
        res.status(500).end("Error al generar alertas de vuelos: " + error.message);
    }
});

module.exports = router;