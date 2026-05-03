import { Injectable } from '@nestjs/common';
import { ChatbotSessionData } from 'src/common/Interfaces/chatbot-session-data.interface';
import { ChatbotActionsService } from './services/chatbot-actions.service';
import { ChatbotAiService } from './services/chatbot-ai.service';
import { ChatbotFlowService } from './services/chatbot-flow.service';
import { ChatbotSessionService } from './services/chatbot-session.service';

@Injectable()
export class ChatbotService {
    constructor(
        private ai: ChatbotAiService,
        private sessionService: ChatbotSessionService,
        private flowService: ChatbotFlowService,
        private actions: ChatbotActionsService,
    ) { }

    async processMessage(dto: any) {
        const sessionId = dto.session_id;

        const sessionDb = await this.sessionService.getSession(sessionId);
        const data = (sessionDb.data as ChatbotSessionData) || {};

        // convertir a objeto manejable
        const session = {
            intent_id: sessionDb.intent_id,
            step: sessionDb.step || 0,
            data: (sessionDb.data as ChatbotSessionData) || {},
            patient_id: sessionDb.patient_id,
        };

        // detectar paciente automáticamente
        if (!session.patient_id) {
            const person = await this.actions.findPatientByPhone(sessionId);

            if (person?.patients?.length) {
                session.patient_id = person.patients[0].id;
            }
        }

        // detectar intención de registro manual
        if (!session.patient_id && dto.message.toLowerCase().includes('registr')) {

            session.data.previous_intent_id = session.intent_id!;

            const registerIntent = await this.actions.findIntentByName('REGISTRAR_PACIENTE');

            session.intent_id = registerIntent?.id!;
            session.step = 0;

            session.data.phone = sessionId;
        }

        // flujo activo
        if (session.intent_id) {

            const response = await this.flowService.handleFlow(
                session,
                dto.message,
            );

            if (response?.response === 'Paciente registrado. Continuemos...') {

                const next = await this.flowService.handleFlow(
                    session,
                    dto.message,
                );

                await this.sessionService.updateSession(sessionId, session);

                return next;
            }

            await this.sessionService.updateSession(sessionId, session);
            return response;
        }

        //Clean Message
        const cleanMessage = await this.normalizeText(dto.message);

        // IA
        const intent = await this.ai.detectIntent(cleanMessage);

        let intentType = intent.type;

        if (intentType === 'SECURITY_BLOCK') {
            return {
                response: 'No puedo proporcionar ese tipo de información 😊'
            };
        }

        // mapear intención
        if (intentType === 'LISTAR_DOCTORES') {
            intentType = 'AGENDAR_CITA';
        }

        const intentDb = await this.actions.findIntentByName(intentType);

        if (!session.intent_id && intentDb) {
            session.intent_id = intentDb.id;
        }

        const forbiddenWords = [
            'usuarios',
            'base de datos',
            'todos los pacientes',
            'contraseñas',
            'registros',
        ];

        const text = dto.message.toLowerCase();

        if (forbiddenWords.some(w => text.includes(w))) {
            return {
                response: 'No puedo ayudarte con esa información.'
            };
        }

        // SIEMPRE intentar rellenar datos
        if (intent.data) {

            if (intent.data.specialty && !session.data.specialty_id) {
                const specialty = await this.actions.findSpecialtyByName(
                    intent.data.specialty
                );

                if (specialty) {
                    session.data.specialty_id = specialty.id;

                    const doctors = await this.actions.getDoctorsBySpecialty(specialty.id);

                    if (!doctors.length) {
                        await this.sessionService.updateSession(sessionId, session);
                        return { response: 'No hay doctores disponibles' };
                    }

                    session.data.doctors = doctors;
                    session.step = 1;
                }
            }

            if (intent.data.date && !session.data.date && session.data.date) {
                session.data.date = this.actions.parseDate(intent.data.date);
            }

            if (intent.data.time && !session.data.time) {
                session.data.time = this.actions.parseTime(intent.data.time);
            }
        }

        const response = await this.flowService.handleFlow(
            session,
            dto.message,
        );

        await this.sessionService.updateSession(sessionId, session);

        return response;
    }

    handleWhatsappWebhook(body: any) {
        const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (!message) return;

        const dto = {
            session_id: message.from, //teléfono
            message: message.text.body,
        };

        return this.processMessage(dto);
    }

    async normalizeText(text: string): Promise<string> {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // quitar tildes
            .replace(/manana/g, "mañana")
            .replace(/manan/g, "mañana")
            .replace(/miercoles/g, "miércoles")
            .replace(/sabado/g, "sábado");
    }
}