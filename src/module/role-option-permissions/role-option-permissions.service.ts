import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseDto } from 'src/dto/base.dto';
import { AssignRolePermissionDto } from 'src/dto/role-option-permissions.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoleOptionPermissionsService {

    constructor(private prisma: PrismaService) { }

    async create(dto: AssignRolePermissionDto, userId: number) {

        const role = await this.prisma.roles.findUnique({
            where: { id: dto.role_id },
        });

        if (!role) throw new BadRequestException('Rol no existe');

        const option = await this.prisma.options.findUnique({
            where: { id: dto.option_id },
        });

        if (!option) throw new BadRequestException('Opción no existe');

        const existing = await this.prisma.role_option_permissions.findFirst({
            where: {
                role_id: dto.role_id,
                option_id: dto.option_id,
                deleted_at: null,
            },
        });

        if (existing) {
            throw new BadRequestException('Ya existen permisos para este rol y opción');
        }

        const permissions = await this.prisma.permissions.findMany({
            where: {
                id: { in: dto.permissions },
            },
        });

        const data = permissions.map(p => ({
            role_id: dto.role_id,
            option_id: dto.option_id,
            permission_id: p.id,
            created_at: new Date(),
            created_by: userId,
        }));

        await this.prisma.role_option_permissions.createMany({ data });

        return {
            message: 'Permisos creados correctamente',
        };
    }

    async update(dto: AssignRolePermissionDto, userId: number) {

        const now = new Date();

        const permissionsDb = await this.prisma.permissions.findMany({
            where: {
                id: { in: dto.permissions },
            },
        });

        const existing = await this.prisma.role_option_permissions.findMany({
            where: {
                role_id: dto.role_id,
                option_id: dto.option_id,
            },
        });

        const existingMap = new Map(
            existing.map(e => [e.permission_id, e]),
        );

        const incomingIds = permissionsDb.map(p => p.id);

        for (const perm of permissionsDb) {

            const found = existingMap.get(perm.id);

            if (found) {
                // reactivar si estaba eliminado
                if (found.deleted_at) {
                    await this.prisma.role_option_permissions.update({
                        where: { id: found.id },
                        data: {
                            deleted_at: null,
                            updated_at: now,
                            updated_by: userId,
                        },
                    });
                }
            } else {
                // crear nuevo
                await this.prisma.role_option_permissions.create({
                    data: {
                        role_id: dto.role_id,
                        option_id: dto.option_id,
                        permission_id: perm.id,
                        created_at: now,
                        created_by: userId,
                    },
                });
            }
        }

        // desactivar si no vienen
        for (const item of existing) {

            if (!incomingIds.includes(item.permission_id!)) {

                if (!item.deleted_at) {
                    await this.prisma.role_option_permissions.update({
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
            message: 'Permisos actualizados correctamente',
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
            where.OR = [
                {
                    roles: {
                        name: {
                            contains: query.value_field,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    options: {
                        name: {
                            contains: query.value_field,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }

        const total = await this.prisma.role_option_permissions.count({ where });

        if (limit >= total) {
            limit = total || 1;
            page = 1;
        }

        const skip = (page - 1) * limit;

        const data = await this.prisma.role_option_permissions.findMany({
            where,
            skip,
            take: limit,
            include: {
                roles: true,
                options: true,
                permissions: true,
            },
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

    async findById(roleId: number, optionId: number) {

        return this.prisma.role_option_permissions.findMany({
            where: {
                role_id: roleId,
                option_id: optionId,
                deleted_at: null,
            },
            include: {
                permissions: true,
            },
        });
    }

    async delete(roleId: number, optionId: number, userId: number) {

        const now = new Date();

        await this.prisma.role_option_permissions.updateMany({
            where: {
                role_id: roleId,
                option_id: optionId,
                deleted_at: null,
            },
            data: {
                deleted_at: now,
                updated_at: now,
                updated_by: userId,
            },
        });

        return {
            message: 'Permisos desactivados correctamente',
        };
    }
}