// routes/VuelosScreen.js
const express = require('express');
const router = express.Router();
const { getLayout } = require('../config/Config');
const { VueloModel, AerolineaModel, AeropuertoModel } = require('../models');

// Función auxiliar para obtener el nombre de aerolínea y aeropuerto
const getFlightData = async (vuelo, aerolineas, aeropuertos) => {
    const aerolinea = aerolineas.find(a => a.id_aerolinea === vuelo.id_aerolinea);
    const aeropuertoOrigen = aeropuertos.find(a => a.id_aeropuerto === vuelo.id_aeropuerto_origen);
    const aeropuertoDestino = aeropuertos.find(a => a.id_aeropuerto === vuelo.id_aeropuerto_destino);

    return {
        ...vuelo,
        nombre_aerolinea: aerolinea ? aerolinea.nombre_aerolinea : 'N/A',
        codigo_iata_origen: aeropuertoOrigen ? aeropuertoOrigen.codigo_iata : 'N/A',
        codigo_iata_destino: aeropuertoDestino ? aeropuertoDestino.codigo_iata : 'N/A'
    };
};

// ====================================================================
// RUTAS GET: MOSTRAR VISTAS
// ====================================================================

// GET para la vista principal de gestión de vuelos
router.get('/', async (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/');
    }

    try {
        // Se obtienen todos los vuelos con la información de aerolínea y aeropuerto, incluyendo los nuevos campos
        const vuelos = await VueloModel.getAll();
        const aerolineas = await AerolineaModel.getAll();
        const aeropuertos = await AeropuertoModel.getAll();

        // Se procesa cada vuelo para obtener los detalles adicionales
        const vuelosConDetalles = await Promise.all(vuelos.map(vuelo =>
            getFlightData(vuelo, aerolineas, aeropuertos)
        ));

        let tableRows = '';
        // Se itera sobre los vuelos con detalles para construir las filas de la tabla
        vuelosConDetalles.forEach(vuelo => {
            tableRows += `
                <tr>
                    <td>${vuelo.id_vuelo}</td>
                    <td>${vuelo.nombre_aerolinea}</td>
                    <td>${vuelo.codigo_iata_origen}</td>
                    <td>${vuelo.codigo_iata_destino}</td>
                    <td>${vuelo.fecha_salida}</td>
                    <td>${vuelo.hora_salida}</td>
                    <td>${vuelo.fecha_llegada}</td>
                    <td>${vuelo.hora_llegada}</td>
                    <td>${vuelo.estado_vuelo}</td>
                    <td>
                        <a href="/vuelos/editar/${vuelo.id_vuelo}" class="button edit">Editar</a>
                        <a href="/vuelos/eliminar/${vuelo.id_vuelo}" class="button delete">Eliminar</a>
                    </td>
                </tr>
            `;
        });

        const layout = getLayout(true);
        const pageTitle = "Gestión de Vuelos";
        const pageSubtitle = "Administra los vuelos del sistema";
        
        const content = `
            <h2>${pageTitle}</h2>
            <p>${pageSubtitle}</p>
            <div class="actions">
                <a href="/vuelos/crear" class="button primary">Crear Nuevo Vuelo</a>
            </div>
            ${vuelosConDetalles.length > 0 ? `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID Vuelo</th>
                            <th>Aerolínea</th>
                            <th>Origen</th>
                            <th>Destino</th>
                            <th>Fecha Salida</th>
                            <th>Hora Salida</th>
                            <th>Fecha Llegada</th>
                            <th>Hora Llegada</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            ` : `
                <p>No se encontraron vuelos.</p>
            `}
        `;

        const fullHtml = layout
            .replace('TITULO PRINCIPAL - APP', pageTitle)
            .replace('SUBTITULO - APP', pageSubtitle)
            .replace('<main>', `<main>${content}`);

        res.send(fullHtml);

    } catch (error) {
        console.error("Error al obtener los vuelos:", error);
        res.status(500).send("Error interno del servidor.");
    }
});

