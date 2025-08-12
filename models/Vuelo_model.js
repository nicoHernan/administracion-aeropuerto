// models/VueloModel.js
const { get_connection } = require('../config/Config.js');

class VueloModel {

    /**
     * Obtiene todos los vuelos activos con detalles de aerolínea y aeropuertos de origen/destino.
     * @returns {Array} Un array de objetos con los datos de los vuelos.
     */
    static async getAll() {
        let conn;
        try {
            conn = await get_connection();
            // CORRECCIÓN: Se actualiza la consulta para obtener también los datos de fecha y hora de llegada
            const [rows] = await conn.query(`
                SELECT
                    vuelos.id_vuelo,
                    vuelos.codigo_vuelo,
                    vuelos.id_aerolinea,
                    vuelos.id_aeropuerto_origen,
                    vuelos.id_aeropuerto_destino,
                    vuelos.fecha_salida,
                    vuelos.hora_salida,
                    vuelos.fecha_llegada,
                    vuelos.hora_llegada,
                    vuelos.estado_vuelo,
                    aerolineas.nombre_aerolinea,
                    aerolineas.codigo_aerolinea
                FROM vuelos
                JOIN aerolineas ON vuelos.id_aerolinea = aerolineas.id_aerolinea
                WHERE vuelos.activo = TRUE
            `);
            return rows;
        } catch (error) {
            console.error("Error al obtener vuelos:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Obtiene un vuelo por su ID.
     * Esta función es necesaria para la ruta de edición.
     * @param {number} id_vuelo - El ID del vuelo a buscar.
     * @returns {Object|null} El objeto del vuelo o null si no se encuentra.
     */
    static async getById(id_vuelo) {
        let conn;
        try {
            conn = await get_connection();
            const [rows] = await conn.query("SELECT * FROM vuelos WHERE id_vuelo = ?", [id_vuelo]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error("Error al obtener vuelo por ID:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Inserta un nuevo vuelo en la base de datos.
     * Ahora recibe explícitamente los campos 'fecha_llegada' y 'hora_llegada' y los inserta directamente.
     * @param {Object} vueloData - Objeto con los datos del vuelo, incluyendo fecha y hora de llegada.
     * @returns {Object} Resultado de la operación de inserción.
     */
    static async create(vueloData) {
        let conn;
        const { 
            id_aerolinea, 
            id_aeropuerto_origen, 
            id_aeropuerto_destino, 
            fecha_salida, 
            hora_salida, 
            fecha_llegada, 
            hora_llegada, 
            estado_vuelo 
        } = vueloData;
        
        const codigo_vuelo = `VUELO-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        
        try {
            conn = await get_connection();
            const result = await conn.query(
                `INSERT INTO vuelos (
                    codigo_vuelo,
                    id_aerolinea,
                    id_aeropuerto_origen,
                    id_aeropuerto_destino,
                    fecha_salida,
                    hora_salida,
                    fecha_llegada,
                    hora_llegada,
                    estado_vuelo,
                    activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
                [
                    codigo_vuelo,
                    id_aerolinea,
                    id_aeropuerto_origen,
                    id_aeropuerto_destino,
                    fecha_salida,
                    hora_salida,
                    fecha_llegada,
                    hora_llegada,
                    estado_vuelo
                ]
            );
            return result;
        } catch (error) {
            console.error("Error al crear vuelo:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Actualiza un vuelo existente en la base de datos.
     * Se han actualizado los campos 'fecha_llegada' y 'hora_llegada' para que coincida con el modelo de datos actual.
     * @param {number} id_vuelo - El ID del vuelo a actualizar.
     * @param {Object} vueloData - Objeto con los datos del vuelo.
     * @returns {Object} Resultado de la operación de actualización.
     */
    static async update(id_vuelo, vueloData) {
        let conn;
        const { id_aerolinea, id_aeropuerto_origen, id_aeropuerto_destino, fecha_salida, hora_salida, fecha_llegada, hora_llegada, estado_vuelo } = vueloData;
        try {
            conn = await get_connection();
            const result = await conn.query(
                `UPDATE vuelos SET
                    id_aerolinea = ?,
                    id_aeropuerto_origen = ?,
                    id_aeropuerto_destino = ?,
                    fecha_salida = ?,
                    hora_salida = ?,
                    fecha_llegada = ?,
                    hora_llegada = ?,
                    estado_vuelo = ?
                WHERE id_vuelo = ?`,
                [id_aerolinea, id_aeropuerto_origen, id_aeropuerto_destino, fecha_salida, hora_salida, fecha_llegada, hora_llegada, estado_vuelo, id_vuelo]
            );
            return result;
        } catch (error) {
            console.error("Error al actualizar vuelo:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Realiza un borrado lógico (soft delete) de un vuelo.
     * @param {number} id_vuelo - El ID del vuelo a desactivar.
     * @returns {Object} Resultado de la operación de actualización.
     */
    static async softDelete(id_vuelo) {
        let conn;
        try {
            conn = await get_connection();
            const [result] = await conn.query("UPDATE vuelos SET activo = FALSE WHERE id_vuelo = ?", [id_vuelo]);
            return result;
        } catch (error) {
            console.error("Error al realizar borrado lógico de vuelo:", error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Elimina un vuelo por su ID (realiza un borrado lógico).
     * Esta función es necesaria para la ruta de eliminación.
     * @param {number} id_vuelo - El ID del vuelo a eliminar.
     * @returns {Object} Resultado de la operación de eliminación.
     */
    static async deleteById(id_vuelo) {
        // Llama a softDelete, que realiza el borrado lógico
        return this.softDelete(id_vuelo);
    }
}

module.exports = VueloModel;

