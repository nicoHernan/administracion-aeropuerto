const mysql = require('mysql2/promise'); // Usamos el driver mysql2/promise

// --- Configuración de la Base de Datos ---
const dbConfig = {
    host: 'localhost',
    user: 'nico', // Tu usuario
    password: '2352', // Tu contraseña
    database: 'buscador_vuelos_db', // Tu base de datos
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Crear un pool de conexiones para reutilizar conexiones a la base de datos
const pool = mysql.createPool(dbConfig);

/**
 * Obtiene una conexión del pool de conexiones.
 * @returns {Promise<mysql.PoolConnection>} Una conexión a la base de datos.
 */
async function get_connection() {
    let conn;
    try {
        conn = await pool.getConnection();
        return conn;
    } catch (err) {
        console.error('Error al obtener la conexión de la base de datos:', err);
        throw err;
    }
}

// --- Layout HTML Reutilizable ---
const getLayout = (isLoggedIn = false) => {
    const navLinks = isLoggedIn
        ? `
            <a href="/vuelos">Vuelos</a>
            <a href="/aeropuertos">Aeropuertos</a>
            <a href="/aerolineas">Aerolíneas</a>
            <a href="/logout" class="button danger">Cerrar Sesión</a>
        `
        : '';
    
    // Este código genera un layout completo y seguro
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TITULO PRINCIPAL - APP</title>
    <link rel="stylesheet" href="/Buscador_Vuelos_css.css">
    <script src="/Buscador_Vuelos_scripts.js"></script>
</head>
<body>
    <div class="grid-container">
        <header>
            <h1>SUBTITULO - APP</h1>
        </header>
        <nav>
            <ul>
                <li><a href='/home'>Home</a></li>
                ${navLinks}
            </ul>
        </nav>
        <main>
            <!-- CONTENIDO DE LA PAGINA SE INSERTA AQUI -->
        </main>
        <footer>
            <p>&copy; 2025 Buscador de Vuelos. Todos los derechos reservados.</p>
        </footer>
    </div>
</body>
</html>
    `;
};

// --- Exportaciones ---
module.exports = { get_connection, getLayout };