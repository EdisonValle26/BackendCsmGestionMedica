import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseDto } from 'src/dto/base.dto';
import { CreateMedicalRecordDto } from 'src/dto/create-medical-record.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MedicalRecordsService {

    constructor(private prisma: PrismaService) { }

    async create(dto: CreateMedicalRecordDto, userId: number) {

        //validar cita
        const appointment = await this.prisma.appointments.findFirst({
            where: {
                id: dto.appointment_id,
                deleted_at: null
            }
        });

        if (!appointment) {
            throw new BadRequestException('La cita no existe');
        }

        //validar que no exista ya un registro
        const existing = await this.prisma.medical_records.findFirst({
            where: {
                appointment_id: dto.appointment_id,
                deleted_at: null
            }
        });

        if (existing) {
            throw new BadRequestException('La cita ya tiene registro médico');
        }

        //validar enfermedad
        const disease = await this.prisma.catalogs.findFirst({
            where: {
                id: dto.disease_id,
                deleted_at: null,
                catalog_types: {
                    code: 'DISEASE'
                }
            }
        });

        if (!disease) {
            throw new BadRequestException('Enfermedad inválida');
        }

        return this.prisma.medical_records.create({
            data: {
                ...dto,
                created_at: new Date(),
                created_by: userId
            }
        });
    }

    // async findAll() {
    //     return this.prisma.medical_records.findMany({
    //         where: { deleted_at: null },
    //         include: {
    //             appointments: true,
    //             catalogs: true
    //         }
    //     });
    // }

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

        const total = await this.prisma.medical_records.count({
            where,
        });

        if (limit >= total) {
            limit = total || 1;
            page = 1;
        }

        const skip = (page - 1) * limit;

        const data = await this.prisma.medical_records.findMany({
            where,
            include: {
                appointments: true,
                catalogs: true
            },
            skip,
            take: limit,
            orderBy: {
                id: 'desc',
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

        const record = await this.prisma.medical_records.findUnique({
            where: { id },
            include: {
                appointments: true,
                catalogs: true
            }
        });

        if (!record) {
            throw new BadRequestException('Registro no existe');
        }

        return record;
    }

    async update(id: number, dto: CreateMedicalRecordDto, userId: number) {

        const existing = await this.prisma.medical_records.findUnique({
            where: { id }
        });

        if (!existing || existing.deleted_at) {
            throw new BadRequestException('Registro no existe');
        }

        return this.prisma.medical_records.update({
            where: { id },
            data: {
                ...dto,
                updated_at: new Date(),
                updated_by: userId
            }
        });
    }

    async delete(id: number, userId: number) {

        const record = await this.prisma.medical_records.findUnique({
            where: { id }
        });

        if (!record) {
            throw new BadRequestException('Registro no existe');
        }

        const now = new Date();

        const isDeleting = record.deleted_at === null;

        await this.prisma.medical_records.update({
            where: { id },
            data: {
                deleted_at: isDeleting ? now : null,
                updated_at: now,
                updated_by: userId,
            },
        });

        return {
            message: isDeleting
                ? 'Registro desactivado'
                : 'Registro reactivado',
        };
    }
}