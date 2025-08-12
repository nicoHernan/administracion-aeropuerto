// models/Aerolinea_model.js
const { get_connection } = require('../config/Config.js'); // CORREGIDO: 'Config' con mayúscula

class AerolineaModel {

    /**
     * Obtiene todas las aerolíneas activas de la base de datos.
     * @returns {Array} Un array de objetos con los datos de las aerolíneas.
     */
    static async getAll() {
        let conn;
        try {
            conn = await get_connection();
            const [rows] = await conn.query("SELECT id_aerolinea, nombre_aerolinea, codigo_aerolinea FROM aerolineas WHERE activo = TRUE");
            return rows;
        } catch (err) {
            console.error("Error al obtener aerolíneas:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Inserta una nueva aerolínea en la base de datos.
     * @param {Object} aerolineaData - Objeto con nombre_aerolinea y codigo_aerolinea.
     * @returns {Object} Resultado de la operación de inserción.
     */
    static async insert(aerolineaData) {
        let conn;
        try {
            conn = await get_connection();
            const result = await conn.query(
                "INSERT INTO aerolineas (nombre_aerolinea, codigo_aerolinea) VALUES (?, ?)",
                [aerolineaData.nombre_aerolinea, aerolineaData.codigo_aerolinea]
            );
            return result;
        } catch (err) {
            console.error("Error al insertar aerolínea:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Realiza un borrado lógico (desactivación) de una aerolínea por su ID.
     * @param {number} id_aerolinea - El ID de la aerolínea a desactivar.
     * @returns {Object} Resultado de la operación de actualización.
     */
    static async softDelete(id_aerolinea) {
        let conn;
        try {
            conn = await get_connection();
            // En lugar de DELETE, actualizamos la columna 'activo' a FALSE
            const result = await conn.query("UPDATE aerolineas SET activo = FALSE WHERE id_aerolinea = ?", [id_aerolinea]);
            return result;
        } catch (err) {
            console.error("Error al realizar borrado lógico de aerolínea:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Genera una tabla HTML con la lista de aerolíneas activas.
     * @param {Array} aerolineas - Array de objetos aerolínea.
     * @returns {string} HTML de la tabla.
     */
    static getHtmlList(aerolineas) {
        if (!aerolineas || aerolineas.length === 0) {
            return "<p>No hay aerolíneas registradas.</p>";
        }
        let html = `<table>
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Código</th>
                <th>Acciones</th>
            </tr>`;
        aerolineas.forEach(a => {
            html += `<tr>
                <td>${a.id_aerolinea}</td>
                <td>${a.nombre_aerolinea}</td>
                <td>${a.codigo_aerolinea}</td>
                <td><a href="/aerolineas/borrar/${a.id_aerolinea}" class="button danger" onclick="return confirm('¿Estás seguro de que quieres DESACTIVAR esta aerolínea? Los vuelos asociados a esta aerolínea seguirán existiendo pero no serán visibles en búsquedas normales.');">Desactivar</a></td>
            </tr>`;
        });
        html += "</table>";
        return html;
    }

    /**
     * Genera un dropdown (select HTML) de aerolíneas activas.
     * @param {Array} aerolineas - Array de objetos aerolínea.
     * @param {string} nameAttribute - El valor del atributo 'name' para el select.
     * @returns {string} HTML del select.
     */
    static getHtmlDropdown(aerolineas, nameAttribute = 'id_aerolinea') {
        if (!aerolineas || aerolineas.length === 0) {
            return `<select name='${nameAttribute}' disabled><option value=''>No hay aerolíneas</option></select>`;
        }
        let html = `<select name='${nameAttribute}'>`;
        aerolineas.forEach(a => {
            html += `<option value='${a.id_aerolinea}'>${a.nombre_aerolinea} (${a.codigo_aerolinea})</option>`;
        });
        html += "</select>";
        return html;
    }
}

module.exports = AerolineaModel;