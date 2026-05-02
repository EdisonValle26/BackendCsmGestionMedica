import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ChatbotActionsService } from "./chatbot-actions.service";

@Injectable()
export class ChatbotFlowService {
    constructor(
        private actions: ChatbotActionsService,
        private prisma: PrismaService
    ) { }

    async handleFlow(session: any, message: string) {

        const steps = await this.getFlowSteps(session.intent_id);

        if (!steps.length) {
            return { response: 'No hay flujo configurado' };
        }

        let currentStepIndex = session.step ?? 0;

        const currentStep = steps[currentStepIndex];

        // guardar respuesta del usuario
        if (currentStepIndex > 0) {
            const prevStep = steps[currentStepIndex - 1];

            let value: any = message;

            if (prevStep.field_name === 'date') {
                value = this.actions.parseDate(message);
            }

            if (prevStep.field_name === 'time') {
                value = this.actions.parseTime(message);
            }

            if (prevStep.field_name === 'doctor_id') {
                const number = message.match(/\d+/); // extrae número
                const index = number ? parseInt(number[0]) - 1 : -1;

                value = session.data.doctors?.[index]?.doctors?.id;
            }

            // solo sobrescribir si el valor es válido
            const field = prevStep.field_name!;

            if (field === 'date' || field === 'time' || field === 'doctor_id') {
                if (value !== null && value !== undefined) {
                    session.data[field] = value;
                }
            } else {
                // campos normales (nombre, apellido, etc)
                session.data[field] = value;
            }
        }

        // si terminó flujo
        if (currentStepIndex >= steps.length) {
            return this.executeFinalAction(session);
        }

        // avanzar
        session.step = currentStepIndex + 1;

        return { response: currentStep.question };
    }

    async executeFinalAction(session: any) {

        const intentDb = await this.prisma.chatbot_intents.findUnique({
            where: { id: session.intent_id }
        });

        const intentName = intentDb?.name;

        // AGENDAR CITA
        if (intentName === 'AGENDAR_CITA') {
            console.log('DATA FINAL CITA:', session.data);
            if (!session.patient_id) {
                return { response: 'Primero debes registrarte' };
            }

            const result = await this.actions.createAppointment({
                patient_id: session.patient_id,
                specialty_id: session.data.specialty_id,
                doctor_id: session.data.doctor_id,
                date: session.data.date,
                time: session.data.time,
            });

            session.intent_id = null;
            session.step = null;
            session.data = {};

            if (!result) {
                return { response: 'No se pudo crear la cita, faltan datos' };
            }

            return { response: 'Cita creada correctamente' };
        }

        // REGISTRAR PACIENTE
        if (intentName === 'REGISTRAR_PACIENTE') {

            if (session.data.confirm?.toLowerCase() !== 'si') {
                return { response: 'Registro cancelado' };
            }

            const patient = await this.actions.createPatient(session.data);

            session.patient_id = patient.id;

            // VOLVER AL INTENT ANTERIOR
            if (session.data.previous_intent_id) {

                const previousData = {
                    specialty_id: session.data.specialty_id,
                    doctor_id: session.data.doctor_id,
                    date: session.data.date,
                    time: session.data.time,
                    doctors: session.data.doctors
                };


                session.intent_id = session.data.previous_intent_id;

                session.step = session.step ?? 0;

                session.data = previousData;

                return { response: 'Paciente registrado. Continuemos...' };
            }

            session.intent_id = null;
            session.step = null;
            session.data = {};

            return { response: 'Paciente registrado correctamente' };
        }

        return { response: 'Flujo completado' };
    }

    async getFlowSteps(intentId: number) {

        if (!intentId) return [];

        return this.prisma.chatbot_flows.findMany({
            where: { intent_id: intentId },
            orderBy: { step_order: 'asc' }
        });
    }
}