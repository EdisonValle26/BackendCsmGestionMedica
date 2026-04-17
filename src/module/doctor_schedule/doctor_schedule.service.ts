import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDoctorScheduleDto } from 'src/dto/create-doctor-schedule.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DoctorScheduleService {

    constructor(private prisma: PrismaService) { }

    async create(dto: CreateDoctorScheduleDto, userId: number) {

        const { doctor_id, day_of_week, start_time, end_time, slot_duration } = dto;

        // validar doctor
        const doctor = await this.prisma.doctors.findUnique({
            where: { id: doctor_id },
        });

        if (!doctor) {
            throw new BadRequestException('Doctor no existe');
        }

        if (!/^\d{2}:\d{2}$/.test(start_time) || !/^\d{2}:\d{2}$/.test(end_time)) {
            throw new BadRequestException('Formato de hora inválido (HH:mm)');
        }


        //convertir horas
        const start = this.buildTime(start_time);
        const end = this.buildTime(end_time);

        // validar con strings
        const startMinutes = this.timeToMinutes(start_time);
        const endMinutes = this.timeToMinutes(end_time);

        if (startMinutes < 0 || startMinutes > 1440 ||
            endMinutes < 0 || endMinutes > 1440) {
            throw new BadRequestException('Hora fuera de rango');
        }

        if (startMinutes >= endMinutes) {
            throw new BadRequestException('Hora inicio debe ser menor a hora fin');
        }

        //validar cruces
        const schedules = await this.prisma.doctor_schedule.findMany({
            where: {
                doctor_id,
                day_of_week,
                deleted_at: null,
            },
        });

        for (const sch of schedules) {

            const schStart = this.timeToMinutes(this.dateToHHMM(sch.start_time!));
            const schEnd = this.timeToMinutes(this.dateToHHMM(sch.end_time!));

            const overlap =
                (startMinutes < schEnd && endMinutes > schStart);

            if (overlap) {
                throw new BadRequestException('El horario se cruza con otro existente');
            }
        }

        await this.prisma.doctor_schedule.create({
            data: {
                doctor_id,
                day_of_week,
                start_time: start,
                end_time: end,
                slot_duration,
                created_at: new Date(),
                created_by: userId,
            },
        });

        return {
            message: 'Horario creado correctamente',
        };
    }

    async findByDoctor(doctorId: number) {

        const schedules = await this.prisma.doctor_schedule.findMany({
            where: {
                doctor_id: doctorId,
                deleted_at: null,
            },
            orderBy: {
                day_of_week: 'asc',
            },
        });

        return schedules.map(s => ({
            ...s,
            start_time: this.dateToHHMM(s.start_time!),
            end_time: this.dateToHHMM(s.end_time!),
        }));
    }

    async delete(id: number, userId: number) {

        const schedule = await this.prisma.doctor_schedule.findUnique({
            where: { id },
        });

        if (!schedule) {
            throw new BadRequestException('Horario no existe');
        }

        const now = new Date();
        const isDeleting = schedule.deleted_at === null;

        await this.prisma.doctor_schedule.update({
            where: { id },
            data: {
                deleted_at: isDeleting ? now : null,
                is_active: isDeleting ? false : true,
                updated_at: now,
                updated_by: userId,
            },
        });

        return {
            message: isDeleting
                ? 'Horario eliminado'
                : 'Horario restaurado',
        };
    }

    private timeToMinutes(time: string) {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }

    private buildTime(time: string): Date {
        const [hours, minutes] = time.split(':').map(Number);

        return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
    }

    private dateToHHMM(date: Date): string {
        return date.toISOString().substring(11, 16);
    }
}