import { Injectable } from '@nestjs/common';

import { BadRequestException } from '@nestjs/common';
import { BaseDto } from 'src/dto/base.dto';
import { CreateCatalogDto } from 'src/dto/create-catalog.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CatalogsService {

    constructor(private prisma: PrismaService) { }

    async create(dto: CreateCatalogDto, userId: number) {

        const exists = await this.prisma.catalogs.findFirst({
            where: {
                code: dto.code,
                type_id: dto.type_id,
                deleted_at: null,
            },
        });

        if (exists) {
            throw new BadRequestException('El catálogo ya existe');
        }

        const catalog = await this.prisma.catalogs.create({
            data: {
                ...dto,
                created_at: new Date(),
                created_by: userId,
            },
        });

        return {
            message: 'Catálogo creado correctamente',
            catalog,
        };
    }

    async update(id: number, dto: CreateCatalogDto, userId: number) {

        const catalog = await this.prisma.catalogs.findUnique({
            where: { id },
        });

        if (!catalog || catalog.deleted_at) {
            throw new BadRequestException('Catálogo no existe');
        }

        const exists = await this.prisma.catalogs.findFirst({
            where: {
                code: dto.code,
                type_id: dto.type_id,
                id: { not: id },
                deleted_at: null,
            },
        });

        if (exists) {
            throw new BadRequestException('El código ya está en uso');
        }

        const updated = await this.prisma.catalogs.update({
            where: { id },
            data: {
                ...dto,
                updated_at: new Date(),
                updated_by: userId,
            },
        });

        return {
            message: 'Catálogo actualizado correctamente',
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

            const fields = query.field.split(',');

            where.OR = fields.map((field: string) => ({
                [field]: {
                    contains: query.value_field,
                    mode: 'insensitive',
                },
            }));
        }

        const total = await this.prisma.catalogs.count({ where });

        if (limit >= total) {
            limit = total || 1;
            page = 1;
        }

        const skip = (page - 1) * limit;

        const data = await this.prisma.catalogs.findMany({
            where,
            skip,
            take: limit,
            include: {
                catalog_types: true,
            },
            orderBy: {
                order_number: 'asc',
            },
        });

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async findById(id: number) {

        const catalog = await this.prisma.catalogs.findUnique({
            where: { id },
            include: {
                catalog_types: true,
            },
        });

        if (!catalog) {
            throw new BadRequestException('Catálogo no existe');
        }

        return catalog;
    }

    async delete(id: number, userId: number) {

        const catalog = await this.prisma.catalogs.findUnique({
            where: { id },
        });

        if (!catalog) {
            throw new BadRequestException('Catálogo no existe');
        }

        const now = new Date();
        const isDeleting = catalog.deleted_at === null;

        await this.prisma.catalogs.update({
            where: { id },
            data: {
                deleted_at: isDeleting ? now : null,
                updated_at: now,
                updated_by: userId,
            },
        });

        return {
            message: isDeleting
                ? 'Catálogo desactivado'
                : 'Catálogo reactivado',
        };
    }

    async findByTypeCode(code: string) {

        return this.prisma.catalogs.findMany({
            where: {
                deleted_at: null,
                is_active: true,
                catalog_types: {
                    code,
                },
            },
            orderBy: {
                order_number: 'asc',
            },
        });
    }

    async findGroup(codes: string[]) {

        const data = await this.prisma.catalogs.findMany({
            where: {
                deleted_at: null,
                is_active: true,
                catalog_types: {
                    code: { in: codes },
                },
            },
            include: {
                catalog_types: true,
            },
            orderBy: {
                order_number: 'asc',
            },
        });

        // agrupar
        const grouped = {};

        for (const item of data) {
            const key = item?.catalog_types?.code;

            if (!grouped[key!]) {
                grouped[key!] = [];
            }

            grouped[key!].push(item);
        }

        return grouped;
    }
}
