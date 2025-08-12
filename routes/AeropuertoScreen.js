// routes/AeropuertoScreen.js
const express = require('express');
const router = express.Router();
const { getLayout } = require('../config/Config'); // Importa getLayout desde Config.js
const { AeropuertoModel } = require('../models'); // Importa el modelo de Aeropuertos

function requireAuth(req, res, next) {
    if (!req.session || !req.session.isLoggedIn) {
        return res.redirect('/');
    }
    next();
}

/* GET Aeropuertos Screen. */
router.get('/', requireAuth, async (req, res) => {
    const layout = getLayout(req.session.isLoggedIn);
    const pageTitle = "Gestión de Aeropuertos";
    const pageSubtitle = "Administración";
    let content = `<h2>${pageTitle}</h2>`;
    let aeropuertosHtml = '';

    try {
        const aeropuertos = await AeropuertoModel.getAll();
        aeropuertosHtml = AeropuertoModel.getHtmlList(aeropuertos);
    } catch (error) {
        console.error("Error al cargar aeropuertos:", error);
        aeropuertosHtml = `<p style="color: red;">Error al cargar los aeropuertos: ${error.message}</p>`;
    }

    content += `
        <div class="actions">
            <a href="/aeropuertos/agregar" class="button">Agregar Aeropuerto</a>
        </div>
        <h3>Aeropuertos Registrados:</h3>
        <div id="aeropuertos-list">
            ${aeropuertosHtml}
        </div>
    `;

    const fullHtml = layout
        .replace('TITULO PRINCIPAL - APP', pageTitle)
        .replace('SUBTITULO - APP', pageSubtitle)
        .replace('<main>', `<main>${content}`);

    res.send(fullHtml);
});

/* GET form to add a new Aeropuerto. */
router.get('/agregar', requireAuth, (req, res) => {
    const layout = getLayout(req.session.isLoggedIn);
    const pageTitle = "Agregar Nuevo Aeropuerto";
    const pageSubtitle = "Formulario";

    const content = `
        <h2>${pageTitle}</h2>
        <form action="/aeropuertos/agregar" method="POST">
            <label for="nombre_aeropuerto">Nombre del Aeropuerto:</label><br>
            <input type="text" id="nombre_aeropuerto" name="nombre_aeropuerto" required><br><br>
            <label for="codigo_iata">Código IATA (3 caracteres):</label><br>
            <input type="text" id="codigo_iata" name="codigo_iata" maxlength="3" required><br><br>
            <label for="ciudad">Ciudad:</label><br>
            <input type="text" id="ciudad" name="ciudad" required><br><br>
            <label for="pais">País:</label><br>
            <input type="text" id="pais" name="pais" required><br><br>
            <button type="submit" class="button">Guardar Aeropuerto</button>
            <a href="/aeropuertos" class="button cancel">Cancelar</a>
        </form>
    `;

    const fullHtml = layout
        .replace('TITULO PRINCIPAL - APP', pageTitle)
        .replace('SUBTITULO - APP', pageSubtitle)
        .replace('<main>', `<main>${content}`);

    res.send(fullHtml);
});

/* POST a new Aeropuerto. */
router.post('/agregar', requireAuth, async (req, res) => {
    const { nombre_aeropuerto, codigo_iata, ciudad, pais } = req.body;
    try {
        await AeropuertoModel.insert({ nombre_aeropuerto, codigo_iata, ciudad, pais });
        res.redirect('/aeropuertos');
    } catch (error) {
        console.error("Error al agregar aeropuerto:", error);
        res.status(500).send(`
            ${getLayout(req.session.isLoggedIn)
                .replace('TITULO PRINCIPAL - APP', 'Error')
                .replace('SUBTITULO - APP', 'Error')
                .replace('<main>', `<main><p style="color: red;">Error al guardar el aeropuerto: ${error.message}</p><a href="/aeropuertos/agregar" class="button">Volver al formulario</a></main>`)
            }
        `);
    }
});

/* GET (soft) delete Aeropuerto. */
router.get('/borrar/:id', requireAuth, async (req, res) => {
    const aeropuertoId = req.params.id;
    try {
        const result = await AeropuertoModel.softDelete(aeropuertoId);
        if (result.affectedRows > 0) {
            res.redirect('/aeropuertos');
        } else {
            res.status(404).send(`
                ${getLayout(req.session.isLoggedIn)
                    .replace('TITULO PRINCIPAL - APP', 'Error')
                    .replace('SUBTITULO - APP', 'Borrar Aeropuerto')
                    .replace('<main>', `<main><p style="color: orange;">Aeropuerto con ID ${aeropuertoId} no encontrado.</p><a href="/aeropuertos" class="button">Volver a la lista</a></main>`)
                }
            `);
        }
    } catch (error) {
        console.error("Error al desactivar aeropuerto:", error);
        res.status(500).send(`
            ${getLayout(req.session.isLoggedIn)
                .replace('TITULO PRINCIPAL - APP', 'Error')
                .replace('SUBTITULO - APP', 'Borrar Aeropuerto')
                .replace('<main>', `<main><p style="color: red;">Error al desactivar el aeropuerto: ${error.message}</p><a href="/aeropuertos" class="button">Volver a la lista</a></main>`)
            }
        `);
    }
});

module.exports = router;