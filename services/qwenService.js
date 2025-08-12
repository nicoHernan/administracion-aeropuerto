process.removeAllListeners('warning');

const OpenAI = require("openai");

/**
 * Genera una respuesta de un modelo LLM (Large Language Model) como Qwen.
 * Soporta streaming de la respuesta.
 * @param {string} llm - El nombre del modelo LLM a usar (ej: "qwen-turbo-latest").
 * @param {string} p_system - El mensaje de rol 'system' para el LLM.
 * @param {string} p_prompt - El mensaje de rol 'user' (la pregunta o instrucción).
 * @param {number} p_max_tokens - El número máximo de tokens en la respuesta.
 * @param {function} onChunk - Callback que se llama con cada chunk de la respuesta en streaming.
 * @returns {Promise<string>} Promesa que resuelve con el contenido completo de la respuesta del LLM.
 */
const generateRta = async (llm, p_system, p_prompt, p_max_tokens, onChunk) => {
    try {
        const mensaje = [
            { role: "system", content: p_system },
            { role: "user", content: p_prompt }
        ];

        const openai = new OpenAI({
            apiKey: "sk-a2da3ff3ba834415a271077f658783ce", // API Key proporcionada por el profesor
            baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
        });

        const completion = await openai.chat.completions.create({
            model: llm,
            messages: mensaje,
            stream: true,
            stream_options: {
                include_usage: true
            },
            temperature: 0.2,
            enable_thinking: false, // si verdadero: agregar limit_thinking_length:xx max_tokens del thinking
            max_tokens: p_max_tokens
        });

        console.log("Streaming output from Qwen service...");

        return new Promise(async (resolve, reject) => {
            try {
                let fullContent = "";

                for await (const chunk of completion) {
                    if (Array.isArray(chunk.choices) && chunk.choices.length > 0) {
                        const content = chunk.choices[0].delta?.content || "";
                        fullContent += content;
                        onChunk(content); // Llama al callback con cada chunk
                    }
                }
                resolve(fullContent); // Resuelve la promesa con el contenido completo
            } catch (error) {
                reject(new Error(`Stream error from Qwen: ${error.message}`));
            }
        });

    } catch (error) {
        console.error("Error al consultar LLM (Qwen):", error.response?.data || error.message);
        throw new Error(`Fallo al generar respuesta de Qwen: ${error.message}`);
    }
};

// Exporta la función para que pueda ser utilizada por otros módulos
module.exports = {
    generateRta
};