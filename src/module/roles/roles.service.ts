import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseDto } from 'src/dto/base.dto';
import { CreateRolDto } from 'src/dto/create-rol.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RolesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateRolDto, userId: number) {

        const existingRol = await this.prisma.roles.findFirst({
            where: { name: dto.name },
        });

        if (existingRol) {
            throw new BadRequestException('El rol ya existe');
        }

        const roles = await this.prisma.roles.create({
            data: {
                name: dto.name,
                description: dto.description,
                created_at: new Date(),
                created_by: userId,
            },
        });

        return {
            message: 'Rol creado correctamente',
            roles
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

        const total = await this.prisma.roles.count({
            where,
        });

        if (limit >= total) {
            limit = total || 1;
            page = 1;
        }

        const skip = (page - 1) * limit;

        const data = await this.prisma.roles.findMany({
            where,
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

        const rol = await this.prisma.roles.findUnique({
            where: { id },
        });

        if (!rol) {
            throw new BadRequestException('Rol no existe');
        }

        return rol;
    }

    async update(id: number, dto: CreateRolDto, userId: number) {
        const rol = await this.prisma.roles.findUnique({
            where: { id },
        });

        if (!rol || rol.deleted_at) {
            throw new BadRequestException('Rol no existe');
        }

        const roles = await this.prisma.roles.update({
            where: { id },
            data: {
                description: dto.description,
                updated_at: new Date(),
                updated_by: userId,
            },
        });

        return {
            message: 'Rol actualizado correctamente',
            roles
        };
    }

    async delete(id: number, userId: number) {
        const rol = await this.prisma.roles.findUnique({
            where: { id },
        });

        if (!rol) {
            throw new BadRequestException('Rol no existe');
        }

        const now = new Date();

        const isDeleting = rol.deleted_at === null;

        await this.prisma.roles.update({
            where: { id },
            data: {
                deleted_at: isDeleting ? now : null,
                updated_at: now,
                updated_by: userId,
            },
        });

        return {
            message: isDeleting
                ? 'Rol desactivado'
                : 'Rol reactivado',
        };
    }
}
