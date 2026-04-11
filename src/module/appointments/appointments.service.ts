import {
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.appointments.findMany({
            where: {
                deleted_at: null,
            },
            include: {
                patients: {
                    include: {
                        persons: true,
                    },
                },
                doctors: {
                    include: {
                        persons: true,
                    },
                },
                specialties: true,
                catalogs_appointments_status_idTocatalogs: true,
            },
        });
    }

    async create(dto: CreateAppointmentDto, userId: number) {
        const now = new Date();

        const appointmentDateTime = new Date(
            `${dto.appointment_date}T${dto.appointment_time}`,
        );

        // Validar fecha pasada
        if (appointmentDateTime < now) {
            throw new BadRequestException('No puedes agendar en el pasado');
        }

        //Validar doctor
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

        // Validar cruce de citas
        const endTime = new Date(
            appointmentDateTime.getTime() + dto.duration_minutes * 60000,
        );

        const overlapping = await this.prisma.appointments.findFirst({
            where: {
                doctor_id: dto.doctor_id,
                appointment_date: new Date(dto.appointment_date),
                deleted_at: null,
                AND: [
                    {
                        appointment_time: {
                            lt: endTime,
                        },
                    },
                    {
                        appointment_time: {
                            gte: appointmentDateTime,
                        },
                    },
                ],
            },
        });

        if (overlapping) {
            throw new BadRequestException('El doctor ya tiene una cita en ese horario');
        }

        // Crear cita
        return this.prisma.appointments.create({
            data: {
                ...dto,
                appointment_date: new Date(dto.appointment_date),
                appointment_time: appointmentDateTime,
                status_id: dto.appointment_status_id,
                created_at: now,
                created_by: userId,
            },
        });
    }

    async update(id: number, dto: CreateAppointmentDto, userId: number) {
        const appointment = await this.prisma.appointments.findUnique({
            where: { id },
        });

        if (!appointment) {
            throw new BadRequestException('Cita no existe');
        }

        const now = new Date();

        const appointmentDateTime = new Date(
            `${dto.appointment_date}T${dto.appointment_time}`,
        );

        if (appointmentDateTime < now) {
            throw new BadRequestException('No puedes agendar en el pasado');
        }

        return this.prisma.appointments.update({
            where: { id },
            data: {
                ...dto,
                appointment_date: new Date(dto.appointment_date),
                appointment_time: appointmentDateTime,
                status_id: dto.appointment_status_id,
                updated_at: new Date(),
                updated_by: userId,
            },
        });
    }
}