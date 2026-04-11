import { Injectable } from '@nestjs/common';
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
        private actions: ChatbotActionsService
    ) { }

    async processMessage(dto: any) {
        const sessionId = dto.session_id;

        const sessionDb = await this.sessionService.getSession(sessionId);

        // convertir a objeto manejable
        const session = {
            intent: sessionDb.intent,
            step: sessionDb.step,
            data: (sessionDb.data as any) || {},
            patient_id: sessionDb.patient_id,
        };

        // detectar paciente automáticamente
        if (!session.patient_id) {
            const person = await this.actions.findPatientByPhone(sessionId);

            if (person?.patients?.length) {
                session.patient_id = person.patients[0].id;
            }
        }

        // flujo activo
        if (session.intent) {
            const response = await this.flowService.handleFlow(
                session,
                dto.message,
            );

            await this.sessionService.updateSession(sessionId, session);
            return response;
        }

        // IA
        const intent = await this.ai.detectIntent(dto.message);

        // actualizar intent solo si no existe
        if (!session.intent) {
            session.intent = intent.type;
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
                    session.step = 'ASK_DOCTOR';
                }
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
}