// GET para el formulario de creación de vuelo
router.get('/crear', async (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/');
    }

    try {
        const aerolineas = await AerolineaModel.getAll();
        const aeropuertos = await AeropuertoModel.getAll();

        const aerolineasOptions = aerolineas.map(a => `<option value="${a.id_aerolinea}">${a.nombre_aerolinea}</option>`).join('');
        const aeropuertosOptions = aeropuertos.map(a => `<option value="${a.id_aeropuerto}">${a.codigo_iata} - ${a.nombre_aeropuerto}</option>`).join('');
        
        const estadoVueloOptions = ['En hora', 'Cancelado', 'Retrasado'];
        const estadoVueloSelectOptions = estadoVueloOptions.map(estado => `<option value="${estado}">${estado}</option>`).join('');

        const layout = getLayout(true);
        const pageTitle = "Crear Nuevo Vuelo";
        const content = `
            <h2>${pageTitle}</h2>
            <form action="/vuelos/crear" method="POST">
                <label for="id_aerolinea">Aerolínea:</label>
                <select id="id_aerolinea" name="id_aerolinea" required>${aerolineasOptions}</select><br><br>
                
                <label for="id_aeropuerto_origen">Aeropuerto de Origen:</label>
                <select id="id_aeropuerto_origen" name="id_aeropuerto_origen" required>${aeropuertosOptions}</select><br><br>
                
                <label for="id_aeropuerto_destino">Aeropuerto de Destino:</label>
                <select id="id_aeropuerto_destino" name="id_aeropuerto_destino" required>${aeropuertosOptions}</select><br><br>
                
                <label for="fecha_salida">Fecha de Salida:</label>
                <input type="date" id="fecha_salida" name="fecha_salida" required><br><br>
                
                <label for="hora_salida">Hora de Salida:</label>
                <input type="time" id="hora_salida" name="hora_salida" required><br><br>

                <!-- CAMPOS AGREGADOS: Fecha y hora de llegada -->
                <label for="fecha_llegada">Fecha de Llegada:</label>
                <input type="date" id="fecha_llegada" name="fecha_llegada" required><br><br>

                <label for="hora_llegada">Hora de Llegada:</label>
                <input type="time" id="hora_llegada" name="hora_llegada" required><br><br>

                <label for="estado_vuelo">Estado del Vuelo:</label>
                <select id="estado_vuelo" name="estado_vuelo" required>${estadoVueloSelectOptions}</select><br><br>

                <button type="submit" class="button primary">Guardar Vuelo</button>
                <a href="/vuelos" class="button">Cancelar</a>
            </form>
        `;

        const fullHtml = layout
            .replace('TITULO PRINCIPAL - APP', pageTitle)
            .replace('<main>', `<main>${content}`);
        res.send(fullHtml);

    } catch (error) {
        console.error("Error al mostrar el formulario de creación:", error);
        res.status(500).send("Error interno del servidor.");
    }
});

