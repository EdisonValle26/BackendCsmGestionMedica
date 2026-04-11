import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatbotActionsService {
    constructor(private prisma: PrismaService) { }

    async getDoctors() {
        const doctors = await this.prisma.doctors.findMany({
            where: {
                deleted_at: null,
            },
            include: {
                persons: true,
            },
        });

        return {
            response: doctors.map(d =>
                `${d.persons?.first_name} ${d.persons?.last_name}`,
            ),
        };
    }

    async createAppointment(data: any) {
        return this.prisma.appointments.create({
            data: {
                patient_id: data.patient_id,
                doctor_id: data.doctor_id,
                specialty_id: data.specialty_id,
                appointment_date: new Date(data.date),
                appointment_time: new Date(`1970-01-01T${data.time}`),
                duration_minutes: 30,
                created_at: new Date(),
            },
        });
    }

    async findSpecialtyByName(name: string) {

        const normalized = name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""); // quita tildes

        return this.prisma.specialties.findFirst({
            where: {
                name: {
                    contains: normalized,
                    mode: 'insensitive',
                },
                deleted_at: null,
            },
        });
    }

    async getDoctorsBySpecialty(specialtyId: number) {
        return this.prisma.doctor_specialties.findMany({
            where: {
                specialty_id: specialtyId,
            },
            include: {
                doctors: {
                    include: {
                        persons: true,
                    },
                },
            },
        });
    }

    async getAvailableSlots(doctorId: number, date: Date) {
        const dayOfWeek = date.getDay();

        const schedule = await this.prisma.doctor_schedule.findFirst({
            where: {
                doctor_id: doctorId,
                day_of_week: dayOfWeek,
                is_active: true,
                deleted_at: null,
            },
        });

        if (!schedule) return [];

        // generar slots
        const slots: string[] = [];;
        let current = new Date(`1970-01-01T${schedule.start_time}`);
        const end = new Date(`1970-01-01T${schedule.end_time}`);

        while (current < end) {
            const time = current.toTimeString().slice(0, 5);

            // validar si ya existe cita
            const exists = await this.prisma.appointments.findFirst({
                where: {
                    doctor_id: doctorId,
                    appointment_date: date,
                    appointment_time: new Date(`1970-01-01T${time}`),
                    deleted_at: null,
                },
            });

            if (!exists) {
                slots.push(time);
            }

            current.setMinutes(current.getMinutes() + schedule.slot_duration!);
        }

        return slots;
    }

    formatDoctors(doctors: any[]) {
        return doctors.map((d, index) => {
            const doc = d.doctors;
            return `${index + 1}. ${doc.persons.first_name} ${doc.persons.last_name}`;
        });
    }

    async findPatientByPhone(phone: string) {
        return this.prisma.persons.findFirst({
            where: {
                phone,
                deleted_at: null,
            },
            include: {
                patients: true,
            },
        });
    }
}