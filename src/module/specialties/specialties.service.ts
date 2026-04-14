import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseDto } from 'src/dto/base.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SpecialtiesService {

    constructor(private prisma: PrismaService) { }

    async create(name: string, userId: number) {

        const exists = await this.prisma.specialties.findFirst({
            where: {
                name,
                deleted_at: null,
            },
        });

        if (exists) {
            throw new BadRequestException('La especialidad ya existe');
        }

        const specialty = await this.prisma.specialties.create({
            data: {
                name,
                created_at: new Date(),
                created_by: userId,
            },
        });

        return {
            message: 'Especialidad creada correctamente',
            specialty,
        };
    }

    async update(id: number, name: string, userId: number) {

        const specialty = await this.prisma.specialties.findUnique({
            where: { id },
        });

        if (!specialty || specialty.deleted_at) {
            throw new BadRequestException('Especialidad no existe');
        }

        const exists = await this.prisma.specialties.findFirst({
            where: {
                name,
                id: { not: id },
                deleted_at: null,
            },
        });

        if (exists) {
            throw new BadRequestException('La especialidad ya está en uso');
        }

        const updated = await this.prisma.specialties.update({
            where: { id },
            data: {
                name,
                updated_at: new Date(),
                updated_by: userId,
            },
        });

        return {
            message: 'Especialidad actualizada correctamente',
            updated,
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
            where[query.field] = {
                contains: query.value_field,
                mode: 'insensitive',
            };
        }

        const total = await this.prisma.specialties.count({ where });

        if (limit >= total) {
            limit = total || 1;
            page = 1;
        }

        const skip = (page - 1) * limit;

        const data = await this.prisma.specialties.findMany({
            where,
            skip,
            take: limit,
            orderBy: { id: 'desc' },
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

        const specialty = await this.prisma.specialties.findUnique({
            where: { id },
        });

        if (!specialty || specialty.deleted_at) {
            throw new BadRequestException('Especialidad no existe');
        }

        return specialty;
    }

    async delete(id: number, userId: number) {

        const specialty = await this.prisma.specialties.findUnique({
            where: { id },
        });

        if (!specialty) {
            throw new BadRequestException('Especialidad no existe');
        }

        const now = new Date();

        const isDeleting = specialty.deleted_at === null;

        await this.prisma.specialties.update({
            where: { id },
            data: {
                deleted_at: isDeleting ? now : null,
                updated_at: now,
                updated_by: userId,
            },
        });

        return {
            message: isDeleting
                ? 'Especialidad desactivada'
                : 'Especialidad reactivada',
        };
    }
}