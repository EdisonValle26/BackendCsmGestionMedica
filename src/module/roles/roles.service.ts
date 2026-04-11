import { BadRequestException, Injectable } from '@nestjs/common';
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

    async findAll() {
        return this.prisma.roles.findMany({
            where: {
                deleted_at: null,
            }
        });
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
