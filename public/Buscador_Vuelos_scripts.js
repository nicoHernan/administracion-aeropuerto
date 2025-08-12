document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const btnGenerarResumen = document.getElementById('btnGenerarResumen');
    const selectResumenPrompt = document.getElementById('selectResumenPrompt');
    const btnGenerarAlertas = document.getElementById('btnGenerarAlertas');
    const selectAlertasPrompt = document.getElementById('selectAlertasPrompt');
    const iaOutput = document.getElementById('iaOutput');

    /**
     * Función genérica para enviar una petición a la API de IA y manejar la respuesta en streaming.
     * @param {string} endpoint - La URL del endpoint de la API (ej: '/api/ia/resumen-vuelos').
     * @param {string} promptType - El tipo de prompt seleccionado del dropdown.
     * @param {HTMLElement} outputElement - El elemento del DOM donde se mostrará la salida.
     */
    async function callAIAPI(endpoint, promptType, outputElement) {
        outputElement.innerHTML = '<p>Generando respuesta... Por favor, espere.</p>';
        outputElement.style.color = '#333';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promptType }) // Envía el tipo de prompt seleccionado
            });

            if (!response.ok) {
                outputElement.innerHTML = `<p style="color: red;">Error: ${response.status} - ${response.statusText}.</p>`;
                console.error('Error en la respuesta del servidor:', response);
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let firstChunk = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                if (firstChunk) {
                    outputElement.innerHTML = '';
                    firstChunk = false;
                }
                outputElement.innerHTML += chunk;
            }
        } catch (error) {
            outputElement.innerHTML = `<p style="color: red;">Error al conectar con la IA: ${error.message}</p>`;
            console.error('Error en la petición de la API de IA:', error);
        }
    }

    // Event Listener para el botón "Generar Resumen de Vuelos"
    if (btnGenerarResumen && selectResumenPrompt) {
        btnGenerarResumen.addEventListener('click', () => {
            const selectedPrompt = selectResumenPrompt.value;
            callAIAPI('/home/ia/resumen-vuelos', selectedPrompt, iaOutput);
        });
    }

    // Event Listener para el botón "Generar Alertas de Vuelos"
    if (btnGenerarAlertas && selectAlertasPrompt) {
        btnGenerarAlertas.addEventListener('click', () => {
            const selectedPrompt = selectAlertasPrompt.value;
            callAIAPI('/home/ia/alertas-vuelos', selectedPrompt, iaOutput);
        });
    }
});