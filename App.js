const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

// Importar los routers (controladores de rutas)
const homeRouter = require('./routes/HomeScreen');
const vuelosRouter = require('./routes/VuelosScreen');
const aerolineasRouter = require('./routes/AerolineasScreen');
const aeropuertoRouter = require('./routes/AeropuertoScreen');

// --- MIDDLEWARES DE EXPRESS ---

// Middleware para servir archivos estáticos (CSS, JS del frontend, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear bodies de solicitudes URL-encoded (datos de formularios HTML)
app.use(express.urlencoded({ extended: true }));

// Middleware para parsear bodies de solicitudes JSON (útil para APIs)
app.use(express.json());

// Configuración y uso del middleware de sesión
app.use(session({
    secret: 'tu_secreto_muy_seguro_y_largo_aqui_!@#$', // ¡IMPORTANTE! Cambia esto por una cadena de caracteres aleatoria y compleja en producción.
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // La cookie de sesión expira en 24 horas
    }
}));


// --- USO DE LAS RUTAS ---
app.use('/', homeRouter);
app.use('/vuelos', vuelosRouter);
app.use('/aerolineas', aerolineasRouter);
app.use('/aeropuertos', aeropuertoRouter);

// --- RUTA PARA CERRAR SESIÓN ---
// Este es el código que necesitas agregar
app.get('/logout', (req, res) => {
    // Si la sesión existe, la destruimos
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                // Manejo del error al destruir la sesión
                console.error("Error al destruir la sesión:", err);
                return res.redirect('/home');
            }
            // Redirigimos al usuario a la página de inicio
            res.redirect('/');
        });
    } else {
        // Si no hay sesión, simplemente redirigimos
        res.redirect('/');
    }
});


// --- MANEJO DE ERRORES (Opcional, pero buena práctica) ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    const { getLayout } = require('./config/Config');
    
    const errorPageHtml = getLayout(req.session && req.session.isLoggedIn)
        .replace('TITULO PRINCIPAL - APP', 'Error del Servidor')
        .replace('SUBTITULO - APP', 'Ha ocurrido un problema')
        .replace('<main>', `<main>
            <h2 style="color: red;">¡Oops! Algo salió mal.</h2>
            <p>Lo sentimos, ha ocurrido un error interno en el servidor.</p>
            <pre>${err.message}</pre>
            <p><a href="/" class="button">Volver al inicio</a></p>
        </main>`);
    res.status(500).send(errorPageHtml);
});

// --- INICIO DEL SERVIDOR ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express ejecutándose en http://localhost:${PORT}`);
    console.log('Presiona Ctrl+C para detenerlo.');
});