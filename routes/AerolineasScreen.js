// AEROLINEASCREEN
const express = require('express');
const router = express.Router();
const { getLayout } = require('../config/config');
const { AerolineaModel } = require('../models');

// Middleware de autenticación (¡NUEVO!)
// Esta función se ejecutará antes de CADA ruta en este router para protegerla.
function requireAuth(req, res, next) {
    if (!req.session || !req.session.isLoggedIn) {
        // Si el usuario no está logueado, redirige al login
        return res.redirect('/');
    }
    next(); // Si está logueado, permite que la solicitud continúe a la ruta
}

/* GET Aerolineas Screen. */
// ¡NUEVO! Aplica el middleware requireAuth a esta ruta
router.get('/', requireAuth, async (req, res) => {
    // ¡NUEVO! Pasamos el estado de login a getLayout
    const layout = getLayout(req.session.isLoggedIn); 
    const pageTitle = "Gestión de Aerolíneas";
    const pageSubtitle = "Administración";
    let content = `<h2>${pageTitle}</h2>`;
    let aerolineasHtml = '';

    try {
        const aerolineas = await AerolineaModel.getAll(); // Obtiene solo aerolíneas activas
        aerolineasHtml = AerolineaModel.getHtmlList(aerolineas);
    } catch (error) {
        console.error("Error al cargar aerolíneas:", error);
        aerolineasHtml = `<p style="color: red;">Error al cargar las aerolíneas: ${error.message}</p>`;
    }

    // Botones de acción
    content += `
        <div class="actions">
            <a href="/aerolineas/agregar" class="button">Agregar Aerolínea</a>
            <a href="/aerolineas/lista" class="button">Listar Aerolíneas</a>
        </div>
        <h3>Aerolíneas Registradas:</h3>
        <div id="aerolineas-list">
            ${aerolineasHtml}
        </div>
    `;

    const fullHtml = layout
        .replace('TITULO PRINCIPAL - APP', pageTitle)
        .replace('SUBTITULO - APP', pageSubtitle)
        .replace('<main>', `<main>${content}`);

    res.send(fullHtml);
});

/* GET form to add a new Aerolinea. */
// ¡NUEVO! Aplica el middleware requireAuth a esta ruta
router.get('/agregar', requireAuth, (req, res) => {
    // ¡NUEVO! Pasamos el estado de login a getLayout
    const layout = getLayout(req.session.isLoggedIn);
    const pageTitle = "Agregar Nueva Aerolínea";
    const pageSubtitle = "Formulario";

    const content = `
        <h2>${pageTitle}</h2>
        <form action="/aerolineas/agregar" method="POST">
            <label for="nombre_aerolinea">Nombre de la Aerolínea:</label><br>
            <input type="text" id="nombre_aerolinea" name="nombre_aerolinea" required><br><br>
            <label for="codigo_aerolinea">Código de la Aerolínea (Max 7 caracteres):</label><br>
            <input type="text" id="codigo_aerolinea" name="codigo_aerolinea" maxlength="7" required><br><br>
            <button type="submit">Guardar Aerolínea</button>
            <a href="/aerolineas" class="button cancel">Cancelar</a>
        </form>
    `;

    const fullHtml = layout
        .replace('TITULO PRINCIPAL - APP', pageTitle)
        .replace('SUBTITULO - APP', pageSubtitle)
        .replace('<main>', `<main>${content}`);

    res.send(fullHtml);
});

/* POST a new Aerolinea. */
// ¡NUEVO! Aplica el middleware requireAuth a esta ruta
router.post('/agregar', requireAuth, async (req, res) => {
    const { nombre_aerolinea, codigo_aerolinea } = req.body;
    try {
        await AerolineaModel.insert({ nombre_aerolinea, codigo_aerolinea });
        res.redirect('/aerolineas');
    } catch (error) {
        console.error("Error al agregar aerolínea:", error);
        // ¡NUEVO! Pasamos el estado de login a getLayout en caso de error
        res.status(500).send(`
            ${getLayout(req.session.isLoggedIn)
                .replace('TITULO PRINCIPAL - APP', 'Error')
                .replace('SUBTITULO - APP', 'Error')
                .replace('<main>', `<main><p style="color: red;">Error al guardar la aerolínea: ${error.message}</p><a href="/aerolineas/agregar">Volver al formulario</a></main>`)
            }
        `);
    }
});

/* GET list of all Aerolineas. */
// ¡NUEVO! Aplica el middleware requireAuth a esta ruta
router.get('/lista', requireAuth, async (req, res) => {
    // ¡NUEVO! Pasamos el estado de login a getLayout
    const layout = getLayout(req.session.isLoggedIn);
    const pageTitle = "Listado de Aerolíneas";
    const pageSubtitle = "Consulta";
    let aerolineasHtml = '';

    try {
        const aerolineas = await AerolineaModel.getAll(); // Obtiene solo aerolíneas activas
        aerolineasHtml = AerolineaModel.getHtmlList(aerolineas);
    } catch (error) {
        console.error("Error al listar aerolíneas:", error);
        aerolineasHtml = `<p style="color: red;">Error al cargar las aerolíneas: ${error.message}</p>`;
    }

    const content = `
        <h2>${pageTitle}</h2>
        <div id="aerolineas-list">
            ${aerolineasHtml}
        </div>
        <p><a href="/aerolineas" class="button">Volver a Gestión de Aerolíneas</a></p>
    `;

    const fullHtml = layout
        .replace('TITULO PRINCIPAL - APP', pageTitle)
        .replace('SUBTITULO - APP', pageSubtitle)
        .replace('<main>', `<main>${content}`);

    res.send(fullHtml);
});

/* GET (soft) delete Aerolinea. */
// ¡NUEVO! Aplica el middleware requireAuth a esta ruta
router.get('/borrar/:id', requireAuth, async (req, res) => {
    const aerolineaId = req.params.id;
    try {
        // Usamos el método softDelete
        const result = await AerolineaModel.softDelete(aerolineaId);
        if (result.affectedRows > 0) {
            res.redirect('/aerolineas/lista'); // Redirige de vuelta a la lista
        } else {
            // ¡NUEVO! Pasamos el estado de login a getLayout en caso de error
            res.status(404).send(`
                ${getLayout(req.session.isLoggedIn)
                    .replace('TITULO PRINCIPAL - APP', 'Error')
                    .replace('SUBTITULO - APP', 'Borrar Aerolínea')
                    .replace('<main>', `<main><p style="color: orange;">Aerolínea con ID ${aerolineaId} no encontrada o ya estaba inactiva.</p><a href="/aerolineas/lista">Volver a la lista</a></main>`)
                }
            `);
        }
    } catch (error) {
        console.error("Error al desactivar aerolínea:", error);
        // ¡NUEVO! Pasamos el estado de login a getLayout en caso de error
        res.status(500).send(`
            ${getLayout(req.session.isLoggedIn)
                .replace('TITULO PRINCIPAL - APP', 'Error')
                .replace('SUBTITULO - APP', 'Borrar Aerolínea')
                .replace('<main>', `<main><p style="color: red;">Error al desactivar la aerolínea: ${error.message}</p><a href="/aerolineas/lista">Volver a la lista</a></main>`)
            }
        `);
    }
});

module.exports = router;