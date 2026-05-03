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
        try {

            const date = data.date instanceof Date ? data.date : this.parseDate(data.date);
            const time = typeof data.time === 'string' ? data.time : this.parseTime(data.time);

            if (!date || !time || !data.doctor_id || !data.specialty_id) {
                throw new Error(`Datos incompletos:
                                doctor_id=${data.doctor_id}
                                specialty_id=${data.specialty_id}
                                date=${data.date}
                                time=${data.time}
                            `);
            }

            const [hours, minutes] = time.split(':');

            const appointmentDateTime = new Date(Date.UTC(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                parseInt(hours),
                parseInt(minutes),
                0,
                0
            ));

            const result = await this.prisma.appointments.create({
                data: {
                    patient_id: data.patient_id,
                    doctor_id: data.doctor_id,
                    specialty_id: data.specialty_id,
                    appointment_date: date,
                    appointment_time: appointmentDateTime,
                    duration_minutes: 30,
                    created_at: new Date(),
                },
            });

            if (!result) {
                return { response: 'Faltan datos para completar la cita, continuemos...' };
            }

            return result;
        } catch (error) {
            console.error('ERROR CREANDO CITA:', error);
            return null;
        }
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

        const schedule = await this.prisma.doctor_schedule.findFirst({
            where: {
                doctor_id: doctorId,
                schedule_date: date,
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

    async createPatient(data: any) {

        const person = await this.prisma.persons.create({
            data: {
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone,
                created_at: new Date(),
            }
        });

        const patient = await this.prisma.patients.create({
            data: {
                person_id: person.id,
                created_at: new Date(),
            }
        });

        return patient;
    }

    async findIntentByName(name: string) {
        return this.prisma.chatbot_intents.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive'
                }
            }
        });
    }

    parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;

        const text = dateStr.toLowerCase().trim();

        const today = new Date();

        // hoy
        if (text.includes('hoy')) {
            return today;
        }

        // mañana (soporta errores tipo "manana", "mañan")
        if (text.match(/manan|mañan/)) {
            const d = new Date(today);
            d.setDate(d.getDate() + 1);
            return d;
        }

        // pasado mañana
        if (text.includes('pasado')) {
            const d = new Date(today);
            d.setDate(d.getDate() + 2);
            return d;
        }

        // días de la semana
        const daysMap: any = {
            domingo: 0,
            lunes: 1,
            martes: 2,
            miercoles: 3,
            miércoles: 3,
            jueves: 4,
            viernes: 5,
            sabado: 6,
            sábado: 6,
        };

        for (const day in daysMap) {
            if (text.includes(day)) {
                const targetDay = daysMap[day];
                const currentDay = today.getDay();

                let diff = targetDay - currentDay;
                if (diff <= 0) diff += 7;

                const d = new Date(today);
                d.setDate(today.getDate() + diff);
                return d;
            }
        }

        // fallback normal
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    parseTime(timeStr: string): string | null {
        if (!timeStr) return null;

        const text = timeStr.toLowerCase().trim();

        // 3pm, 3 pm, 3 de la tarde
        const hourMatch = text.match(/(\d{1,2})/);
        if (!hourMatch) return null;

        let hour = parseInt(hourMatch[1]);
        let minutes = 0;

        // detectar minutos si existen
        const minMatch = text.match(/:(\d{2})/);
        if (minMatch) {
            minutes = parseInt(minMatch[1]);
        }

        // contexto
        if (text.includes('tarde') || text.includes('pm')) {
            if (hour < 12) hour += 12;
        }

        if (text.includes('noche')) {
            if (hour < 12) hour += 12;
        }

        if (text.includes('mañana') || text.includes('am')) {
            if (hour === 12) hour = 0;
        }

        return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
}