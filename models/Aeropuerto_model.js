const { get_connection } = require('../config/Config.js');

class AeropuertoModel {

    /**
     * Obtiene todos los aeropuertos activos de la base de datos.
     * @returns {Array} Un array de objetos con los datos de los aeropuertos.
     */
    static async getAll() {
        let conn;
        try {
            conn = await get_connection();
            const [rows] = await conn.query("SELECT * FROM aeropuertos WHERE activo = 1");
            
            let result = rows;
            
            // Si el resultado no es un array, asumimos que solo se devolvió un objeto.
            // Lo convertimos en un array para que sea compatible con el resto del código.
            if (!Array.isArray(rows)) {
                // Si la consulta no devolvió ningún objeto, retornamos un array vacío.
                if (rows === undefined || rows === null) {
                    result = [];
                } else {
                    // Si devolvió un solo objeto, lo envolvemos en un array.
                    result = [rows];
                }
                console.warn("⚠️ Advertencia: El resultado de la base de datos no es un array. Esto puede indicar una configuración inesperada del driver.");
            }
            
            // *** LÍNEA AGREGADA PARA DEPURACIÓN ***
            // Esto nos dirá cuántos registros se obtuvieron realmente.
            console.log(`Se obtuvieron ${result.length} aeropuertos de la base de datos.`);
            
            return result;
        } catch (err) {
            console.error("Error al obtener aeropuertos:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Inserta un nuevo aeropuerto en la base de datos.
     * @param {Object} aeropuertoData - Objeto con nombre_aeropuerto, codigo_iata, ciudad, pais.
     * @returns {Object} Resultado de la operación de inserción.
     */
    static async insert(aeropuertoData) {
        let conn;
        const { nombre_aeropuerto, codigo_iata, ciudad, pais } = aeropuertoData;
        try {
            conn = await get_connection();
            const [result] = await conn.query(
                'INSERT INTO aeropuertos (nombre_aeropuerto, codigo_iata, ciudad, pais, activo) VALUES (?, ?, ?, ?, 1)',
                [nombre_aeropuerto, codigo_iata, ciudad, pais]
            );
            return result;
        } catch (err) {
            console.error("Error al insertar aeropuerto:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Realiza un borrado lógico (desactivación) de un aeropuerto por su ID.
     * @param {number} id_aeropuerto - El ID del aeropuerto a desactivar.
     * @returns {Object} Resultado de la operación de actualización.
     */
    static async softDelete(id_aeropuerto) {
        let conn;
        try {
            conn = await get_connection();
            const [result] = await conn.query('UPDATE aeropuertos SET activo = 0 WHERE id_aeropuerto = ?', [id_aeropuerto]);
            return result;
        } catch (err) {
            console.error("Error al desactivar aeropuerto:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Genera una lista HTML de aeropuertos.
     * @param {Array} aeropuertos - Array de objetos aeropuerto.
     * @returns {string} HTML de la lista.
     */
    static getHtmlList(aeropuertos) {
        if (!Array.isArray(aeropuertos) || aeropuertos.length === 0) {
            return '<p>No hay aeropuertos registrados.</p>';
        }

        let html = '<ul class="entity-list">';
        for (const aeropuerto of aeropuertos) {
            html += `
                <li>
                    <div class="info-item"><strong>Nombre:</strong> ${aeropuerto.nombre_aeropuerto}</div>
                    <div class="info-item"><strong>Código IATA:</strong> ${aeropuerto.codigo_iata}</div>
                    <div class="info-item"><strong>Ciudad:</strong> ${aeropuerto.ciudad}</div>
                    <div class="info-item"><strong>País:</strong> ${aeropuerto.pais}</div>
                    <div class="actions">
                        <a href="/aeropuertos/borrar/${aeropuerto.id_aeropuerto}" class="button danger">Borrar</a>
                    </div>
                </li>
            `;
        }
        html += '</ul>';
        return html;
    }
}
module.exports = AeropuertoModel;
