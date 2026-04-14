import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCatalogTypeDto } from 'src/dto/create-catalog-type.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CatalogTypeService {

    constructor(private prisma: PrismaService) { }

    async create(dto: CreateCatalogTypeDto) {

        const exists = await this.prisma.catalog_types.findFirst({
            where: {
                code: dto.code,
            },
        });

        if (exists) {
            throw new BadRequestException('El tipo de catálogo ya existe');
        }

        const type = await this.prisma.catalog_types.create({
            data: {
                code: dto.code,
                name: dto.name,
                created_at: new Date(),
            },
        });

        return {
            message: 'Tipo de catálogo creado correctamente',
            type,
        };
    }

    async findAll() {
        return this.prisma.catalog_types.findMany({
            orderBy: { id: 'desc' },
        });
    }

    async findById(id: number) {

        const type = await this.prisma.catalog_types.findUnique({
            where: { id },
        });

        if (!type) {
            throw new BadRequestException('Tipo no existe');
        }

        return type;
    }

    async update(id: number, dto: CreateCatalogTypeDto) {

        const type = await this.prisma.catalog_types.findUnique({
            where: { id },
        });

        if (!type) {
            throw new BadRequestException('Tipo no existe');
        }

        const exists = await this.prisma.catalog_types.findFirst({
            where: {
                code: dto.code,
                id: { not: id },
            },
        });

        if (exists) {
            throw new BadRequestException('El código ya existe');
        }

        const updated = await this.prisma.catalog_types.update({
            where: { id },
            data: {
                code: dto.code,
                name: dto.name,
                updated_at: new Date(),
            },
        });

        return {
            message: 'Tipo actualizado correctamente',
            updated,
        };
    }
}
