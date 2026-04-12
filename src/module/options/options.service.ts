import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseDto } from 'src/dto/base.dto';
import { CreateOptionDto } from 'src/dto/create-option.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OptionsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateOptionDto, userId: number) {

        const now = new Date();

        const createRecursive = async (data: CreateOptionDto, parentId?: number) => {

            const exists = await this.prisma.options.findFirst({
                where: {
                    route: data.route,
                    deleted_at: null,
                },
            });

            if (exists) {
                throw new BadRequestException(`La opción ${data.route} ya existe`);
            }

            const option = await this.prisma.options.create({
                data: {
                    name: data.name,
                    route: data.route,
                    icon: data.icon,
                    parent_id: parentId ?? data.parent_id,
                    created_at: now,
                    created_by: userId,
                },
            });

            // CREAR HIJOS
            if (data.children && data.children.length) {
                for (const child of data.children) {
                    await createRecursive(child, option.id);
                }
            }

            return option;
        };

        const option = await createRecursive(dto);

        return {
            message: 'Opción creada correctamente',
            option,
        };
    }

    async update(id: number, dto: CreateOptionDto, userId: number) {

        const option = await this.prisma.options.findUnique({
            where: { id },
        });

        if (!option || option.deleted_at) {
            throw new BadRequestException('Opción no existe');
        }

        const exists = await this.prisma.options.findFirst({
            where: {
                route: dto.route,
                id: { not: id },
                deleted_at: null,
            },
        });

        if (exists) {
            throw new BadRequestException('La ruta ya está en uso');
        }

        const updated = await this.prisma.options.update({
            where: { id },
            data: {
                name: dto.name,
                route: dto.route,
                icon: dto.icon,
                parent_id: dto.parent_id,
                updated_at: new Date(),
                updated_by: userId,
            },
        });

        return {
            message: 'Opción actualizada correctamente',
            updated,
        };
    }

    async findAll(query: BaseDto) {

        let where: any = {};

        if (query.status) {
            where.deleted_at =
                query.status === 'I'
                    ? { not: null }
                    : null;
        } else {
            where.deleted_at = null;
        }

        const data = await this.prisma.options.findMany({
            where,
            orderBy: { id: 'asc' },
        });

        const buildTree = (items: any[], parentId: number | null = null) => {
            return items
                .filter(item => item.parent_id === parentId)
                .map(item => ({
                    ...item,
                    children: buildTree(items, item.id),
                }));
        };

        const tree = buildTree(data, null);

        return {
            data: tree,
        };
    }

    async findById(id: number) {

        const all = await this.prisma.options.findMany({
            where: {
                deleted_at: null,
            },
        });

        const root = all.find(o => o.id === id);

        if (!root) {
            throw new BadRequestException('Opción no existe');
        }

        const buildTree = (items: any[], parentId: number) => {
            return items
                .filter(item => item.parent_id === parentId)
                .map(item => ({
                    ...item,
                    children: buildTree(items, item.id),
                }));
        };

        return {
            ...root,
            children: buildTree(all, root.id),
        };
    }

    async delete(id: number, userId: number) {

        const option = await this.prisma.options.findUnique({
            where: { id },
        });

        if (!option) {
            throw new BadRequestException('Opción no existe');
        }

        const now = new Date();

        const isDeleting = option.deleted_at === null;

        await this.prisma.options.update({
            where: { id },
            data: {
                deleted_at: isDeleting ? now : null,
                updated_at: now,
                updated_by: userId,
            },
        });

        return {
            message: isDeleting
                ? 'Opción desactivada'
                : 'Opción reactivada',
        };
    }
}