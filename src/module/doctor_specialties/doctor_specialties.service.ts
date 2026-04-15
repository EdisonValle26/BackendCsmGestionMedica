import { BadRequestException, Injectable } from '@nestjs/common';
import { AssignDoctorSpecialtiesDto } from 'src/dto/assign-doctor-specialties.dto';
import { BaseDto } from 'src/dto/base.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DoctorSpecialtiesService {

    constructor(private prisma: PrismaService) { }

    async assign(dto: AssignDoctorSpecialtiesDto, userId: number) {

        const { doctor_id, specialty_ids } = dto;

        const doctor = await this.prisma.doctors.findUnique({
            where: { id: doctor_id },
        });

        if (!doctor) {
            throw new BadRequestException('Doctor no existe');
        }

        const current = await this.prisma.doctor_specialties.findMany({
            where: { doctor_id },
        });

        const now = new Date();

        const currentMap = new Map(
            current.map(item => [item.specialty_id, item])
        );

        const specialties = await this.prisma.specialties.findMany({
            where: {
                id: { in: specialty_ids },
                deleted_at: null,
            },
        });

        if (specialties.length !== specialty_ids.length) {
            throw new BadRequestException('Una o más especialidades no existen');
        }

        const newSet = new Set(specialty_ids);

        for (const specialtyId of newSet) {

            const existing = currentMap.get(specialtyId);

            if (!existing) {
                await this.prisma.doctor_specialties.create({
                    data: {
                        doctor_id,
                        specialty_id: specialtyId,
                        created_at: now,
                        created_by: userId,
                    },
                });

            } else if (existing.deleted_at) {
                await this.prisma.doctor_specialties.update({
                    where: { id: existing.id },
                    data: {
                        deleted_at: null,
                        updated_at: now,
                        updated_by: userId,
                    },
                });
            }
        }

        for (const item of current) {

            if (!newSet.has(item.specialty_id!)) {

                if (!item.deleted_at) {
                    await this.prisma.doctor_specialties.update({
                        where: { id: item.id },
                        data: {
                            deleted_at: now,
                            updated_at: now,
                            updated_by: userId,
                        },
                    });
                }
            }
        }

        return {
            message: 'Especialidades sincronizadas correctamente',
        };
    }

    async findAll(query: BaseDto) {

        let page = Number(query.skip) || 1;
        let limit = Number(query.take) || 10;

        let where: any = {};

        if (query.status) {
            where.deleted_at =
                query.status === 'I'
                    ? { not: null }
                    : null;
        } else {
            where.deleted_at = null;
        }

        if (query.field && query.value_field) {

            const fields = query.field.split(',');

            where.OR = fields.map((field: string) => ({
                [field]: {
                    contains: query.value_field,
                    mode: 'insensitive',
                },
            }));
        }

        const total = await this.prisma.doctor_specialties.count({ where });

        const skip = (page - 1) * limit;

        const data = await this.prisma.doctor_specialties.findMany({
            where,
            skip,
            take: limit,
            include: {
                doctors: true,
                specialties: true,
            },
            orderBy: { id: 'desc' },
        });

        return {
            data,
            total,
            page,
            limit,
        };
    }

}
