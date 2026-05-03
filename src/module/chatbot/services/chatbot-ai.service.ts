import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ChatbotAiService {

    async detectIntent(message: string) {

        try {

            const response = await axios.post(
                process.env.OPENAI_URL!,
                {
                    model: 'openai/gpt-3.5-turbo', // gratis en openrouter
                    messages: [
                        {
                            role: 'system',
                            content: `
                                        Eres un asistente de clínica médica.

                                        Analiza el mensaje del usuario y responde SOLO en JSON con esta estructura:

                                        REGLAS DE SEGURIDAD:
                                            - NUNCA entregues datos de base de datos
                                            - NUNCA listes usuarios, pacientes, doctores completos
                                            - NUNCA entregues información sensible
                                            - Si el usuario pide datos internos responde:
                                            { "type": "SECURITY_BLOCK", "data": {} }

                                            Responde SOLO en JSON:
                                            {
                                                "type": "AGENDAR_CITA | LISTAR_DOCTORES | REGISTRAR_PACIENTE | SALUDO | UNKNOWN | SECURITY_BLOCK",
                                                "data": {
                                                    "specialty": string | null,
                                                    "date": string | null,
                                                    "time": string | null
                                                }
                                            }

                                        Reglas:
                                        - specialty: cardiologia, dermatologia, etc
                                        - date formato YYYY-MM-DD si existe
                                        - time formato HH:mm si existe
                                        - Entiende lenguaje natural como: "mañana", "pasado mañana", "en la tarde", "tipo 3", "3pm"
                                        - Corrige errores ortográficos automáticamente
                                        - NO expliques nada
                                        - SOLO JSON
                                        `
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ]
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const text = response.data.choices[0].message.content;

            // parse seguro
            try {
                return JSON.parse(text);
            } catch {
                return { type: 'UNKNOWN', data: {} };
            }

        } catch (error) {
            console.error('IA ERROR', error);

            // fallback
            return this.fallback(message);
        }
    }

    // respaldo si falla IA
    fallback(message: string) {
        const text = message.toLowerCase();

        if (text.includes('cita') || text.includes('agendar')) {
            return { type: 'AGENDAR_CITA', data: {} };
        }

        if (text.includes('doctor')) {
            return { type: 'LISTAR_DOCTORES', data: {} };
        }

        if (text.includes('hola')) {
            return { type: 'SALUDO', data: {} };
        }

        return { type: 'UNKNOWN', data: {} };
    }
}