// GET para el formulario de edición de vuelo
router.get('/editar/:id', async (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/');
    }

    try {
        const id_vuelo = req.params.id;
        const vuelo = await VueloModel.getById(id_vuelo);
        const aerolineas = await AerolineaModel.getAll();
        const aeropuertos = await AeropuertoModel.getAll();

        if (!vuelo) {
            return res.status(404).send("Vuelo no encontrado.");
        }

        const aerolineasOptions = aerolineas.map(a => 
            `<option value="${a.id_aerolinea}" ${a.id_aerolinea === vuelo.id_aerolinea ? 'selected' : ''}>${a.nombre_aerolinea}</option>`
        ).join('');

        const aeropuertosOptions = aeropuertos.map(a => 
            `<option value="${a.id_aeropuerto}" ${a.id_aeropuerto === vuelo.id_aeropuerto_origen ? 'selected' : ''}>${a.codigo_iata} - ${a.nombre_aeropuerto}</option>`
        ).join('');

        const aeropuertosOptionsDestino = aeropuertos.map(a => 
            `<option value="${a.id_aeropuerto}" ${a.id_aeropuerto === vuelo.id_aeropuerto_destino ? 'selected' : ''}>${a.codigo_iata} - ${a.nombre_aeropuerto}</option>`
        ).join('');

        const estadoVueloOptions = ['En hora', 'Cancelado', 'Retrasado'];
        const estadoVueloSelectOptions = estadoVueloOptions.map(estado =>
            `<option value="${estado}" ${estado === vuelo.estado_vuelo ? 'selected' : ''}>${estado}</option>`
        ).join('');

        // Se ajusta el formato de la fecha para el input type="date"
        const fechaSalidaValue = vuelo.fecha_salida ? vuelo.fecha_salida.toISOString().substring(0, 10) : '';
        const fechaLlegadaValue = vuelo.fecha_llegada ? vuelo.fecha_llegada.toISOString().substring(0, 10) : '';


        const layout = getLayout(true);
        const pageTitle = `Editar Vuelo #${id_vuelo}`;
        const content = `
            <h2>${pageTitle}</h2>
            <form action="/vuelos/editar/${id_vuelo}" method="POST">
                <label for="id_aerolinea">Aerolínea:</label>
                <select id="id_aerolinea" name="id_aerolinea" required>${aerolineasOptions}</select><br><br>
                
                <label for="id_aeropuerto_origen">Aeropuerto de Origen:</label>
                <select id="id_aeropuerto_origen" name="id_aeropuerto_origen" required>${aeropuertosOptions}</select><br><br>
                
                <label for="id_aeropuerto_destino">Aeropuerto de Destino:</label>
                <select id="id_aeropuerto_destino" name="id_aeropuerto_destino" required>${aeropuertosOptionsDestino}</select><br><br>

                <label for="fecha_salida">Fecha de Salida:</label>
                <input type="date" id="fecha_salida" name="fecha_salida" value="${fechaSalidaValue}" required><br><br>
                
                <label for="hora_salida">Hora de Salida:</label>
                <input type="time" id="hora_salida" name="hora_salida" value="${vuelo.hora_salida}" required><br><br>

                <!-- CAMPOS AGREGADOS PARA LA EDICIÓN -->
                <label for="fecha_llegada">Fecha de Llegada:</label>
                <input type="date" id="fecha_llegada" name="fecha_llegada" value="${fechaLlegadaValue}" required><br><br>
                
                <label for="hora_llegada">Hora de Llegada:</label>
                <input type="time" id="hora_llegada" name="hora_llegada" value="${vuelo.hora_llegada}" required><br><br>

                <label for="estado_vuelo">Estado del Vuelo:</label>
                <select id="estado_vuelo" name="estado_vuelo" required>${estadoVueloSelectOptions}</select><br><br>

                <button type="submit" class="button primary">Actualizar Vuelo</button>
                <a href="/vuelos" class="button">Cancelar</a>
            </form>
        `;

        const fullHtml = layout
            .replace('TITULO PRINCIPAL - APP', pageTitle)
            .replace('<main>', `<main>${content}`);
        res.send(fullHtml);

    } catch (error) {
        console.error("Error al mostrar el formulario de edición:", error);
        res.status(500).send("Error interno del servidor.");
    }
});


// ====================================================================
// RUTAS POST: PROCESAR DATOS
// ====================================================================

// POST para crear un nuevo vuelo
router.post('/crear', async (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/');
    }
    const { id_aerolinea, id_aeropuerto_origen, id_aeropuerto_destino, fecha_salida, hora_salida, fecha_llegada, hora_llegada, estado_vuelo } = req.body;
    try {
        await VueloModel.create({ id_aerolinea, id_aeropuerto_origen, id_aeropuerto_destino, fecha_salida, hora_salida, fecha_llegada, hora_llegada, estado_vuelo });
        res.redirect('/vuelos');
    } catch (error) {
        console.error("Error al crear el vuelo:", error);
        res.status(500).send("Error interno del servidor al crear el vuelo.");
    }
});

// POST para actualizar un vuelo
router.post('/editar/:id', async (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/');
    }
    const id_vuelo = req.params.id;
    // CAMBIO 1: Se incluyen los campos fecha_llegada y hora_llegada
    const { id_aerolinea, id_aeropuerto_origen, id_aeropuerto_destino, fecha_salida, hora_salida, fecha_llegada, hora_llegada, estado_vuelo } = req.body;

    try {
        // CAMBIO 2: Se pasan los nuevos campos a la función de actualización del modelo
        await VueloModel.update(id_vuelo, { id_aerolinea, id_aeropuerto_origen, id_aeropuerto_destino, fecha_salida, hora_salida, fecha_llegada, hora_llegada, estado_vuelo });
        res.redirect('/vuelos');
    } catch (error) {
        console.error("Error al actualizar el vuelo:", error);
        res.status(500).send("Error interno del servidor al actualizar el vuelo.");
    }
});

// GET para eliminar un vuelo
router.get('/eliminar/:id', async (req, res) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/');
    }
    const id_vuelo = req.params.id;
    try {
        await VueloModel.deleteById(id_vuelo);
        res.redirect('/vuelos');
    } catch (error) {
        console.error("Error al eliminar el vuelo:", error);
        res.status(500).send("Error interno del servidor al eliminar el vuelo.");
    }
});

module.exports = router;
