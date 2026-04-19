import {
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { BaseDto } from 'src/dto/base.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
    constructor(private prisma: PrismaService) { }

    async findAll(query: BaseDto) {

        let page = Number(query.skip) || 1;
        let limit = Number(query.take) || 10;

        let where: any = {};

        // 🔴 status (activo / inactivo)
        if (query.status) {
            where.deleted_at =
                query.status === 'I'
                    ? { not: null }
                    : null;
        } else {
            where.deleted_at = null;
        }

        // 🔎 filtros dinámicos
        if (query.field && query.value_field) {

            const fields = query.field.split(',');

            where.OR = fields.map((field: string) => ({
                [field]: {
                    contains: query.value_field,
                    mode: 'insensitive',
                },
            }));
        }

        // filtros específicos útiles
        if (query['doctor_id']) {
            where.doctor_id = Number(query['doctor_id']);
        }

        if (query['patient_id']) {
            where.patient_id = Number(query['patient_id']);
        }

        if (query['date']) {
            where.appointment_date = new Date(query['date']);
        }

        const total = await this.prisma.appointments.count({ where });

        if (limit >= total) {
            limit = total || 1;
            page = 1;
        }

        const skip = (page - 1) * limit;

        const data = await this.prisma.appointments.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                id: 'desc',
            },
            include: {
                patients: { include: { persons: true } },
                doctors: { include: { persons: true } },
                specialties: true,
                catalogs_appointments_status_idTocatalogs: true,
            },
        });

        const totalPages = total ? Math.ceil(total / limit) : 0;

        return {
            data,
            total,
            totalPages,
            page,
            limit,
        };
    }

    async findById(id: number) {

        const appointment = await this.prisma.appointments.findUnique({
            where: { id },
            include: {
                patients: { include: { persons: true } },
                doctors: { include: { persons: true } },
                specialties: true,
                catalogs_appointments_status_idTocatalogs: true,
            },
        });

        if (!appointment) {
            throw new BadRequestException('Cita no existe');
        }

        return appointment;
    }

    async create(dto: CreateAppointmentDto, userId: number) {

        const now = new Date();

        const appointmentDate = new Date(dto.appointment_date);
        const appointmentDateTime = new Date(`${dto.appointment_date}T${dto.appointment_time}:00`);

        const endTime = new Date(
            appointmentDateTime.getTime() + dto.duration_minutes * 60000
        );

        const status = await this.prisma.catalogs.findFirst({
            where: {
                id: dto.appointment_status_id,
                deleted_at: null,
                catalog_types: {
                    code: 'APPOINTMENT_STATUS'
                }
            },
            include: { catalog_types: true }
        });

        if (!status) {
            throw new BadRequestException('Estado de cita inválido');
        }

        const appointmentType = await this.prisma.catalogs.findFirst({
            where: {
                id: dto.appointment_type_id,
                deleted_at: null,
                catalog_types: {
                    code: 'APPOINTMENT_TYPE'
                }
            },
            include: { catalog_types: true }
        });

        if (!appointmentType) {
            throw new BadRequestException('Tipo de cita inválido');
        }

        // Validar fecha pasada
        if (appointmentDateTime < now) {
            throw new BadRequestException('No puedes agendar en el pasado');
        }

        // Validar doctor
        const doctor = await this.prisma.doctors.findFirst({
            where: { id: dto.doctor_id, deleted_at: null },
        });

        if (!doctor) {
            throw new BadRequestException('Doctor no válido');
        }

        // Validar paciente
        const patient = await this.prisma.patients.findFirst({
            where: { id: dto.patient_id, deleted_at: null },
        });

        if (!patient) {
            throw new BadRequestException('Paciente no válido');
        }

        // Validar especialidad del doctor
        const doctorSpecialty = await this.prisma.doctor_specialties.findFirst({
            where: {
                doctor_id: dto.doctor_id,
                specialty_id: dto.specialty_id,
                deleted_at: null,
            },
        });

        if (!doctorSpecialty) {
            throw new BadRequestException('El doctor no tiene esa especialidad');
        }

        // Validar horario del doctor
        const schedules = await this.prisma.doctor_schedule.findMany({
            where: {
                doctor_id: dto.doctor_id,
                schedule_date: appointmentDate,
                deleted_at: null,
                is_active: true,
            },
        });

        if (!schedules.length) {
            throw new BadRequestException('El doctor no trabaja ese día');
        }

        const isInsideSchedule = schedules.some(sch => {

            const schStart = new Date(sch.start_time!);
            const schEnd = new Date(sch.end_time!);

            const schStartMinutes = schStart.getUTCHours() * 60 + schStart.getUTCMinutes();
            const schEndMinutes = schEnd.getUTCHours() * 60 + schEnd.getUTCMinutes();

            const startMinutes = appointmentDateTime.getHours() * 60 + appointmentDateTime.getMinutes();
            const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

            return startMinutes >= schStartMinutes && endMinutes <= schEndMinutes;
        });

        if (!isInsideSchedule) {
            throw new BadRequestException('La cita está fuera del horario del doctor');
        }

        //  Validar cruce de citas del DOCTOR
        const doctorOverlap = await this.prisma.appointments.findFirst({
            where: {
                doctor_id: dto.doctor_id,
                appointment_date: appointmentDate,
                deleted_at: null,
                catalogs_appointments_status_idTocatalogs: {
                    code: { notIn: ['CANCELADO'] }
                },
                AND: [
                    { appointment_time: { lt: endTime } },
                    { appointment_time: { gte: appointmentDateTime } },
                ],
            },
        });

        if (doctorOverlap) {
            throw new BadRequestException('El doctor ya tiene una cita en ese horario');
        }

        //Validar cruce de citas del PACIENTE
        const patientOverlap = await this.prisma.appointments.findFirst({
            where: {
                patient_id: dto.patient_id,
                appointment_date: appointmentDate,
                deleted_at: null,
                catalogs_appointments_status_idTocatalogs: {
                    code: { notIn: ['CANCELADO'] }
                },
                AND: [
                    {
                        appointment_time: { lt: endTime },
                    },
                    {
                        appointment_time: { gte: appointmentDateTime },
                    },
                ],
            },
        });

        if (patientOverlap) {
            throw new BadRequestException('El paciente ya tiene una cita en ese horario');
        }

        // Crear cita
        return this.prisma.appointments.create({
            data: {
                patient_id: dto.patient_id,
                doctor_id: dto.doctor_id,
                specialty_id: dto.specialty_id,
                appointment_date: appointmentDate,
                appointment_time: appointmentDateTime,
                duration_minutes: dto.duration_minutes,
                appointment_type_id: dto.appointment_type_id,
                status_id: dto.appointment_status_id,
                reason: dto.reason,
                notes: dto.notes,
                created_at: now,
                created_by: userId,
            },
        });
    }

    async update(id: number, dto: CreateAppointmentDto, userId: number) {

        const existing = await this.prisma.appointments.findUnique({
            where: { id },
        });

        if (!existing || existing.deleted_at) {
            throw new BadRequestException('Cita no existe');
        }

        const now = new Date();

        const appointmentDate = new Date(dto.appointment_date);
        const appointmentDateTime = new Date(`${dto.appointment_date}T${dto.appointment_time}:00`);

        const endTime = new Date(
            appointmentDateTime.getTime() + dto.duration_minutes * 60000
        );

        if (appointmentDateTime < now) {
            throw new BadRequestException('No puedes agendar en el pasado');
        }

        // 🔴 VALIDACIONES reutilizadas (igual que create)

        const doctor = await this.prisma.doctors.findFirst({
            where: { id: dto.doctor_id, deleted_at: null },
        });

        if (!doctor) throw new BadRequestException('Doctor no válido');

        const patient = await this.prisma.patients.findFirst({
            where: { id: dto.patient_id, deleted_at: null },
        });

        if (!patient) throw new BadRequestException('Paciente no válido');

        // 🔴 VALIDAR CRUCE DOCTOR (excluyendo la misma cita)
        const doctorOverlap = await this.prisma.appointments.findFirst({
            where: {
                doctor_id: dto.doctor_id,
                appointment_date: appointmentDate,
                id: { not: id },
                deleted_at: null,
                AND: [
                    { appointment_time: { lt: endTime } },
                    { appointment_time: { gte: appointmentDateTime } },
                ],
            },
        });

        if (doctorOverlap) {
            throw new BadRequestException('El doctor ya tiene una cita en ese horario');
        }

        // 🔴 VALIDAR CRUCE PACIENTE
        const patientOverlap = await this.prisma.appointments.findFirst({
            where: {
                patient_id: dto.patient_id,
                appointment_date: appointmentDate,
                id: { not: id },
                deleted_at: null,
                AND: [
                    { appointment_time: { lt: endTime } },
                    { appointment_time: { gte: appointmentDateTime } },
                ],
            },
        });

        if (patientOverlap) {
            throw new BadRequestException('El paciente ya tiene una cita en ese horario');
        }

        return this.prisma.appointments.update({
            where: { id },
            data: {
                patient_id: dto.patient_id,
                doctor_id: dto.doctor_id,
                specialty_id: dto.specialty_id,
                appointment_date: appointmentDate,
                appointment_time: appointmentDateTime,
                duration_minutes: dto.duration_minutes,
                appointment_type_id: dto.appointment_type_id,
                status_id: dto.appointment_status_id,
                reason: dto.reason,
                notes: dto.notes,
                updated_at: new Date(),
                updated_by: userId,
            },
        });
    }

    async getAvailableSlots(doctorId: number, date: string) {

        const appointmentDate = new Date(date);
        
        const schedules = await this.prisma.doctor_schedule.findMany({
            where: {
                doctor_id: doctorId,
                schedule_date: appointmentDate,
                deleted_at: null,
                is_active: true,
            },
        });
        if (!schedules.length) {
            return [];
        }

        // 🔴 citas existentes
        const appointments = await this.prisma.appointments.findMany({
            where: {
                doctor_id: doctorId,
                appointment_date: appointmentDate,
                deleted_at: null,
            },
        });

        const occupied = appointments.map(a => {
            const start = new Date(a.appointment_time!);
            const end = new Date(start.getTime() + a.duration_minutes! * 60000);
            return { start, end };
        });

        const slots: string[] = [];

        for (const sch of schedules) {

            const start = new Date(sch.start_time!);
            const end = new Date(sch.end_time!);

            let current = new Date(start);

            while (current < end) {

                const slotEnd = new Date(
                    current.getTime() + sch.slot_duration! * 60000
                );

                // validar cruce con citas
                const isOccupied = occupied.some(o =>
                    current < o.end && slotEnd > o.start
                );

                if (!isOccupied) {
                    slots.push(current.toISOString().substring(11, 16)); // HH:mm
                }

                current = slotEnd;
            }
        }

        return slots;
    }

    async delete(id: number, userId: number) {

        const appointment = await this.prisma.appointments.findUnique({
            where: { id },
        });

        if (!appointment) {
            throw new BadRequestException('Cita no existe');
        }

        const now = new Date();
        const isDeleting = appointment.deleted_at === null;

        await this.prisma.appointments.update({
            where: { id },
            data: {
                deleted_at: isDeleting ? now : null,
                updated_at: now,
                updated_by: userId,
            },
        });

        return {
            message: isDeleting
                ? 'Cita Desactivada'
                : 'Cita Activada',
        };
    }
}