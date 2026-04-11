import {
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { UpdateUserDto } from 'src/dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async createUser(dto: CreateUserDto, adminId: number) {
        const existingUser = await this.prisma.users.findUnique({
            where: { username: dto.username },
        });

        if (existingUser) {
            throw new BadRequestException('El username ya existe');
        }

        const existingPerson = await this.prisma.persons.findFirst({
            where: { identification: dto.identification },
        });

        if (existingPerson) {
            throw new BadRequestException('La identificación ya está registrada');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const person = await this.prisma.persons.create({
            data: {
                identification: dto.identification,
                document_type_id: dto.document_type_id,
                first_name: dto.first_name,
                last_name: dto.last_name,
                birth_date: new Date(dto.birth_date),
                gender_id: dto.gender_id,
                nationality_id: dto.nationality_id,
                phone: dto.phone,
                email: dto.email,
                address: dto.address,
                created_at: new Date(),
                created_by: adminId,
            },
        });

        const user = await this.prisma.users.create({
            data: {
                person_id: person.id,
                username: dto.username,
                password: hashedPassword,
                created_at: new Date(),
                created_by: adminId,
            },
        });

        await this.prisma.user_roles.create({
            data: {
                user_id: user.id,
                role_id: dto.role_id,
            },
        });

        return {
            message: 'Usuario creado correctamente',
        };
    }

    async findAll() {
        return this.prisma.users.findMany({
            where: {
                deleted_at: null,
                is_active: true,
            },
            include: {
                persons: true,
                user_roles: {
                    include: {
                        roles: true,
                    },
                },
            },
        });
    }

    async updateUser(id: number, dto: UpdateUserDto, adminId: number) {
        const user = await this.prisma.users.findUnique({
            where: { id },
        });

        if (!user || user.deleted_at) {
            throw new BadRequestException('Usuario no existe');
        }

        await this.prisma.persons.update({
            where: { id: user.person_id! },
            data: {
                ...dto,
                birth_date: dto.birth_date ? new Date(dto.birth_date) : undefined,
                updated_at: new Date(),
                updated_by: adminId,
            },
        });

        return {
            message: 'Usuario actualizado correctamente',
        };
    }

    async deleteUser(id: number, adminId: number) {
        const user = await this.prisma.users.findUnique({
            where: { id },
        });

        if (!user) {
            throw new BadRequestException('Usuario no existe');
        }

        const now = new Date();

        const isDeleting = user.deleted_at === null;

        await this.prisma.users.update({
            where: { id },
            data: {
                deleted_at: isDeleting ? now : null,
                is_active: isDeleting ? false : true,
                updated_at: now,
                updated_by: adminId,
            },
        });

        return {
            message: isDeleting
                ? 'Usuario desactivado'
                : 'Usuario reactivado',
        };
    }
}