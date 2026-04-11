import { Injectable } from "@nestjs/common";
import { ChatbotActionsService } from "./chatbot-actions.service";

@Injectable()
export class ChatbotFlowService {
    constructor(private actions: ChatbotActionsService) { }

    async handleFlow(session: any, message: string) {

        switch (session.intent) {

            case 'AGENDAR_CITA':
                return this.handleAppointmentFlow(session, message);

            default:
                return { response: 'No hay flujo activo' };
        }
    }

    async handleAppointmentFlow(session: any, message: string) {
        // SI YA TIENE ESPECIALIDAD, NO PREGUNTAR OTRA VEZ
        if (session.data.specialty_id && session.step === null) {
            session.step = 'ASK_DOCTOR';
        }

        // si ya tiene todo, saltar flujo
        if (
            session.data.specialty_id &&
            session.data.doctor_id &&
            session.data.date &&
            session.data.time
        ) {
            session.step = 'CONFIRM';
        }

        switch (session.step) {

            // INICIO
            case null:

                if (!session.data.specialty_id) {
                    session.step = 'ASK_SPECIALTY';
                    return { response: '¿Qué especialidad necesitas?' };
                }

                if (!session.data.doctor_id) {
                    session.step = 'ASK_DOCTOR';

                    const doctors = await this.actions.getDoctorsBySpecialty(
                        session.data.specialty_id
                    );

                    if (!doctors.length) {
                        return { response: 'No hay doctores disponibles' };
                    }

                    session.data.doctors = doctors;

                    return {
                        response:
                            'Selecciona un doctor:\n' +
                            this.actions.formatDoctors(doctors).join('\n'),
                    };
                }

                break;

            // ESPECIALIDAD
            case 'ASK_SPECIALTY':
                const specialty = await this.actions.findSpecialtyByName(message);

                if (!specialty) {
                    return { response: 'Especialidad no encontrada' };
                }

                session.data.specialty_id = specialty.id;

                const doctors = await this.actions.getDoctorsBySpecialty(specialty.id);

                if (!doctors.length) {
                    return { response: 'No hay doctores disponibles' };
                }

                session.data.doctors = doctors;

                session.step = 'ASK_DOCTOR';

                return {
                    response:
                        'Selecciona un doctor:\n' +
                        this.actions.formatDoctors(doctors).join('\n'),
                };

            // DOCTOR
            case 'ASK_DOCTOR':
                const index = parseInt(message) - 1;

                if (isNaN(index) || !session.data.doctors[index]) {
                    return { response: 'Seleccion inválida' };
                }

                const doctor = session.data.doctors[index].doctors;

                session.data.doctor_id = doctor.id;
                session.data.doctor_name =
                    doctor.persons.first_name + ' ' + doctor.persons.last_name;

                session.step = 'ASK_DATE';

                return { response: '¿Qué fecha deseas? (YYYY-MM-DD)' };

            // FECHA
            case 'ASK_DATE':
                const date = new Date(message);

                if (isNaN(date.getTime())) {
                    return { response: 'Fecha inválida' };
                }

                session.data.date = message;

                const slots = await this.actions.getAvailableSlots(
                    session.data.doctor_id,
                    date,
                );

                if (!slots.length) {
                    return { response: 'No hay horarios disponibles' };
                }

                session.data.available_slots = slots;
                session.step = 'ASK_TIME';

                return {
                    response: `Horarios disponibles:\n${slots.join(', ')}`,
                };

            // HORA
            case 'ASK_TIME':
                if (!session.data.available_slots.includes(message)) {
                    return { response: 'Hora inválida' };
                }

                session.data.time = message;
                session.step = 'CONFIRM';

                return {
                    response:
                        `Confirma tu cita:\n\n` +
                        `Doctor: ${session.data.doctor_name}\n` +
                        `Fecha: ${session.data.date}\n` +
                        `Hora: ${session.data.time}\n\n` +
                        `Responde "SI" para confirmar o "NO" para cancelar`,
                };

            // CONFIRMACIÓN
            case 'CONFIRM':

                if (!session.patient_id) {
                    return {
                        response: 'Debes registrarte primero en la clínica',
                    };
                }

                if (message.toLowerCase() === 'si') {

                    await this.actions.createAppointment(session.data);

                    session.step = null;
                    session.intent = null;
                    session.data = {};

                    return { response: 'Cita agendada correctamente' };
                }

                if (message.toLowerCase() === 'no') {
                    session.step = null;
                    session.intent = null;
                    session.data = {};

                    return { response: 'Operación cancelada' };
                }

                return { response: 'Responde "SI" o "NO"' };

            default:
                return { response: 'Error en flujo' };
        }
    }
}