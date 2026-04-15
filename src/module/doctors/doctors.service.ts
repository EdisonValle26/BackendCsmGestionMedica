import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DoctorsService {

    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.doctors.findMany({
            where: {
                deleted_at: null,
            },
            include: {
                persons: true,
                doctor_specialties: {
                    include: {
                        specialties: true,
                    },
                },
                doctor_schedule: true,
            },
            orderBy: {
                id: 'desc',
            },
        });
    }

    async findById(id: number) {

        const doctor = await this.prisma.doctors.findUnique({
            where: { id },
            include: {
                persons: true,
                doctor_specialties: {
                    include: {
                        specialties: true,
                    },
                },
                doctor_schedule: true,
            },
        });

        if (!doctor || doctor.deleted_at) {
            throw new BadRequestException('Doctor no existe');
        }

        return doctor;
    }

    async delete(id: number, userId: number) {

        const doctor = await this.prisma.doctors.findUnique({
            where: { id },
        });

        if (!doctor) {
            throw new BadRequestException('Doctor no existe');
        }

        const now = new Date();
        const isDeleting = doctor.deleted_at === null;

        await this.prisma.doctors.update({
            where: { id },
            data: {
                deleted_at: isDeleting ? now : null,
                updated_at: now,
                updated_by: userId,
            },
        });

        return {
            message: isDeleting
                ? 'Doctor desactivado'
                : 'Doctor reactivado',
        };
    }
}